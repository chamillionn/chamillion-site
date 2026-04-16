import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { ConsultationType, Consultation } from "@/lib/supabase/types";
import ConsultoriasClient from "./consultorias-client";

export const metadata = { title: "Consultorías" };

export default async function ConsultoriasPage() {
  const [supabase, ctx] = await Promise.all([
    createClient(),
    requireUser(),
  ]);

  const [{ data: types }, { data: bookings }] = await Promise.all([
    supabase
      .from("consultation_types")
      .select("*")
      .eq("is_active", true)
      .order("price_eur", { ascending: true }),
    ctx
      ? supabase
          .from("consultations")
          .select("*")
          .eq("user_id", ctx.user.id)
          .order("scheduled_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <ConsultoriasClient
      types={(types as ConsultationType[]) ?? []}
      bookings={(bookings as Consultation[]) ?? []}
    />
  );
}
