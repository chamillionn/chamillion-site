"use client";

import { useEffect, useState } from "react";
import styles from "./polymarket-embed.module.css";

interface Props {
  /** Market slug (single sub-market, not event) */
  marketSlug: string;
  /** Fallback link if the iframe fails or user prefers external */
  fallbackHref?: string;
  title?: string;
  height?: number;
  /** Features string passed to Polymarket embed: volume|buyButtons|chart|... */
  features?: string;
}

/**
 * Polymarket single-market embed widget.
 * Syncs theme with the site's data-theme attribute (dark/light).
 * Forces re-mount on theme change so the iframe picks up the new src.
 */
export default function PolymarketEmbed({
  marketSlug,
  fallbackHref,
  title = "Polymarket",
  height = 440,
  features = "volume",
}: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const read = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setTheme(t === "light" ? "light" : "dark");
    };
    read();
    const ob = new MutationObserver(read);
    ob.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => ob.disconnect();
  }, []);

  const src = `https://embed.polymarket.com/market?market=${marketSlug}&features=${features}&theme=${theme}`;

  return (
    <figure className={styles.wrap}>
      <iframe
        key={theme}
        title={title}
        src={src}
        className={styles.frame}
        style={{ height: `${height}px` }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {fallbackHref && (
        <figcaption className={styles.caption}>
          <a
            href={fallbackHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Abrir en Polymarket ↗
          </a>
        </figcaption>
      )}
    </figure>
  );
}
