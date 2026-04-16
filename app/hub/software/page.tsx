import { createClient } from "@/lib/supabase/server";
import type { SoftwareWithLatest } from "@/lib/supabase/types";
import SoftwareClient from "./software-client";

export const metadata = { title: "Software" };

export default async function SoftwarePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("software_with_latest")
    .select("*");

  const items = (data as SoftwareWithLatest[]) ?? [];

  return <SoftwareClient items={items} />;
}
