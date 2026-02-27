import { requireUser } from "@/lib/supabase/auth";
import PaywallCTA from "./paywall-cta";

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
      <PaywallCTA isLoggedIn={!!ctx} />
    </>
  );
}
