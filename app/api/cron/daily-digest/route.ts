import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import type { TradeEnriched } from "@/lib/supabase/types";

/**
 * Daily digest cron — sends yesterday's trades summary to opted-in users.
 * Protected by CRON_SECRET bearer token (same pattern as sync routes).
 * Intended to run daily via Vercel Cron.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET ?? process.env.SYNC_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Get users who opted in to daily digest
  const { data: prefs } = await supabase
    .from("email_preferences")
    .select("user_id, digest_hour")
    .eq("daily_digest", true);

  const subscribers = (prefs ?? []) as { user_id: string; digest_hour: number }[];

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0, message: "No subscribers" });
  }

  // 2. Get yesterday's trades
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dayStart = yesterday.toISOString().slice(0, 10) + "T00:00:00Z";
  const dayEnd = yesterday.toISOString().slice(0, 10) + "T23:59:59Z";

  const { data: tradesData } = await supabase
    .from("trades_enriched")
    .select("*")
    .gte("executed_at", dayStart)
    .lte("executed_at", dayEnd)
    .order("executed_at", { ascending: false });

  const trades = (tradesData as TradeEnriched[]) ?? [];

  if (trades.length === 0) {
    return NextResponse.json({ sent: 0, message: "No trades yesterday" });
  }

  // 3. Build email HTML
  const dateStr = yesterday.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const tradeRows = trades
    .map((t) => {
      const side = t.side.includes("buy") || t.side.includes("long")
        ? `<span style="color:#5BAA7C">${sideLabel(t.side)}</span>`
        : `<span style="color:#C7555A">${sideLabel(t.side)}</span>`;
      const total = t.total_value_eur
        ? `${t.total_value_eur.toFixed(0)}€`
        : `$${t.total_value.toFixed(0)}`;
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #1E2229;color:#8B9099;font-size:12px">${new Date(t.executed_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1E2229;color:#E8EAED;font-size:12px">${t.asset}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1E2229;font-size:12px">${side}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1E2229;color:#E8EAED;font-size:12px;text-align:right">${total}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #1E2229;color:#8B9099;font-size:12px">${t.platform_name ?? ""}</td>
      </tr>`;
    })
    .join("");

  const html = `
    <div style="background:#0C0E11;color:#E8EAED;font-family:-apple-system,sans-serif;padding:32px;max-width:640px;margin:0 auto">
      <div style="margin-bottom:24px">
        <span style="font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6B8EA0">Chamillion Hub</span>
      </div>
      <h1 style="font-size:20px;font-weight:700;margin:0 0 4px;color:#E8EAED">Resumen del ${dateStr}</h1>
      <p style="font-size:14px;color:#8B9099;margin:0 0 24px">${trades.length} operacion${trades.length === 1 ? "" : "es"} registrada${trades.length === 1 ? "" : "s"}.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #1E2229">
        <thead>
          <tr style="background:#15181E">
            <th style="padding:8px 10px;text-align:left;font-size:10px;letter-spacing:0.04em;text-transform:uppercase;color:#7A7F89">Hora</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;letter-spacing:0.04em;text-transform:uppercase;color:#7A7F89">Activo</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;letter-spacing:0.04em;text-transform:uppercase;color:#7A7F89">Lado</th>
            <th style="padding:8px 10px;text-align:right;font-size:10px;letter-spacing:0.04em;text-transform:uppercase;color:#7A7F89">Total</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;letter-spacing:0.04em;text-transform:uppercase;color:#7A7F89">Plataforma</th>
          </tr>
        </thead>
        <tbody>${tradeRows}</tbody>
      </table>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1E2229">
        <a href="https://chamillion.site/hub/cartera" style="color:#6B8EA0;font-size:13px;text-decoration:none">Ver cartera completa →</a>
      </div>
      <p style="font-size:11px;color:#7A7F89;margin-top:32px">Recibes este email porque activaste el digest diario en chamillion.site/hub</p>
    </div>
  `;

  // 4. Send to each subscriber
  let sent = 0;
  const errors: string[] = [];

  for (const sub of subscribers) {
    // Get user email from profiles
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", sub.user_id)
      .single();

    if (profileErr || !profile?.email) {
      errors.push(`No email for user ${sub.user_id}: ${profileErr?.message ?? "missing"}`);
      continue;
    }

    try {
      await sendEmail({
        to: profile.email,
        subject: `Chamillion — ${trades.length} operacion${trades.length === 1 ? "" : "es"} del ${dateStr}`,
        html,
      });
      sent++;
    } catch (e) {
      errors.push(`${profile.email}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ sent, total: subscribers.length, trades: trades.length, errors });
}

function sideLabel(side: string): string {
  const map: Record<string, string> = {
    buy: "Compra",
    sell: "Venta",
    open_long: "Long",
    open_short: "Short",
    close_long: "Cerrar Long",
    close_short: "Cerrar Short",
  };
  return map[side] ?? side;
}
