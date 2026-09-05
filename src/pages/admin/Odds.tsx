import { useState, type FormEvent } from "react";
import { Search, Copy, Check, TrendingUp, TrendingDown, Minus, History } from "lucide-react";
import { useToast } from "@/components/Toast";
import { rawOdds, findBookmaker, getBookmakerOdds, getHistoricalOdds } from "@/lib/odds";
import type { RawOddsResponse, BookmakerMatch, BookmakerOddsResult, HistoricalOddsResult } from "@/lib/odds";
import { odds as fmtOdds, time, shortDate } from "@/lib/format";

// sportId reales (de /v4/sports): 10 fútbol, 11 baloncesto, 12 tenis, 14 fútbol americano
// tournamentId de la doc oficial (deberían ser estables, no por-usuario): 8 LaLiga, 7 Champions
const PRESETS = [
  { label: "Deportes", path: "/v4/sports", query: "" },
  { label: "Casas de apuestas", path: "/v4/bookmakers", query: "" },
  { label: "Mercados · Fútbol", path: "/v4/markets", query: "sportId=10" },
  { label: "Mercados · Baloncesto", path: "/v4/markets", query: "sportId=11" },
  { label: "Ligas · Fútbol", path: "/v4/tournaments", query: "sportId=10" },
  { label: "Ligas · Baloncesto", path: "/v4/tournaments", query: "sportId=11" },
  { label: "Fixtures · LaLiga", path: "/v4/fixtures", query: "tournamentId=8&hasOdds=true" },
  { label: "Participantes · Fútbol", path: "/v4/participants", query: "sportId=10" },
];

