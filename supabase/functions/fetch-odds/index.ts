// ============================================================================
// FamilyPicks — fetch-odds (modo diagnóstico para oddspapi.io)
//
// oddspapi.io identifica deportes/mercados/casas/equipos por ID numérico y
// hay que resolverlos contra sus endpoints de referencia. Antes de construir
// la integración final necesitamos ver una respuesta real, así que esta
// versión solo expone un passthrough "raw": llama a cualquier endpoint GET
// de la API con tu ODDS_API_KEY puesta por el servidor, y devuelve el JSON
// tal cual para poder inspeccionarlo desde /admin/cuotas.
//
// Requiere el secret ODDS_API_KEY (Project Settings -> Edge Functions ->
// Secrets). Solo responde si quien llama es admin.
//
// Body JSON: { "action": "raw", "path": "/v4/sports", "query": { "sportId": "1" } }
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

    const { action, path, query } = await req.json().catch(() => ({}) as Record<string, unknown>);

    if (action === "raw") {
      if (!path || typeof path !== "string" || !path.startsWith("/")) {
        return json({ error: "path inválido (debe empezar por /, ej. /v4/sports)" }, 400);
      }
      const params = new URLSearchParams({ apiKey });
      if (query && typeof query === "object") {
        for (const [k, v] of Object.entries(query as Record<string, unknown>)) {
          if (v != null) params.set(k, String(v));
        }
      }
      const upstreamUrl = `${ODDS_API_BASE}${path}?${params}`;
      const r = await fetch(upstreamUrl);
      const text = await r.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        /* la respuesta no era JSON; devolvemos el texto tal cual */
      }
      return json({ upstream_status: r.status, path, body });
    }

    return json({ error: "action debe ser 'raw' (modo diagnóstico) mientras exploramos el esquema de oddspapi.io." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
