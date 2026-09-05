import { supabase, isSupabaseConfigured } from "./supabase";

export interface OddsSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface OddsOutcome {
  name: string;
  price: number;
}
export interface OddsMarket {
  key: string;
  last_update: string;
  outcomes: OddsOutcome[];
}
export interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}
export interface OddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export interface OddsQuota {
  remaining: string | null;
  used: string | null;
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Conecta Supabase para consultar cuotas reales (no disponible en modo demo).");
  }
  const { data, error } = await supabase.functions.invoke("fetch-odds", { body });
  if (error) {
    // supabase-js no siempre expone el JSON de error de la función; intentamos leerlo.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const parsed = await ctx.json();
        if (parsed?.error) throw new Error(parsed.error);
      } catch {
        /* usa el mensaje genérico de abajo */
      }
    }
    throw new Error(error.message ?? "No se pudo consultar la función de cuotas");
  }
  if (data && typeof data === "object" && "error" in data) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

export async function listOddsSports(): Promise<OddsSport[]> {
  return invoke<OddsSport[]>({ action: "list_sports" });
}

export async function getOdds(sportKey: string): Promise<{ quota: OddsQuota; games: OddsGame[] }> {
  return invoke<{ quota: OddsQuota; games: OddsGame[] }>({ action: "odds", sport_key: sportKey });
}

/** Mejor precio disponible para cada resultado (comparando todas las casas). */
export function bestPrices(game: OddsGame): Record<string, { price: number; bookmaker: string }> {
  const best: Record<string, { price: number; bookmaker: string }> = {};
  for (const bk of game.bookmakers) {
    const h2h = bk.markets.find((m) => m.key === "h2h");
    if (!h2h) continue;
    for (const o of h2h.outcomes) {
      if (!best[o.name] || o.price > best[o.name].price) {
        best[o.name] = { price: o.price, bookmaker: bk.title };
      }
    }
  }
  return best;
}

/** Mapea el "group" de The Odds API a uno de nuestros slugs de deporte. */
export function guessSportSlug(group: string): string {
  const g = group.toLowerCase();
  if (g.includes("soccer")) return "futbol";
  if (g.includes("basketball")) return "baloncesto";
  if (g.includes("tennis")) return "tenis";
  if (g.includes("american football")) return "futbol-americano";
  return "otros";
}
