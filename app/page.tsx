"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, LayoutGrid, Sparkles, ArrowUp, X, Check, RotateCcw } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { ClothesGrid } from "@/components/ClothesGrid";
import { FilterModal } from "@/components/FilterModal";
import { useToast } from "@/components/Toast";
import { recommendOutfitAction, analyzeImageAction as uploadImageAction } from "@/app/actions";
import { getLocalItems as getAllItems, saveLocalItem as saveItem } from "@/lib/db";
import { syncFromServer as syncWithSupabase, updateItem } from "@/lib/sync";
import { convertToJpeg } from "@/lib/image";
import Image from "next/image";

// Wrapper to match expected interface and fetch item details
const askStylist = async (items: any[], prompt: string) => {
  const res = await recommendOutfitAction(prompt, items);

  // Map IDs back to full item objects
  const recommendedItems = res.selected_item_ids
    .map((id: string) => items.find(i => i.id === id))
    .filter(Boolean);

  return {
    reasoning: res.reasoning,
    items: recommendedItems,
    outfit_type: res.outfit_type,
    logic: res.logic,
    vibe: res.vibe
  };
};

// Enhanced type definition for Wardrobe Engineer output
interface StylistResult {
  reasoning: string;
  items: any[];
  outfit_type?: string;
  logic?: string;
  vibe?: string;
}
import { AnimatePresence, motion } from "framer-motion";

const SUGGESTIONS = [
  "Class today",
  "Presentation",
  "Just chilling",
  "Going out",
  "Meeting someone",
  "Need to focus"
];

