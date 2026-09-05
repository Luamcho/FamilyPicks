import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/Toast";
import { createPick } from "@/lib/api";
import { MOCK_SPORTS } from "@/lib/mock";
import type { MarketCategory, PickSource } from "@/lib/types";

const MARKET_CATEGORIES: { v: MarketCategory; label: string }[] = [
  { v: "goals_lines", label: "Línea de goles / puntos" },
  { v: "handicap", label: "Hándicap" },
  { v: "moneyline", label: "Ganador (1X2 / ML)" },
  { v: "btts", label: "Ambos marcan" },
  { v: "totals", label: "Totales (over/under)" },
  { v: "player_props", label: "Props de jugador" },
  { v: "other", label: "Otro" },
];

interface FormState {
  sport_slug: string;
  competition: string;
  event: string;
  market: string;
  market_category: MarketCategory;
  selection: string;
  odds: string;
  stake: string;
  confidence: string;
  event_start_at: string;
  source: PickSource;
  analysis: string;
}

const empty: FormState = {
  sport_slug: MOCK_SPORTS[0]?.slug ?? "futbol",
  competition: "",
  event: "",
  market: "",
  market_category: "goals_lines",
  selection: "",
  odds: "",
  stake: "5",
  confidence: "3",
  event_start_at: "",
  source: "manual",
  analysis: "",
};

export function AdminNewPick() {
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState<FormState>(empty);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!f.competition.trim()) e.competition = "Requerido";
    if (!f.event.trim()) e.event = "Requerido";
    if (!f.market.trim()) e.market = "Requerido";
    if (!f.selection.trim()) e.selection = "Requerido";
    const odds = Number(f.odds.replace(",", "."));
    if (!f.odds.trim() || !Number.isFinite(odds) || odds <= 1)
      e.odds = "Cuota > 1.00";
    const stake = Number(f.stake);
    if (!Number.isInteger(stake) || stake < 1 || stake > 10)
      e.stake = "Entre 1 y 10";
    if (!f.event_start_at) e.event_start_at = "Requerido";
    return e;
  }, [f]);

  const valid = Object.keys(errors).length === 0;
  const show = (k: keyof FormState) => submitted && errors[k];

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    setBusy(true);
    try {
      await createPick({
        sport_slug: f.sport_slug,
        competition: f.competition.trim(),
        event: f.event.trim(),
        market: f.market.trim(),
        market_category: f.market_category,
        selection: f.selection.trim(),
        odds: Number(f.odds.replace(",", ".")),
        stake: Number(f.stake),
        confidence: Number(f.confidence),
        event_start_at: new Date(f.event_start_at).toISOString(),
        source: f.source,
        analysis: f.analysis.trim() || undefined,
      });
      toast("Pick publicado");
      nav("/admin");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo publicar", "err");
      setBusy(false);
    }
  }

  return (
    <div className="admin-page">
      <div>
        <h2>Publicar pick</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Se publica con la hora actual. La cuota de cierre se registra al liquidarlo.
        </p>
      </div>

      <form className="card" onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        <div className="form-grid cols-2">
          <div className="field">
            <label htmlFor="sport">Deporte</label>
            <select id="sport" value={f.sport_slug} onChange={(e) => set("sport_slug", e.target.value)}>
              {MOCK_SPORTS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className={`field${show("competition") ? " invalid" : ""}`}>
            <label htmlFor="comp">
              Competición <span className="req">*</span>
            </label>
            <input
              id="comp"
              value={f.competition}
              onChange={(e) => set("competition", e.target.value)}
              placeholder="LaLiga, NBA, ATP 500…"
            />
            {show("competition") && <span className="err-msg">{errors.competition}</span>}
          </div>
        </div>

        <div className={`field${show("event") ? " invalid" : ""}`}>
          <label htmlFor="event">
            Evento <span className="req">*</span>
          </label>
          <input
            id="event"
            value={f.event}
            onChange={(e) => set("event", e.target.value)}
            placeholder="Local vs Visitante"
          />
          {show("event") && <span className="err-msg">{errors.event}</span>}
        </div>

        <div className="form-grid cols-2">
          <div className={`field${show("market") ? " invalid" : ""}`}>
            <label htmlFor="market">
              Mercado <span className="req">*</span>
            </label>
            <input
              id="market"
              value={f.market}
              onChange={(e) => set("market", e.target.value)}
              placeholder="Línea de goles, Hándicap…"
            />
            {show("market") && <span className="err-msg">{errors.market}</span>}
          </div>
          <div className="field">
            <label htmlFor="cat">Categoría (para las estadísticas)</label>
            <select
              id="cat"
              value={f.market_category}
              onChange={(e) => set("market_category", e.target.value as MarketCategory)}
            >
              {MARKET_CATEGORIES.map((c) => (
                <option key={c.v} value={c.v}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`field${show("selection") ? " invalid" : ""}`}>
          <label htmlFor="sel">
            Selección <span className="req">*</span>
          </label>
          <input
            id="sel"
            value={f.selection}
            onChange={(e) => set("selection", e.target.value)}
            placeholder="Más de 2.5 goles, Hándicap −1…"
          />
          {show("selection") && <span className="err-msg">{errors.selection}</span>}
        </div>

        <div className="form-grid cols-2">
          <div className={`field${show("odds") ? " invalid" : ""}`}>
            <label htmlFor="odds">
              Cuota de registro <span className="req">*</span>
            </label>
            <input
              id="odds"
              type="text"
              inputMode="decimal"
              value={f.odds}
              onChange={(e) => set("odds", e.target.value)}
              placeholder="2.10"
            />
            {show("odds") && <span className="err-msg">{errors.odds}</span>}
          </div>
          <div className={`field${show("stake") ? " invalid" : ""}`}>
            <label htmlFor="stake">
              Stake (1–10) <span className="req">*</span>
            </label>
            <input
              id="stake"
              type="number"
              min={1}
              max={10}
              step={1}
              value={f.stake}
              onChange={(e) => set("stake", e.target.value)}
            />
            {show("stake") && <span className="err-msg">{errors.stake}</span>}
          </div>
        </div>

        <div className="form-grid cols-2">
          <div className="field">
            <label htmlFor="conf">Confianza</label>
            <select id="conf" value={f.confidence} onChange={(e) => set("confidence", e.target.value)}>
              <option value="1">1 · Baja</option>
              <option value="2">2</option>
              <option value="3">3 · Media</option>
              <option value="4">4</option>
              <option value="5">5 · Máxima</option>
            </select>
          </div>
          <div className={`field${show("event_start_at") ? " invalid" : ""}`}>
            <label htmlFor="start">
              Inicio del evento <span className="req">*</span>
            </label>
            <input
              id="start"
              type="datetime-local"
              value={f.event_start_at}
              onChange={(e) => set("event_start_at", e.target.value)}
            />
            {show("event_start_at") && (
              <span className="err-msg">{errors.event_start_at}</span>
            )}
          </div>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={f.source === "ai"}
            onChange={(e) => set("source", e.target.checked ? "ai" : "manual")}
          />
          Sugerencia de IA (marca esto si te lo propuso un asistente y lo revisaste)
        </label>

        <div className="field">
          <label htmlFor="analysis">Análisis (opcional)</label>
          <textarea
            id="analysis"
            rows={3}
            value={f.analysis}
            onChange={(e) => set("analysis", e.target.value)}
            placeholder="Por qué hay valor en esta cuota…"
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Publicando…" : "Publicar pick"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => nav("/admin")}>
            Cancelar
          </button>
          {submitted && !valid && (
            <span className="err-msg" role="alert">
              Revisa los campos marcados.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
