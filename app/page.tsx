"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, LayoutGrid, Sparkles, ArrowUp, X } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { ClothesGrid } from "@/components/ClothesGrid";
import { FilterModal } from "@/components/FilterModal";
import { useToast } from "@/components/Toast";
import { recommendOutfitAction, analyzeImageAction as uploadImageAction } from "@/app/actions";
import { getLocalItems as getAllItems, saveLocalItem as saveItem } from "@/lib/db";
import { syncFromServer as syncWithSupabase } from "@/lib/sync";
import Image from "next/image"; // Added Image import

// Wrapper to match expected interface and fetch item details
const askStylist = async (items: any[], prompt: string) => {
  const res = await recommendOutfitAction(prompt, items);

  // Map IDs back to full item objects
  const recommendedItems = res.selected_item_ids
    .map((id: string) => items.find(i => i.id === id))
    .filter(Boolean);

  return { reasoning: res.reasoning, items: recommendedItems };
};

// ... type definition ...
interface StylistResult {
  reasoning: string;
  items: any[];
}
import { AnimatePresence, motion } from "framer-motion";

const SUGGESTIONS = [
  "Casual coffee date",
  "Business meeting",
  "Rainy day comfort",
  "Night out",
  "Weekend brunch",
  "Gym workout",
  "Date night"
];

