"use client";

import { useState } from "react";
import { ClothingItem, ClothingTags } from "@/types";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { updateItemTagsAction } from "@/app/actions";
import { useToast } from "./Toast";
import { triggerHaptic } from "@/lib/haptics";

interface Props {
    item: ClothingItem;
    onClose: () => void;
    onUpdate: (id: string, tags: ClothingTags) => void;
}

const CATEGORIES = ["Top", "Bottom", "Shoe", "Outerwear", "Accessory"];
const FORMALITY = ["Casual", "Smart Casual", "Business", "Formal"];
const PATTERNS = ["Solid", "Striped", "Plaid", "Checkered", "Floral", "Geometric", "Graphic", "Camo", "Other"];
const FITS = ["Slim", "Regular", "Relaxed", "Oversized", "Tailored", "Cropped"];
const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
const OCCASIONS = ["Everyday", "Office", "Date Night", "Party", "Workout", "Beach", "Formal Event", "Travel"];
const STYLE_TAGS = ["Minimalist", "Streetwear", "Classic", "Preppy", "Athleisure", "Bohemian", "Edgy", "Vintage"];
const COLOR_TEMPS = ["Warm", "Cool", "Neutral"];

export function ItemDetailModal({ item, onClose, onUpdate }: Props) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [tags, setTags] = useState<ClothingTags>(item.tags);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const save = async () => {
        triggerHaptic();
        setSaving(true);
        try {
            await updateItemTagsAction(item.id, tags);
            onUpdate(item.id, tags);
            triggerHaptic();
            toast("Saved", "success");
            onClose();
        } catch (e) {
            triggerHaptic();
            const msg = e instanceof Error ? e.message : "Failed to save";
            toast(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    const set = (k: keyof ClothingTags, v: any) => {
        triggerHaptic();
        setTags(p => ({ ...p, [k]: v }));
    };

    const toggleArrayItem = (key: keyof ClothingTags, value: string) => {
        triggerHaptic();
        const current = (tags[key] as string[]) || [];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        setTags(p => ({ ...p, [key]: updated }));
    };

    const isInArray = (key: keyof ClothingTags, value: string) => {
        const arr = tags[key] as string[] | undefined;
        return arr?.includes(value) ?? false;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end liquid-overlay animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full liquid-sheet overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="liquid-handle" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 pb-4">
                    <button
                        onClick={onClose}
                        className="text-body text-tint ios-btn font-medium"
                    >
                        Cancel
                    </button>
                    <span className="text-headline font-semibold text-label-primary">
                        Details
                    </span>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="text-headline font-semibold text-tint disabled:opacity-50 min-w-[50px] flex justify-end ios-btn"
                    >
                        {saving ? <div className="spinner" /> : "Done"}
                    </button>
                </div>

                {/* Content */}
                <div
                    className="max-h-[80vh] overflow-y-auto pb-safe-bottom bg-system-background"
                    style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
                >
                    {/* Image Header */}
                    <div className="py-4 flex justify-center bg-system-background">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-premium-lg ring-1 ring-white/10">
                            <Image src={item.image_url} alt="" fill className="object-cover" />
                        </div>
                    </div>

                    <div className="space-y-5 px-5">

                        {/* Sub-category & Color Row */}
                        <div className="ios-card overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-separator/30">
                                <span className="text-body text-label-primary">Type</span>
                                <input
                                    type="text"
                                    value={tags.sub_category || ""}
                                    onChange={e => set("sub_category", e.target.value)}
                                    placeholder="e.g. Henley T-Shirt"
                                    className="text-body text-label-secondary text-right bg-transparent outline-none placeholder:text-label-quaternary w-[160px]"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 border-b border-separator/30">
                                <span className="text-body text-label-primary">Color</span>
                                <input
                                    type="text"
                                    value={tags.color || ""}
                                    onChange={e => set("color", e.target.value)}
                                    placeholder="e.g. Navy Blue"
                                    className="text-body text-label-secondary text-right bg-transparent outline-none placeholder:text-label-quaternary w-[160px]"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4">
                                <span className="text-body text-label-primary">Fabric</span>
                                <input
                                    type="text"
                                    value={tags.fabric || ""}
                                    onChange={e => set("fabric", e.target.value)}
                                    placeholder="e.g. 100% Cotton"
                                    className="text-body text-label-secondary text-right bg-transparent outline-none placeholder:text-label-quaternary w-[160px]"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <span className="text-[11px] uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                Category
                            </span>
                            <div className="ios-segmented">
                                {CATEGORIES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => set("category", c)}
                                        className={`ios-segment text-[13px] ${tags.category === c ? 'active' : ''}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Formality */}
                        <div className="space-y-2">
                            <span className="text-[11px] uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                Formality
                            </span>
                            <div className="ios-segmented">
                                {FORMALITY.map(f => (
                                    <button
                                        key={f}
                                        onClick={() => set("formality", f)}
                                        className={`ios-segment text-[12px] ${tags.formality === f ? 'active' : ''}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pattern */}
                        <div className="space-y-2">
                            <span className="text-[11px] uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                Pattern
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {PATTERNS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => set("pattern", p)}
                                        className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${tags.pattern === p
                                                ? 'bg-white text-black'
                                                : 'bg-white/10 text-white/70'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Fit */}
                        <div className="space-y-2">
                            <span className="text-[11px] uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                Fit
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {FITS.map(f => (
                                    <button
                                        key={f}
                                        onClick={() => set("fit", f)}
                                        className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${tags.fit === f
                                                ? 'bg-white text-black'
                                                : 'bg-white/10 text-white/70'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Seasons - Multi-select */}
                        <div className="space-y-2">
                            <span className="text-[11px] uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                Seasons
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {SEASONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleArrayItem("seasons", s)}
                                        className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${isInArray("seasons", s)
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
                            <span className="text-[11px] uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                Occasions
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {OCCASIONS.map(o => (
                                    <button
                                        key={o}
                                        onClick={() => toggleArrayItem("occasions", o)}
                                        className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${isInArray("occasions", o)
                                                ? 'bg-white text-black'
                                                : 'bg-white/10 text-white/70'
                                            }`}
                                    >
                                        {o}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Toggle */}
                        <button
                            onClick={() => { triggerHaptic(); setShowAdvanced(!showAdvanced); }}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                            <span className="text-[14px] font-medium text-white/70">More Details</span>
                            {showAdvanced ? <ChevronUp size={18} className="text-white/50" /> : <ChevronDown size={18} className="text-white/50" />}
                        </button>

                        {/* Advanced Section */}
                        {showAdvanced && (
                            <div className="space-y-5 animate-fade-in">

                                {/* Style Tags - Multi-select */}
                                <div className="space-y-2">
                                    <span className="text-[11px] uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                        Style Tags
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {STYLE_TAGS.map(st => (
                                            <button
                                                key={st}
                                                onClick={() => toggleArrayItem("style_tags", st)}
                                                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${isInArray("style_tags", st)
                                                        ? 'bg-white text-black'
                                                        : 'bg-white/10 text-white/70'
                                                    }`}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Temperature */}
                                <div className="space-y-2">
                                    <span className="text-[11px] uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                        Color Temperature
                                    </span>
                                    <div className="ios-segmented">
                                        {COLOR_TEMPS.map(ct => (
                                            <button
                                                key={ct}
                                                onClick={() => set("color_temperature", ct)}
                                                className={`ios-segment ${tags.color_temperature === ct ? 'active' : ''}`}
                                            >
                                                {ct}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Additional Text Fields */}
                                <div className="ios-card overflow-hidden">
                                    <div className="flex items-center justify-between p-4 border-b border-separator/30">
                                        <span className="text-body text-label-primary">Secondary Color</span>
                                        <input
                                            type="text"
                                            value={tags.secondary_color || ""}
                                            onChange={e => set("secondary_color", e.target.value)}
                                            placeholder="If any"
                                            className="text-body text-label-secondary text-right bg-transparent outline-none placeholder:text-label-quaternary w-[120px]"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 border-b border-separator/30">
                                        <span className="text-body text-label-primary">Texture</span>
                                        <input
                                            type="text"
                                            value={tags.texture || ""}
                                            onChange={e => set("texture", e.target.value)}
                                            placeholder="e.g. Ribbed"
                                            className="text-body text-label-secondary text-right bg-transparent outline-none placeholder:text-label-quaternary w-[120px]"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 border-b border-separator/30">
                                        <span className="text-body text-label-primary">Brand</span>
                                        <input
                                            type="text"
                                            value={tags.brand_guess || ""}
                                            onChange={e => set("brand_guess", e.target.value)}
                                            placeholder="If known"
                                            className="text-body text-label-secondary text-right bg-transparent outline-none placeholder:text-label-quaternary w-[120px]"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4">
                                        <span className="text-body text-label-primary">Versatility</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => set("versatility_score", n)}
                                                    className={`w-7 h-7 rounded-full text-[12px] font-semibold transition-all ${tags.versatility_score === n
                                                            ? 'bg-white text-black'
                                                            : 'bg-white/10 text-white/50'
                                                        }`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Style Notes */}
                                <div className="space-y-2">
                                    <span className="text-[11px] uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                        Style Notes
                                    </span>
                                    <textarea
                                        value={tags.style_notes || ""}
                                        onChange={e => {
                                            set("style_notes", e.target.value);
                                            // Auto-resize
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        placeholder="Any styling tips for this item..."
                                        rows={2}
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-[14px] text-white placeholder:text-white/30 outline-none resize-none min-h-[60px]"
                                        style={{ height: 'auto' }}
                                        onFocus={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Extra padding at bottom */}
                        <div className="h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}
