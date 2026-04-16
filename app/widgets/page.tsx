import { getOptionalUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import WidgetsClient from "./widgets-client";

async function getPremiumSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "premium_widgets")
    .single();

  if (Array.isArray(data?.value)) return data.value as string[];
  return [];
}

export default async function WidgetsPage() {
  const [premiumSlugs, ctx] = await Promise.all([
    getPremiumSlugs(),
    getOptionalUser(),
  ]);

  const userRole = ctx?.profile.role ?? null;

  return (
    <WidgetsClient
      premiumSlugs={premiumSlugs}
      userRole={userRole}
    />
  );
}
