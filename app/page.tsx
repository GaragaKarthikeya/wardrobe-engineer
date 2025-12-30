"use client";

import { useState, useRef } from "react";
import { ClothesGrid } from "@/components/ClothesGrid";
import { ArrowUp, Sparkles, Plus, LayoutGrid, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { analyzeImageAction, recommendOutfitAction } from "./actions";
import { ClothingItem } from "@/types";
import Image from "next/image";
import { useToast } from "@/components/Toast";
import { convertToJpeg, SUPPORTED_FORMATS } from "@/lib/image";
import { triggerHaptic } from "@/lib/haptics";

type View = "closet" | "stylist";

export default function Home() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("closet");

  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<{ items: ClothingItem[]; reason: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    triggerHaptic('medium');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setProgress({ done: 0, total: files.length });

    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      setProgress({ done: i + 1, total: files.length });
      try {
        const blob = await convertToJpeg(files[i]);
        const file = new File([blob], `${Date.now()}.jpg`, { type: 'image/jpeg' });
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

        await supabase.storage.from("wardrobe").upload(name, file);
        const url = supabase.storage.from("wardrobe").getPublicUrl(name).data.publicUrl;

        const form = new FormData();
        form.append("file", file);
        const tags = await analyzeImageAction(form);

        await supabase.from("items").insert({ image_url: url, tags, is_clean: true });
        ok++;
        triggerHaptic('success');
      } catch (err) {
        console.error(err);
        triggerHaptic('error');
      }
    }

    if (ok) toast(`${ok} item${ok > 1 ? 's' : ''} added`, "success");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (ok) window.location.reload();
  };

  const ask = async () => {
    if (!prompt.trim()) return;
    triggerHaptic('medium');

    setThinking(true);
    setResult(null);

    try {
      const { data: inv } = await supabase.from("items").select("*");
      if (!inv?.length) {
        toast("Add items first", "info");
        setThinking(false);
        return;
      }

      const res = await recommendOutfitAction(prompt, inv);

      if (res.selected_item_ids?.length) {
        const { data } = await supabase.from("items").select("*").in("id", res.selected_item_ids);
        setResult({ items: data || [], reason: res.reasoning });
        triggerHaptic('success');
      } else {
        setResult({ items: [], reason: res.reasoning });
        triggerHaptic('light');
      }
    } catch (err) {
      toast("Something went wrong", "error");
      triggerHaptic('error');
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-system-background">
      {/* Navigation Bar - iOS Large Title Style */}
      <header className="safe-top px-4 sticky top-0 z-40 bg-system-background/80 backdrop-blur-xl border-b border-separator/0 transition-all">
        <div className="flex items-center justify-between py-2 min-h-[52px]">
          <h1 className="text-large-title text-label-primary tracking-tight">
            {view === "closet" ? "Closet" : "Stylist"}
          </h1>

          {view === "closet" && (
            <button
              onClick={() => { fileRef.current?.click(); triggerHaptic('light'); }}
              disabled={uploading}
              className="ios-btn flex items-center gap-1 text-tint font-semibold text-[17px]"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={22} />}
            </button>
          )}
        </div>

        {uploading && (
          <div className="h-0.5 rounded-full overflow-hidden mb-2 bg-fill-tertiary mx-1">
            <div
              className="h-full transition-all duration-300 bg-tint"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        )}
      </header>

      <input
        type="file"
        ref={fileRef}
        className="hidden"
        accept={SUPPORTED_FORMATS}
        multiple
        onChange={upload}
      />

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {view === "closet" && (
          <div className="px-4 pb-[120px] pt-4">
            <ClothesGrid />
          </div>
        )}

        {view === "stylist" && (
          <div className="flex flex-col h-full px-4 pb-[120px] pt-4">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8 animate-fade-in">
                <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center mb-6 bg-fill-tertiary">
                  <Sparkles size={32} className="text-label-secondary" />
                </div>
                <p className="text-title-2 mb-2 text-label-primary">
                  What are you dressing for?
                </p>
                <p className="text-body text-label-secondary">
                  Describe the occasion or weather, and I'll suggest an outfit from your clean items.
                </p>
              </div>
            ) : (
              <div className="flex-1 pt-4 animate-slide-up">
                <p className="text-caption-1 font-semibold uppercase tracking-wider mb-4 text-label-tertiary pl-1">
                  Suggested Outfit
                </p>

                {result.items.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4 snap-x">
                    {result.items.map(item => (
                      <div
                        key={item.id}
                        className="relative w-[140px] aspect-square flex-shrink-0 rounded-2xl overflow-hidden bg-secondary-background snap-center shadow-lg border border-white/5 animate-pop"
                      >
                        <Image src={item.image_url} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-5 rounded-[18px] mt-2 bg-secondary-background">
                  <p className="text-body text-label-primary leading-relaxed">
                    {result.reason}
                  </p>
                </div>

                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => { setResult(null); setPrompt(""); triggerHaptic('light'); }}
                    className="ios-btn text-body font-medium text-tint"
                  >
                    Try Another
                  </button>
                </div>
              </div>
            )}

            {/* Compose Bar */}
            <div className="mt-auto pt-4">
              <div className="flex gap-3 p-1.5 pl-4 rounded-[22px] bg-secondary-background items-center ring-1 ring-white/10 focus-within:ring-tint/50 transition-all">
                <input
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !thinking && ask()}
                  placeholder="Describe the occasion..."
                  className="flex-1 py-2 text-body bg-transparent outline-none text-label-primary placeholder:text-label-tertiary"
                />
                <button
                  onClick={ask}
                  disabled={thinking || !prompt.trim()}
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center bg-tint disabled:opacity-30 transition-all active:scale-95"
                >
                  {thinking ? (
                    <Loader2 size={16} className="animate-spin text-white" />
                  ) : (
                    <ArrowUp size={18} className="text-white" strokeWidth={3} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Tab Bar - iOS Style Glass */}
      <nav className="fixed bottom-0 left-0 right-0 glass pb-[calc(20px+env(safe-area-inset-bottom))] pt-2 px-6 z-50 flex justify-around">
        <button
          onClick={() => { setView("closet"); triggerHaptic('light'); }}
          className="flex flex-col items-center gap-1 min-w-[64px] ios-btn"
        >
          <LayoutGrid
            size={24}
            className={view === "closet" ? "text-tint" : "text-label-tertiary"}
            strokeWidth={view === "closet" ? 2.5 : 2}
          />
          <span
            className={`text-[10px] font-medium ${view === "closet" ? "text-tint" : "text-label-tertiary"}`}
          >
            Closet
          </span>
        </button>
        <button
          onClick={() => { setView("stylist"); triggerHaptic('light'); }}
          className="flex flex-col items-center gap-1 min-w-[64px] ios-btn"
        >
          <Sparkles
            size={24}
            className={view === "stylist" ? "text-tint" : "text-label-tertiary"}
            fill={view === "stylist" ? "currentColor" : "none"}
          />
          <span
            className={`text-[10px] font-medium ${view === "stylist" ? "text-tint" : "text-label-tertiary"}`}
          >
            Stylist
          </span>
        </button>
      </nav>
    </div>
  );
}
