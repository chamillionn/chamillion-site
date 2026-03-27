import { getOptionalUser } from "@/lib/supabase/auth";
import WidgetsClient from "./widgets-client";

export const dynamic = "force-dynamic";

export default async function WidgetsPage() {
  let isAdmin = false;
  try {
    const ctx = await getOptionalUser();
    isAdmin = ctx?.profile.role === "admin";
  } catch {}
  return <WidgetsClient isAdmin={isAdmin} />;
}
