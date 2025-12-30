"use client";

import { useState } from "react";
import { ClothingItem, ClothingTags } from "@/types";
import { Loader2, Check } from "lucide-react";
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
        triggerHaptic('medium');
        setSaving(true);
        try {
            await updateItemTagsAction(item.id, tags);
            onUpdate(item.id, tags);
            triggerHaptic('success');
            toast("Saved", "success");
            onClose();
        } catch (e) {
            triggerHaptic('error');
            const msg = e instanceof Error ? e.message : "Failed to save";
            toast(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    const set = (k: keyof ClothingTags, v: any) => {
        triggerHaptic('selection');
        setTags(p => ({ ...p, [k]: v }));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm transition-all animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full bg-grouped-secondary rounded-t-[20px] overflow-hidden animate-slide-up shadow-2xl ring-1 ring-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="w-full h-6 bg-grouped-secondary flex items-center justify-center pt-2">
                    <div className="w-9 h-1 rounded-full bg-fill-tertiary" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-4 bg-grouped-secondary z-10 relative">
                    <button
                        onClick={onClose}
                        className="text-body text-tint active:opacity-50"
                    >
                        Cancel
                    </button>
                    <span className="text-headline font-semibold text-label-primary">
                        Edit Item
                    </span>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="text-headline font-semibold text-tint disabled:opacity-50 min-w-[40px] flex justify-end"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : "Done"}
                    </button>
                </div>

                {/* Content Scrollable */}
                <div className="max-h-[85vh] overflow-y-auto pb-safe-bottom bg-grouped-background">

                    {/* Image Header */}
                    <div className="py-6 flex justify-center bg-grouped-background">
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10">
                            <Image src={item.image_url} alt="" fill className="object-cover" />
                        </div>
                    </div>

                    <div className="space-y-6 px-4 pb-8">
                        {/* Section: Color */}
                        <div>
                            <span className="text-caption-1 uppercase text-label-secondary pl-4 mb-2 block tracking-wider">
                                Color
                            </span>
                            <div className="ios-card overflow-hidden">
                                <div className="ios-list-item">
                                    <span className="text-body text-label-primary">Color Name</span>
                                    <input
                                        type="text"
                                        value={tags.color || ""}
                                        onChange={e => set("color", e.target.value)}
                                        placeholder="e.g. Navy Blue"
                                        className="text-body text-label-secondary text-right bg-transparent outline-none placeholder:text-label-tertiary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Category */}
                        <div>
                            <span className="text-caption-1 uppercase text-label-secondary pl-4 mb-2 block tracking-wider">
                                Category
                            </span>
                            <div className="flex p-0.5 rounded-[9px] bg-fill-tertiary overflow-x-auto">
                                {CATEGORIES.slice(0, 4).map(c => {
                                    const isSelected = tags.category === c;
                                    return (
                                        <button
                                            key={c}
                                            onClick={() => set("category", c)}
                                            className={`flex-1 py-[6px] rounded-[7px] text-[13px] font-medium whitespace-nowrap px-2 transition-all ${isSelected
                                                ? "bg-secondary-background text-label-primary shadow-sm"
                                                : "text-label-secondary"
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section: Formality */}
                        <div>
                            <span className="text-caption-1 uppercase text-label-secondary pl-4 mb-2 block tracking-wider">
                                Formality
                            </span>
                            <div className="ios-card overflow-hidden">
                                {FORMALITY.map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => set("formality", f)}
                                        className="w-full flex items-center justify-between py-3 px-4 bg-secondary-background active:bg-fill-tertiary transition-colors border-b border-separator/50 last:border-0"
                                    >
                                        <span className="text-body text-label-primary">{f}</span>
                                        {tags.formality === f && (
                                            <Check size={18} className="text-tint" strokeWidth={2.5} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
