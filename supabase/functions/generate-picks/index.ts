// ============================================================================
// FamilyPicks — generate-picks
//
// Automatización diaria: para cada deporte, saca hasta 10 partidos de las
// ligas/torneos principales que juegan hoy (oddspapi.io, con hasOdds=true),
// se queda solo con los que Hard Rock Bet cotiza, le pide a Claude que elija
// los mejores picks del día y guarda las propuestas en `pick_candidates`
// (NO en `picks` — el dueño las aprueba a mano desde /admin/candidatos).
//
// Se puede llamar de dos formas:
//   1) Manual: un admin logueado, desde el botón "Generar ahora" del panel.
//   2) Cron: un job diario de pg_cron/pg_net que llama con el service_role
//      key como Bearer (ver migración 20260904160000_daily_picks_cron.sql).
//
// Requiere los secrets ODDS_API_KEY y ANTHROPIC_API_KEY (Project Settings ->
// Edge Functions -> Secrets). El dueño los da de alta, esta función nunca
// los expone.
// ============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const ODDS_API_BASE = "https://api.oddspapi.io";
const BOOKMAKER = "hardrockbet";
const MAX_PER_SPORT = 10;
const MAX_MARKETS_PER_FIXTURE = 6;

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

// sportId de oddspapi.io -> slug de nuestra tabla sports, + nombres de torneo
// "principales" (coincidencia por substring, sin distinguir mayúsculas) para
// filtrar de entre todos los partidos con cuotas del día. Si ninguno matchea
// para un deporte, se usan los primeros MAX_PER_SPORT por hora de inicio.
const SPORTS: { oddsSportId: number; sportSlug: string; majorTournaments: string[] }[] = [
  {
    oddsSportId: 10,
    sportSlug: "futbol",
    majorTournaments: [
      "la liga", "premier league", "champions league", "europa league",
      "serie a", "bundesliga", "ligue 1", "liga mx", "mls",
      "eredivisie", "primeira liga", "libertadores", "sudamericana",
    ],
  },
  { oddsSportId: 11, sportSlug: "baloncesto", majorTournaments: ["nba", "euroleague", "acb"] },
  { oddsSportId: 12, sportSlug: "tenis", majorTournaments: [] },
  { oddsSportId: 14, sportSlug: "futbol-americano", majorTournaments: ["nfl", "ncaa"] },
];

interface MarketDef {
  marketId: number;
  marketName: string;
  marketType: string;
  handicap: number;
  outcomes: { outcomeId: number; outcomeName: string }[];
}

interface FixtureLite {
  sportSlug: string;
  sportOddsId: number;
  tournament: string;
  event: string;
  fixtureId: string;
  startTime: string;
}

