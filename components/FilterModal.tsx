"use client";

import { X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { useState } from "react";

interface FilterState {
    category: string;
    status: 'all' | 'clean' | 'dirty';
    formality: string;
    pattern: string;
    seasons: string[];
    occasions: string[];
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

const FORMALITY = ['all', 'Casual', 'Smart Casual', 'Business', 'Formal'];
const PATTERNS = ['all', 'Solid', 'Striped', 'Plaid', 'Checkered', 'Floral', 'Geometric', 'Graphic', 'Camo', 'Other'];
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const OCCASIONS = ['Everyday', 'Office', 'Date Night', 'Party', 'Workout', 'Beach', 'Formal Event', 'Travel'];

export function FilterModal({ isOpen, onClose, filters, setFilters }: Props) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    if (!isOpen) return null;

    const update = (key: keyof FilterState, value: any) => {
        triggerHaptic();
        setFilters({ ...filters, [key]: value });
    };

    const toggleArrayItem = (key: keyof FilterState, value: string) => {
        triggerHaptic();
        const current = (filters[key] as string[]) || [];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        setFilters({ ...filters, [key]: updated });
    };

    const isInArray = (key: keyof FilterState, value: string) => {
        const arr = filters[key] as string[] | undefined;
        return arr?.includes(value) ?? false;
    };

    const clearAll = () => {
        triggerHaptic();
        setFilters({ category: 'all', status: 'all', formality: 'all', pattern: 'all', seasons: [], occasions: [], sort: 'newest' });
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end bg-black/50 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full liquid-sheet overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
                style={{
                    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                }}
            >
                {/* Drag Handle */}
                <div className="liquid-handle" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-4">
                    <button
                        onClick={clearAll}
                        className="text-[14px] text-white/60 ios-btn font-medium"
                    >
                        Clear All
                    </button>
                    <span className="text-title-3 font-bold text-label-primary">Filters</span>
                    <button
                        onClick={() => { triggerHaptic(); onClose(); }}
                        className="w-8 h-8 rounded-full border border-separator flex items-center justify-center text-label-secondary ios-btn"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="px-5 space-y-5 max-h-[70vh] overflow-y-auto pb-4">

                    {/* Status - iOS Segmented Control */}
                    <div className="space-y-2">
                        <span className="text-[11px] uppercase tracking-wider text-label-tertiary font-semibold">
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
                    <div className="space-y-2">
                        <span className="text-[11px] uppercase tracking-wider text-label-tertiary font-semibold">
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

                    {/* Formality */}
                    <div className="space-y-2">
                        <span className="text-[11px] uppercase tracking-wider text-label-tertiary font-semibold">
                            Formality
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {FORMALITY.map(f => (
                                <button
                                    key={f}
                                    onClick={() => update('formality', f)}
                                    className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${filters.formality === f
                                            ? 'bg-white text-black'
                                            : 'bg-white/10 text-white/70'
                                        }`}
                                >
                                    {f === 'all' ? 'All' : f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pattern */}
                    <div className="space-y-2">
                        <span className="text-[11px] uppercase tracking-wider text-label-tertiary font-semibold">
                            Pattern
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {PATTERNS.map(p => (
                                <button
                                    key={p}
                                    onClick={() => update('pattern', p)}
                                    className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${filters.pattern === p
                                            ? 'bg-white text-black'
                                            : 'bg-white/10 text-white/70'
                                        }`}
                                >
                                    {p === 'all' ? 'All' : p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Toggle */}
                    <button
                        onClick={() => { triggerHaptic(); setShowAdvanced(!showAdvanced); }}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                        <span className="text-[14px] font-medium text-white/70">More Filters</span>
                        {showAdvanced ? <ChevronUp size={18} className="text-white/50" /> : <ChevronDown size={18} className="text-white/50" />}
                    </button>

                    {/* Advanced Filters */}
                    {showAdvanced && (
                        <div className="space-y-5 animate-fade-in">
                            {/* Seasons - Multi-select */}
                            <div className="space-y-2">
                                <span className="text-[11px] uppercase tracking-wider text-label-tertiary font-semibold">
                                    Seasons
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {SEASONS.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => toggleArrayItem('seasons', s)}
                                            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${isInArray('seasons', s)
                                                    ? 'bg-white text-black'
                                                    : 'bg-white/10 text-white/70'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Occasions - Multi-select */}
                            <div className="space-y-2">
                                <span className="text-[11px] uppercase tracking-wider text-label-tertiary font-semibold">
                                    Occasions
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {OCCASIONS.map(o => (
                                        <button
                                            key={o}
                                            onClick={() => toggleArrayItem('occasions', o)}
                                            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${isInArray('occasions', o)
                                                    ? 'bg-white text-black'
                                                    : 'bg-white/10 text-white/70'
                                                }`}
                                        >
                                            {o}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sort - iOS Segmented Control */}
                    <div className="space-y-2">
                        <span className="text-[11px] uppercase tracking-wider text-label-tertiary font-semibold">
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
