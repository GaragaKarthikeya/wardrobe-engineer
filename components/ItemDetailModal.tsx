"use client";

import { useState } from "react";
import { ClothingItem, ClothingTags } from "@/types";
import { Loader2, Check, ChevronRight } from "lucide-react";
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

export function ItemDetailModal({ item, onClose, onUpdate }: Props) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [tags, setTags] = useState<ClothingTags>(item.tags);

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

    const set = (k: keyof ClothingTags, v: string) => {
        triggerHaptic();
        setTags(p => ({ ...p, [k]: v }));
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
                        Edit Item
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
                    <div className="py-6 flex justify-center bg-system-background">
                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-premium-lg ring-1 ring-white/10">
                            <Image src={item.image_url} alt="" fill className="object-cover" />
                        </div>
                    </div>

                    <div className="space-y-6 px-5">
                        {/* Section: Color */}
                        <div className="space-y-2">
                            <span className="text-caption-1 uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                Color
                            </span>
                            <div className="ios-card overflow-hidden">
                                <div className="flex items-center justify-between p-4 border-b border-separator/30">
                                    <span className="text-body text-label-primary">Color Name</span>
                                    <input
                                        type="text"
                                        value={tags.color || ""}
                                        onChange={e => set("color", e.target.value)}
                                        placeholder="e.g. Navy Blue"
                                        className="text-body text-label-secondary text-right bg-transparent outline-none placeholder:text-label-quaternary w-[140px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Category */}
                        <div className="space-y-2">
                            <span className="text-caption-1 uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                Category
                            </span>
                            <div className="ios-segmented">
                                {CATEGORIES.slice(0, 4).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => set("category", c)}
                                        className={`ios-segment ${tags.category === c ? 'active' : ''}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section: Formality */}
                        <div className="space-y-2">
                            <span className="text-caption-1 uppercase text-label-tertiary font-semibold tracking-wider px-1">
                                Formality
                            </span>
                            <div className="ios-card overflow-hidden">
                                {FORMALITY.map((f, index) => (
                                    <button
                                        key={f}
                                        onClick={() => set("formality", f)}
                                        className={`
                                            w-full flex items-center justify-between p-4 
                                            active:bg-fill-tertiary transition-all
                                            ${index < FORMALITY.length - 1 ? 'border-b border-separator/30' : ''}
                                        `}
                                    >
                                        <span className={`text-body ${tags.formality === f ? 'text-tint font-medium' : 'text-label-primary'}`}>
                                            {f}
                                        </span>
                                        {tags.formality === f && (
                                            <div className="w-5 h-5 rounded-full bg-tint flex items-center justify-center">
                                                <Check size={12} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Extra padding at bottom */}
                        <div className="h-4" />
                    </div>
                </div>
            </div>
        </div >
    );
}
