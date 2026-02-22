import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import ThemeToggle from "@/components/theme-toggle";
import styles from "./layout.module.css";

export default function NewsletterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){var t;try{t=localStorage.getItem('chamillion-theme')}catch(e){}if(!t)t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)})()`,
        }}
      />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.headerLogo} href="/">
            <Image src="/assets/newsletter/logo.jpg" alt="Chamillion" width={36} height={36} />
            <span>Chamillion</span>
          </Link>
          <div className={styles.headerRight}>
            <nav className={styles.headerNav}>
              <Link href="/">Inicio</Link>
              <Link href="/newsletter">Archivo</Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
