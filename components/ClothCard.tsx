"use client";

import { ClothingItem } from "@/types";
import { Check, Pencil, Trash2, CheckCircle, X } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { triggerHaptic } from "@/lib/haptics";

// Tiny placeholder for instant perceived loading
const shimmerPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23222'/%3E%3C/svg%3E";

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
    const isAccessory = item.tags?.category === 'Accessory';
    const [showMenu, setShowMenu] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
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
        } else if (!isAccessory) {
            // Only toggle clean/dirty for non-accessories
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

    // Context Menu Portal - Always mounted, visibility controlled
    const contextMenu = mounted ? createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-200 ${showMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={closeMenu}
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0,
                backgroundColor: showMenu ? 'rgba(0,0,0,0.5)' : 'transparent',
                backdropFilter: showMenu ? 'blur(8px)' : 'none',
                WebkitBackdropFilter: showMenu ? 'blur(8px)' : 'none',
            }}
        >
            <div
                className={`w-[300px] rounded-[28px] overflow-hidden liquid-glass-elevated transition-all duration-200 ${showMenu ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Close Button */}
                <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl relative overflow-hidden bg-white/5 flex-shrink-0">
                        {/* Use same cached image with priority loading */}
                        <Image 
                            src={item.image_url} 
                            alt="" 
                            fill 
                            className="object-cover" 
                            sizes="56px"
                            placeholder="blur"
                            blurDataURL={shimmerPlaceholder}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-white truncate">
                            {item.tags?.sub_category || item.tags?.category || 'Item'}
                        </p>
                        {!isAccessory && (
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
                        )}
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
                        <span className="text-[17px] text-white">Details</span>
                        <Pencil size={20} className="text-white/50" />
                    </button>

                    <div className="h-px bg-white/10 mx-4" />

                    <button
                        onClick={() => handleAction('select')}
                        className="w-full flex items-center justify-between px-4 py-4 active:bg-white/5 transition-colors"
                    >
                        <span className="text-[17px] text-white">Select</span>
                        <CheckCircle size={20} className="text-white/50" />
                    </button>

                    <div className="h-px bg-white/10 mx-4" />

                    <button
                        onClick={() => handleAction('delete')}
                        className="w-full flex items-center justify-between px-4 py-4 active:bg-white/5 transition-colors"
                    >
                        <span className="text-[17px] text-[#FF453A]">Delete</span>
                        <Trash2 size={20} className="text-[#FF453A]/70" />
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
                    ${!clean && !isAccessory ? 'opacity-50' : ''}
                `}
                style={{
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <Image
                    src={item.image_url}
                    alt=""
                    fill
                    className={`object-cover transition-all duration-300 pointer-events-none select-none ${!clean && !isAccessory ? 'grayscale' : ''}`}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    loading="eager"
                    onLoad={() => setImageLoaded(true)}
                    placeholder="blur"
                    blurDataURL={shimmerPlaceholder}
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

                {!selectMode && !isAccessory && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-sm">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                                backgroundColor: clean ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                                boxShadow: clean
                                    ? '0 0 8px 2px rgba(255, 255, 255, 0.5)'
                                    : 'none'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Portal for context menu */}
            {contextMenu}
        </>
    );
}
