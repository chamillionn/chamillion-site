import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOptionalUser } from "@/lib/supabase/auth";
import {
  KRONOS_ANON_COOKIE,
  KRONOS_ANON_MAX,
  decodeCounter,
  effectiveCounter,
  globalStatus,
  remaining,
  resetsAt,
} from "@/lib/kronos-rate-limit";
import { isKronosEnabled } from "@/lib/kronos-status";

export async function GET() {
  const killSwitch = await isKronosEnabled();
  const gStatus = globalStatus();
  const enabled = killSwitch && !gStatus.tripped;

  const reason = !killSwitch
    ? "kill_switch"
    : gStatus.tripped
      ? "global_cap"
      : null;
  const globalResetsAt = gStatus.tripped ? gStatus.resetsAt : null;

  const ctx = await getOptionalUser();

  if (ctx && (ctx.profile.role === "member" || ctx.profile.role === "admin")) {
    return NextResponse.json({
      enabled,
      reason,
      globalResetsAt,
      remaining: null,
      resetsAt: null,
      max: null,
      mode: "member",
    });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(KRONOS_ANON_COOKIE)?.value;
  const counter = effectiveCounter(decodeCounter(raw));

  return NextResponse.json({
    enabled,
    reason,
    globalResetsAt,
    remaining: remaining(counter),
    resetsAt: resetsAt(counter),
    max: KRONOS_ANON_MAX,
    mode: "anon",
  });
}
