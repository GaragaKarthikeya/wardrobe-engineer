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

const SUGGESTIONS = [
  "Casual coffee date",
  "Business meeting",
  "Rainy day comfort",
  "Night out"
];

const LOADING_STEPS = [
  "Analyzing your closet...",
  "Matching colors...",
  "Checking weather patterns...",
  "Finalizing your look..."
];

export default function Home() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("closet");

  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
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

  const ask = async (overridePrompt?: string) => {
    const p = overridePrompt || prompt;
    if (!p.trim()) return;
    triggerHaptic('medium');

    setThinking(true);
    setResult(null);
    setLoadingStep(0);

    // Loading Animation Cycle
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
    }, 800);

    try {
      const { data: inv } = await supabase.from("items").select("*");
      if (!inv?.length) {
        toast("Add items first", "info");
        setThinking(false);
        clearInterval(interval);
        return;
      }

      const res = await recommendOutfitAction(p, inv);
      clearInterval(interval);

      if (res.selected_item_ids?.length) {
        const { data } = await supabase.from("items").select("*").in("id", res.selected_item_ids);
        setResult({ items: data || [], reason: res.reasoning });
        triggerHaptic('success');
      } else {
        setResult({ items: [], reason: res.reasoning });
        triggerHaptic('light');
      }
    } catch (err) {
      clearInterval(interval);
      toast("Something went wrong", "error");
      triggerHaptic('error');
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-system-background font-sans selection:bg-tint/30 tracking-tight">
      {/* Navigation Bar - iOS Large Title Style */}
      <header className="safe-top px-4 sticky top-0 z-40 bg-system-background/80 backdrop-blur-xl border-b border-separator transition-all">
        <div className="flex items-center justify-between py-2 min-h-[52px]">
          <h1 className="text-large-title text-label-primary tracking-tight font-bold">
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

        {/* Progress Bar */}
        {uploading && (
          <div className="h-0.5 rounded-full overflow-hidden mb-2 bg-fill-tertiary mx-1">
            <div className="h-full transition-all duration-300 bg-tint" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        )}
      </header>

      {/* Hidden Input for Uploads */}
      <input type="file" ref={fileRef} className="hidden" accept={SUPPORTED_FORMATS} multiple onChange={upload} />

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {view === "closet" && (
          <div className="px-4 pb-[120px] pt-4">
            <ClothesGrid />
          </div>
        )}

        {view === "stylist" && (
          <div className="flex flex-col h-full px-4 pb-[140px] pt-4 max-w-xl mx-auto w-full relative">

            {thinking && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-system-background/80 backdrop-blur-sm animate-fade-in">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-[3px] border-fill-tertiary border-t-tint animate-spin" />
                </div>
                <p className="mt-6 text-body font-medium text-label-secondary animate-pulse">
                  {LOADING_STEPS[loadingStep]}
                </p>
              </div>
            )}

            {!result && !thinking ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in transition-all">
                <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-6 bg-fill-tertiary/50 text-tint shadow-lg shadow-tint/10">
                  <Sparkles size={32} />
                </div>
                <p className="text-title-2 mb-2 text-label-primary font-bold">
                  Personal Stylist
                </p>
                <p className="text-body text-label-secondary mb-8 max-w-[280px]">
                  What are we dressing for today?
                </p>

                {/* Suggestions Chips */}
                <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => { setPrompt(s); ask(s); }}
                      className="px-4 py-2 rounded-full bg-fill-tertiary/50 hover:bg-fill-secondary active:scale-95 transition-all text-subheadline text-label-primary font-medium"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : result && !thinking && (
              <div className="flex-1 pt-2 animate-slide-up pb-4 overflow-y-auto no-scrollbar">
                {/* User Prompt Bubble */}
                <div className="flex justify-end mb-8 px-1">
                  <div className="bg-tint px-5 py-3 rounded-[20px] rounded-tr-[4px] max-w-[85%] shadow-sm">
                    <p className="text-[17px] text-white leading-snug">{prompt}</p>
                  </div>
                </div>

                {/* Magazine Style Result */}
                <div className="animate-scale-in">
                  <div className="flex items-center gap-2 mb-4 px-1 opacity-60">
                    <Sparkles size={14} className="text-label-secondary" />
                    <span className="text-caption-1 font-semibold text-label-secondary uppercase tracking-wider">
                      Curated Look
                    </span>
                  </div>

                  {/* Editorial Layout */}
                  {result.items.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {result.items.map((item, i) => (
                        <div
                          key={item.id}
                          className={`relative overflow-hidden rounded-xl bg-fill-tertiary ${i === 0 && result.items.length === 3 ? 'col-span-2 aspect-[16/9]' : 'aspect-[3/4]'}`}
                        >
                          <Image src={item.image_url} alt="" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/10" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-0 mb-8">
                    <p className="text-[18px] leading-[1.5] text-label-primary font-normal">
                      {result.reason}
                    </p>
                  </div>

                  <div className="flex justify-center pb-8">
                    <button
                      onClick={() => {
                        setResult(null);
                        setPrompt("");
                        triggerHaptic('medium');
                      }}
                      className="h-11 px-6 rounded-full bg-fill-tertiary hover:bg-fill-secondary active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Sparkles size={16} className="text-tint" />
                      <span className="text-subheadline font-semibold text-label-primary">Style Another Look</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compose Bar */}
            <div className={`mt-auto pt-4 transition-all duration-300 ${result ? 'translate-y-0' : ''}`}>
              <div className="flex gap-3 p-1.5 pl-4 rounded-full bg-[#1C1C1E] items-center ring-1 ring-white/10 focus-within:ring-tint/50 transition-all shadow-lg">
                <input
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !thinking && ask()}
                  placeholder="Describe the occasion..."
                  disabled={thinking}
                  className="flex-1 py-2.5 text-[17px] bg-transparent outline-none text-label-primary placeholder:text-label-tertiary"
                />
                <button
                  onClick={() => ask()}
                  disabled={thinking || !prompt.trim()}
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center bg-tint disabled:opacity-30 disabled:hidden transition-all active:scale-90"
                >
                  {thinking ? (
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  ) : (
                    <ArrowUp size={18} className="text-white" strokeWidth={3} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Tab Bar - Dynamic Island Style */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up-fade">
        <div className="flex items-center justify-center gap-1 p-1 pr-2 rounded-full bg-[#1C1C1E]/90 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10">
          <button
            onClick={() => { setView("closet"); triggerHaptic('light'); }}
            className={`
              relative flex items-center gap-2 pl-4 pr-5 h-12 rounded-full transition-all duration-300
              ${view === "closet" ? "bg-white text-black shadow-sm" : "text-label-secondary hover:text-white hover:bg-white/5"}
            `}
          >
            <LayoutGrid size={20} strokeWidth={view === "closet" ? 2.5 : 2} />
            <span className="text-[13px] font-semibold tracking-tight">Closet</span>
          </button>

          <button
            onClick={() => { setView("stylist"); triggerHaptic('light'); }}
            className={`
              relative flex items-center gap-2 pl-4 pr-5 h-12 rounded-full transition-all duration-300
              ${view === "stylist" ? "bg-white text-black shadow-sm" : "text-label-secondary hover:text-white hover:bg-white/5"}
            `}
          >
            <Sparkles size={20} strokeWidth={view === "stylist" ? 2.5 : 2} />
            <span className="text-[13px] font-semibold tracking-tight">Stylist</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

