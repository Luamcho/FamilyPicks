// ============================================================================
// FamilyPicks — fetch-odds (oddspapi.io)
//
// oddspapi.io identifica deportes/mercados/casas/equipos por ID numérico.
// Estas acciones hacen el trabajo de resolverlos en el servidor, para no
// tener que mandar tablas enormes (todos los mercados de todos los deportes)
// al cliente solo para sacar los 5-10 que de verdad usa una casa concreta.
//
// Requiere el secret ODDS_API_KEY (Project Settings -> Edge Functions ->
// Secrets). Solo responde si quien llama es admin.
//
// Body JSON, una de:
//   { "action": "raw", "path": "/v4/sports", "query": { "sportId": "1" } }
//   { "action": "find_bookmaker", "query": "hard rock" }
//   { "action": "bookmaker_odds", "bookmaker": "hard-rock-bet", "fixture_id": "id1000..." }
// ============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const ODDS_API_BASE = "https://api.oddspapi.io";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

interface Bookmaker {
  bookmakerName: string;
  slug: string;
  liveOdds: boolean | null;
  cloneOf: string | null;
}

interface MarketDef {
  marketId: number;
  marketName: string;
  marketType: string;
  handicap: number;
  period: string;
  outcomes: { outcomeId: number; outcomeName: string }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin");
    if (adminErr || !isAdmin) {
      return json({ error: "Solo el admin puede consultar cuotas." }, 403);
    }

    const apiKey = Deno.env.get("ODDS_API_KEY");
    if (!apiKey) {
      return json(
        { error: "Falta el secret ODDS_API_KEY. Añádelo en Supabase → Project Settings → Edge Functions → Secrets." },
        500,
      );
    }

    async function upstream(path: string, extra: Record<string, string> = {}) {
      const params = new URLSearchParams({ apiKey, ...extra });
      const r = await fetch(`${ODDS_API_BASE}${path}?${params}`);
      const text = await r.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        /* respuesta no-JSON, se devuelve el texto tal cual */
      }
      return { status: r.status, body };
    }

    const payload = await req.json().catch(() => ({}) as Record<string, unknown>);
    const { action } = payload as { action?: string };

    // ------------------------------------------------------------------
    // raw: passthrough genérico para explorar cualquier endpoint
    // ------------------------------------------------------------------
    if (action === "raw") {
      const { path, query } = payload as { path?: string; query?: Record<string, unknown> };
      if (!path || typeof path !== "string" || !path.startsWith("/")) {
        return json({ error: "path inválido (debe empezar por /, ej. /v4/sports)" }, 400);
      }
      const extra: Record<string, string> = {};
      if (query && typeof query === "object") {
        for (const [k, v] of Object.entries(query)) if (v != null) extra[k] = String(v);
      }
      const { status, body } = await upstream(path, extra);
      return json({ upstream_status: status, path, body });
    }

    // ------------------------------------------------------------------
    // find_bookmaker: busca por nombre/slug sin devolver las ~300+ casas
    // ------------------------------------------------------------------
    if (action === "find_bookmaker") {
      const { query } = payload as { query?: string };
      const { status, body } = await upstream("/v4/bookmakers");
      if (status >= 300) return json({ error: "oddspapi.io devolvió un error", upstream_status: status, body }, 502);
      const all = (body ?? []) as Bookmaker[];
      const needle = (query ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const matches = needle
        ? all.filter((b) => {
            const hay = `${b.bookmakerName}${b.slug}`.toLowerCase().replace(/[^a-z0-9]/g, "");
            return hay.includes(needle);
          })
        : all;
      return json({ count: matches.length, bookmakers: matches.slice(0, 30) });
    }

    // ------------------------------------------------------------------
    // bookmaker_odds: cuotas de UNA casa para UN partido, con nombres de
    // mercado/resultado resueltos — no la tabla completa de /v4/markets.
    // ------------------------------------------------------------------
    if (action === "bookmaker_odds") {
      const { bookmaker, fixture_id } = payload as { bookmaker?: string; fixture_id?: string };
      if (!bookmaker || !fixture_id) {
        return json({ error: "Faltan 'bookmaker' (slug) y/o 'fixture_id'." }, 400);
      }

      const oddsRes = await upstream("/v4/odds", { fixtureId: fixture_id, bookmakers: bookmaker });
      if (oddsRes.status >= 300) {
        return json({ error: "oddspapi.io devolvió un error", upstream_status: oddsRes.status, body: oddsRes.body }, 502);
      }
      const fixture = oddsRes.body as Record<string, unknown>;
      const bookmakerOdds = (fixture.bookmakerOdds ?? {}) as Record<string, { markets?: Record<string, unknown> }>;
      const thisBook = bookmakerOdds[bookmaker];
      const marketsRaw = (thisBook?.markets ?? {}) as Record<
        string,
        { outcomes?: Record<string, { players?: Record<string, { price?: number; priceAmerican?: string }> }> }
      >;
      const marketIds = Object.keys(marketsRaw);

      if (marketIds.length === 0) {
        return json({
          event: `${fixture.participant1Name ?? "?"} vs ${fixture.participant2Name ?? "?"}`,
          tournament: fixture.tournamentName ?? null,
          startTime: fixture.startTime ?? null,
          bookmaker,
          markets: [],
          note: `${bookmaker} no tiene cuotas cargadas para este partido ahora mismo.`,
        });
      }

      // sportId del fixture -> para no traer la tabla de mercados de TODOS los deportes
      const sportId = fixture.sportId;
      const marketsRefRes = await upstream("/v4/markets", sportId != null ? { sportId: String(sportId) } : {});
      const marketDefs = (marketsRefRes.status < 300 ? (marketsRefRes.body as MarketDef[]) : []) ?? [];
      const marketById = new Map(marketDefs.map((m) => [String(m.marketId), m]));

      const markets = marketIds.map((mid) => {
        const def = marketById.get(mid);
        const outcomeNameById = new Map((def?.outcomes ?? []).map((o) => [String(o.outcomeId), o.outcomeName]));
        const outcomesRaw = marketsRaw[mid].outcomes ?? {};
        const outcomes = Object.entries(outcomesRaw).map(([oid, o]) => {
          const firstPlayer = Object.values(o.players ?? {})[0];
          return {
            outcomeId: Number(oid),
            outcomeName: outcomeNameById.get(oid) ?? `#${oid}`,
            price: firstPlayer?.price ?? null,
          };
        });
        return {
          marketId: Number(mid),
          marketName: def?.marketName ?? `Mercado #${mid}`,
          marketType: def?.marketType ?? null,
          handicap: def?.handicap ?? null,
          outcomes,
        };
      });

      return json({
        event: `${fixture.participant1Name ?? "?"} vs ${fixture.participant2Name ?? "?"}`,
        tournament: fixture.tournamentName ?? null,
        startTime: fixture.startTime ?? null,
        bookmaker,
        markets,
      });
    }

    return json({ error: "action debe ser 'raw', 'find_bookmaker' o 'bookmaker_odds'." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
