"use client";

import { useState, useRef } from "react";
import { ClothesGrid } from "@/components/ClothesGrid";
import { Send, Sparkles, ImagePlus, Grid3X3, Wand2, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { analyzeImageAction, recommendOutfitAction } from "./actions";
import { ClothingItem } from "@/types";
import Image from "next/image";
import { useToast } from "@/components/Toast";
import { convertToJpeg, SUPPORTED_FORMATS } from "@/lib/image";

type Tab = "closet" | "stylist";

// Quick prompts for the stylist
const QUICK_PROMPTS = [
  "Office meeting",
  "Casual weekend",
  "Date night",
  "Workout",
  "Brunch",
];

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
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Process single image
  const processSingleImage = async (file: File): Promise<any> => {
    const jpegBlob = await convertToJpeg(file);
    const jpegFile = new File([jpegBlob], `${Date.now()}.jpg`, { type: 'image/jpeg' });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error: uploadError } = await supabase.storage.from("wardrobe").upload(filename, jpegFile);
    if (uploadError) throw uploadError;

    const publicUrl = supabase.storage.from("wardrobe").getPublicUrl(filename).data.publicUrl;

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
    if (!files?.length) return;

    const fileArray = Array.from(files);
    setUploading(true);
    setBatchProgress({ current: 0, total: fileArray.length });

    let success = 0, fail = 0;
    for (let i = 0; i < fileArray.length; i++) {
      setBatchProgress({ current: i + 1, total: fileArray.length });
      try {
        await processSingleImage(fileArray[i]);
        success++;
      } catch (e) {
        fail++;
      }
    }

    if (success) toast(`Added ${success} item${success > 1 ? 's' : ''}`, "success");
    if (fail) toast(`${fail} failed`, "error");

    setUploading(false);
    setBatchProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (success) window.location.reload();
  };

  // Stylist
  const handleAsk = async (prompt?: string) => {
    const query = prompt || input;
    if (!query.trim()) return;

    setLoading(true);
    setRecommendation(null);
    setOutfitItems([]);
    setInput(query);

    try {
      const { data: inventory } = await supabase.from("items").select("*");
      if (!inventory?.length) {
        toast("Add clothes first!", "info");
        setLoading(false);
        return;
      }

      const result = await recommendOutfitAction(query, inventory);
      setRecommendation(result);

      if (result.selected_item_ids?.length) {
        const { data } = await supabase.from("items").select("*").in("id", result.selected_item_ids);
        setOutfitItems(data || []);
      }
    } catch (e) {
      toast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 pt-safe px-safe backdrop-blur-xl"
        style={{
          background: 'rgba(15, 15, 15, 0.85)',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        <div className="flex items-center justify-between py-3">
          <div>
            <h1
              className="text-lg font-semibold tracking-tight"
              style={{ color: 'var(--color-accent-text)' }}
            >
              Wardrobe
            </h1>
          </div>

          {activeTab === "closet" && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium touch-target transition-all active:scale-95"
              style={{
                background: uploading ? 'var(--color-accent-muted)' : 'var(--color-surface-elevated)',
                color: uploading ? 'var(--color-accent-text)' : 'var(--color-text)'
              }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{batchProgress.current}/{batchProgress.total}</span>
                </>
              ) : (
                <>
                  <ImagePlus size={16} />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Progress bar */}
        {uploading && batchProgress.total > 1 && (
          <div className="h-0.5 -mb-px" style={{ background: 'var(--color-surface)' }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                background: 'var(--color-accent)'
              }}
            />
          </div>
        )}
      </header>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={SUPPORTED_FORMATS}
        multiple
        onChange={handleFileChange}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-safe">
        {activeTab === "closet" && (
          <div className="py-4">
            <ClothesGrid />
          </div>
        )}

        {activeTab === "stylist" && (
          <div className="py-6 flex flex-col min-h-full">
            {!recommendation ? (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-accent-muted)' }}
                >
                  <Wand2 size={28} style={{ color: 'var(--color-accent)' }} />
                </div>
                <h2 className="text-xl font-semibold mb-2">AI Stylist</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                  Tell me the occasion and I'll pick the perfect outfit
                </p>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleAsk(prompt)}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95"
                      style={{
                        background: 'var(--color-surface-elevated)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Result */
              <div className="flex-1 px-4 animate-fade-in">
                <div
                  className="text-xs font-medium uppercase tracking-wider mb-3"
                  style={{ color: 'var(--color-accent)' }}
                >
                  For "{input}"
                </div>

                {/* Outfit Images */}
                {outfitItems.length > 0 && (
                  <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {outfitItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden"
                        style={{
                          border: '2px solid var(--color-accent)',
                          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)'
                        }}
                      >
                        <Image
                          src={item.image_url}
                          alt={item.tags?.sub_category || "Item"}
                          fill
                          className="object-cover"
                        />
                        <div
                          className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}
                        >
                          <p className="text-[10px] text-white font-medium truncate">
                            {item.tags?.sub_category || item.tags?.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reasoning */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    {recommendation.reasoning}
                  </p>
                </div>

                <button
                  onClick={() => { setRecommendation(null); setInput(""); }}
                  className="mt-4 text-sm font-medium"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Try another occasion →
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div
              className="mt-auto pt-4 pb-2"
              style={{ borderTop: '1px solid var(--color-border-subtle)' }}
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleAsk()}
                  placeholder="Describe the occasion..."
                  className="flex-1 px-4 py-3.5 rounded-2xl text-sm outline-none"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)'
                  }}
                />
                <button
                  onClick={() => handleAsk()}
                  disabled={loading || !input.trim()}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-black" />
                  ) : (
                    <Send size={18} className="text-black" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="sticky bottom-0 pb-safe px-safe"
        style={{
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border-subtle)'
        }}
      >
        <div className="flex">
          <button
            onClick={() => setActiveTab("closet")}
            className="flex-1 flex flex-col items-center py-3 gap-1 touch-target transition-colors"
            style={{ color: activeTab === "closet" ? 'var(--color-accent)' : 'var(--color-text-subtle)' }}
          >
            <Grid3X3 size={22} />
            <span className="text-[10px] font-medium">Closet</span>
          </button>
          <button
            onClick={() => setActiveTab("stylist")}
            className="flex-1 flex flex-col items-center py-3 gap-1 touch-target transition-colors"
            style={{ color: activeTab === "stylist" ? 'var(--color-accent)' : 'var(--color-text-subtle)' }}
          >
            <Wand2 size={22} />
            <span className="text-[10px] font-medium">Stylist</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
