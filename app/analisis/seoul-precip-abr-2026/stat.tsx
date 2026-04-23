import styles from "./stat.module.css";

interface Props {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  /** Delta vs reference; positive = up, negative = down. Prefixed with sign automatically. */
  delta?: number;
  deltaUnit?: string;
  /** Extra caption under the value */
  caption?: string;
  /** Visual style variant */
  variant?: "default" | "hero" | "pill" | "solid";
  /** Color tone (for semantic meaning: positive/negative/neutral) */
  tone?: "neutral" | "positive" | "negative" | "accent";
}

export default function Stat({
  label,
  value,
  unit,
  delta,
  deltaUnit,
  caption,
  variant = "default",
  tone = "neutral",
}: Props) {
  return (
    <div
      className={`${styles.stat} ${styles[`variant-${variant}`]} ${styles[`tone-${tone}`]}`}
    >
      <div className={styles.label}>{label}</div>
      <div className={styles.valueLine}>
        <span className={styles.value}>{value}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {delta != null && (
        <div
          className={`${styles.delta} ${delta >= 0 ? styles.deltaPositive : styles.deltaNegative}`}
        >
          {delta >= 0 ? "+" : ""}
          {delta}
          {deltaUnit ?? ""}
        </div>
      )}
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );
}
