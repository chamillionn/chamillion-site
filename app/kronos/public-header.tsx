import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import styles from "./public-header.module.css";

export default function PublicKronosHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/hub" aria-label="Chamillion Hub">
          <span className={styles.brandIcon}>
            <Image
              src="/assets/newsletter/logo.jpg"
              alt=""
              width={20}
              height={20}
              sizes="20px"
            />
          </span>
          <span className={styles.brandName}>HUB</span>
        </Link>
        <div className={styles.actions}>
          <Link href="/suscribirse" className={styles.signupLink}>
            Registrarse
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
