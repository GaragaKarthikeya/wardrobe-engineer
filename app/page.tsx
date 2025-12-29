"use client";

import { useState, useRef } from "react";
import { ClothesGrid } from "@/components/ClothesGrid";
import { Send, Sparkles, X, ImagePlus, Grid3X3, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { analyzeImageAction, recommendOutfitAction } from "./actions";
import { cn } from "@/lib/utils";
import { ClothingItem } from "@/types";
import Image from "next/image";
import { useToast } from "@/components/Toast";
import { convertToJpeg, SUPPORTED_FORMATS } from "@/lib/image";

type Tab = "closet" | "stylist";

export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("closet");

  // Stylist State
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    selected_item_ids: string[];
    reasoning: string;
  } | null>(null);
  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>([]);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Process single image
  const processSingleImage = async (file: File): Promise<any> => {
    const jpegBlob = await convertToJpeg(file);
    const jpegFile = new File([jpegBlob], `${Date.now()}.jpg`, { type: 'image/jpeg' });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("wardrobe")
      .upload(filename, jpegFile);

    if (uploadError) throw uploadError;

    const publicUrl = supabase.storage
      .from("wardrobe")
      .getPublicUrl(filename).data.publicUrl;

    const formData = new FormData();
    formData.append("file", jpegFile);
    const metadata = await analyzeImageAction(formData);

    const { error: dbError } = await supabase.from("items").insert({
      image_url: publicUrl,
      tags: metadata,
      is_clean: true,
    });

    if (dbError) throw dbError;
    return metadata;
  };

  // Batch upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const total = fileArray.length;

    setUploading(true);
    setBatchProgress({ current: 0, total });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < total; i++) {
      setBatchProgress({ current: i + 1, total });
      setUploadProgress(`${i + 1}/${total}`);

      try {
        await processSingleImage(fileArray[i]);
        successCount++;
      } catch (error: any) {
        console.error(`Failed:`, error);
        failCount++;
      }
    }

    if (successCount > 0) toast(`Added ${successCount} item${successCount > 1 ? 's' : ''}!`, "success");
    if (failCount > 0) toast(`Failed: ${failCount}`, "error");

    setUploading(false);
    setUploadProgress("");
    setBatchProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (successCount > 0) window.location.reload();
  };

  // Stylist
  const handleAsk = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setRecommendation(null);
    setOutfitItems([]);

    try {
      const { data: inventory } = await supabase.from("items").select("*");
      if (!inventory?.length) {
        toast("Add clothes first!", "info");
        setLoading(false);
        return;
      }

      const result = await recommendOutfitAction(input, inventory);
      setRecommendation(result);

      if (result.selected_item_ids?.length > 0) {
        const { data } = await supabase
          .from("items")
          .select("*")
          .in("id", result.selected_item_ids);
        setOutfitItems(data || []);
      }
    } catch (error: any) {
      toast("Failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-lg border-b border-zinc-800/50 px-4 pt-safe pb-3 flex justify-between items-center">
        <div>
          <h1 className="font-mono text-base font-bold tracking-tight text-teal-400">
            WARDROBE<span className="text-zinc-700">_</span>ENG
          </h1>
        </div>

        {activeTab === "closet" && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all",
              uploading
                ? "bg-teal-500/20 text-teal-400"
                : "bg-zinc-800 active:bg-zinc-700"
            )}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{uploadProgress}</span>
              </>
            ) : (
              <>
                <ImagePlus size={16} />
                <span>Add</span>
              </>
            )}
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={SUPPORTED_FORMATS}
          multiple
          onChange={handleFileChange}
        />
      </header>

      {/* Batch Progress */}
      {uploading && batchProgress.total > 1 && (
        <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "closet" && (
          <div className="p-4">
            <ClothesGrid />
          </div>
        )}

        {activeTab === "stylist" && (
          <div className="p-4 flex flex-col h-full">
            {/* Chat-like UI */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              {!recommendation ? (
                <>
                  <Sparkles size={48} className="text-teal-500 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">AI Stylist</h2>
                  <p className="text-zinc-500 text-sm max-w-xs">
                    Describe the occasion and I'll pick the perfect outfit from your clean clothes.
                  </p>
                </>
              ) : (
                <div className="w-full max-w-md animate-in fade-in">
                  {/* Outfit Images */}
                  {outfitItems.length > 0 && (
                    <div className="flex gap-3 justify-center mb-4 flex-wrap">
                      {outfitItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-teal-500/50 shadow-lg"
                        >
                          <Image
                            src={item.image_url}
                            alt={item.tags?.sub_category || "Item"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-zinc-900 rounded-2xl p-4 text-left border border-zinc-800">
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      {recommendation.reasoning}
                    </p>
                  </div>

                  <button
                    onClick={() => setRecommendation(null)}
                    className="mt-4 text-teal-500 text-sm"
                  >
                    Ask again
                  </button>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleAsk()}
                  placeholder="What's the occasion?"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
                <button
                  onClick={handleAsk}
                  disabled={loading || !input.trim()}
                  className="bg-teal-500 text-black font-semibold px-4 py-3 rounded-xl disabled:opacity-40"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="sticky bottom-0 bg-zinc-950 border-t border-zinc-800 pb-safe">
        <div className="flex">
          <button
            onClick={() => setActiveTab("closet")}
            className={cn(
              "flex-1 flex flex-col items-center py-3 gap-1 transition-colors",
              activeTab === "closet" ? "text-teal-400" : "text-zinc-500"
            )}
          >
            <Grid3X3 size={22} />
            <span className="text-xs">Closet</span>
          </button>
          <button
            onClick={() => setActiveTab("stylist")}
            className={cn(
              "flex-1 flex flex-col items-center py-3 gap-1 transition-colors",
              activeTab === "stylist" ? "text-teal-400" : "text-zinc-500"
            )}
          >
            <MessageSquare size={22} />
            <span className="text-xs">Stylist</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
