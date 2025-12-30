"use client";

import { X, Check } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

interface FilterState {
    category: string;
    status: 'all' | 'clean' | 'dirty';
    sort: 'newest' | 'oldest';
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: (f: FilterState) => void;
}

const CATEGORIES = [
    { id: 'all', label: 'All Items' },
    { id: 'Top', label: 'Tops' },
    { id: 'Bottom', label: 'Bottoms' },
    { id: 'Shoe', label: 'Shoes' },
    { id: 'Outerwear', label: 'Outerwear' },
    { id: 'Accessory', label: 'Accessories' },
];

export function FilterModal({ isOpen, onClose, filters, setFilters }: Props) {
    if (!isOpen) return null;

    const update = (key: keyof FilterState, value: any) => {
        triggerHaptic('selection');
        setFilters({ ...filters, [key]: value });
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full bg-grouped-secondary rounded-t-[20px] overflow-hidden animate-slide-up shadow-2xl ring-1 ring-white/10 pb-safe-bottom"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-separator/50 bg-grouped-secondary relative z-10">
                    <span className="text-headline font-semibold text-label-primary">Filter & Sort</span>
                    <button
                        onClick={() => { triggerHaptic('light'); onClose(); }}
                        className="w-8 h-8 rounded-full bg-fill-tertiary flex items-center justify-center text-label-secondary"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">

                    {/* Categories */}
                    <div className="space-y-2">
                        <span className="text-caption-1 uppercase tracking-wider text-label-secondary font-medium pl-1">
                            Category
                        </span>
                        <div className="ios-card overflow-hidden">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => update('category', cat.id)}
                                    className="w-full flex items-center justify-between p-3.5 bg-secondary-background active:bg-fill-tertiary transition-colors border-b border-separator/50 last:border-0"
                                >
                                    <span className={`text-body ${filters.category === cat.id ? 'text-tint font-medium' : 'text-label-primary'}`}>
                                        {cat.label}
                                    </span>
                                    {filters.category === cat.id && (
                                        <Check size={18} className="text-tint" strokeWidth={2.5} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <span className="text-caption-1 uppercase tracking-wider text-label-secondary font-medium pl-1">
                            Status
                        </span>
                        <div className="flex p-0.5 rounded-[9px] bg-fill-tertiary">
                            <button
                                onClick={() => update('status', 'all')}
                                className={`flex-1 py-[6px] rounded-[7px] text-[13px] font-medium transition-all ${filters.status === 'all' ? 'bg-grouped-secondary text-label-primary shadow-sm' : 'text-label-secondary'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => update('status', 'clean')}
                                className={`flex-1 py-[6px] rounded-[7px] text-[13px] font-medium transition-all ${filters.status === 'clean' ? 'bg-grouped-secondary text-label-primary shadow-sm' : 'text-label-secondary'}`}
                            >
                                Clean
                            </button>
                            <button
                                onClick={() => update('status', 'dirty')}
                                className={`flex-1 py-[6px] rounded-[7px] text-[13px] font-medium transition-all ${filters.status === 'dirty' ? 'bg-grouped-secondary text-label-primary shadow-sm' : 'text-label-secondary'}`}
                            >
                                Dirty
                            </button>
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                        <span className="text-caption-1 uppercase tracking-wider text-label-secondary font-medium pl-1">
                            Sort By
                        </span>
                        <div className="ios-card overflow-hidden">
                            <button
                                onClick={() => update('sort', 'newest')}
                                className="w-full flex items-center justify-between p-3.5 bg-secondary-background active:bg-fill-tertiary transition-colors border-b border-separator/50"
                            >
                                <span className="text-body text-label-primary">Newest First</span>
                                {filters.sort === 'newest' && <Check size={18} className="text-tint" strokeWidth={2.5} />}
                            </button>
                            <button
                                onClick={() => update('sort', 'oldest')}
                                className="w-full flex items-center justify-between p-3.5 bg-secondary-background active:bg-fill-tertiary transition-colors"
                            >
                                <span className="text-body text-label-primary">Oldest First</span>
                                {filters.sort === 'oldest' && <Check size={18} className="text-tint" strokeWidth={2.5} />}
                            </button>
                        </div>
                    </div>

                    <div className="h-4" /> {/* Spacer */}
                </div>
            </div>
        </div>
    );
}
