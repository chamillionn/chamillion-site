import { NextResponse } from "next/server";
import { authCheck } from "@/lib/sync/types";
import { createAnalysesClient } from "@/lib/supabase/analyses-client";
import { ANALYSIS_REGISTRY, type RegistryTracker } from "@/app/analisis/registry";
import { polymarketResolver } from "@/lib/trackers/polymarket";
import type { TickResult } from "@/lib/trackers/types";
import type {
  Analysis,
  AnalysisOutcome,
  TrackerUnderlying,
} from "@/lib/supabase/types";

interface PerAnalysisResult {
  slug: string;
  snapshot: "inserted" | "updated" | "error" | "skipped";
  events: { inserted: number; deduped: number };
  resolved: boolean;
  outcome?: AnalysisOutcome | null;
  error?: string;
  warnings?: string[];
}

export async function GET(request: Request) {
  if (!(await authCheck(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const db = createAnalysesClient();
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const results: PerAnalysisResult[] = [];

  for (const entry of ANALYSIS_REGISTRY) {
    if (!entry.tracker) continue;

    const { data: row } = await db
      .from("analyses")
      .select("*")
      .eq("slug", entry.slug)
      .maybeSingle();

    if (!row) {
      results.push({
        slug: entry.slug,
        snapshot: "error",
        events: { inserted: 0, deduped: 0 },
        resolved: false,
        error: "Analysis row not found — run registry reconcile first",
      });
      continue;
    }

    const analysis = row as Analysis;
    if (analysis.resolved_at) {
      results.push({
        slug: entry.slug,
        snapshot: "skipped",
        events: { inserted: 0, deduped: 0 },
        resolved: true,
        outcome: analysis.final_outcome,
      });
      continue;
    }

    try {
      const tick = await runResolver(entry.tracker, analysis, db);

      // Merge underlying from analysis_observations (latest) if the resolver
      // didn't produce one. This is the case for Polymarket+manual-underlying
      // setups like Seoul.
      let underlying = tick.underlying;
      if (!underlying) {
        const { data: latestObs } = await db
          .from("analysis_observations")
          .select("observed_at, value, source, note")
          .eq("analysis_id", analysis.id)
          .order("observed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestObs) {
          underlying = {
            value: Number(latestObs.value),
            unit: analysis.prediction_unit ?? "",
            source: latestObs.source ?? "manual",
            asOf: latestObs.observed_at,
          } satisfies TrackerUnderlying;
        }
      }

      // Upsert snapshot
      let snapshotStatus: PerAnalysisResult["snapshot"] = "skipped";
      if (!dryRun) {
        const { error: upErr } = await db.from("analysis_snapshots").upsert(
          {
            analysis_id: analysis.id,
            snapshot_date: todayIso,
            underlying,
            position: tick.position,
            edge: tick.edge,
          },
          { onConflict: "analysis_id,snapshot_date" },
        );
        if (upErr) throw upErr;
        snapshotStatus = "inserted"; // we don't distinguish upsert kinds here
      }

      // Insert events (dedup by dedup_key via unique constraint)
      let eventsInserted = 0;
      let eventsDeduped = 0;
      if (!dryRun && tick.events.length > 0) {
        for (const ev of tick.events) {
          const { error: evErr } = await db.from("analysis_events").insert({
            analysis_id: analysis.id,
            occurred_at: ev.occurred_at,
            type: ev.type,
            payload: ev.payload ?? null,
            source: ev.source ?? null,
            dedup_key: ev.dedup_key ?? null,
          });
          if (evErr) {
            if (evErr.code === "23505") eventsDeduped++;
            else throw evErr;
          } else {
            eventsInserted++;
          }
        }
      }

      // Auto-resolution: if today has passed the end date and we have a
      // final underlying value, mark resolved.
      let resolved = false;
      let outcome: AnalysisOutcome | null = null;
      if (
        analysis.prediction_end_date &&
        todayIso > analysis.prediction_end_date &&
        underlying?.value != null &&
        analysis.prediction_target_value != null
      ) {
        outcome = deriveOutcome(analysis, underlying.value);
        const roi = tick.position?.totalCashPnl != null && tick.position.totalNotional > 0
          ? (tick.position.totalCashPnl / tick.position.totalNotional) * 100
          : null;

        if (!dryRun) {
          const { error: resolveErr } = await db
            .from("analyses")
            .update({
              resolved_at: new Date().toISOString(),
              final_outcome: outcome,
              final_roi_pct: roi,
            })
            .eq("id", analysis.id);
          if (resolveErr) throw resolveErr;

          await db.from("analysis_events").insert({
            analysis_id: analysis.id,
            occurred_at: new Date().toISOString(),
            type: "resolution",
            payload: { outcome, roi, finalValue: underlying.value },
            source: "cron",
            dedup_key: `resolution:${analysis.id}`,
          });
        }
        resolved = true;
      }

      results.push({
        slug: entry.slug,
        snapshot: snapshotStatus,
        events: { inserted: eventsInserted, deduped: eventsDeduped },
        resolved,
        outcome,
        warnings: tick.warnings,
      });
    } catch (e) {
      results.push({
        slug: entry.slug,
        snapshot: "error",
        events: { inserted: 0, deduped: 0 },
        resolved: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    dryRun,
    processed: results.length,
    results,
  });
}

async function runResolver(
  tracker: RegistryTracker,
  analysis: Analysis,
  db: ReturnType<typeof createAnalysesClient>,
): Promise<TickResult> {
  switch (tracker.kind) {
    case "polymarket":
      return polymarketResolver(analysis, tracker, { db });
    default: {
      const _exhaustive: never = tracker.kind;
      throw new Error(`Unknown tracker kind: ${_exhaustive as string}`);
    }
  }
}

function deriveOutcome(
  analysis: Analysis,
  finalValue: number,
): AnalysisOutcome {
  const target = analysis.prediction_target_value;
  if (target == null) return "neutral";
  const direction = analysis.prediction_direction;
  if (direction === "bullish") {
    return finalValue >= target ? "cumplida" : "fallida";
  }
  if (direction === "bearish") {
    return finalValue < target ? "cumplida" : "fallida";
  }
  return "neutral";
}
