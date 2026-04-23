import styles from "./callout.module.css";

export type CalloutTone = "info" | "insight" | "warn" | "critical";

interface Props {
  tone?: CalloutTone;
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const DEFAULT_ICON: Record<CalloutTone, string> = {
  info: "i",
  insight: "✦",
  warn: "!",
  critical: "✕",
};

export default function Callout({
  tone = "info",
  title,
  icon,
  children,
}: Props) {
  return (
    <aside
      className={`${styles.callout} ${styles[`tone-${tone}`]}`}
      role={tone === "warn" || tone === "critical" ? "alert" : undefined}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon ?? DEFAULT_ICON[tone]}
      </span>
      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.content}>{children}</div>
      </div>
    </aside>
  );
}
