"use client";

import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import UserMenu from "@/components/user-menu";
import PremiumBadge from "@/components/premium-badge";
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
          <PremiumBadge className={styles.extendedBadge} />
        </Link>
        <nav className={styles.headerNav}>
          <Link href="/">Inicio</Link>
          <Link href="/newsletter">Archivo</Link>
          <UserMenu />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
