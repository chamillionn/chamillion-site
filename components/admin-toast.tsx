"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContext {
  toast: (message: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastContext>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 200,
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                pointerEvents: "auto",
                cursor: "pointer",
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: 13,
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid",
                maxWidth: 360,
                animation: "toastIn 0.2s ease-out",
                ...(t.type === "success"
                  ? {
                      background: "rgba(91, 170, 124, 0.12)",
                      borderColor: "rgba(91, 170, 124, 0.3)",
                      color: "var(--green)",
                    }
                  : t.type === "error"
                    ? {
                        background: "rgba(199, 85, 90, 0.12)",
                        borderColor: "rgba(199, 85, 90, 0.3)",
                        color: "var(--red)",
                      }
                    : {
                        background: "rgba(107, 142, 160, 0.12)",
                        borderColor: "rgba(107, 142, 160, 0.3)",
                        color: "var(--steel-blue)",
                      }),
              }}
            >
              {t.type === "success" && "✓ "}
              {t.type === "error" && "✗ "}
              {t.message}
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}
