"use client";

import { useState } from "react";
import { ClothingItem } from "@/types";
import { X, Save, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
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
const OCCASIONS = ["Office", "Date", "Casual", "Sports", "Party", "Formal Event"];

export function ItemDetailModal({ item, onClose, onUpdate }: ItemDetailModalProps) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [tags, setTags] = useState(item.tags || {});

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateItemTagsAction(item.id, tags);
            onUpdate(item.id, tags);
            toast("Tags updated!", "success");
            onClose();
        } catch (error: any) {
            toast(error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const updateTag = (key: string, value: any) => {
        setTags((prev: any) => ({ ...prev, [key]: value }));
    };

    const toggleArrayTag = (key: string, value: string) => {
        setTags((prev: any) => {
            const arr = prev[key] || [];
            if (arr.includes(value)) {
                return { ...prev, [key]: arr.filter((v: string) => v !== value) };
            } else {
                return { ...prev, [key]: [...arr, value] };
            }
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 border border-zinc-700 w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Image */}
                <div className="relative h-48 bg-zinc-800">
                    <Image
                        src={item.image_url}
                        alt="Clothing item"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <div className="absolute bottom-3 left-4">
                        <p className="text-white font-semibold text-lg">
                            {tags.color} {tags.sub_category || tags.category}
                        </p>
                        <p className="text-zinc-400 text-sm">{tags.formality}</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                    {/* Category */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wide">Category</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => updateTag("category", cat)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        tags.category === cat
                                            ? "bg-teal-500 text-black"
                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wide">Color</label>
                        <input
                            type="text"
                            value={tags.color || ""}
                            onChange={(e) => updateTag("color", e.target.value)}
                            className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    {/* Sub Category */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wide">Type</label>
                        <input
                            type="text"
                            value={tags.sub_category || ""}
                            onChange={(e) => updateTag("sub_category", e.target.value)}
                            placeholder="e.g., Polo, Jeans, Sneakers"
                            className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    {/* Formality */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wide">Formality</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {FORMALITIES.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => updateTag("formality", f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        tags.formality === f
                                            ? "bg-teal-500 text-black"
                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Seasons */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wide">Seasons</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {SEASONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => toggleArrayTag("seasons", s)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        (tags.seasons || []).includes(s)
                                            ? "bg-teal-500 text-black"
                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Occasions */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wide">Occasions</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {OCCASIONS.map((o) => (
                                <button
                                    key={o}
                                    onClick={() => toggleArrayTag("occasions", o)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                        (tags.occasions || []).includes(o)
                                            ? "bg-teal-500 text-black"
                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    )}
                                >
                                    {o}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