export function AdminOdds() {
  const toast = useToast();

  // --- buscar casa de apuestas ---
  const [bkQuery, setBkQuery] = useState("hard rock");
  const [bkLoading, setBkLoading] = useState(false);
  const [bkMatches, setBkMatches] = useState<BookmakerMatch[] | null>(null);
  const [bkSlug, setBkSlug] = useState("");

  async function searchBookmaker(e?: FormEvent) {
    e?.preventDefault();
    setBkLoading(true);
    setBkMatches(null);
    try {
      const res = await findBookmaker(bkQuery);
      setBkMatches(res.bookmakers);
      if (res.bookmakers.length === 1) setBkSlug(res.bookmakers[0].slug);
      if (res.bookmakers.length === 0) toast("Sin coincidencias. Prueba con otro texto.", "err");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al buscar la casa", "err");
    } finally {
      setBkLoading(false);
    }
  }

  // --- mercados de esa casa para un partido ---
  const [fixtureId, setFixtureId] = useState("");
  const [moLoading, setMoLoading] = useState(false);
  const [moResult, setMoResult] = useState<BookmakerOddsResult | null>(null);

  async function searchMarkets(e?: FormEvent) {
    e?.preventDefault();
    if (!bkSlug || !fixtureId) {
      toast("Necesitas el slug de la casa y un fixtureId", "err");
      return;
    }
    setMoLoading(true);
    setMoResult(null);
    try {
      const res = await getBookmakerOdds(bkSlug, fixtureId);
      setMoResult(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al consultar mercados", "err");
    } finally {
      setMoLoading(false);
    }
  }

  // --- histórico de cuotas (apertura -> actual) ---
  const [histLoading, setHistLoading] = useState(false);
  const [histResult, setHistResult] = useState<HistoricalOddsResult | null>(null);

  async function loadHistory() {
    if (!bkSlug || !fixtureId) {
      toast("Necesitas el slug de la casa y un fixtureId", "err");
      return;
    }
    setHistLoading(true);
    setHistResult(null);
    try {
      const res = await getHistoricalOdds(bkSlug, fixtureId);
      setHistResult(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al consultar el histórico", "err");
    } finally {
      setHistLoading(false);
    }
  }

  // --- explorador genérico (raw) ---
  const [path, setPath] = useState("/v4/sports");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RawOddsResponse | null>(null);
  const [copied, setCopied] = useState(false);

  function parseQuery(raw: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const pair of raw.split("&")) {
      const [k, v] = pair.split("=");
      if (k?.trim()) out[k.trim()] = (v ?? "").trim();
    }
    return out;
  }

  async function run(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await rawOdds(path, parseQuery(query));
      setResult(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al consultar", "err");
    } finally {
      setLoading(false);
    }
  }

  async function copyJson() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.body, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("No se pudo copiar. Selecciona el texto a mano.", "err");
    }
  }

  return (
    <div className="admin-page">
      <div>
        <h2>Cuotas</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Busca tu casa de apuestas y mira solo los mercados que ella ofrece para
          un partido — sin descargar la tabla completa de todos los mercados.
        </p>
      </div>

      {/* 1. Buscar casa */}
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>1. Encuentra tu casa de apuestas</h3>
        <form className="form-grid cols-2" onSubmit={searchBookmaker}>
          <div className="field">
            <label htmlFor="bkq">Nombre a buscar</label>
            <input id="bkq" value={bkQuery} onChange={(e) => setBkQuery(e.target.value)} placeholder="hard rock" />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" type="submit" disabled={bkLoading}>
              <Search aria-hidden width={15} height={15} /> {bkLoading ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </form>
        {bkMatches && bkMatches.length > 0 && (
          <div className="chips" role="group" aria-label="Resultados">
            {bkMatches.map((b) => (
              <button
                key={b.slug}
                type="button"
                className="chip"
                aria-pressed={bkSlug === b.slug}
                onClick={() => setBkSlug(b.slug)}
                title={b.slug}
              >
                {b.bookmakerName}
              </button>
            ))}
          </div>
        )}
        {bkSlug && (
          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
            Casa elegida: <span className="num">{bkSlug}</span>
          </p>
        )}
      </div>

      {/* 2. Mercados de esa casa para un partido */}
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>2. Mercados para un partido</h3>
        <p className="sub" style={{ margin: 0 }}>
          Consigue un <code>fixtureId</code> con el atajo "Fixtures · LaLiga" de abajo (o
          cualquier <code>/v4/fixtures</code>), pégalo aquí.
        </p>
        <form className="form-grid cols-2" onSubmit={searchMarkets}>
          <div className="field">
            <label htmlFor="fx">fixtureId</label>
            <input id="fx" value={fixtureId} onChange={(e) => setFixtureId(e.target.value)} placeholder="id1000001764618978" />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" type="submit" disabled={moLoading || !bkSlug}>
              <Search aria-hidden width={15} height={15} /> {moLoading ? "Consultando…" : "Ver mercados"}
            </button>
          </div>
        </form>

        {moResult && (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="si-head">
              <span className="si-ev">{moResult.event}</span>
            </div>
            <div className="si-meta">
              {moResult.tournament ?? "—"} · {moResult.startTime ? time(moResult.startTime) : "—"} ·{" "}
              casa <span className="num">{moResult.bookmaker}</span>
            </div>
            {moResult.note && <p className="sub">{moResult.note}</p>}
            {moResult.markets.map((m) => (
              <div key={m.marketId} className="settle-item">
                <div className="si-head">
                  <span className="si-ev" style={{ fontSize: 14 }}>
                    {m.marketName}
                  </span>
                  {m.marketType && <span className="badge badge--ai">{m.marketType}</span>}
                </div>
                <div className="settle-controls" style={{ flexWrap: "wrap" }}>
                  {m.outcomes.map((o) => (
                    <span key={o.outcomeId} className="res-btn" style={{ cursor: "default" }}>
                      {o.outcomeName} · <span className="num">{o.price != null ? fmtOdds(o.price) : "—"}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Histórico de cuotas: apertura -> actual, para ver hacia dónde carga el mercado */}
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>3. Movimiento de cuotas</h3>
        <p className="sub" style={{ margin: 0 }}>
          Cómo cambió cada cuota desde que se abrió el mercado — usa el mismo{" "}
          <code>fixtureId</code> y casa de arriba. Solo hay datos desde enero de 2026.
        </p>
        <div className="form-actions">
          <button className="btn btn-primary" type="button" onClick={loadHistory} disabled={histLoading || !bkSlug}>
            <History aria-hidden width={15} height={15} /> {histLoading ? "Consultando…" : "Ver histórico"}
          </button>
        </div>

        {histResult && (
          <div style={{ display: "grid", gap: 10 }}>
            <div className="si-head">
              <span className="si-ev">{histResult.event}</span>
            </div>
            <div className="si-meta">
              {histResult.tournament ?? "—"} · {histResult.startTime ? time(histResult.startTime) : "—"} · casa{" "}
              <span className="num">{histResult.bookmaker}</span>
            </div>
            {histResult.note && <p className="sub">{histResult.note}</p>}
            {histResult.markets.map((m) => (
              <div key={m.marketId} className="settle-item">
                <div className="si-head">
                  <span className="si-ev" style={{ fontSize: 14 }}>
                    {m.marketName}
                  </span>
                  {m.marketType && <span className="badge badge--ai">{m.marketType}</span>}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {m.outcomes.map((o) => {
                    const openP = o.opening?.price ?? null;
                    const latP = o.latest?.price ?? null;
                    const dir = openP != null && latP != null ? Math.sign(latP - openP) : 0;
                    return (
                      <div key={o.outcomeId} style={{ display: "grid", gap: 4 }}>
                        <div className="settle-controls" style={{ flexWrap: "wrap" }}>
                          <span className="res-btn" style={{ cursor: "default" }}>
                            {o.outcomeName}
                          </span>
                          <span className="res-btn" style={{ cursor: "default" }}>
                            Apertura <span className="num">{openP != null ? fmtOdds(openP) : "—"}</span>
                            {" → "}
                            <span className={`num ${dir < 0 ? "neg" : dir > 0 ? "pos" : ""}`}>
                              {latP != null ? fmtOdds(latP) : "—"}
                            </span>{" "}
                            {dir < 0 && <TrendingDown aria-hidden width={13} height={13} style={{ display: "inline", verticalAlign: -2 }} />}
                            {dir > 0 && <TrendingUp aria-hidden width={13} height={13} style={{ display: "inline", verticalAlign: -2 }} />}
                            {dir === 0 && <Minus aria-hidden width={13} height={13} style={{ display: "inline", verticalAlign: -2 }} />}
                          </span>
                          {o.latest && !o.latest.active && <span className="badge">cerrada</span>}
                        </div>
                        {o.history.length > 1 && (
                          <details>
                            <summary className="hint" style={{ cursor: "pointer" }}>
                              {o.history.length} cambios de cuota
                            </summary>
                            <div className="chips" style={{ marginTop: 6 }}>
                              {[...o.history].reverse().map((h, i) => (
                                <span key={i} className="chip" title={h.at} style={{ cursor: "default", opacity: h.active ? 1 : 0.55 }}>
                                  {fmtOdds(h.price)} · {shortDate(h.at)} {time(h.at)}
                                </span>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Explorador genérico */}
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>Explorador genérico (para conseguir fixtureId, etc.)</h3>
        <div className="chips" role="group" aria-label="Atajos">
          {PRESETS.map((p) => (
            <button
              key={p.path + p.query}
              type="button"
              className="chip"
              aria-pressed={path === p.path && query === p.query}
              onClick={() => {
                setPath(p.path);
                setQuery(p.query);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <form className="form-grid cols-2" onSubmit={run}>
          <div className="field">
            <label htmlFor="path">Endpoint (path)</label>
            <input id="path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/v4/sports" />
            <span className="hint">Sin dominio ni apiKey — eso lo pone el servidor.</span>
          </div>
          <div className="field">
            <label htmlFor="query">Parámetros extra (opcional)</label>
            <input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="sportId=1&tournamentIds=12,34"
            />
            <span className="hint">Formato clave=valor&clave2=valor2</span>
          </div>
          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              <Search aria-hidden width={15} height={15} /> {loading ? "Consultando…" : "Probar"}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 15, margin: 0 }}>
              Respuesta ·{" "}
              <span className={result.upstream_status < 300 ? "pos" : "neg"}>HTTP {result.upstream_status}</span>
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={copyJson}
              style={{ marginLeft: "auto" }}
              aria-label="Copiar todo el JSON"
            >
              {copied ? (
                <>
                  <Check aria-hidden width={14} height={14} /> Copiado
                </>
              ) : (
                <>
                  <Copy aria-hidden width={14} height={14} /> Copiar JSON
                </>
              )}
            </button>
          </div>
          <p className="sub">{result.path}</p>
          <pre
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 14,
              fontSize: 12,
              overflowX: "auto",
              maxHeight: 480,
              overflowY: "auto",
            }}
          >
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
