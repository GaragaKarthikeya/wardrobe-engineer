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

    const update = (key: keyof FilterState, value: string | 'all' | 'clean' | 'dirty' | 'newest' | 'oldest') => {
        triggerHaptic();
        setFilters({ ...filters, [key]: value });
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end bg-black/50 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full bg-secondary-background rounded-t-[24px] overflow-hidden animate-slide-up shadow-premium-lg border-t border-white/[0.08]"
                onClick={e => e.stopPropagation()}
                style={{
                    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                }}
            >
                {/* Drag Handle */}
                <div className="w-full py-3 flex justify-center">
                    <div className="w-10 h-1 rounded-full bg-fill-secondary" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-4">
                    <span className="text-title-3 font-bold text-label-primary">Filters</span>
                    <button
                        onClick={() => { triggerHaptic(); onClose(); }}
                        className="w-8 h-8 rounded-full bg-fill-tertiary flex items-center justify-center text-label-secondary ios-btn"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="px-5 space-y-6 max-h-[65vh] overflow-y-auto pb-4">

                    {/* Status - iOS Segmented Control */}
                    <div className="space-y-3">
                        <span className="text-caption-1 uppercase tracking-wider text-label-tertiary font-semibold">
                            Status
                        </span>
                        <div className="ios-segmented">
                            {(['all', 'clean', 'dirty'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => update('status', status)}
                                    className={`ios-segment ${filters.status === status ? 'active' : ''}`}
                                >
                                    {status === 'all' ? 'All' : status === 'clean' ? 'Clean' : 'Dirty'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Categories - Refined List */}
                    <div className="space-y-3">
                        <span className="text-caption-1 uppercase tracking-wider text-label-tertiary font-semibold">
                            Category
                        </span>
                        <div className="ios-card overflow-hidden">
                            {CATEGORIES.map((cat, index) => (
                                <button
                                    key={cat.id}
                                    onClick={() => update('category', cat.id)}
                                    className={`
                                        w-full flex items-center justify-between p-4 
                                        active:bg-fill-tertiary transition-all
                                        ${index < CATEGORIES.length - 1 ? 'border-b border-separator/40' : ''}
                                    `}
                                >
                                    <span className={`text-body ${filters.category === cat.id ? 'text-tint font-medium' : 'text-label-primary'}`}>
                                        {cat.label}
                                    </span>
                                    {filters.category === cat.id && (
                                        <div className="w-5 h-5 rounded-full bg-tint flex items-center justify-center">
                                            <Check size={12} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort - iOS Segmented Control */}
                    <div className="space-y-3">
                        <span className="text-caption-1 uppercase tracking-wider text-label-tertiary font-semibold">
                            Sort By
                        </span>
                        <div className="ios-segmented">
                            <button
                                onClick={() => update('sort', 'newest')}
                                className={`ios-segment ${filters.sort === 'newest' ? 'active' : ''}`}
                            >
                                Newest
                            </button>
                            <button
                                onClick={() => update('sort', 'oldest')}
                                className={`ios-segment ${filters.sort === 'oldest' ? 'active' : ''}`}
                            >
                                Oldest
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
