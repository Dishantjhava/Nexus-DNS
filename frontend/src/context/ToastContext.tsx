"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";

export type ToastType = "info" | "success" | "error" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  showFeatureNotAvailable: (featureName?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const showFeatureNotAvailable = useCallback((featureName?: string) => {
    const msg = featureName
      ? `${featureName} is not available in this environment.`
      : "This feature is not available in this environment.";
    addToast(msg, "info");
  }, [addToast]);

  const flashbarItems: FlashbarProps.MessageDefinition[] = toasts.map((t) => ({
    id: t.id,
    type: t.type,
    content: t.message,
    dismissible: true,
    onDismiss: () => removeToast(t.id),
  }));

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showFeatureNotAvailable }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-12 right-4 z-50 max-w-md w-full">
          <Flashbar items={flashbarItems} />
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
