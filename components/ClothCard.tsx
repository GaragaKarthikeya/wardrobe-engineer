"use client";

import { ClothingItem } from "@/types";
import { cn } from "@/lib/utils";
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
            className={cn(
                "group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                item.is_clean
                    ? "border-green-500/50 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10"
                    : "border-red-500/50 hover:border-red-400 grayscale-[0.4] opacity-70 hover:opacity-100",
                highlighted && "ring-4 ring-teal-400 ring-offset-2 ring-offset-zinc-950 scale-105",
                onDelete && "hover:border-red-500 hover:scale-95",
                isEditMode && "hover:border-blue-500 hover:scale-95"
            )}
        >
            <Image
                src={item.image_url}
                alt={`${item.tags?.color || ''} ${item.tags?.sub_category || item.tags?.category || 'Clothing'}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
            />

            {/* Delete Overlay */}
            {onDelete && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-red-500 p-3 rounded-full">
                        <Trash2 size={24} className="text-white" />
                    </div>
                </div>
            )}

            {/* Edit Overlay */}
            {isEditMode && !onDelete && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-blue-500 p-3 rounded-full">
                        <Edit3 size={24} className="text-white" />
                    </div>
                </div>
            )}

            {/* Status Icon */}
            {!onDelete && !isEditMode && (
                <div className={cn(
                    "absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all",
                    item.is_clean
                        ? "bg-green-500/30 text-green-300"
                        : "bg-red-500/30 text-red-300"
                )}>
                    {item.is_clean ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                </div>
            )}

            {/* Tags Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                <p className="text-xs text-white font-medium truncate">
                    {item.tags?.color} {item.tags?.sub_category || item.tags?.category}
                </p>
                {item.tags?.formality && (
                    <p className="text-[10px] text-zinc-400 capitalize">{item.tags.formality}</p>
                )}
            </div>
        </div>
    );
}
