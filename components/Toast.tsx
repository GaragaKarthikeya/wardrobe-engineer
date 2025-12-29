"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    }, []);

    const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    const getStyle = (type: ToastType) => {
        switch (type) {
            case 'success': return { bg: 'var(--color-clean-muted)', border: 'var(--color-clean)', icon: 'var(--color-clean)' };
            case 'error': return { bg: 'var(--color-dirty-muted)', border: 'var(--color-dirty)', icon: 'var(--color-dirty)' };
            default: return { bg: 'var(--color-surface-elevated)', border: 'var(--color-border)', icon: 'var(--color-accent)' };
        }
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* Toast Container - Top Center for mobile */}
            <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pt-safe px-4 pointer-events-none">
                {toasts.map((t) => {
                    const style = getStyle(t.type);
                    return (
                        <div
                            key={t.id}
                            className="mt-2 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl pointer-events-auto animate-slide-up max-w-sm w-full"
                            style={{
                                background: style.bg,
                                border: `1px solid ${style.border}`,
                                backdropFilter: 'blur(12px)'
                            }}
                        >
                            {t.type === 'success' && <CheckCircle size={18} style={{ color: style.icon }} />}
                            {t.type === 'error' && <AlertCircle size={18} style={{ color: style.icon }} />}
                            {t.type === 'info' && <Info size={18} style={{ color: style.icon }} />}

                            <p className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>{t.message}</p>

                            <button
                                onClick={() => dismiss(t.id)}
                                style={{ color: 'var(--color-text-subtle)' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
