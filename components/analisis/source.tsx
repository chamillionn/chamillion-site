import styles from "./source.module.css";

interface Props {
  name: string;
  href: string;
  domain?: string;
  /** Short inline explainer shown as a subtle caption */
  caption?: string;
}

/**
 * Cite an external source with a favicon and a clickable link.
 * Stays on-brand (steel-blue accent, monospace meta) and is SSR-friendly.
 */
export default function Source({ name, href, domain, caption }: Props) {
  const d = domain ?? new URL(href).hostname.replace(/^www\./, "");
  return (
    <a
      className={styles.source}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.favicon}
        src={`https://www.google.com/s2/favicons?domain=${d}&sz=32`}
        alt=""
        width={14}
        height={14}
      />
      <span className={styles.name}>{name}</span>
      {caption && <span className={styles.caption}>{caption}</span>}
      <span className={styles.arrow}>↗</span>
    </a>
  );
}
