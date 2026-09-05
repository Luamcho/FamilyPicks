import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "./supabase";
import type { MarketCategory } from "./types";

export interface PickCandidate {
  id: string;
  batch_id: string;
  sport_slug: string;
  sport_name: string;
  competition: string;
  event: string;
  market: string;
  market_category: MarketCategory;
  selection: string;
  odds: number;
  bookmaker: string;
  stake: number;
  confidence: number | null;
  event_start_at: string;
  analysis: string | null;
  status: "pending" | "approved" | "dismissed";
  created_at: string;
}

const CANDIDATE_COLS =
  "id, batch_id, competition, event, market, market_category, selection, odds, bookmaker, " +
  "stake, confidence, event_start_at, analysis, status, created_at, sports(slug, name)";

function mapRows(data: unknown): PickCandidate[] {
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  return rows.map((r) => {
    const sport = r.sports as { slug?: string; name?: string } | null;
    return {
      ...(r as unknown as PickCandidate),
      sport_slug: sport?.slug ?? "otros",
      sport_name: sport?.name ?? "Otros",
    };
  });
}

/** Candidatos pendientes de aprobar, más recientes primero. */
export async function getPendingCandidates(): Promise<PickCandidate[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pick_candidates")
    .select(CANDIDATE_COLS)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return mapRows(data);
}

/** Copia el candidato a `picks` (source='ai') y lo marca aprobado. */
export async function approveCandidate(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc("approve_pick_candidate", { p_id: id });
  if (error) throw error;
}

export async function dismissCandidate(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc("dismiss_pick_candidate", { p_id: id });
  if (error) throw error;
}

export interface GeneratePicksResult {
  batch_id: string | null;
  candidates_count: number;
  note?: string;
}

/** Dispara la automatización ahora mismo (misma lógica que corre el cron diario). */
export async function generatePicksNow(): Promise<GeneratePicksResult> {
  if (!isSupabaseConfigured || !supabase || !supabaseUrl || !supabaseAnonKey) {
    throw new Error("Conecta Supabase para generar picks (no disponible en modo demo).");
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Tu sesión ha caducado. Vuelve a entrar.");

  const res = await fetch(`${supabaseUrl}/functions/v1/generate-picks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseAnonKey,
    },
    body: "{}",
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* sin cuerpo JSON */
  }

  if (!res.ok) {
    const msg =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Error ${res.status} al generar picks`;
    throw new Error(msg);
  }
  return payload as GeneratePicksResult;
}
