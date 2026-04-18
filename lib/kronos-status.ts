import { createServiceClient } from "@/lib/supabase/server";

export async function isKronosEnabled(): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "kronos_enabled")
      .maybeSingle();
    if (data?.value === false) return false;
    return true;
  } catch {
    return true;
  }
}
