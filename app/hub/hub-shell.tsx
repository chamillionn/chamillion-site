"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import UserMenu from "@/components/user-menu";
import styles from "./hub-shell.module.css";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/hub", label: "Panel" },
  { href: "/hub/cartera", label: "Cartera" },
  { href: "/hub/mi-cartera", label: "Mi Cartera" },
  { href: "/hub/analisis", label: "Análisis" },
  { href: "/hub/herramientas", label: "Herramientas" },
  { href: "/hub/software", label: "Software" },
  { href: "/hub/consultorias", label: "Consultorías" },
];

export default function HubShell({
  userRole,
  children,
}: {
  userRole: "member" | "admin";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className={styles.shell}>
      {/* ── Top bar ── */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          {/* Left: brand */}
          <Link className={styles.brand} href="/">
            <div className={styles.brandIcon}>
              <Image
                src="/assets/newsletter/logo.jpg"
                alt="Chamillion"
                width={20}
                height={20}
                sizes="20px"
              />
            </div>
            <span className={styles.brandName}>Hub</span>
          </Link>

          {/* Center: nav */}
          <nav
            aria-label="Hub"
            className={`${styles.nav} ${mobileOpen ? styles.navOpen : ""}`}
          >
            {NAV.map((item) => {
              const isActive =
                item.href === "/hub"
                  ? pathname === "/hub"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: actions */}
          <div className={styles.actions}>
            {userRole === "admin" && (
              <Link href="/admin" className={styles.adminBadge}>
                Admin
              </Link>
            )}
            <ThemeToggle />
            <UserMenu />
            <button
              className={styles.mobileToggle}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {mobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Content ── */}
      <main className={styles.main}>
        <div className={styles.mainInner}>{children}</div>
      </main>
    </div>
  );
}
