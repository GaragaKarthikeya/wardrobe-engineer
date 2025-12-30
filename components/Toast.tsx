"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState<ToastType>("info");

    const toast = useCallback((msg: string, t: ToastType = "info") => {
        setMessage(msg);
        setType(t);
        setShow(true);
    }, []);

    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => setShow(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [show]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {show && (
                <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] animate-slide-up-fade">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-[32px] bg-black/80 backdrop-blur-2xl shadow-2xl border border-white/10 min-w-[200px] max-w-[90vw] justify-center shadow-black/50">
                        {type === "success" && <CheckCircle2 size={20} className="text-green" fill="currentColor" stroke="black" />}
                        {type === "error" && <AlertCircle size={20} className="text-red" fill="currentColor" stroke="black" />}
                        {type === "info" && <Info size={20} className="text-gray-400" />}

                        <span className="text-[15px] font-semibold text-white tracking-tight">
                            {message}
                        </span>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}

