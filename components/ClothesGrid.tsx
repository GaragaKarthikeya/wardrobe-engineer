"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ClothingItem } from "@/types";
import { ClothCard } from "./ClothCard";
import { ItemDetailModal } from "./ItemDetailModal";
import { Loader2, Trash2, Edit3 } from "lucide-react";

type FilterCategory = 'all' | 'Top' | 'Bottom' | 'Shoe' | 'Outerwear';

const FILTERS: { value: FilterCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Top', label: 'Tops' },
    { value: 'Bottom', label: 'Bottoms' },
    { value: 'Shoe', label: 'Shoes' },
    { value: 'Outerwear', label: 'Layers' },
];

export function ClothesGrid() {
    const [items, setItems] = useState<ClothingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterCategory>('all');
    const [deleteMode, setDeleteMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

    const fetchItems = useCallback(async () => {
        const { data, error } = await supabase
            .from("items")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error) setItems(data as ClothingItem[] || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, is_clean: !currentStatus } : i));
        await supabase.from("items").update({ is_clean: !currentStatus }).eq("id", id);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this item?")) return;
        const item = items.find(i => i.id === id);
        setItems(prev => prev.filter(i => i.id !== id));
        await supabase.from("items").delete().eq("id", id);

        if (item?.image_url) {
            const filename = item.image_url.split('/').pop();
            if (filename) await supabase.storage.from("wardrobe").remove([filename]);
        }
    };

    const handleEdit = (id: string) => {
        const item = items.find(i => i.id === id);
        if (item) setSelectedItem(item);
    };

    const handleTagUpdate = (id: string, tags: any) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, tags } : i));
    };

    const handleCardClick = (id: string, currentStatus: boolean) => {
        if (deleteMode) handleDelete(id);
        else if (editMode) handleEdit(id);
        else handleToggle(id, currentStatus);
    };

    const filtered = filter === 'all' ? items : items.filter(i => i.tags?.category === filter);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-text-subtle)' }} />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div
                className="text-center py-16 rounded-2xl"
                style={{
                    border: '2px dashed var(--color-border)',
                    color: 'var(--color-text-muted)'
                }}
            >
                <p className="text-sm font-medium">Your closet is empty</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>
                    Tap "Add" to upload your first item
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className="px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 touch-target"
                        style={{
                            background: filter === f.value ? 'var(--color-accent)' : 'var(--color-surface-elevated)',
                            color: filter === f.value ? '#000' : 'var(--color-text-muted)'
                        }}
                    >
                        {f.label}
                    </button>
                ))}

                <div className="flex gap-2 ml-auto">
                    <button
                        onClick={() => { setEditMode(!editMode); setDeleteMode(false); }}
                        className="px-3 py-2.5 rounded-full transition-all active:scale-95 touch-target"
                        style={{
                            background: editMode ? 'var(--color-accent-muted)' : 'var(--color-surface-elevated)',
                            color: editMode ? 'var(--color-accent)' : 'var(--color-text-subtle)'
                        }}
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={() => { setDeleteMode(!deleteMode); setEditMode(false); }}
                        className="px-3 py-2.5 rounded-full transition-all active:scale-95 touch-target"
                        style={{
                            background: deleteMode ? 'var(--color-dirty-muted)' : 'var(--color-surface-elevated)',
                            color: deleteMode ? 'var(--color-dirty)' : 'var(--color-text-subtle)'
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
                {filtered.map((item) => (
                    <ClothCard
                        key={item.id}
                        item={item}
                        onToggle={handleCardClick}
                        onDelete={deleteMode ? handleDelete : undefined}
                        isEditMode={editMode}
                    />
                ))}
            </div>

            {filtered.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-subtle)' }}>
                    No items in this category
                </p>
            )}

            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onUpdate={handleTagUpdate}
                />
            )}
        </div>
    );
}
