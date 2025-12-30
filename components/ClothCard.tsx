"use client";

import { ClothingItem } from "@/types";
import { Check, Pencil, Trash2, CheckCircle, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useState, useRef } from "react";
import { triggerHaptic } from "@/lib/haptics";

interface Props {
    item: ClothingItem;
    onToggle: (id: string, clean: boolean) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
    selected?: boolean;
    selectMode?: boolean;
}

export function ClothCard({ item, onToggle, onEdit, onDelete, onSelect, selected, selectMode }: Props) {
    const clean = item.is_clean;
    const [showMenu, setShowMenu] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const didLongPress = useRef(false);

    const handleTouchStart = () => {
        didLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            triggerHaptic('medium');
            setShowMenu(true);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleClick = () => {
        if (didLongPress.current) {
            didLongPress.current = false;
            return;
        }

        triggerHaptic('light');

        if (selectMode) {
            onSelect(item.id);
        } else {
            onToggle(item.id, clean);
        }
    };

    const handleAction = (action: 'edit' | 'delete' | 'select') => {
        setShowMenu(false);
        if (action === 'edit') onEdit(item.id);
        if (action === 'delete') onDelete(item.id);
        if (action === 'select') onSelect(item.id);
    };

    return (
        <>
            <div
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                className={`
                    relative rounded-xl overflow-hidden transition-all duration-200 aspect-square
                    bg-secondary-background
                    ${selectMode ? 'active:opacity-100' : 'active:opacity-80 active:scale-[0.98]'}
                    ${selected ? 'ring-2 ring-tint ring-offset-2 ring-offset-black' : ''}
                    ${!clean ? 'opacity-60' : ''}
                `}
            >
                <Image
                    src={item.image_url}
                    alt=""
                    fill
                    className={`object-cover transition-all ${clean ? '' : 'grayscale contrast-125'}`}
                    sizes="50vw"
                />

                {/* Selection Overlay */}
                {selectMode && (
                    <div className="absolute inset-0 bg-black/20 flex items-start justify-end p-2">
                        <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                            ${selected ? 'bg-tint border-tint' : 'bg-transparent border-white/60'}
                        `}>
                            {selected && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                    </div>
                )}

                {/* Status indicator */}
                {!selectMode && (
                    <div className={`
                        absolute top-1.5 right-1.5 w-2 h-2 rounded-full shadow-sm
                        border border-black/20
                        ${clean ? 'bg-green' : 'bg-red'}
                    `} />
                )}
            </div>

            {/* iOS Context Menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowMenu(false)}
                >
                    <div
                        className="w-[250px] rounded-xl overflow-hidden bg-secondary-background/90 backdrop-blur-xl shadow-2xl animate-slide-up ring-1 ring-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-4 py-3 border-b border-separator/50 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg relative overflow-hidden bg-tertiary-background">
                                <Image src={item.image_url} alt="" fill className="object-cover" />
                            </div>
                            <div>
                                <p className="text-subheadline font-semibold text-label-primary">
                                    {item.tags?.category}
                                </p>
                                <p className="text-caption-1 text-label-secondary">
                                    {clean ? "Clean" : "Laundry"}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleAction('edit')}
                            className="w-full flex items-center justify-between px-4 py-3.5 active:bg-fill-tertiary transition-colors border-b border-separator/50"
                        >
                            <span className="text-body text-label-primary">Edit Item</span>
                            <Pencil size={18} className="text-label-primary" />
                        </button>

                        <button
                            onClick={() => handleAction('select')}
                            className="w-full flex items-center justify-between px-4 py-3.5 active:bg-fill-tertiary transition-colors border-b border-separator/50"
                        >
                            <span className="text-body text-label-primary">Select...</span>
                            <CheckCircle size={18} className="text-label-primary" />
                        </button>

                        <button
                            onClick={() => handleAction('delete')}
                            className="w-full flex items-center justify-between px-4 py-3.5 active:bg-fill-tertiary transition-colors group"
                        >
                            <span className="text-body text-red group-active:opacity-70">Delete</span>
                            <Trash2 size={18} className="text-red group-active:opacity-70" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
