import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOptionalUser } from "@/lib/supabase/auth";
import {
  KRONOS_ANON_COOKIE,
  KRONOS_ANON_MAX,
  bumpPredictLimit,
  checkPredictLimit,
  cookieHeader,
  decodeCounter,
  effectiveCounter,
  getClientIp,
  resetsAt,
} from "@/lib/kronos-rate-limit";
import { isKronosEnabled } from "@/lib/kronos-status";

const KRONOS_URL =
  "https://chamillionn--kronos-predictor-kronosservice-api.modal.run";

export async function POST(request: Request) {
  const enabled = await isKronosEnabled();
  if (!enabled) {
    return NextResponse.json(
      {
        error: "KRONOS_OFFLINE",
        reason: "kill_switch",
        message: "Kronos está temporalmente offline.",
      },
      { status: 503 },
    );
  }

  // Server-side IP + global cap (applies to all callers)
  const ip = getClientIp(request);
  const limit = checkPredictLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: limit.reason === "global_cap" ? "KRONOS_OFFLINE" : "RATE_LIMITED",
        reason: limit.reason,
        message:
          limit.reason === "global_cap"
            ? "Kronos ha alcanzado el límite de uso de hoy. Vuelve mañana."
            : "Demasiadas solicitudes desde tu red. Vuelve a intentarlo más tarde.",
        resetsAt: limit.resetsAt,
      },
      { status: limit.reason === "global_cap" ? 503 : 429 },
    );
  }

  const body = await request.json();
  const ctx = await getOptionalUser();
  const isMember =
    !!ctx && (ctx.profile.role === "member" || ctx.profile.role === "admin");

  // Anonymous gating: only mini model, cookie-based daily quota
  let counter = null;
  if (!isMember) {
    if (body?.model_size && body.model_size !== "mini") {
      return NextResponse.json(
        {
          error: "MODEL_LOCKED",
          message: "Modelo disponible solo para miembros.",
        },
        { status: 403 },
      );
    }
    body.model_size = "mini";

    const cookieStore = await cookies();
    const raw = cookieStore.get(KRONOS_ANON_COOKIE)?.value;
    counter = effectiveCounter(decodeCounter(raw));
    if (counter.count >= KRONOS_ANON_MAX) {
      return NextResponse.json(
        {
          error: "RATE_LIMITED",
          reason: "anon_daily",
          message: "Has usado tus 3 predicciones de hoy.",
          resetsAt: resetsAt(counter),
        },
        { status: 429 },
      );
    }
  }

  // Forward to Modal
  let modalRes: Response;
  try {
    modalRes = await fetch(KRONOS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e) {
    console.error("[kronos] Modal unreachable:", e);
    return NextResponse.json(
      {
        error: "KRONOS_OFFLINE",
        reason: "modal_unreachable",
        message:
          "Kronos no responde. Vuelve a intentarlo en unos momentos.",
      },
      { status: 503 },
    );
  }

  if (!modalRes.ok) {
    const text = await modalRes.text().catch(() => "");
    const offline =
      modalRes.status === 402 ||
      modalRes.status === 503 ||
      modalRes.status === 504;
    console.error(
      `[kronos] Modal ${modalRes.status}: ${text.slice(0, 200)}`,
    );
    return NextResponse.json(
      {
        error: offline ? "KRONOS_OFFLINE" : "KRONOS_ERROR",
        reason: offline ? "modal_error" : undefined,
        message: offline
          ? "Kronos está temporalmente offline. Vuelve a intentarlo luego."
          : `Kronos: HTTP ${modalRes.status}`,
      },
      { status: offline ? 503 : 502 },
    );
  }

  const data = await modalRes.json();
  const response = NextResponse.json(data);

  // Only bump counters on success
  bumpPredictLimit(ip);

  if (!isMember && counter) {
    const next = { count: counter.count + 1, windowStart: counter.windowStart };
    response.headers.append("Set-Cookie", cookieHeader(next));
  }

  return response;
}
