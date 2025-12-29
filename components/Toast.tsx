"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { cn } from "@/lib/utils";
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

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const dismiss = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const icons = {
        success: <CheckCircle size={18} className="text-green-400" />,
        error: <AlertCircle size={18} className="text-red-400" />,
        info: <Info size={18} className="text-teal-400" />,
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md animate-in slide-in-from-right border",
                            t.type === "success" && "bg-green-950/80 border-green-800",
                            t.type === "error" && "bg-red-950/80 border-red-800",
                            t.type === "info" && "bg-zinc-900/80 border-zinc-700"
                        )}
                    >
                        {icons[t.type]}
                        <p className="text-sm text-white flex-1">{t.message}</p>
                        <button
                            onClick={() => dismiss(t.id)}
                            className="text-zinc-400 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
