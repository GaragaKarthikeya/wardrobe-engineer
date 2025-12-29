"use client";

import { useState } from "react";
import { ClothingItem } from "@/types";
import { X, Save, Loader2 } from "lucide-react";
import Image from "next/image";
import { updateItemTagsAction } from "@/app/actions";
import { useToast } from "./Toast";

interface ItemDetailModalProps {
    item: ClothingItem;
    onClose: () => void;
    onUpdate: (id: string, tags: any) => void;
}

const CATEGORIES = ["Top", "Bottom", "Shoe", "Outerwear", "Accessory"];
const FORMALITIES = ["Casual", "Smart Casual", "Business", "Formal"];
const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

export function ItemDetailModal({ item, onClose, onUpdate }: ItemDetailModalProps) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [tags, setTags] = useState(item.tags || {});

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateItemTagsAction(item.id, tags);
            onUpdate(item.id, tags);
            toast("Saved!", "success");
            onClose();
        } catch (e: any) {
            toast(e.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const updateTag = (key: string, value: any) => setTags((prev: any) => ({ ...prev, [key]: value }));

    const toggleArray = (key: string, value: string) => {
        setTags((prev: any) => {
            const arr = prev[key] || [];
            return { ...prev, [key]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value] };
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg max-h-[85vh] rounded-t-3xl overflow-hidden animate-slide-up"
                style={{ background: 'var(--color-surface)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image Header */}
                <div className="relative h-40" style={{ background: 'var(--color-bg)' }}>
                    <Image
                        src={item.image_url}
                        alt="Item"
                        fill
                        className="object-cover"
                    />
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(transparent 50%, var(--color-surface))' }}
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2.5 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.5)' }}
                    >
                        <X size={18} style={{ color: 'var(--color-text)' }} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5 overflow-y-auto max-h-[50vh]">
                    {/* Color */}
                    <div>
                        <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-subtle)' }}>
                            Color
                        </label>
                        <input
                            type="text"
                            value={tags.color || ""}
                            onChange={(e) => updateTag("color", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                            style={{
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)'
                            }}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-subtle)' }}>
                            Category
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => updateTag("category", cat)}
                                    className="px-4 py-2.5 rounded-full text-xs font-medium transition-all active:scale-95"
                                    style={{
                                        background: tags.category === cat ? 'var(--color-accent)' : 'var(--color-bg)',
                                        color: tags.category === cat ? '#000' : 'var(--color-text-muted)'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Formality */}
                    <div>
                        <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-subtle)' }}>
                            Formality
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FORMALITIES.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => updateTag("formality", f)}
                                    className="px-4 py-2.5 rounded-full text-xs font-medium transition-all active:scale-95"
                                    style={{
                                        background: tags.formality === f ? 'var(--color-accent)' : 'var(--color-bg)',
                                        color: tags.formality === f ? '#000' : 'var(--color-text-muted)'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Seasons */}
                    <div>
                        <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-text-subtle)' }}>
                            Seasons
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SEASONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => toggleArray("seasons", s)}
                                    className="px-4 py-2.5 rounded-full text-xs font-medium transition-all active:scale-95"
                                    style={{
                                        background: (tags.seasons || []).includes(s) ? 'var(--color-accent)' : 'var(--color-bg)',
                                        color: (tags.seasons || []).includes(s) ? '#000' : 'var(--color-text-muted)'
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="p-5 pb-safe" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                        style={{ background: 'var(--color-accent)', color: '#000' }}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