interface FixtureOdds extends FixtureLite {
  markets: { marketName: string; marketType: string | null; outcomes: { name: string; price: number }[] }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const isCron = bearer === serviceRoleKey;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      isCron ? serviceRoleKey : Deno.env.get("SUPABASE_ANON_KEY")!,
      isCron ? undefined : { global: { headers: { Authorization: authHeader } } },
    );

    if (!isCron) {
      const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin");
      if (adminErr || !isAdmin) {
        return json({ error: "Solo el admin puede generar picks." }, 403);
      }
    }

    const oddsApiKey = Deno.env.get("ODDS_API_KEY");
    if (!oddsApiKey) {
      return json({ error: "Falta el secret ODDS_API_KEY." }, 500);
    }
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return json({ error: "Falta el secret ANTHROPIC_API_KEY." }, 500);
    }

    async function oddsGet(path: string, extra: Record<string, string> = {}) {
      const params = new URLSearchParams({ apiKey: oddsApiKey, ...extra });
      const r = await fetch(`${ODDS_API_BASE}${path}?${params}`);
      const text = await r.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        /* no-JSON */
      }
      return { status: r.status, body };
    }

    // ------------------------------------------------------------------
    // 1) Hasta MAX_PER_SPORT fixtures con cuotas, por deporte, priorizando
    //    ligas/torneos principales. Ventana de 10 días (máximo que admite
    //    /v4/fixtures) para que, si hoy no juega nadie importante, agarre
    //    los próximos partidos en vez de devolver vacío — se ordenan por
    //    fecha así que los de hoy siempre salen primero cuando los hay.
    // ------------------------------------------------------------------
    const now = new Date();
    const from = now.toISOString();
    const to = new Date(now.getTime() + 10 * 24 * 3600 * 1000).toISOString();

    // Body opcional: { "leagues": ["LaLiga", "NBA", ...] } — si el dueño da su
    // propia lista de ligas/torneos, se busca SOLO ahí (sin caer de vuelta a
    // "cualquier partido" del deporte). Sin body o con leagues vacío, se usa
    // el criterio por defecto (SPORTS[].majorTournaments, con fallback a todo
    // el deporte si ninguno matchea).
    const payload = await req.json().catch(() => ({}) as Record<string, unknown>);
    const overrideLeagues = Array.isArray((payload as { leagues?: unknown }).leagues)
      ? ((payload as { leagues: unknown[] }).leagues)
          .map((s) => String(s).trim().toLowerCase())
          .filter(Boolean)
      : [];

    const fixtures: FixtureLite[] = [];
    for (const sport of SPORTS) {
      const { status, body } = await oddsGet("/v4/fixtures", {
        sportId: String(sport.oddsSportId),
        from,
        to,
        hasOdds: "true",
      });
      if (status >= 300 || !Array.isArray(body)) continue;

      const all = (body as Record<string, unknown>[]).map((f) => ({
        sportSlug: sport.sportSlug,
        sportOddsId: sport.oddsSportId,
        tournament: String(f.tournamentName ?? ""),
        event: `${f.participant1Name ?? "?"} vs ${f.participant2Name ?? "?"}`,
        fixtureId: String(f.fixtureId ?? f.id ?? ""),
        startTime: String(f.startTime ?? ""),
      })).filter((f) => f.fixtureId);

      let pool: FixtureLite[];
      if (overrideLeagues.length) {
        pool = all.filter((f) => overrideLeagues.some((t) => f.tournament.toLowerCase().includes(t)));
      } else {
        const major = sport.majorTournaments.length
          ? all.filter((f) => sport.majorTournaments.some((t) => f.tournament.toLowerCase().includes(t)))
          : all;
        pool = major.length ? major : all;
      }
      pool.sort((a, b) => a.startTime.localeCompare(b.startTime));
      fixtures.push(...pool.slice(0, MAX_PER_SPORT));
    }

    // ------------------------------------------------------------------
    // 2) Para cada fixture, cuotas de Hard Rock Bet ya resueltas a nombres.
    //    Se descartan los partidos que esa casa no cotiza.
    // ------------------------------------------------------------------
    const marketRefBySport = new Map<number, Map<string, MarketDef>>();
    async function marketRef(sportOddsId: number): Promise<Map<string, MarketDef>> {
      const cached = marketRefBySport.get(sportOddsId);
      if (cached) return cached;
      const { status, body } = await oddsGet("/v4/markets", { sportId: String(sportOddsId) });
      const defs = status < 300 && Array.isArray(body) ? (body as MarketDef[]) : [];
      const m = new Map(defs.map((d) => [String(d.marketId), d]));
      marketRefBySport.set(sportOddsId, m);
      return m;
    }

    const withOdds: FixtureOdds[] = [];
    for (const fx of fixtures) {
      const { status, body } = await oddsGet("/v4/odds", { fixtureId: fx.fixtureId, bookmakers: BOOKMAKER });
      if (status >= 300) continue;
      const fixture = body as Record<string, unknown>;
      const bookmakerOdds = (fixture.bookmakerOdds ?? {}) as Record<string, { markets?: Record<string, unknown> }>;
      const thisBook = bookmakerOdds[BOOKMAKER];
      const marketsRaw = (thisBook?.markets ?? {}) as Record<
        string,
        { outcomes?: Record<string, { players?: Record<string, { price?: number }> }> }
      >;
      const marketIds = Object.keys(marketsRaw);
      if (marketIds.length === 0) continue;

      const defs = await marketRef(fx.sportOddsId);
      const markets = marketIds.slice(0, MAX_MARKETS_PER_FIXTURE).map((mid) => {
        const def = defs.get(mid);
        const outcomeNameById = new Map((def?.outcomes ?? []).map((o) => [String(o.outcomeId), o.outcomeName]));
        const outcomesRaw = marketsRaw[mid].outcomes ?? {};
        const outcomes = Object.entries(outcomesRaw)
          .map(([oid, o]) => {
            const firstPlayer = Object.values(o.players ?? {})[0];
            return { name: outcomeNameById.get(oid) ?? `#${oid}`, price: firstPlayer?.price ?? null };
          })
          .filter((o): o is { name: string; price: number } => o.price != null);
        return { marketName: def?.marketName ?? `Mercado #${mid}`, marketType: def?.marketType ?? null, outcomes };
      }).filter((m) => m.outcomes.length > 0);

      if (markets.length > 0) withOdds.push({ ...fx, markets });
    }

    if (withOdds.length === 0) {
      const where = overrideLeagues.length ? `en "${overrideLeagues.join(", ")}"` : "en las ligas principales";
      return json({
        batch_id: null,
        candidates_count: 0,
        candidates: [],
        note: `No se encontraron partidos con cuotas de Hard Rock Bet ${where} en los próximos 10 días. ${
          fixtures.length === 0
            ? "No hubo ni fixtures que coincidieran con esa búsqueda — revisa el nombre de la liga."
            : `Sí hay ${fixtures.length} partido(s) que coinciden, pero Hard Rock Bet no tiene cuotas cargadas para ninguno todavía.`
        }`,
      });
    }

    // ------------------------------------------------------------------
    // 3) Claude elige los mejores picks entre lo que Hard Rock cotiza hoy.
    // ------------------------------------------------------------------
    const catalog = withOdds.map((f, i) => ({
      ref: i,
      sport: f.sportSlug,
      tournament: f.tournament,
      event: f.event,
      startTime: f.startTime,
      markets: f.markets,
    }));

    const systemPrompt = `Eres un analista de apuestas deportivas. Te doy una lista de próximos partidos (pueden ser de hoy o de los próximos días — cada uno trae su "startTime") con las cuotas reales que ofrece la casa Hard Rock Bet (ya filtradas: solo mercados que esa casa cotiza). Elige los mejores picks (mínimo 1, máximo 6) según valor esperado y solidez del razonamiento, priorizando los partidos más próximos en el tiempo si hay varios de calidad similar.

Reglas estrictas:
- Solo puedes elegir partidos, mercados y cuotas que aparecen tal cual en los datos. No inventes partidos ni cuotas.
- "market_category" debe ser exactamente uno de: goals_lines, handicap, moneyline, btts, totals, player_props, other.
- "odds" debe copiarse exacto del "price" del outcome elegido.
- "ref" debe ser el número "ref" del partido tal como aparece en los datos.
- "stake" es un entero 1-10 (tamaño de apuesta sugerido, 10 = máxima confianza). "confidence" es un entero 1-5.
- "analysis" es una justificación breve en español (1-3 frases), mencionando el día si el partido no es hoy.

Responde SOLO con JSON válido, sin texto extra, con esta forma exacta:
{"picks":[{"ref":0,"market":"nombre del mercado","market_category":"moneyline","selection":"nombre de la opción elegida","odds":1.85,"stake":5,"confidence":3,"analysis":"..."}]}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: JSON.stringify(catalog) }],
      }),
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      return json({ error: `Anthropic API error ${claudeRes.status}: ${errBody.slice(0, 500)}` }, 502);
    }
    const claudeBody = await claudeRes.json();
    const text = (claudeBody.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");

    let parsed: { picks?: Record<string, unknown>[] };
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : text);
    } catch {
      return json({ error: "Claude no devolvió JSON válido.", raw: text.slice(0, 800) }, 502);
    }

    // ------------------------------------------------------------------
    // 4) Validar contra los datos reales e insertar como candidatos.
    // ------------------------------------------------------------------
    const sportIdBySlug: Record<string, number> = { futbol: 1, baloncesto: 2, tenis: 3, "futbol-americano": 4 };
    const MARKET_CATEGORIES = new Set(["goals_lines", "handicap", "moneyline", "btts", "totals", "player_props", "other"]);
    const batchId = crypto.randomUUID();
    const rows: Record<string, unknown>[] = [];

    for (const p of parsed.picks ?? []) {
      const ref = Number(p.ref);
      const fx = withOdds[ref];
      if (!fx) continue;
      const odds = Number(p.odds);
      const selection = String(p.selection ?? "");
      const validOdds = fx.markets.some((m) => m.outcomes.some((o) => o.name === selection && Math.abs(o.price - odds) < 0.01));
      if (!validOdds) continue;
      const category = MARKET_CATEGORIES.has(String(p.market_category)) ? String(p.market_category) : "other";
      const stake = Math.min(10, Math.max(1, Math.round(Number(p.stake) || 3)));
      const confidence = Math.min(5, Math.max(1, Math.round(Number(p.confidence) || 3)));

      rows.push({
        batch_id: batchId,
        sport_id: sportIdBySlug[fx.sportSlug] ?? 5,
        competition: fx.tournament || fx.sportSlug,
        event: fx.event,
        market: String(p.market ?? "Mercado"),
        market_category: category,
        selection,
        odds,
        bookmaker: BOOKMAKER,
        stake,
        confidence,
        event_start_at: fx.startTime,
        analysis: String(p.analysis ?? ""),
      });
    }

    if (rows.length === 0) {
      return json({ batch_id: null, candidates_count: 0, candidates: [], note: "Claude no propuso picks válidos hoy." });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const { data: inserted, error: insertErr } = await admin.from("pick_candidates").insert(rows).select();
    if (insertErr) {
      return json({ error: `No se pudieron guardar los candidatos: ${insertErr.message}` }, 500);
    }

    return json({ batch_id: batchId, candidates_count: inserted?.length ?? 0, candidates: inserted ?? [] });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
