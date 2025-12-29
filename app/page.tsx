"use client";

import { useState, useRef } from "react";
import { ClothesGrid } from "@/components/ClothesGrid";
import { Send, Sparkles, X, Plus, ImagePlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { analyzeImageAction, recommendOutfitAction } from "./actions";
import { cn } from "@/lib/utils";
import { ClothingItem } from "@/types";
import Image from "next/image";
import { useToast } from "@/components/Toast";
import { convertToJpeg, SUPPORTED_FORMATS } from "@/lib/image";

export default function Home() {
  const { toast } = useToast();
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
  const processSingleImage = async (file: File): Promise<void> => {
    // Convert to JPEG
    const jpegBlob = await convertToJpeg(file);
    const jpegFile = new File([jpegBlob], `${Date.now()}.jpg`, { type: 'image/jpeg' });

    // Upload to Supabase
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("wardrobe")
      .upload(filename, jpegFile);

    if (uploadError) throw uploadError;

    const publicUrl = supabase.storage
      .from("wardrobe")
      .getPublicUrl(filename).data.publicUrl;

    // Analyze with AI
    const formData = new FormData();
    formData.append("file", jpegFile);
    const metadata = await analyzeImageAction(formData);

    // Save to database
    const { error: dbError } = await supabase.from("items").insert({
      image_url: publicUrl,
      tags: metadata,
      is_clean: true,
    });

    if (dbError) throw dbError;

    return metadata;
  };

  // Handle batch upload
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
      const file = fileArray[i];
      setBatchProgress({ current: i + 1, total });
      setUploadProgress(`Processing ${i + 1}/${total}...`);

      try {
        await processSingleImage(file);
        successCount++;
      } catch (error: any) {
        console.error(`Failed to process ${file.name}:`, error);
        failCount++;
      }
    }

    // Show result
    if (successCount > 0) {
      toast(`Added ${successCount} item${successCount > 1 ? 's' : ''}!`, "success");
    }
    if (failCount > 0) {
      toast(`Failed to add ${failCount} item${failCount > 1 ? 's' : ''}`, "error");
    }

    setUploading(false);
    setUploadProgress("");
    setBatchProgress({ current: 0, total: 0 });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Reload to show new items
    if (successCount > 0) {
      window.location.reload();
    }
  };

  // Handle Recommendation
  const handleCommand = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setRecommendation(null);
    setOutfitItems([]);

    try {
      const { data: inventory } = await supabase.from("items").select("*");

      if (!inventory || inventory.length === 0) {
        toast("Add some clothes first!", "info");
        setLoading(false);
        return;
      }

      const result = await recommendOutfitAction(input, inventory);
      setRecommendation(result);

      if (result.selected_item_ids?.length > 0) {
        const { data: selectedItems } = await supabase
          .from("items")
          .select("*")
          .in("id", result.selected_item_ids);
        setOutfitItems(selectedItems || []);
      }
    } catch (error: any) {
      console.error(error);
      toast("Stylist failed. Try again.", "error");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-teal-500/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-lg border-b border-zinc-800/50 px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-tight text-teal-400">
            WARDROBE<span className="text-zinc-600">_</span>ENGINEER
          </h1>
          <p className="text-[10px] text-zinc-600 font-mono -mt-0.5">v1.1 // batch upload</p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full transition-all",
            uploading
              ? "bg-teal-500/20 text-teal-400"
              : "bg-zinc-800 hover:bg-zinc-700 hover:scale-105 active:scale-95"
          )}
        >
          {uploading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-teal-400 border-t-transparent rounded-full" />
              <span className="text-xs">{uploadProgress}</span>
            </>
          ) : (
            <>
              <ImagePlus size={18} />
              <span className="text-sm hidden sm:inline">Add</span>
            </>
          )}
        </button>

        {/* Multi-file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={SUPPORTED_FORMATS}
          multiple
          onChange={handleFileChange}
        />
      </header>

      {/* Batch Progress Bar */}
      {uploading && batchProgress.total > 1 && (
        <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Batch Upload</span>
            <span>{batchProgress.current}/{batchProgress.total}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="p-4 pb-28">
        <ClothesGrid />
      </div>

      {/* Recommendation Overlay */}
      {recommendation && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setRecommendation(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl p-5 shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setRecommendation(null)}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors p-1.5 hover:bg-zinc-800 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-teal-400" />
              <h3 className="font-mono text-sm text-teal-400">OUTFIT_SUGGESTION</h3>
            </div>

            {/* Outfit Images */}
            {outfitItems.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {outfitItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-teal-500/30 shadow-lg shadow-teal-500/10"
                  >
                    <Image
                      src={item.image_url}
                      alt={item.tags?.sub_category || "Outfit item"}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1 py-0.5">
                      <p className="text-[9px] text-white truncate font-medium">
                        {item.tags?.sub_category || item.tags?.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-zinc-300 text-sm leading-relaxed">
              {recommendation.reasoning}
            </p>

            {outfitItems.length === 0 && (
              <p className="text-zinc-500 text-xs italic mt-3 bg-zinc-800/50 p-2 rounded-lg">
                No matching items found. Mark more items as clean or try a different occasion.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Command Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-8">
        <div className="max-w-xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleCommand()}
            placeholder="What's the occasion?"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-lg placeholder:text-zinc-500"
          />
          <button
            onClick={handleCommand}
            disabled={loading || !input.trim()}
            className="bg-teal-500 hover:bg-teal-400 text-black font-semibold px-4 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/20"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
