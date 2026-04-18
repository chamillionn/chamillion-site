import { getOptionalUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import KronosClient from "@/app/hub/herramientas/kronos/kronos-client";
import styles from "./public-header.module.css";

export const metadata = {
  title: "Kronos — Predicciones de velas",
  description:
    "Transformer entrenado en series OHLCV. Prueba el modelo sobre cualquier par de Binance. 3 predicciones gratis por día.",
  openGraph: {
    title: "Kronos — Predicciones de velas",
    description:
      "Transformer entrenado en series OHLCV. Prueba 3 predicciones gratis sobre cualquier par.",
    images: ["/assets/newsletter/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronos — Predicciones de velas",
    description:
      "Transformer entrenado en series OHLCV. Prueba 3 predicciones gratis sobre cualquier par.",
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
