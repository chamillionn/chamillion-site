"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import styles from "../post.module.css";

export default function WalletCollapsible({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={styles.walletToggle}
        aria-expanded={open}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={styles.walletToggleIcon}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>Si ya sabes cómo montar una wallet, puedes saltarte esta sección.</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`${styles.walletChevron} ${open ? styles.walletChevronOpen : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className={`${styles.walletContent} ${open ? styles.walletContentOpen : ""}`}>
        <div className={styles.walletContentInner}>
          {children}
        </div>
      </div>
    </div>
  );
}
