"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

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

    const iconColor = type === "success" ? "text-green" : type === "error" ? "text-red" : "text-label-secondary";
    const bgGlow = type === "success" ? "shadow-[0_0_20px_rgba(48,209,88,0.15)]" :
        type === "error" ? "shadow-[0_0_20px_rgba(255,69,58,0.15)]" : "";

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {show && (
                <div
                    className={`
                        fixed top-3 left-1/2 -translate-x-1/2 z-[100]
                        ${isExiting ? 'animate-[fadeOut_0.2s_ease-out_forwards]' : 'animate-bounce-in'}
                    `}
                >
                    <div className={`
                        flex items-center gap-3 px-5 py-3.5 
                        rounded-full bg-secondary-background/95 
                        backdrop-blur-2xl shadow-premium-lg 
                        border border-white/[0.08]
                        min-w-[180px] max-w-[85vw] justify-center
                        ${bgGlow}
                    `}>
                        {/* Animated Icons */}
                        {type === "success" && (
                            <div className="relative w-5 h-5 flex items-center justify-center">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    className={iconColor}
                                >
                                    <circle
                                        cx="10"
                                        cy="10"
                                        r="9"
                                        fill="currentColor"
                                        className="opacity-20"
                                    />
                                    <circle
                                        cx="10"
                                        cy="10"
                                        r="9"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        fill="none"
                                    />
                                    <path
                                        d="M6 10.5L8.5 13L14 7"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="check-animated"
                                    />
                                </svg>
                            </div>
                        )}

                        {type === "error" && (
                            <div className="relative w-5 h-5 flex items-center justify-center">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    className={iconColor}
                                >
                                    <circle
                                        cx="10"
                                        cy="10"
                                        r="9"
                                        fill="currentColor"
                                        className="opacity-20"
                                    />
                                    <circle
                                        cx="10"
                                        cy="10"
                                        r="9"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        fill="none"
                                    />
                                    <path
                                        d="M10 6V11M10 14V14.01"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        )}

                        {type === "info" && (
                            <div className="w-5 h-5 rounded-full bg-fill-secondary flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-label-secondary" />
                            </div>
                        )}

                        <span className="text-[15px] font-semibold text-label-primary tracking-tight">
                            {message}
                        </span>
                    </div>
                </div>
            )}

            {/* Fade out keyframe - injected once */}
            <style jsx global>{`
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}
