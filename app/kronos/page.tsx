import { getOptionalUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import KronosClient from "@/app/hub/herramientas/kronos/kronos-client";
import styles from "./public-header.module.css";

const TITLE = "Kronos — Modelo fundacional en OHLCV";
const DESCRIPTION =
  "Predice las próximas 24 velas sobre BTC, ETH, oro, S&P 500, EUR/USD y más. 3 predicciones gratis por día.";
const PAGE_URL = "https://chamillion.site/kronos";
const IMAGE = "https://chamillion.site/kronos/og-image.png";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL("https://chamillion.site"),
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: "Chamillion",
    title: TITLE,
    description: DESCRIPTION,
    locale: "es_ES",
    images: [
      {
        url: IMAGE,
        width: 1200,
        height: 675,
        alt: "Kronos — demo de predicción de velas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE],
  },
};

export default async function KronosPublicPage() {
  const ctx = await getOptionalUser();
  if (ctx && (ctx.profile.role === "member" || ctx.profile.role === "admin")) {
    redirect("/hub/herramientas/kronos");
  }
  return (
    <main className={styles.main}>
      <div className={styles.mainInner}>
        <KronosClient mode="anon" />
      </div>
    </main>
  );
}
