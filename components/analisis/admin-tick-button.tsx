"use client";

import { useState, useTransition } from "react";
import { runTrackerTick } from "@/app/admin/analisis/actions";
import styles from "./admin-tick-button.module.css";

interface Props {
  analysisId: string;
}

type Feedback =
  | { kind: "idle" }
  | { kind: "success"; text: string; warnings: string[] }
  | { kind: "error"; text: string };

/**
 * Admin-only inline tick button for analysis pages. Triggers runTrackerTick()
 * (which itself requires admin) and surfaces the result + warnings inline —
 * the public layout has no toast provider, so we render feedback next to the
 * button.
 */
export default function AdminTickButton({ analysisId }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });

  const handleTick = () => {
    setFeedback({ kind: "idle" });
    startTransition(async () => {
      const res = await runTrackerTick(analysisId);
      if (res.error) {
        setFeedback({ kind: "error", text: res.error });
        return;
      }
      setFeedback({
        kind: "success",
        text: `${res.positionLegs ?? 0} pos · ${res.eventsFetched ?? 0} events · ${res.eventsInserted ?? 0} nuevos`,
        warnings: res.warnings ?? [],
      });
      if (res.warnings && res.warnings.length > 0) {
        console.warn("Tracker warnings:", res.warnings);
      }
    });
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        onClick={handleTick}
        disabled={pending}
        className={styles.btn}
        title="Forzar un tick del tracker ahora (admin)"
      >
        <span className={styles.dot} />
        {pending ? "Ejecutando…" : "Ejecutar tick"}
      </button>

      {feedback.kind === "success" && (
        <div className={styles.feedbackOk}>
          <span>✓ {feedback.text}</span>
          {feedback.warnings.length > 0 && (
            <details className={styles.warnings}>
              <summary>{feedback.warnings.length} warnings</summary>
              <ul>
                {feedback.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {feedback.kind === "error" && (
        <div className={styles.feedbackErr}>✕ {feedback.text}</div>
      )}
    </div>
  );
}
