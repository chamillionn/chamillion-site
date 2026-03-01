"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import UserMenu from "@/components/user-menu";
import PremiumBadge from "@/components/premium-badge";
import { V } from "@/lib/theme";
import styles from "./layout.module.css";

function useMediaQuery(maxWidth: number) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [maxWidth]);
  return matches;
}

export default function Header() {
  const mobile = useMediaQuery(600);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setMenuOpen(false); }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.headerLogo} href="/">
          <div className={styles.logoBox}>
            <Image
              src="/assets/newsletter/logo.jpg"
              alt="Chamillion"
              width={24}
              height={24}
              sizes="24px"
            />
          </div>
          <span>Chamillion</span>
          <PremiumBadge className={styles.extendedBadge} />
        </Link>

        {/* Desktop nav */}
        <nav className={styles.headerNav}>
          <Link href="/">Inicio</Link>
          <Link href="/newsletter">Archivo</Link>
          <UserMenu />
          <ThemeToggle />
        </nav>

        {/* Mobile hamburger */}
        {mobile && (
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className={styles.hamburger}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {mobile && menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 260,
              maxWidth: "85vw",
              height: "100%",
              background: V.bgCard,
              borderLeft: `1px solid ${V.border}`,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              animation: "fadeIn 0.2s ease-out",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menu"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: V.textSecondary }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Navigation section */}
            <div style={{ fontSize: 10, fontFamily: "var(--font-jetbrains), monospace", color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: 4 }}>Navegacion</div>
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 10px",
                borderRadius: 8,
                textDecoration: "none",
                color: V.textPrimary,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: V.textSecondary }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Inicio
            </Link>
            <Link
              href="/newsletter"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 10px",
                borderRadius: 8,
                textDecoration: "none",
                color: V.textPrimary,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: V.textSecondary }}>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Archivo
            </Link>

            <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${V.border}, transparent)`, margin: "8px 0" }} />

            {/* Account section */}
            <div style={{ fontSize: 10, fontFamily: "var(--font-jetbrains), monospace", color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: 4 }}>Cuenta</div>
            <UserMenu variant="expanded" onNavigate={() => setMenuOpen(false)} />

            <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${V.border}, transparent)`, margin: "8px 0" }} />

            {/* Settings section */}
            <div style={{ fontSize: 10, fontFamily: "var(--font-jetbrains), monospace", color: V.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: 4 }}>Ajustes</div>
            <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 12 }}>
              <ThemeToggle />
              <span style={{ fontSize: 14, fontWeight: 500, color: V.textPrimary }}>Tema</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
