import styles from "./hero.module.css";

interface Props {
  eyebrow?: string;
  title: React.ReactNode;
  standfirst?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Editorial hero — minimal and typographic.
 * No pills, no thesis box. Just eyebrow + title + standfirst,
 * with an optional slot for the live tracker widget below.
 */
export default function Hero({ eyebrow, title, standfirst, children }: Props) {
  return (
    <header className={styles.hero}>
      {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
      <h1 className={styles.title}>{title}</h1>
      {standfirst && <p className={styles.standfirst}>{standfirst}</p>}
      {children && <div className={styles.slot}>{children}</div>}
    </header>
  );
}
