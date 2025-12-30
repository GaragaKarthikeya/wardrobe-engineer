"use client";

import { useState, useRef, useEffect } from "react";
import { ClothesGrid } from "@/components/ClothesGrid";
import { ArrowUp, Sparkles, Plus, LayoutGrid } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { analyzeImageAction, recommendOutfitAction } from "./actions";
import { ClothingItem } from "@/types";
import Image from "next/image";
import { useToast } from "@/components/Toast";
import { convertToJpeg, SUPPORTED_FORMATS } from "@/lib/image";
import { triggerHaptic, prepareHaptics } from "@/lib/haptics";
import { saveLocalItem, getLocalItems } from "@/lib/db";

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
  const [isInputFocused, setIsInputFocused] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<{ items: ClothingItem[]; reason: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // Prepare haptics for iOS on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      prepareHaptics();
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
    };

    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('click', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    triggerHaptic();
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

        // Insert to server
        const { data } = await supabase.from("items").insert({ image_url: url, tags, is_clean: true }).select().single();

        // Also save to local DB for instant access
        if (data) {
          await saveLocalItem(data as ClothingItem);
        }

        ok++;
        triggerHaptic();
      } catch (err) {
        console.error(err);
        triggerHaptic();
      }
    }

    if (ok) toast(`${ok} item${ok > 1 ? 's' : ''} added`, "success");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    // Trigger a soft refresh by switching views
    if (ok) {
      setView("stylist");
      setTimeout(() => setView("closet"), 100);
    }
  };

  const ask = async (overridePrompt?: string) => {
    const p = overridePrompt || prompt;
    if (!p.trim()) return;
    triggerHaptic();

    setThinking(true);
    setResult(null);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
    }, 800);

    try {
      // Try local data first
      let inv = await getLocalItems();

      // Fallback to server if no local data
      if (!inv.length) {
        const { data } = await supabase.from("items").select("*");
        inv = (data || []) as ClothingItem[];
      }

      if (!inv.length) {
        toast("Add items first", "info");
        setThinking(false);
        clearInterval(interval);
        return;
      }

      const res = await recommendOutfitAction(p, inv);
      clearInterval(interval);

      if (res.selected_item_ids?.length) {
        // Find items in our local inventory
        const selectedItems = inv.filter(i => res.selected_item_ids.includes(i.id));
        setResult({ items: selectedItems, reason: res.reasoning });
        triggerHaptic();
      } else {
        setResult({ items: [], reason: res.reasoning });
        triggerHaptic();
      }
    } catch (err) {
      clearInterval(interval);
      toast("Something went wrong", "error");
      triggerHaptic();
    } finally {
      setThinking(false);
    }
  };

  const switchView = (newView: View) => {
    if (view !== newView) {
      triggerHaptic();
      setView(newView);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-system-background font-sans selection:bg-tint/30 tracking-tight">
      {/* Navigation Bar - iOS 26 Liquid Glass */}
      <header className="safe-top px-5 sticky top-0 z-40 liquid-glass-ultra">
        <div className="flex items-center justify-between py-4 min-h-[60px]">
          <h1 className="text-[28px] text-label-primary font-bold tracking-tight">
            {view === "closet" ? "Closet" : "Stylist"}
          </h1>

          {view === "closet" && (
            <button
              onClick={() => { fileRef.current?.click(); triggerHaptic(); }}
              disabled={uploading}
              className="liquid-button liquid-pill-sm flex items-center justify-center w-10 h-10 p-0"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus size={20} strokeWidth={2.5} className="text-label-primary" />
              )}
            </button>
          )}
        </div>

        {/* Progress Bar - Animated */}
        {uploading && (
          <div className="h-[2px] rounded-full overflow-hidden mb-3 bg-fill-quaternary">
            <div
              className="h-full bg-label-primary/80 transition-all duration-300 ease-out"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
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

            {/* Loading Overlay */}
            {thinking && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-system-background/90 backdrop-blur-sm animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-14 h-14 rounded-full border-[3px] border-fill-tertiary border-t-tint animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles size={20} className="text-tint animate-pulse" />
                  </div>
                </div>
                <p className="text-body font-medium text-label-secondary">
                  {LOADING_STEPS[loadingStep]}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!result && !thinking ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-tint-light shadow-glow-tint">
                  <Sparkles size={36} className="text-tint" />
                </div>
                <p className="text-title-2 mb-2 text-label-primary font-bold">
                  Personal Stylist
                </p>
                <p className="text-body text-label-secondary mb-8 max-w-[280px]">
                  What are we dressing for today?
                </p>

                {/* Suggestion Chips - Staggered Animation */}
                <div className="flex flex-wrap justify-center gap-2.5 max-w-sm">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => { triggerHaptic(); setPrompt(s); ask(s); }}
                      className="px-4 py-2.5 rounded-full bg-secondary-background border border-separator/50 ios-btn text-subheadline text-label-primary font-medium animate-scale-in"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : result && !thinking && (
              <div className="flex-1 pt-2 animate-fade-in pb-4 overflow-y-auto no-scrollbar">
                {/* User Prompt Bubble */}
                <div className="flex justify-end mb-6 px-1">
                  <div className="bg-tint px-5 py-3 rounded-[22px] rounded-tr-[6px] max-w-[85%] shadow-premium">
                    <p className="text-[17px] text-white leading-snug font-medium">{prompt}</p>
                  </div>
                </div>

                {/* Result Card */}
                <div className="animate-scale-in">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-6 h-6 rounded-full bg-tint-light flex items-center justify-center">
                      <Sparkles size={12} className="text-tint" />
                    </div>
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
                          className={`
                            relative overflow-hidden rounded-2xl bg-secondary-background shadow-premium
                            ${i === 0 && result.items.length === 3 ? 'col-span-2 aspect-[16/9]' : 'aspect-[3/4]'}
                          `}
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <Image src={item.image_url} alt="" fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mb-8">
                    <p className="text-[17px] leading-[1.6] text-label-primary">
                      {result.reason}
                    </p>
                  </div>

                  <div className="flex justify-center pb-8">
                    <button
                      onClick={() => {
                        setResult(null);
                        setPrompt("");
                        triggerHaptic();
                      }}
                      className="h-12 px-6 rounded-full bg-secondary-background border border-separator/50 ios-btn flex items-center gap-2.5"
                    >
                      <Sparkles size={16} className="text-tint" />
                      <span className="text-subheadline font-semibold text-label-primary">Style Another Look</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compose Bar - Premium */}
            <div className="mt-auto pt-4">
              <div
                className={`
                  flex gap-3 p-1.5 pl-5 rounded-full bg-secondary-background items-center 
                  border transition-all duration-300 shadow-premium-lg
                  ${isInputFocused ? 'border-tint/50 shadow-glow-tint' : 'border-separator/50'}
                `}
              >
                <input
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !thinking && ask()}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder="Describe the occasion..."
                  disabled={thinking}
                  className="flex-1 py-3 text-[17px] bg-transparent outline-none text-label-primary placeholder:text-label-tertiary"
                />
                <button
                  onClick={() => ask()}
                  disabled={thinking || !prompt.trim()}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center 
                    transition-all duration-200 ease-out
                    ${prompt.trim() ? 'bg-tint scale-100 opacity-100' : 'bg-fill-tertiary scale-90 opacity-50'}
                  `}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  {thinking ? (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  ) : (
                    <ArrowUp size={18} className="text-white" strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Tab Bar - iOS 26 Liquid Glass */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up-fade">
        <div className="liquid-tab-bar flex items-center gap-2 p-2">
          <button
            onClick={() => switchView("closet")}
            className={`
              liquid-tab flex items-center gap-2.5 px-6 h-12 rounded-full 
              transition-all duration-300 ease-out
              ${view === "closet"
                ? "liquid-tab-active"
                : "text-label-tertiary"
              }
            `}
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <LayoutGrid size={18} strokeWidth={view === "closet" ? 2.5 : 2} className={view === "closet" ? "text-label-primary" : ""} />
            <span className={`text-[14px] font-semibold ${view === "closet" ? "text-label-primary" : ""}`}>Closet</span>
          </button>

          <button
            onClick={() => switchView("stylist")}
            className={`
              liquid-tab flex items-center gap-2.5 px-6 h-12 rounded-full 
              transition-all duration-300 ease-out
              ${view === "stylist"
                ? "liquid-tab-active"
                : "text-label-tertiary"
              }
            `}
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <Sparkles size={18} strokeWidth={view === "stylist" ? 2.5 : 2} className={view === "stylist" ? "text-label-primary" : ""} />
            <span className={`text-[14px] font-semibold ${view === "stylist" ? "text-label-primary" : ""}`}>Stylist</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
