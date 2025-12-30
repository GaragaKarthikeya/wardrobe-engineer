"use client";

import { useEffect, useState, useCallback } from "react";
import { ClothingItem } from "@/types";
import { ClothCard } from "./ClothCard";
import { ItemDetailModal } from "./ItemDetailModal";
import { X, Trash2, SlidersHorizontal, RefreshCw } from "lucide-react";
import { useToast } from "./Toast";
import { triggerHaptic } from "@/lib/haptics";
import { FilterModal } from "./FilterModal";
import { loadItemsCacheFirst, updateItem, removeItem, syncFromServer } from "@/lib/sync";

export function ClothesGrid() {
    const { toast } = useToast();
    const [items, setItems] = useState<ClothingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

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

    // Cache-first loading
    const loadItems = useCallback(async () => {
        setLoading(true);
        await loadItemsCacheFirst(
            // On local data (instant)
            (localItems) => {
                setItems(localItems);
                setLoading(false);
            },
            // On server data (background)
            (serverItems) => {
                setItems(serverItems);
                setLoading(false);
            }
        );
        setLoading(false);
    }, []);

    useEffect(() => { loadItems(); }, [loadItems]);

    // Manual refresh
    const handleRefresh = async () => {
        triggerHaptic();
        setSyncing(true);
        const { success, items: serverItems } = await syncFromServer();
        if (success) {
            setItems(serverItems);
            toast("Synced", "success");
        } else {
            toast("Offline - showing cached data", "info");
        }
        setSyncing(false);
    };

    const toggle = async (id: string, clean: boolean) => {
        triggerHaptic();
        // Update locally immediately
        setItems(p => p.map(i => i.id === id ? { ...i, is_clean: !clean } : i));
        // Sync to server in background
        await updateItem(id, { is_clean: !clean });
    };

    const toggleSelect = (id: string) => {
        triggerHaptic();
        if (!selectMode) {
            setSelectMode(true);
        }
        setSelected(p => {
            const n = new Set(p);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const deleteOne = async (id: string) => {
        triggerHaptic();
        const item = items.find(i => i.id === id);
        if (!item) return;

        // Remove from UI immediately
        setItems(p => p.filter(i => i.id !== id));
        // Sync deletion in background
        await removeItem(id, item.image_url);
        toast("Deleted", "success");
    };

    const deleteSelected = async () => {
        triggerHaptic();
        const toDelete = items.filter(i => selected.has(i.id));

        // Remove from UI immediately
        setItems(p => p.filter(i => !selected.has(i.id)));

        // Sync deletions in background
        for (const item of toDelete) {
            await removeItem(item.id, item.image_url);
        }

        toast(`${toDelete.length} deleted`, "success");
        exitSelectMode();
    };

    const exitSelectMode = () => {
        triggerHaptic();
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

    const hasActiveFilters = filters.category !== 'all' || filters.status !== 'all';

    // Loading State - Premium Skeleton
    if (loading && items.length === 0) {
        return (
            <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl skeleton" />
                ))}
            </div>
        );
    }

    // Empty State
    if (!items.length) {
        return (
            <div className="text-center py-24 px-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-fill-tertiary mx-auto mb-4 flex items-center justify-center">
                    <SlidersHorizontal size={28} className="text-label-tertiary" />
                </div>
                <p className="text-title-3 mb-2 text-label-primary font-semibold">
                    No Items Yet
                </p>
                <p className="text-body text-label-secondary max-w-[260px] mx-auto">
                    Tap the + button to add your first piece of clothing.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Header Controls */}
            {!selectMode && (
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setShowFilters(true); triggerHaptic() }}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-full ios-btn
                                transition-all border
                                ${hasActiveFilters
                                    ? 'bg-tint-light border-tint/30 text-tint'
                                    : 'bg-secondary-background border-separator/50 text-label-secondary'
                                }
                            `}
                        >
                            <SlidersHorizontal size={16} />
                            <span className="text-[15px] font-medium">
                                {filters.category === 'all' ? 'Filter' : filters.category}
                            </span>
                        </button>

                        {/* Sync Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={syncing}
                            className="w-9 h-9 rounded-full bg-secondary-background border border-separator/50 flex items-center justify-center ios-btn"
                        >
                            <RefreshCw
                                size={16}
                                className={`text-label-secondary ${syncing ? 'animate-spin' : ''}`}
                            />
                        </button>
                    </div>

                    <button
                        onClick={() => { setSelectMode(true); triggerHaptic() }}
                        className="text-[15px] font-semibold text-tint px-3 py-2 ios-btn"
                    >
                        Select
                    </button>
                </div>
            )}

            {/* Select Mode Bar */}
            {selectMode && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl mb-5 animate-scale-in bg-secondary-background border border-separator/50 shadow-premium">
                    <button
                        onClick={exitSelectMode}
                        className="flex items-center gap-2 ios-btn px-2"
                    >
                        <X size={18} className="text-tint" strokeWidth={2.5} />
                        <span className="text-body font-medium text-tint">Cancel</span>
                    </button>

                    <span className="text-subheadline font-semibold text-label-primary">
                        {selected.size} selected
                    </span>

                    <button
                        onClick={deleteSelected}
                        disabled={selected.size === 0}
                        className={`
                            ios-btn px-3 py-2 rounded-full flex items-center gap-2 transition-all
                            ${selected.size > 0 ? 'bg-red-light' : 'opacity-40'}
                        `}
                    >
                        <Trash2 size={18} className="text-red" />
                    </button>
                </div>
            )}

            {/* Hint text */}
            {!selectMode && items.length > 0 && (
                <p className="text-caption-1 text-center mb-5 text-label-tertiary font-medium animate-fade-in">
                    Tap to toggle • Long press for options
                </p>
            )}

            {/* Grid - Staggered Animation */}
            <div className="grid grid-cols-2 gap-4 pb-8">
                {filtered.map((item, index) => (
                    <div
                        key={item.id}
                        className="flex flex-col gap-2 animate-scale-in"
                        style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                    >
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

            {/* No Results */}
            {!filtered.length && (
                <div className="text-center py-16 animate-fade-in">
                    <p className="text-body text-label-tertiary">
                        No items match your filters.
                    </p>
                    <button
                        onClick={() => setFilters({ category: 'all', status: 'all', sort: 'newest' })}
                        className="mt-3 text-tint text-subheadline font-semibold ios-btn"
                    >
                        Clear Filters
                    </button>
                </div>
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
