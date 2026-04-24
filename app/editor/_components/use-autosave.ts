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
  /** Tiempo sin ediciones antes de flushear (ms). Default 2000. */
  debounceMs?: number;
  /**
   * Tiempo máximo entre flushes aunque el user siga tecleando (ms). Default
   * 30000 — protege contra sesiones de escritura continuas donde el debounce
   * nunca dispararía. Pon 0 para desactivar.
   */
  maxWaitMs?: number;
}

/**
 * Autosave con debounce + max-wait. La serialización del payload se hace en
 * el momento del flush (no en cada edit) para no pagar el coste de
 * getMarkdown/getJSON en cada keystroke. El caller pasa un provider en vez
 * del payload directo.
 *
 * Flushea cuando ocurre lo primero:
 *   - pasan `debounceMs` sin ediciones, o
 *   - pasan `maxWaitMs` desde la primera edición del batch, o
 *   - la pestaña pasa a `hidden`, o
 *   - se llama `flush()` explícitamente.
 */
export function useAutosave({
  onSave,
  debounceMs = 2000,
  maxWaitMs = 30000,
}: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const providerRef = useRef<PayloadProvider | null>(null);
  const inflightRef = useRef(false);
  const dirtyRef = useRef(false);

  // onSave cambia de identidad en cada render (siempre es una closure
  // nueva del caller). Lo guardamos en un ref para que `flush` pueda
  // quedarse estable y los useEffects de abajo no tengan que re-cleanup
  // en cada render (que era lo que borraba los timers pendientes).
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  function clearTimers() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (maxWaitRef.current) {
      clearTimeout(maxWaitRef.current);
      maxWaitRef.current = null;
    }
  }

  const flush = useCallback(async () => {
    if (!providerRef.current || !dirtyRef.current || inflightRef.current) {
      console.log("[autosave] flush skipped:", {
        hasProvider: !!providerRef.current,
        dirty: dirtyRef.current,
        inflight: inflightRef.current,
      });
      return;
    }
    clearTimers();
    inflightRef.current = true;
    setStatus("saving");
    try {
      const payload = providerRef.current();
      console.log("[autosave] flushing", {
        mdLen: payload.contentMd?.length ?? 0,
        hasJson: !!payload.contentJson,
      });
      const res = await onSaveRef.current(payload);
      if (res.error) {
        console.warn("[autosave] save failed:", res.error);
        setStatus("error");
        setErrorMsg(res.error);
      } else {
        setStatus("saved");
        setSavedAt(Date.now());
        setErrorMsg(null);
        dirtyRef.current = false;
      }
    } catch (err) {
      console.error("[autosave] flush threw:", err);
      setStatus("error");
      setErrorMsg((err as Error).message || "Error desconocido");
    } finally {
      inflightRef.current = false;
    }
  }, []);

  const schedule = useCallback(
    (provider: PayloadProvider) => {
      console.log("[autosave] schedule called", {
        debounceMs,
        maxWaitMs,
        hadDebounce: !!debounceRef.current,
        hadMaxWait: !!maxWaitRef.current,
      });
      providerRef.current = provider;
      dirtyRef.current = true;

      // Debounce: reinicia cada vez que hay una edit.
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        console.log("[autosave] debounce fired");
        debounceRef.current = null;
        void flush();
      }, debounceMs);

      // Max-wait: solo arranca si no hay uno corriendo. No se reinicia.
      if (maxWaitRef.current === null && maxWaitMs > 0) {
        maxWaitRef.current = setTimeout(() => {
          console.log("[autosave] max-wait fired");
          maxWaitRef.current = null;
          void flush();
        }, maxWaitMs);
      }
    },
    [flush, debounceMs, maxWaitMs],
  );

  // Flush pendiente al esconder la pestaña (antes de que el user se vaya).
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden" && dirtyRef.current) {
        void flush();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
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
