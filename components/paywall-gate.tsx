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
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>
      </div>
      <PaywallCTA isLoggedIn={!!ctx} />
    </>
  );
}
