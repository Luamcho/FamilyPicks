import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "./supabase";

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

// Llamamos por fetch directo (no supabase.functions.invoke): el SDK a veces
// consume el cuerpo de la respuesta de error antes de que podamos leerlo y
// solo deja "Edge Function returned a non-2xx status code" — con fetch
// controlamos nosotros el parseo y siempre recuperamos el { error } real.
async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured || !supabase || !supabaseUrl || !supabaseAnonKey) {
    throw new Error("Conecta Supabase para consultar cuotas reales (no disponible en modo demo).");
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Tu sesión ha caducado. Vuelve a entrar.");
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/fetch-odds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* respuesta sin cuerpo JSON */
  }

  if (!res.ok) {
    const msg =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Error ${res.status} al consultar cuotas`;
    throw new Error(msg);
  }
  return payload as T;
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
