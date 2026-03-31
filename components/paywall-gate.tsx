import { requireUser } from "@/lib/supabase/auth";
import PaywallCTA from "./paywall-cta";
import styles from "./paywall-cta.module.css";

interface Props {
  children: React.ReactNode;
  teaser: React.ReactNode;
  isPremium: boolean;
}

/**
 * Server Component that gates premium content.
 * Shows full content for members/admins, teaser + CTA otherwise.
 * Premium content HTML is never sent to unauthorized clients.
 */
export default async function PaywallGate({
  children,
  teaser,
  isPremium,
}: Props) {
  if (!isPremium) return <>{children}</>;

  const ctx = await requireUser();
  const hasAccess =
    ctx && (ctx.profile.role === "member" || ctx.profile.role === "admin");

  if (hasAccess) return <>{children}</>;

  return (
    <>
      {teaser}
      <div className={styles.blurredPreview} aria-hidden="true">
        <p>El siguiente paso es saber dónde y cómo desplegar el capital. Hay múltiples opciones, cada una con sus ventajas y riesgos. En esta sección desgloso las herramientas, plataformas y estrategias que estoy usando con mi propia cartera.</p>
        <p>Incluye análisis detallados, capturas de pantalla de cada operación, y las métricas clave que monitorizo para tomar decisiones informadas. Todo con datos reales y verificables.</p>
      </div>
      <PaywallCTA isLoggedIn={!!ctx} />
    </>
  );
}
