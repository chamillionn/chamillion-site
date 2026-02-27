"use client";

import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import styles from "./layout.module.css";

export default function Header() {
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
          <span className={styles.extendedBadge}>Premium</span>
        </Link>
        <nav className={styles.headerNav}>
          <Link href="/">Inicio</Link>
          <Link href="/newsletter">Archivo</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
