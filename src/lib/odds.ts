import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "./supabase";

export interface RawOddsResponse {
  upstream_status: number;
  path: string;
  body: unknown;
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

/**
 * Modo diagnóstico: llama a cualquier endpoint GET de oddspapi.io con la key
 * puesta por el servidor, y devuelve la respuesta cruda. Úsalo para ver el
 * esquema real (sports/bookmakers/markets/participants/odds) antes de que
 * construyamos el mapeo final a nombres legibles.
 */
export async function rawOdds(path: string, query?: Record<string, string>): Promise<RawOddsResponse> {
  return invoke<RawOddsResponse>({ action: "raw", path, query });
}

export interface BookmakerMatch {
  bookmakerName: string;
  slug: string;
  liveOdds: boolean | null;
  cloneOf: string | null;
}

/** Busca una casa por nombre/slug sin traer las ~300+ casas de golpe. */
export async function findBookmaker(query: string): Promise<{ count: number; bookmakers: BookmakerMatch[] }> {
  return invoke({ action: "find_bookmaker", query });
}

export interface BookmakerMarketOutcome {
  outcomeId: number;
  outcomeName: string;
  price: number | null;
}
export interface BookmakerMarket {
  marketId: number;
  marketName: string;
  marketType: string | null;
  handicap: number | null;
  outcomes: BookmakerMarketOutcome[];
}
export interface BookmakerOddsResult {
  event: string;
  tournament: string | null;
  startTime: string | null;
  bookmaker: string;
  markets: BookmakerMarket[];
  note?: string;
}

/** Cuotas de una casa concreta para un partido, con nombres de mercado/resultado ya resueltos. */
export async function getBookmakerOdds(bookmaker: string, fixtureId: string): Promise<BookmakerOddsResult> {
  return invoke({ action: "bookmaker_odds", bookmaker, fixture_id: fixtureId });
}