export default function Home() {
  const [view, setView] = useState<"closet" | "stylist">("closet");
  const [showFilters, setShowFilters] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<StylistResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState(""); // Store the last used prompt for Try Again
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    triggerHaptic();

    let successCount = 0;
    let lastError = "";

    try {
      // Process all files
      for (const file of Array.from(files)) {
        try {
          // Compress image to JPEG with max 800KB target
          const compressedBlob = await convertToJpeg(file, 0.8);

          // If still too large, compress more aggressively
          let finalBlob = compressedBlob;
          if (compressedBlob.size > 800 * 1024) {
            finalBlob = await convertToJpeg(file, 0.6);
          }

          // Create new file from compressed blob
          const compressedFile = new File([finalBlob], file.name, { type: 'image/jpeg' });

          const formData = new FormData();
          formData.append("file", compressedFile);

          const newItem = await uploadImageAction(formData);
          await saveItem(newItem);
          successCount++;
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          lastError = error.message || "Upload failed";
        }
      }

      triggerHaptic();
      if (successCount > 0) {
        toast(successCount === 1 ? "Item added" : `${successCount} items added`, "success");
        setRefreshTrigger(p => p + 1);
        syncWithSupabase();
      }

      // Show rejection reason if any file failed
      if (lastError && successCount === 0) {
        toast(lastError, "error");
      } else if (lastError && successCount > 0) {
        toast(`${files.length - successCount} rejected`, "error");
      }
    } catch (error: any) {
      console.error(error);
      triggerHaptic();
      toast(error.message || "Failed to upload", "error");
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
    setLastPrompt(text); // Store for "Try Again"
    setResult(null); // Clear previous result to show loading state

    try {
      const items = await getAllItems();
      const response = await askStylist(items, text);
      setResult(response);
      setPrompt(text); // Update prompt to show in bubble
      triggerHaptic();
    } catch (e) {
      console.error(e);
      triggerHaptic();
      toast("Stylist is unavailable", "error");
      // Keep prompt so user can try again
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
        multiple
      />

      {/* Header - Liquid Glass */}
      <header className="fixed top-0 left-0 right-0 z-50 animate-slide-down-fade">
        <div className="liquid-glass-ultra mx-4 mt-safe-top h-[60px] flex items-center justify-between px-5 rounded-[24px]">
          <span className="text-[28px] font-bold tracking-tight text-white drop-shadow-md">
            {view === "closet" ? "Closet" : "Stylist"}
          </span>
          {view === "closet" && (
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
          )}
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
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col min-h-[calc(100vh-180px)]"
            >
              {/* Result Area */}
              {result ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 space-y-5 pb-6"
                >
                  {/* User Query Bubble */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-end"
                  >
                    <div className="bg-white/10 backdrop-blur-xl px-5 py-3.5 rounded-[20px] rounded-tr-[6px] border border-white/10 max-w-[85%]">
                      <p className="text-[16px] text-white leading-relaxed font-medium">{lastPrompt}</p>
                    </div>
                  </motion.div>

                  {/* Outfit Showcase */}
                  {result.items.length > 0 && (
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-between px-1"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <Sparkles size={13} className="text-white" />
                          </div>
                          <span className="text-[12px] font-semibold text-white/50 uppercase tracking-wider">
                            {result.outfit_type || "Outfit"}
                          </span>
                        </div>
                        {result.vibe && (
                          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                            {result.vibe}
                          </span>
                        )}
                      </motion.div>

                      <div className="grid grid-cols-2 gap-3.5">
                        {result.items.map((item, i) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              delay: 0.3 + i * 0.1,
                              duration: 0.5,
                              ease: [0.25, 0.1, 0.25, 1]
                            }}
                            className={`group relative rounded-[20px] overflow-hidden ${i === 0 && result.items.length % 2 !== 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-[3/4]'}`}
                          >
                            <Image
                              src={item.image_url}
                              alt="Outfit item"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-[13px] font-semibold text-white/95 truncate">
                                {item.tags?.sub_category || item.tags?.category || "Item"}
                              </p>
                              <p className="text-[11px] text-white/50 truncate">
                                {item.tags?.color}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logic Line - Color Theory Explanation */}
                  {result.logic && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + result.items.length * 0.1 + 0.1 }}
                      className="px-1"
                    >
                      <p className="text-[13px] text-white/40 font-medium italic">
                        "{result.logic}"
                      </p>
                    </motion.div>
                  )}

                  {/* AI Reasoning */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + result.items.length * 0.1 + 0.2 }}
                    className="bg-white/5 backdrop-blur-xl px-5 py-4 rounded-[20px] border border-white/10"
                  >
                    <p className="text-[15px] text-white/75 leading-relaxed">{result.reasoning}</p>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + result.items.length * 0.1 }}
                    className="flex flex-col gap-3 w-full"
                  >
                    {/* Wear This - Primary Button (only show if items exist) */}
                    {result.items.length > 0 && (
                      <button
                        onClick={async () => {
                          triggerHaptic();

                          // Mark all non-accessory items as dirty
                          const itemsToMark = result.items.filter(item => item.tags?.category !== 'Accessory');
                          for (const item of itemsToMark) {
                            await updateItem(item.id, { is_clean: false });
                          }

                          // Clear state and navigate
                          setResult(null);
                          setPrompt("");
                          setRefreshTrigger(p => p + 1);

                          // Switch to closet with slight delay for animation
                          setTimeout(() => {
                            setView("closet");
                            triggerHaptic();
                          }, 100);

                          const count = itemsToMark.length;
                          toast(count === 1 ? "1 item marked as worn" : `${count} items marked as worn`, "success");
                        }}
                        className="w-full py-3.5 rounded-full bg-white text-black text-[16px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                      >
                        <Check size={18} strokeWidth={2.5} /> Wear This
                      </button>
                    )}

                    {/* Secondary Buttons Row */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { triggerHaptic(); ask(lastPrompt); }}
                        className="flex-1 py-3 rounded-full bg-white/10 border border-white/10 text-[15px] font-medium text-white/80 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <RotateCcw size={16} /> Try Again
                      </button>
                      <button
                        onClick={() => { triggerHaptic(); setResult(null); setPrompt(""); setLastPrompt(""); }}
                        className="flex-1 py-3 rounded-full bg-white/5 border border-white/10 text-[15px] font-medium text-white/60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <X size={16} /> New
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                // Empty/Loading State
                <div className="flex-1 flex flex-col items-center justify-center px-6 relative min-h-[500px]">
                  {/* Ambient Glow - Subtle and Elegant */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: thinking ? [0.15, 0.25, 0.15] : 0.1,
                      scale: thinking ? [1, 1.1, 1] : 1
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: thinking ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-radial from-white/20 to-transparent rounded-full blur-[100px] pointer-events-none"
                  />

                  {/* Center Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        y: thinking ? [0, -4, 0] : [0, -6, 0]
                      }}
                      transition={{
                        scale: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
                        opacity: { duration: 0.6 },
                        y: {
                          duration: thinking ? 2 : 3.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                      className="mb-10"
                    >
                      {thinking ? (
                        // Loading - 3 elegant dots
                        <div className="flex items-center gap-2">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.4, 1, 0.4]
                              }}
                              transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                              }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          ))}
                        </div>
                      ) : (
                        // Idle - simple sparkle
                        <Sparkles size={44} className="text-white" strokeWidth={1.5} />
                      )}
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.5 }}
                      className="text-[32px] font-semibold text-white mb-3 tracking-tight"
                    >
                      {thinking ? "Thinking" : "Stylist"}
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25, duration: 0.5 }}
                      className="text-[17px] text-white/45 max-w-[300px] text-center leading-relaxed font-normal"
                    >
                      {thinking
                        ? "Finding the perfect pieces"
                        : "I'll pick the perfect outfit"}
                    </motion.p>
                  </div>
                </div>
              )}

              {/* Suggestion Chips */}
              {!result && !thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex overflow-x-auto gap-2.5 pb-3 px-1 no-scrollbar"
                >
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      onClick={() => { triggerHaptic(); setPrompt(s); ask(s); }}
                      className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[14px] text-white/80 font-medium hover:bg-white/10 active:scale-95 transition-all flex-shrink-0"
                    >
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Input Box - Only show when no result and not thinking */}
              {!result && !thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className={`
                    w-full flex items-center gap-3 p-2 pl-5 rounded-[24px] 
                    bg-white/5 backdrop-blur-xl border transition-all duration-200
                    ${isInputFocused ? 'border-white/25' : 'border-white/10'}
                  `}
                >
                  <input
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && ask()}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="What's the occasion?"
                    className="flex-1 py-2 bg-transparent outline-none text-[16px] text-white placeholder:text-white/35"
                  />
                  <button
                    onClick={() => ask()}
                    disabled={!prompt.trim()}
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center 
                      transition-all duration-200
                      ${prompt.trim()
                        ? 'bg-white scale-100 opacity-100'
                        : 'bg-white/10 scale-90 opacity-50'
                      }
                      active:scale-95
                    `}
                  >
                    <ArrowUp size={18} className={prompt.trim() ? "text-black" : "text-white/60"} strokeWidth={2.5} />
                  </button>
                </motion.div>
              )}
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
