"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ClothingItem } from "@/types";
import { ClothCard } from "./ClothCard";
import { ItemDetailModal } from "./ItemDetailModal";
import { Loader2, Trash2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterCategory = 'all' | 'Top' | 'Bottom' | 'Shoe' | 'Outerwear';

const FILTER_OPTIONS: { value: FilterCategory; label: string }[] = [
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

        if (error) {
            console.error("Error fetching items:", error);
        } else {
            setItems(data as ClothingItem[] || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, is_clean: !currentStatus } : item
            )
        );

        const { error } = await supabase
            .from("items")
            .update({ is_clean: !currentStatus })
            .eq("id", id);

        if (error) {
            console.error("Error updating status:", error);
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, is_clean: currentStatus } : item
                )
            );
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this item?")) return;

        const itemToDelete = items.find((item) => item.id === id);
        setItems((prev) => prev.filter((item) => item.id !== id));

        const { error: dbError } = await supabase.from("items").delete().eq("id", id);
        if (dbError) {
            console.error("Error deleting item:", dbError);
            fetchItems();
            return;
        }

        if (itemToDelete?.image_url) {
            const urlParts = itemToDelete.image_url.split('/');
            const filename = urlParts[urlParts.length - 1];

            await supabase.storage.from("wardrobe").remove([filename]);
        }
    };

    const handleEdit = (id: string) => {
        const item = items.find((i) => i.id === id);
        if (item) {
            setSelectedItem(item);
        }
    };

    const handleTagUpdate = (id: string, tags: any) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, tags } : item
            )
        );
    };

    const handleCardClick = (id: string, currentStatus: boolean) => {
        if (deleteMode) {
            handleDelete(id);
        } else if (editMode) {
            handleEdit(id);
        } else {
            handleToggle(id, currentStatus);
        }
    };

    const filteredItems = filter === 'all'
        ? items
        : items.filter(item => item.tags?.category === filter);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-zinc-500">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-20 text-zinc-500 font-mono text-sm border-2 border-dashed border-zinc-800 rounded-xl">
                <p>No items inside</p>
                <p className="text-xs opacity-50 mt-1">Upload items to start engineering</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {FILTER_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setFilter(opt.value)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                            filter === opt.value
                                ? "bg-teal-500 text-black"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}

                <div className="ml-auto flex gap-2">
                    {/* Edit Mode Toggle */}
                    <button
                        onClick={() => { setEditMode(!editMode); setDeleteMode(false); }}
                        className={cn(
                            "px-3 py-2 rounded-full text-sm transition-all flex items-center gap-1",
                            editMode
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                                : "bg-zinc-800 text-zinc-500 hover:text-blue-400"
                        )}
                    >
                        <Edit3 size={14} />
                        {editMode && <span>Done</span>}
                    </button>

                    {/* Delete Mode Toggle */}
                    <button
                        onClick={() => { setDeleteMode(!deleteMode); setEditMode(false); }}
                        className={cn(
                            "px-3 py-2 rounded-full text-sm transition-all flex items-center gap-1",
                            deleteMode
                                ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                : "bg-zinc-800 text-zinc-500 hover:text-red-400"
                        )}
                    >
                        <Trash2 size={14} />
                        {deleteMode && <span>Done</span>}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredItems.map((item) => (
                    <ClothCard
                        key={item.id}
                        item={item}
                        onToggle={handleCardClick}
                        onDelete={deleteMode ? handleDelete : undefined}
                        isEditMode={editMode}
                    />
                ))}
            </div>

            {filteredItems.length === 0 && (
                <p className="text-center text-zinc-600 py-8 font-mono text-sm">
                    No items in this category
                </p>
            )}

            {/* Item Detail Modal */}
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
