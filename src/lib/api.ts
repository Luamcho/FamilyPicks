import { supabase, isSupabaseConfigured } from "./supabase";
import * as mock from "./mock";
import {
  addLocalPick,
  deleteLocalPick,
  demoPicks,
  settleLocalPick,
  type NewPickInput,
} from "./store";
import type {
  BankrollPoint,
  Pick,
  PickStatus,
  SportStat,
  StatsOverview,
} from "./types";

export const DEMO_MODE = !isSupabaseConfigured;
export type { NewPickInput };

const PICK_COLS =
  "id, competition, event, market, market_category, selection, odds, closing_odds, " +
  "stake, confidence, event_start_at, published_at, status, result_units, settled_at, source, " +
  "sports(slug, name)";

function mapRows(data: unknown): Pick[] {
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => {
    const sport = r.sports as { slug?: string; name?: string } | null;
    return {
      ...(r as unknown as Pick),
      sport_slug: sport?.slug ?? "otros",
      sport_name: sport?.name ?? "Otros",
    };
  });
}

/** Todos tus picks. Es una app privada: solo tú (admin) puedes verlos, la RLS
 *  ya lo garantiza en el servidor. */
export async function getPicks(): Promise<Pick[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("picks")
      .select(PICK_COLS)
      .order("published_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return mapRows(data);
  }
  return demoPicks();
}

/** Alias usado por el panel de admin: misma fuente, sin filtros. */
export const getAllPicks = getPicks;

const sportIdCache = new Map<string, number>();
async function sportIdBySlug(slug: string): Promise<number> {
  if (sportIdCache.has(slug)) return sportIdCache.get(slug)!;
  if (!supabase) return 1;
  const { data, error } = await supabase
    .from("sports")
    .select("id")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  const id = (data as { id: number }).id;
  sportIdCache.set(slug, id);
  return id;
}

export async function createPick(input: NewPickInput): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const sport_id = await sportIdBySlug(input.sport_slug);
    const { error } = await supabase.from("picks").insert({
      sport_id,
      competition: input.competition,
      event: input.event,
      market: input.market,
      market_category: input.market_category,
      selection: input.selection,
      odds: input.odds,
      stake: input.stake,
      confidence: input.confidence,
      event_start_at: input.event_start_at,
      source: input.source,
      analysis: input.analysis ?? null,
    });
    if (error) throw error;
    return;
  }
  addLocalPick(input);
}

export async function settlePick(
  id: string,
  status: PickStatus,
  closingOdds: number | null,
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc("settle_pick", {
      p_pick_id: id,
      p_status: status,
      p_closing_odds: closingOdds,
    });
    if (error) throw error;
    return;
  }
  settleLocalPick(id, status, closingOdds);
}

export async function removePick(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("picks").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  deleteLocalPick(id);
}

export async function getStatsOverview(): Promise<StatsOverview> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc("stats_overview").single();
    if (error) throw error;
    return data as unknown as StatsOverview;
  }
  return mock.MOCK_STATS_OVERVIEW;
}

export async function getStatsBySport(): Promise<SportStat[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc("stats_by_sport");
    if (error) throw error;
    return (data ?? []) as unknown as SportStat[];
  }
  return mock.MOCK_BY_SPORT;
}

export async function getBankroll(
  bucket: "day" | "week" | "month" = "month",
): Promise<BankrollPoint[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc("stats_bankroll", { p_bucket: bucket });
    if (error) throw error;
    return (data ?? []) as unknown as BankrollPoint[];
  }
  return mock.MOCK_BANKROLL;
}

export async function getSettledHistory(): Promise<Pick[]> {
  const picks = await getPicks();
  return picks
    .filter((p) => p.status !== "pending")
    .sort(
      (a, b) =>
        new Date(b.settled_at ?? b.published_at).getTime() -
        new Date(a.settled_at ?? a.published_at).getTime(),
    );
}
