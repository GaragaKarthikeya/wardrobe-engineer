"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ClothingItem } from "@/types";
import { ClothCard } from "./ClothCard";
import { ItemDetailModal } from "./ItemDetailModal";
import { Loader2, X, Trash2 } from "lucide-react";
import { useToast } from "./Toast";
import { triggerHaptic } from "@/lib/haptics";

type Category = 'all' | 'Top' | 'Bottom' | 'Shoe' | 'Outerwear';

const CATEGORIES: { value: Category; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Top', label: 'Tops' },
    { value: 'Bottom', label: 'Bottoms' },
    { value: 'Shoe', label: 'Shoes' },
    { value: 'Outerwear', label: 'Outerwear' },
];

export function ClothesGrid() {
    const { toast } = useToast();
    const [items, setItems] = useState<ClothingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<Category>('all');

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

    const filtered = category === 'all' ? items : items.filter(i => i.tags?.category === category);

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
            {/* iOS Segmented Control */}
            <div className="flex p-0.5 rounded-[9px] mb-6 bg-fill-tertiary">
                {CATEGORIES.map(c => {
                    const isActive = category === c.value;
                    return (
                        <button
                            key={c.value}
                            onClick={() => { setCategory(c.value); triggerHaptic('selection'); }}
                            className={`flex-1 py-[6px] rounded-[7px] text-[13px] font-medium transition-all active:scale-95 ${isActive
                                ? "bg-grouped-secondary text-label-primary shadow-sm"
                                : "text-label-secondary hover:text-label-primary"
                                }`}
                        >
                            {c.label}
                        </button>
                    );
                })}
            </div>

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
            {!selectMode && (
                <p className="text-caption-1 text-center mb-4 text-label-tertiary font-medium">
                    Tap to toggle clean/dirty • Long press for options
                </p>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-8">
                {filtered.map(item => (
                    <div key={item.id} className="flex flex-col gap-1.5">
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
                    No items found in {category}.
                </p>
            )}

            {editing && (
                <ItemDetailModal
                    item={editing}
                    onClose={() => setEditing(null)}
                    onUpdate={(id, tags) => setItems(p => p.map(i => i.id === id ? { ...i, tags } : i))}
                />
            )}
        </>
    );
}