export default function Home() {
  const [view, setView] = useState<"closet" | "stylist">("closet");
  const [showFilters, setShowFilters] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<StylistResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync on load
  useEffect(() => {
    syncWithSupabase().then(() => setRefreshTrigger(p => p + 1));
  }, []);

  const switchView = (v: "closet" | "stylist") => {
    triggerHaptic();
    setView(v);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    triggerHaptic();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const newItem = await uploadImageAction(formData);
      await saveItem(newItem);

      triggerHaptic();
      toast("Item added to closet", "success");
      setRefreshTrigger(p => p + 1);
      syncWithSupabase();
    } catch (error) {
      console.error(error);
      triggerHaptic();
      toast("Failed to upload", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const ask = async (overridePrompt?: string) => {
    const text = overridePrompt || prompt;
    if (!text.trim()) return;

    triggerHaptic();
    setThinking(true);
    setPrompt(text);

    try {
      const items = await getAllItems();
      const response = await askStylist(items, text);
      setResult(response);
      triggerHaptic();
    } catch (e) {
      console.error(e);
      triggerHaptic();
      toast("Stylist is unavailable", "error");
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 pb-24 relative overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
        accept="image/*"
      />

      {/* Header - Liquid Glass */}
      <header className="fixed top-0 left-0 right-0 z-50 animate-slide-down-fade">
        <div className="liquid-glass-ultra mx-4 mt-safe-top h-[60px] flex items-center justify-between px-5 rounded-[24px]">
          <span className="text-[28px] font-bold tracking-tight text-white drop-shadow-md">
            Closet
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-10 h-10 rounded-full liquid-button liquid-pill-sm flex items-center justify-center p-0"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={24} className="text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[calc(60px+env(safe-area-inset-top)+24px)]" />

      {/* Main Content Area with Sliding Transition */}
      <main className="px-4 relative min-h-[80vh]">
        <AnimatePresence mode="wait">
          {view === "closet" ? (
            <motion.div
              key="closet"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <ClothesGrid
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                refreshTrigger={refreshTrigger}
              />
            </motion.div>
          ) : (
            <motion.div
              key="stylist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col h-[calc(100vh-180px)]"
            >
              {/* Stylist UI Window - Matches Tab Bar Style */}
              <div className="flex-1 flex flex-col relative overflow-hidden rounded-[32px] liquid-glass-elevated border-white/10 shadow-2xl">

                {/* Result Area */}
                {result ? (
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 animate-fade-in no-scrollbar pb-32">
                    {/* User Query Bubble */}
                    <div className="flex justify-end">
                      <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-[24px] rounded-tr-[4px] border border-white/10 shadow-lg max-w-[85%]">
                        <p className="text-[17px] text-white leading-snug font-medium">{prompt}</p>
                      </div>
                    </div>

                    {/* Outfit Showcase - Staggered Animation */}
                    {result.items.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-4 px-1">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <Sparkles size={14} className="text-white" />
                          </div>
                          <span className="text-[13px] font-bold text-white/60 uppercase tracking-widest">Curated Look</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {result.items.map((item, i) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: i * 0.15, duration: 0.4, ease: "easeOut" }}
                              className={`group relative aspect-[3/4] rounded-[24px] overflow-hidden bg-black/40 border border-white/10 shadow-lg ${i === 0 && result.items.length % 2 !== 0 ? 'col-span-2 aspect-[4/3]' : ''}`}
                            >
                              <Image
                                src={item.image_url}
                                alt="Outfit item"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                              <div className="absolute bottom-3 left-3 right-3">
                                <p className="text-[13px] font-semibold text-white truncate">{item.tags?.sub_category || "Item"}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Reasoning */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: result.items.length * 0.15 + 0.2 }}
                      className="bg-black/40 backdrop-blur-md px-6 py-5 rounded-[28px] border border-white/5 shadow-lg"
                    >
                      <div className="prose prose-invert prose-p:text-white/80 prose-p:leading-relaxed">
                        <p className="text-[16px]">{result.reasoning}</p>
                      </div>
                    </motion.div>

                    <button
                      onClick={() => { setResult(null); setPrompt(""); }}
                      className="mx-auto flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[15px] text-white/60 hover:bg-white/10 transition-all"
                    >
                      <X size={16} /> Start New Style
                    </button>
                  </div>
                ) : (
                  // ... Empty State ...
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative">
                    {/* Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

                    {/* AI Orb Animation */}
                    <div className="relative mb-8">
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] ${thinking ? 'animate-pulse' : 'animate-[float_6s_ease-in-out_infinite]'}`}>
                        <div className={`w-16 h-16 rounded-full bg-white/10 blur-xl absolute inset-0 m-auto ${thinking ? 'animate-ping' : ''}`} />
                        <Sparkles size={40} className="text-white relative z-10" />
                      </div>
                    </div>

                    <h2 className="text-[28px] font-bold text-white mb-3 tracking-tight">Personal Stylist</h2>
                    <p className="text-[17px] text-white/50 max-w-[280px] leading-relaxed">
                      {thinking ? "Analyzing your wardrobe..." : "What's the occasion today?"}
                    </p>
                  </div>
                )}

                {/* Input Area - Floating Glass Pill */}
                <div className="p-4 pt-0 z-10">
                  {/* Suggestion Rail */}
                  {!result && !thinking && (
                    <div className="flex overflow-x-auto gap-3 pb-4 px-2 no-scrollbar mask-gradient-x">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => { triggerHaptic(); setPrompt(s); ask(s); }}
                          className="whitespace-nowrap px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[15px] text-white/90 font-medium active:bg-white/10 transition-all flex-shrink-0"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Compose Box */}
                  <div
                    className={`
                        w-full flex items-center gap-3 p-2 pl-5 rounded-[28px] 
                        bg-black/40 backdrop-blur-xl border transition-all duration-300
                        ${isInputFocused ? 'border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'border-white/10'}
                      `}
                  >
                    <input
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !thinking && ask()}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder="Ask anything..."
                      disabled={thinking}
                      className="flex-1 py-1.5 bg-transparent outline-none text-[17px] text-white placeholder:text-white/30"
                    />
                    <button
                      onClick={() => ask()}
                      disabled={thinking || !prompt.trim()}
                      className={`
                          w-10 h-10 rounded-full flex items-center justify-center 
                          transition-all duration-300 ease-out
                          ${prompt.trim()
                          ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-100 opacity-100'
                          : 'bg-white/10 scale-90 opacity-40'
                        }
                        `}
                    >
                      {thinking ? (
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <ArrowUp size={20} className={prompt.trim() ? "text-black" : "text-white"} strokeWidth={3} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Tab Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up-fade">
        <div className="liquid-tab-bar flex items-center gap-2 p-2 shadow-2xl">
          <button
            onClick={() => switchView("closet")}
            className={`
              liquid-tab flex items-center gap-2.5 px-6 h-12 rounded-full 
              transition-all duration-300 ease-out
              ${view === "closet"
                ? "liquid-tab-active"
                : "text-white/40 hover:text-white/60"
              }
            `}
          >
            <LayoutGrid size={20} className={view === "closet" ? "text-white" : ""} />
            <span className={`text-[15px] font-semibold ${view === "closet" ? "text-white" : ""}`}>Closet</span>
          </button>

          <button
            onClick={() => switchView("stylist")}
            className={`
              liquid-tab flex items-center gap-2.5 px-6 h-12 rounded-full 
              transition-all duration-300 ease-out
              ${view === "stylist"
                ? "liquid-tab-active"
                : "text-white/40 hover:text-white/60"
              }
            `}
          >
            <Sparkles size={20} className={view === "stylist" ? "text-white" : ""} />
            <span className={`text-[15px] font-semibold ${view === "stylist" ? "text-white" : ""}`}>Stylist</span>
          </button>
        </div>
      </nav>

      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={{ category: 'all', status: 'all', sort: 'newest' }}
        setFilters={() => { }}
      />
    </div>
  );
}
