"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState<ToastType>("info");
    const [isExiting, setIsExiting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toast = useCallback((msg: string, t: ToastType = "info") => {
        setMessage(msg);
        setType(t);
        setIsExiting(false);
        setShow(true);
    }, []);

    useEffect(() => {
        if (show && !isExiting) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => setShow(false), 200);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [show, isExiting]);

    const iconColor = "#FFFFFF";

    const toastContent = show && mounted ? createPortal(
        <div
            style={{
                position: 'fixed',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10000,
                animation: isExiting
                    ? 'toastOut 0.2s ease-out forwards'
                    : 'toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 20px',
                    borderRadius: 50,
                    background: 'rgba(44, 44, 46, 0.95)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    boxShadow: type === "success"
                        ? '0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(48, 209, 88, 0.15)'
                        : type === "error"
                            ? '0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(255, 69, 58, 0.15)'
                            : '0 8px 32px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    minWidth: 160,
                }}
            >
                {/* Icon */}
                {type === "success" && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill={iconColor} fillOpacity="0.15" />
                        <circle cx="10" cy="10" r="9" stroke={iconColor} strokeWidth="1.5" fill="none" />
                        <path
                            d="M6 10.5L8.5 13L14 7"
                            stroke={iconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}

                {type === "error" && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill={iconColor} fillOpacity="0.15" />
                        <circle cx="10" cy="10" r="9" stroke={iconColor} strokeWidth="1.5" fill="none" />
                        <path d="M10 6V11" stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
                        <circle cx="10" cy="14" r="1" fill={iconColor} />
                    </svg>
                )}

                {type === "info" && (
                    <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(142, 142, 147, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#8E8E93',
                        }} />
                    </div>
                )}

                <span style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    letterSpacing: '-0.01em',
                }}>
                    {message}
                </span>
            </div>

            <style>{`
                @keyframes toastIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes toastOut {
                    from {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                }
            `}</style>
        </div>,
        document.body
    ) : null;

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {toastContent}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}
