"use client";

import { ClothingItem } from "@/types";
import { Check, Pencil, Trash2, CheckCircle } from "lucide-react";
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
    const [isPressed, setIsPressed] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const didLongPress = useRef(false);

    const handleTouchStart = () => {
        didLongPress.current = false;
        setIsPressed(true);

        // Fire haptic IMMEDIATELY on touch
        triggerHaptic('light');

        longPressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            triggerHaptic('heavy');
            setShowMenu(true);
            setIsPressed(false);
        }, 500);
    };

    const handleTouchEnd = () => {
        setIsPressed(false);
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
        triggerHaptic('medium');
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
                onContextMenu={(e) => e.preventDefault()}
                className={`
                    relative rounded-2xl overflow-hidden aspect-square
                    bg-secondary-background
                    transition-all duration-200 ease-out
                    ${isPressed ? 'scale-[0.97] opacity-90' : 'scale-100 opacity-100'}
                    ${selected ? 'ring-[2.5px] ring-tint ring-offset-2 ring-offset-black shadow-glow-tint' : ''}
                    ${!clean ? 'opacity-50' : ''}
                `}
                style={{
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <Image
                    src={item.image_url}
                    alt=""
                    fill
                    className={`object-cover transition-all duration-300 pointer-events-none select-none ${clean ? '' : 'grayscale'}`}
                    sizes="50vw"
                />

                {/* Selection Overlay */}
                {selectMode && (
                    <div className="absolute inset-0 bg-black/30 flex items-start justify-end p-2.5 transition-opacity duration-200">
                        <div
                            className={`
                                w-6 h-6 rounded-full flex items-center justify-center 
                                transition-all duration-300 ease-out
                                ${selected
                                    ? 'bg-tint border-0 scale-100 shadow-glow-tint'
                                    : 'bg-black/40 border-2 border-white/70 scale-90'
                                }
                            `}
                            style={{
                                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        >
                            {selected && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                    </div>
                )}

                {/* Status Indicator - Premium */}
                {!selectMode && (
                    <div
                        className={`
                            absolute top-2 right-2 
                            w-2.5 h-2.5 rounded-full
                            transition-all duration-300
                            ${clean
                                ? 'bg-green shadow-[0_0_8px_2px_rgba(48,209,88,0.5)]'
                                : 'bg-red shadow-[0_0_8px_2px_rgba(255,69,58,0.5)]'
                            }
                        `}
                    />
                )}
            </div>

            {/* iOS Context Menu - Premium */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in"
                    onClick={() => setShowMenu(false)}
                >
                    <div
                        className="w-[260px] rounded-2xl overflow-hidden bg-secondary-background/95 backdrop-blur-2xl shadow-premium-lg animate-scale-in border border-white/[0.08]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Preview Header */}
                        <div className="px-4 py-4 border-b border-separator/50 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl relative overflow-hidden bg-tertiary-background shadow-sm">
                                <Image src={item.image_url} alt="" fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-subheadline font-semibold text-label-primary truncate">
                                    {item.tags?.sub_category || item.tags?.category || 'Item'}
                                </p>
                                <p className="text-caption-1 text-label-secondary flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${clean ? 'bg-green' : 'bg-red'}`} />
                                    {clean ? "Clean" : "Needs Washing"}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="py-1">
                            <button
                                onClick={() => handleAction('edit')}
                                className="w-full flex items-center justify-between px-4 py-3.5 active:bg-fill-tertiary transition-all group"
                            >
                                <span className="text-body text-label-primary group-active:opacity-70">View Details</span>
                                <Pencil size={18} className="text-label-secondary group-active:opacity-70" />
                            </button>

                            <button
                                onClick={() => handleAction('select')}
                                className="w-full flex items-center justify-between px-4 py-3.5 active:bg-fill-tertiary transition-all group border-t border-separator/30"
                            >
                                <span className="text-body text-label-primary group-active:opacity-70">Select Item</span>
                                <CheckCircle size={18} className="text-label-secondary group-active:opacity-70" />
                            </button>

                            <button
                                onClick={() => handleAction('delete')}
                                className="w-full flex items-center justify-between px-4 py-3.5 active:bg-red-light transition-all group border-t border-separator/30"
                            >
                                <span className="text-body text-red group-active:opacity-70">Delete Item</span>
                                <Trash2 size={18} className="text-red group-active:opacity-70" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
