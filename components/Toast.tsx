"use client";

import { useState, createContext, useContext, useCallback } from "react";

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void; }

const Ctx = createContext<ToastCtx | null>(null);
export function useToast() {
    const c = useContext(Ctx);
    if (!c) throw new Error("useToast must be within ToastProvider");
    return c;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, _type?: ToastType) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(p => [...p, { id, message }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 2500);
    }, []);

    return (
        <Ctx.Provider value={{ toast }}>
            {children}
            <div className="fixed top-2 left-0 right-0 z-[100] flex flex-col items-center safe-top px-4 pointer-events-none gap-2">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className="px-6 py-3 rounded-full pointer-events-auto animate-slide-up shadow-lg bg-tertiary-background/90 backdrop-blur-md ring-1 ring-white/10"
                    >
                        <p className="text-subheadline font-semibold text-label-primary text-center">
                            {t.message}
                        </p>
                    </div>
                ))}
            </div>
        </Ctx.Provider>
    );
}
