// ============================================================================
// FamilyPicks — fetch-odds
//
// Trae partidos y cuotas de The Odds API (theoddsapi.com) para que el admin
// (o Claude, en tu nombre) elija qué picks tienen valor antes de publicarlos.
// Requiere el secret ODDS_API_KEY (Project Settings -> Edge Functions ->
// Secrets en el dashboard de Supabase). Solo responde si quien llama es admin.
//
// Body JSON:
//   { "action": "list_sports" }                    -> catálogo de deportes activos
//   { "action": "odds", "sport_key": "soccer_epl" } -> partidos + cuotas de ese deporte
// ============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
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

    const { action, sport_key } = await req.json().catch(() => ({}) as Record<string, unknown>);

    if (action === "list_sports") {
      const r = await fetch(`${ODDS_API_BASE}/sports?apiKey=${apiKey}`);
      const body = await r.json();
      return json(body, r.status);
    }

    if (action === "odds") {
      if (!sport_key || typeof sport_key !== "string") return json({ error: "Falta sport_key" }, 400);
      const params = new URLSearchParams({
        apiKey,
        regions: "eu,uk,us",
        markets: "h2h",
        oddsFormat: "decimal",
        dateFormat: "iso",
      });
      const r = await fetch(`${ODDS_API_BASE}/sports/${sport_key}/odds/?${params}`);
      const body = await r.json();
      if (!r.ok) return json(body, r.status);
      return json({
        quota: {
          remaining: r.headers.get("x-requests-remaining"),
          used: r.headers.get("x-requests-used"),
        },
        games: body,
      });
    }

    return json({ error: "action debe ser 'list_sports' u 'odds'." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
