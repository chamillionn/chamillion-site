"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import type { DbTarget } from "@/lib/supabase/admin-db";

export async function switchAdminDb(target: DbTarget) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Unauthorized" };

  const store = await cookies();
  store.set("admin-db-target", target, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/v");
  return { success: true };
}
