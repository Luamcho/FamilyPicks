import { useState, type FormEvent } from "react";
import { Search, Copy, Check } from "lucide-react";
import { useToast } from "@/components/Toast";
import { rawOdds } from "@/lib/odds";
import type { RawOddsResponse } from "@/lib/odds";

// sportId reales (de /v4/sports): 10 fútbol, 11 baloncesto, 12 tenis, 14 fútbol americano
const PRESETS = [
  { label: "Deportes", path: "/v4/sports", query: "" },
  { label: "Casas de apuestas", path: "/v4/bookmakers", query: "" },
  { label: "Mercados", path: "/v4/markets", query: "" },
  { label: "Ligas · Fútbol", path: "/v4/tournaments", query: "sportId=10" },
  { label: "Ligas · Baloncesto", path: "/v4/tournaments", query: "sportId=11" },
  { label: "Participantes", path: "/v4/participants", query: "" },
];

export function AdminOdds() {
  const toast = useToast();
  const [path, setPath] = useState("/v4/sports");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RawOddsResponse | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyJson() {
    if (!result) return;
    const text = JSON.stringify(result.body, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("No se pudo copiar. Selecciona el texto a mano.", "err");
    }
  }

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

  return (
    <div className="admin-page">
      <div>
        <h2>Cuotas — modo diagnóstico</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          oddspapi.io identifica todo por ID numérico. Antes de construir la
          pantalla final necesitamos ver una respuesta real de cada endpoint de
          referencia. Prueba los atajos, copia el resultado y pégamelo en el chat.
        </p>
      </div>

      <div className="card" style={{ display: "grid", gap: 14 }}>
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
            <input
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/v4/sports"
            />
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
              <span className={result.upstream_status < 300 ? "pos" : "neg"}>
                HTTP {result.upstream_status}
              </span>
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
