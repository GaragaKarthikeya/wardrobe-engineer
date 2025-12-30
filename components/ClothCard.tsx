"use client";

import { ClothingItem } from "@/types";
import { Check, Pencil, Trash2, CheckCircle, X } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
    const [mounted, setMounted] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const didLongPress = useRef(false);

    // For portal rendering
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleTouchStart = () => {
        didLongPress.current = false;
        setIsPressed(true);
        triggerHaptic();

        longPressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            triggerHaptic();
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

        triggerHaptic();

        if (selectMode) {
            onSelect(item.id);
        } else {
            onToggle(item.id, clean);
        }
    };

    const closeMenu = () => {
        triggerHaptic();
        setShowMenu(false);
    };

    const handleAction = (action: 'edit' | 'delete' | 'select') => {
        triggerHaptic();
        setShowMenu(false);
        if (action === 'edit') onEdit(item.id);
        if (action === 'delete') onDelete(item.id);
        if (action === 'select') onSelect(item.id);
    };

    // Context Menu Portal
    const contextMenu = showMenu && mounted ? createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center liquid-overlay"
            onClick={closeMenu}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div
                className="w-[300px] rounded-[28px] overflow-hidden liquid-glass-elevated animate-scale-in"
                onClick={e => e.stopPropagation()}
                style={{
                    animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}
            >
                {/* Header with Close Button */}
                <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl relative overflow-hidden bg-[#3A3A3C] flex-shrink-0">
                        <Image src={item.image_url} alt="" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-white truncate">
                            {item.tags?.sub_category || item.tags?.category || 'Item'}
                        </p>
                        <p className="text-[13px] text-white/60 flex items-center gap-1.5 mt-0.5">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: clean ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                                    boxShadow: clean
                                        ? '0 0 6px rgba(255, 255, 255, 0.5)'
                                        : 'none'
                                }}
                            />
                            {clean ? "Clean" : "Needs Wash"}
                        </p>
                    </div>
                    <button
                        onClick={closeMenu}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
                    >
                        <X size={16} className="text-white/70" />
                    </button>
                </div>

                {/* Actions */}
                <div>
                    <button
                        onClick={() => handleAction('edit')}
                        className="w-full flex items-center justify-between px-4 py-4 active:bg-white/5 transition-colors"
                    >
                        <span className="text-[17px] text-white">View Details</span>
                        <Pencil size={20} className="text-white/50" />
                    </button>

                    <div className="h-px bg-white/10 mx-4" />

                    <button
                        onClick={() => handleAction('select')}
                        className="w-full flex items-center justify-between px-4 py-4 active:bg-white/5 transition-colors"
                    >
                        <span className="text-[17px] text-white">Select Item</span>
                        <CheckCircle size={20} className="text-white/50" />
                    </button>

                    <div className="h-px bg-white/10 mx-4" />

                    <button
                        onClick={() => handleAction('delete')}
                        className="w-full flex items-center justify-between px-4 py-4 active:bg-white/5 transition-colors"
                    >
                        <span className="text-[17px] text-white/60">Delete Item</span>
                        <Trash2 size={20} className="text-white/60" />
                    </button>
                </div>

                {/* Cancel Button */}
                <div className="p-3 pt-0">
                    <button
                        onClick={closeMenu}
                        className="w-full py-3.5 rounded-xl bg-white/10 text-[17px] font-semibold text-white active:bg-white/15 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

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
                    ${selected ? 'ring-[2.5px] ring-tint ring-offset-2 ring-offset-black' : ''}
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
                    <div className="absolute inset-0 bg-black/30 flex items-start justify-end p-2.5">
                        <div
                            className={`
                                w-6 h-6 rounded-full flex items-center justify-center 
                                transition-all duration-300 ease-out
                                ${selected
                                    ? 'bg-tint scale-100'
                                    : 'bg-black/40 border-2 border-white/70 scale-90'
                                }
                            `}
                        >
                            {selected && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                    </div>
                )}

                {/* Status Indicator */}
                {!selectMode && (
                    <div
                        className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                        style={{
                            backgroundColor: clean ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                            boxShadow: clean
                                ? '0 0 8px 2px rgba(255, 255, 255, 0.5)'
                                : 'none'
                        }}
                    />
                )}
            </div>

            {/* Portal for context menu */}
            {contextMenu}
        </>
    );
}
