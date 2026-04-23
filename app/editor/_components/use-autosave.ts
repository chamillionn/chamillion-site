"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutosavePayload {
  contentJson: unknown;
  contentMd: string;
}

type PayloadProvider = () => AutosavePayload;

interface UseAutosaveOptions {
  onSave: (payload: AutosavePayload) => Promise<{ error?: string }>;
  debounceMs?: number;
}

/**
 * Autosave con debounce. La serialización del payload se hace en el momento
 * del flush (no en cada edit) para no pagar el coste de getMarkdown/getJSON
 * en cada keystroke. El caller pasa un provider en vez del payload directo.
 */
export function useAutosave({ onSave, debounceMs = 2000 }: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const providerRef = useRef<PayloadProvider | null>(null);
  const inflightRef = useRef(false);
  const dirtyRef = useRef(false);

  const flush = useCallback(async () => {
    if (!providerRef.current || !dirtyRef.current || inflightRef.current) return;
    inflightRef.current = true;
    setStatus("saving");
    try {
      const payload = providerRef.current();
      const res = await onSave(payload);
      if (res.error) {
        setStatus("error");
        setErrorMsg(res.error);
      } else {
        setStatus("saved");
        setSavedAt(Date.now());
        setErrorMsg(null);
        dirtyRef.current = false;
      }
    } finally {
      inflightRef.current = false;
    }
  }, [onSave]);

  const schedule = useCallback(
    (provider: PayloadProvider) => {
      providerRef.current = provider;
      dirtyRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        void flush();
      }, debounceMs);
    },
    [flush, debounceMs],
  );

  // Flush pendiente al esconder la pestaña (antes de que el user se vaya).
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden" && dirtyRef.current) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        void flush();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [flush]);

  return { status, savedAt, errorMsg, schedule, flush };
}

export function formatSavedAgo(savedAt: number | null): string {
  if (!savedAt) return "";
  const delta = Math.floor((Date.now() - savedAt) / 1000);
  if (delta < 5) return "justo ahora";
  if (delta < 60) return `hace ${delta} s`;
  const mins = Math.floor(delta / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `hace ${hours} h`;
}
