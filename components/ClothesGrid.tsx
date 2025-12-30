"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ClothingItem } from "@/types";
import { ClothCard } from "./ClothCard";
import { ItemDetailModal } from "./ItemDetailModal";
import { Loader2, X, Trash2 } from "lucide-react";
import { useToast } from "./Toast";
import { triggerHaptic } from "@/lib/haptics";
import { FilterModal } from "./FilterModal";
import { Filter, SlidersHorizontal, CheckCircle2 } from "lucide-react";

export function ClothesGrid() {
    const { toast } = useToast();
    const [items, setItems] = useState<ClothingItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<{
        category: string;
        status: 'all' | 'clean' | 'dirty';
        sort: 'newest' | 'oldest';
    }>({
        category: 'all',
        status: 'all',
        sort: 'newest'
    });

    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [editing, setEditing] = useState<ClothingItem | null>(null);

    const fetch = useCallback(async () => {
        const { data } = await supabase.from("items").select("*").order("created_at", { ascending: false });
        setItems(data as ClothingItem[] || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const toggle = async (id: string, clean: boolean) => {
        triggerHaptic('light');
        setItems(p => p.map(i => i.id === id ? { ...i, is_clean: !clean } : i));
        await supabase.from("items").update({ is_clean: !clean }).eq("id", id);
    };

    const toggleSelect = (id: string) => {
        triggerHaptic('selection');
        if (!selectMode) {
            setSelectMode(true);
            triggerHaptic('medium');
        }
        setSelected(p => {
            const n = new Set(p);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const deleteOne = async (id: string) => {
        triggerHaptic('heavy');
        const item = items.find(i => i.id === id);
        if (!item) return;

        setItems(p => p.filter(i => i.id !== id));
        await supabase.from("items").delete().eq("id", id);
        const file = item.image_url.split('/').pop();
        if (file) await supabase.storage.from("wardrobe").remove([file]);
        toast("Deleted", "success");
    };

    const deleteSelected = async () => {
        triggerHaptic('heavy');
        const toDelete = items.filter(i => selected.has(i.id));
        setItems(p => p.filter(i => !selected.has(i.id)));

        for (const item of toDelete) {
            await supabase.from("items").delete().eq("id", item.id);
            const file = item.image_url.split('/').pop();
            if (file) await supabase.storage.from("wardrobe").remove([file]);
        }

        toast(`${toDelete.length} deleted`, "success");
        exitSelectMode();
    };

    const exitSelectMode = () => {
        triggerHaptic('light');
        setSelectMode(false);
        setSelected(new Set());
    };

    // Derived State
    const filtered = items
        .filter(i => {
            if (filters.category !== 'all' && i.tags?.category !== filters.category) return false;
            if (filters.status === 'clean' && !i.is_clean) return false;
            if (filters.status === 'dirty' && i.is_clean) return false;
            return true;
        })
        .sort((a, b) => {
            if (filters.sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 size={24} className="animate-spin text-label-tertiary" />
            </div>
        );
    }

    if (!items.length) {
        return (
            <div className="text-center py-24 px-6 animate-scale-in">
                <p className="text-title-3 mb-2 text-label-primary">
                    No Items Yet
                </p>
                <p className="text-body text-label-secondary">
                    Tap the + button to add your first piece of clothing.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Header Controls */}
            {!selectMode && (
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => { setShowFilters(true); triggerHaptic('light') }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-background active:bg-fill-tertiary transition-colors border border-white/5"
                    >
                        <SlidersHorizontal size={16} className={filters.category !== 'all' ? 'text-tint' : 'text-label-secondary'} />
                        <span className={`text-[15px] font-medium ${filters.category !== 'all' ? 'text-label-primary' : 'text-label-secondary'}`}>
                            {filters.category === 'all' ? 'Filter' : filters.category}
                        </span>
                    </button>

                    <button
                        onClick={() => { setSelectMode(true); triggerHaptic('light') }}
                        className="text-[15px] font-medium text-tint px-2 py-1"
                    >
                        Select
                    </button>
                </div>
            )}

            {/* Select Mode Bar */}
            {selectMode && (
                <div className="flex items-center justify-between p-3 rounded-xl mb-4 animate-fade-in bg-secondary-background border border-separator/50">
                    <button
                        onClick={exitSelectMode}
                        className="flex items-center gap-2 ios-btn px-2"
                    >
                        <X size={18} className="text-tint" strokeWidth={2.5} />
                        <span className="text-body text-tint">Cancel</span>
                    </button>

                    <span className="text-subheadline font-semibold text-label-primary">
                        {selected.size} selected
                    </span>

                    <button
                        onClick={deleteSelected}
                        disabled={selected.size === 0}
                        className="ios-btn px-2"
                    >
                        <Trash2 size={20} className="text-red" />
                    </button>
                </div>
            )}

            {/* Hint text */}
            {!selectMode && items.length > 0 && (
                <p className="text-caption-1 text-center mb-4 text-label-tertiary font-medium opacity-0 animate-[fadeIn_1s_delay-500ms_forwards]">
                    Tap to toggle clean/dirty • Long press for options
                </p>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-8">
                {filtered.map(item => (
                    <div key={item.id} className="flex flex-col gap-1.5 animate-scale-in">
                        <ClothCard
                            item={item}
                            onToggle={toggle}
                            onEdit={(id) => setEditing(items.find(i => i.id === id) || null)}
                            onDelete={deleteOne}
                            onSelect={toggleSelect}
                            selected={selected.has(item.id)}
                            selectMode={selectMode}
                        />
                        <p className="text-caption-1 font-medium text-label-secondary text-center truncate px-1">
                            {item.tags?.sub_category || item.tags?.category}
                        </p>
                    </div>
                ))}
            </div>

            {!filtered.length && (
                <p className="text-center py-12 text-body text-label-tertiary">
                    No items found matching your filters.
                </p>
            )}

            {/* Modals */}
            <FilterModal
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                setFilters={setFilters}
            />

            {editing && (
                <ItemDetailModal
                    item={editing}
                    onClose={() => setEditing(null)}
                    onUpdate={(id, tags) => {
                        setItems(p => p.map(i => i.id === id ? { ...i, tags } : i));
                    }}
                />
            )}
        </>
    );
}
