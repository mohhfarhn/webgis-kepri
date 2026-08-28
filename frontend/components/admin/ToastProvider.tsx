"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam ToastProvider");
  return ctx;
}

const toastIcon: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
};

const toastColor: Record<ToastType, string> = {
  success: "#4ADE80",
  error: "#EF4444",
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => removeToast(id), 3500);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            aria-live={t.type === "error" ? "assertive" : "polite"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#111625",
              border: `1px solid ${toastColor[t.type]}66`,
              borderRadius: "10px",
              padding: "12px 18px",
              fontSize: "13px",
              fontWeight: 700,
              color: toastColor[t.type],
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              maxWidth: "340px",
              animation: "toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <span
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                flexShrink: 0,
                background: `${toastColor[t.type]}1f`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
              }}
            >
              {toastIcon[t.type]}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
