"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-saudara-green-800 text-white border-saudara-green-700"
              : toast.type === "error"
              ? "bg-red-700 text-white border-red-600"
              : toast.type === "warning"
              ? "bg-amber-600 text-white border-amber-500"
              : "bg-saudara-charcoal text-white border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-saudara-green-200 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />}
            {toast.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-200 shrink-0" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-blue-200 shrink-0" />}
            <span className="leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/20 rounded-lg shrink-0 transition-colors"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}
