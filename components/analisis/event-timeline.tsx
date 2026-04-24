import type { AnalysisEvent } from "@/lib/supabase/types";
import styles from "./event-timeline.module.css";

interface Props {
  events: AnalysisEvent[];
  /** Limit shown; events beyond are hidden behind "ver todo" */
  initialLimit?: number;
}

const TYPE_LABEL: Record<string, string> = {
  order_placed: "orden puesta",
  order_filled: "orden llena",
  order_cancelled: "orden cancelada",
  position_opened: "posición abierta",
  position_closed: "posición cerrada",
  resolution: "resolución",
  note: "nota",
};

const TYPE_TONE: Record<string, string> = {
  order_filled: "emphasis",
  position_opened: "emphasis",
  position_closed: "emphasis",
  resolution: "resolution",
  order_placed: "muted",
  order_cancelled: "muted",
  note: "muted",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function describe(event: AnalysisEvent): string {
  const p = event.payload ?? {};
  if (event.type === "order_filled" || event.type === "order_placed") {
    const side = String(p.side ?? "");
    const outcome = String(p.outcome ?? "");
    const size = typeof p.size === "number" ? `${Math.round(p.size)} ct` : "";
    const price = typeof p.price === "number" ? `@ ${(Number(p.price) * 100).toFixed(0)}¢` : "";
    const slug = p.slug ? String(p.slug).split("-").slice(-3).join(" ") : "";
    return [side, outcome, size, price, slug].filter(Boolean).join(" · ");
  }
  if (event.type === "resolution") {
    const outcome = String(p.outcome ?? "");
    const roi = typeof p.roi === "number" ? ` · ${(p.roi as number).toFixed(1)}%` : "";
    const finalValue = typeof p.finalValue === "number" ? ` · valor final ${p.finalValue}` : "";
    return `${outcome}${roi}${finalValue}`;
  }
  if (typeof p.text === "string") return p.text;
  return "";
}

export default function EventTimeline({ events, initialLimit = 20 }: Props) {
  if (events.length === 0) {
    return (
      <div className={styles.empty}>
        Sin eventos aún. Aparecerán aquí al primer tick del cron.
      </div>
    );
  }

  // Sorted DESC by date (most recent first)
  const sorted = [...events].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );

  const shown = sorted.slice(0, initialLimit);

  return (
    <ol className={styles.timeline}>
      {shown.map((ev) => {
        const toneKey = TYPE_TONE[ev.type] ?? "muted";
        return (
          <li key={ev.id} className={`${styles.entry} ${styles[`tone-${toneKey}`]}`}>
            <div className={styles.when}>{formatWhen(ev.occurred_at)}</div>
            <div className={styles.body}>
              <span className={styles.label}>{TYPE_LABEL[ev.type] ?? ev.type}</span>
              <span className={styles.desc}>{describe(ev)}</span>
            </div>
          </li>
        );
      })}
      {sorted.length > shown.length && (
        <li className={styles.more}>+ {sorted.length - shown.length} eventos anteriores</li>
      )}
    </ol>
  );
}
