"use client";

import { ClothingItem } from "@/types";
import { Check, X, Trash2, Edit3 } from "lucide-react";
import Image from "next/image";

interface ClothCardProps {
    item: ClothingItem;
    onToggle: (id: string, currentStatus: boolean) => void;
    onDelete?: (id: string) => void;
    highlighted?: boolean;
    isEditMode?: boolean;
}

export function ClothCard({ item, onToggle, onDelete, highlighted, isEditMode }: ClothCardProps) {
    const handleClick = () => {
        onToggle(item.id, item.is_clean);
    };

    return (
        <div
            onClick={handleClick}
            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-95"
            style={{
                border: `2px solid ${item.is_clean ? 'var(--color-clean)' : 'var(--color-dirty)'}`,
                background: 'var(--color-surface)',
                opacity: item.is_clean ? 1 : 0.6,
                filter: item.is_clean ? 'none' : 'grayscale(0.4)'
            }}
        >
            <Image
                src={item.image_url}
                alt={`${item.tags?.color || ''} ${item.tags?.sub_category || item.tags?.category || 'Clothing'}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
            />

            {/* Delete Overlay */}
            {onDelete && (
                <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
                    style={{ background: 'var(--color-dirty-muted)' }}
                >
                    <div
                        className="p-3 rounded-full"
                        style={{ background: 'var(--color-dirty)' }}
                    >
                        <Trash2 size={20} className="text-white" />
                    </div>
                </div>
            )}

            {/* Edit Overlay */}
            {isEditMode && !onDelete && (
                <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
                    style={{ background: 'var(--color-accent-muted)' }}
                >
                    <div
                        className="p-3 rounded-full"
                        style={{ background: 'var(--color-accent)' }}
                    >
                        <Edit3 size={20} className="text-black" />
                    </div>
                </div>
            )}

            {/* Status Badge */}
            {!onDelete && !isEditMode && (
                <div
                    className="absolute top-2 right-2 p-1.5 rounded-full"
                    style={{
                        background: item.is_clean ? 'var(--color-clean-muted)' : 'var(--color-dirty-muted)',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    {item.is_clean ? (
                        <Check size={12} strokeWidth={3} style={{ color: 'var(--color-clean)' }} />
                    ) : (
                        <X size={12} strokeWidth={3} style={{ color: 'var(--color-dirty)' }} />
                    )}
                </div>
            )}

            {/* Info Overlay */}
            <div
                className="absolute bottom-0 left-0 right-0 p-2.5"
                style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}
            >
                <p className="text-xs text-white font-medium truncate">
                    {item.tags?.color} {item.tags?.sub_category || item.tags?.category}
                </p>
                {item.tags?.formality && (
                    <p className="text-[10px] opacity-60 text-white">{item.tags.formality}</p>
                )}
            </div>
        </div>
    );
}
