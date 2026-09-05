import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, TrendingUp } from "lucide-react";
import { BankrollChart } from "@/components/BankrollChart";
import { SportIcon } from "@/components/bits";
import { getBankroll, getStatsBySport, getStatsOverview } from "@/lib/api";
import { count, monthsSince, pct, units } from "@/lib/format";
import type { BankrollPoint, SportStat, StatsOverview } from "@/lib/types";

type Period = "90d" | "6m" | "12m";
const SLICE: Record<Period, number> = { "90d": 4, "6m": 7, "12m": 13 };

export function Stats() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [bySport, setBySport] = useState<SportStat[] | null>(null);
  const [bankroll, setBankroll] = useState<BankrollPoint[] | null>(null);
  const [period, setPeriod] = useState<Period>("12m");

  useEffect(() => {
    let alive = true;
    getStatsOverview().then((d) => alive && setOverview(d));
    getStatsBySport().then((d) => alive && setBySport(d));
    getBankroll("month").then((d) => alive && setBankroll(d));
    return () => {
      alive = false;
    };
  }, []);

  const chartData = useMemo(() => {
    if (!bankroll) return [];
    const n = SLICE[period];
    return bankroll.slice(Math.max(0, bankroll.length - n));
  }, [bankroll, period]);

  const monthly = useMemo(() => {
    if (!bankroll) return [];
    return bankroll.slice(1).map((p) => ({
      label: new Date(p.bucket_start).toLocaleDateString("es-ES", { month: "short" }),
      value: p.period_units,
    }));
  }, [bankroll]);
  const maxAbs = Math.max(1, ...monthly.map((m) => Math.abs(m.value)));

  const maxSportRoi = Math.max(1, ...(bySport ?? []).map((s) => Math.abs(s.roi_pct ?? 0)));

  return (
    <div className="page-pad content-narrow" style={{ display: "grid", gap: 18 }}>
      {/* resumen */}
      <section className="card authority">
        <div className="a-head">
          <span className="a-av" aria-hidden />
          <div style={{ flex: "1 1 180px" }}>
            <div className="a-name">
              Tu track record
              <ShieldCheck aria-label="Historial completo, sin selección" />
            </div>
            <div className="a-sub">
              Historial completo
              {overview?.first_pick_at
                ? ` desde ${new Date(overview.first_pick_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`
                : ""}
            </div>
          </div>
        </div>
        <p className="a-method">
          Value betting en fútbol europeo y NBA, con cobertura menor en tenis y NFL.
          Stakes 1–10 sobre banca fija, cuota de cierre registrada en Pinnacle. Sin
          martingalas ni "combinadas seguras".
        </p>
        <div className="a-stats">
          <Stat v={pct(overview?.roi_pct ?? null)} l="ROI" pos />
          <Stat v={overview ? `${overview.yield_pct ?? "—"} %` : "—"} l="Yield" />
          <Stat v={overview ? `${overview.hit_rate_pct ?? "—"} %` : "—"} l="Acierto" />
          <Stat v={count(overview?.total_picks ?? null)} l="Picks" />
          <Stat v={monthsSince(overview?.first_pick_at)} l="Periodo" />
          <Stat v={overview ? `${overview.current_streak} W` : "—"} l="Racha" />
        </div>
        <p style={{ fontSize: 12, color: "var(--faint)", margin: 0 }}>
          Rendimiento pasado; las predicciones no garantizan resultados.
        </p>
      </section>

      {/* bankroll */}
      <section className="card">
        <figure style={{ margin: 0 }}>
          <div className="chart-head">
            <div>
              <h2 style={{ margin: "0 0 4px" }}>Evolución del bankroll</h2>
              <p className="sub" style={{ margin: 0 }}>
                Unidades acumuladas. Banca inicial = 100 u.
              </p>
            </div>
            <div className="seg" role="group" aria-label="Periodo de la gráfica">
              {(["90d", "6m", "12m"] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={period === p}
                  onClick={() => setPeriod(p)}
                >
                  {p === "90d" ? "90 días" : p === "6m" ? "6 meses" : "12 meses"}
                </button>
              ))}
            </div>
          </div>
          {bankroll === null ? (
            <p className="sub">Cargando gráfica…</p>
          ) : chartData.length > 1 ? (
            <>
              <BankrollChart data={chartData} />
              <figcaption>
                De {chartData[0]?.cumulative_units ?? 0} a{" "}
                <b className={(chartData[chartData.length - 1]?.cumulative_units ?? 0) >= 0 ? "pos" : "neg"}>
                  {(chartData[chartData.length - 1]?.cumulative_units ?? 0) > 0 ? "+" : ""}
                  {chartData[chartData.length - 1]?.cumulative_units ?? 0} u
                </b>{" "}
                en el periodo · {count(overview?.total_picks ?? null)} apuestas totales.
              </figcaption>
            </>
          ) : (
            <p className="sub">
              Aún no hay histórico. Publica y liquida picks para ver la curva.
            </p>
          )}
          <details className="data-toggle">
            <summary>Ver datos de la gráfica</summary>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th style={{ textAlign: "right" }}>Acumulado</th>
                  <th style={{ textAlign: "right" }}>Variación</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((p) => (
                  <tr key={p.bucket_start}>
                    <td>
                      {new Date(p.bucket_start).toLocaleDateString("es-ES", {
                        month: "short",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="n">
                      {p.cumulative_units > 0 ? "+" : ""}
                      {p.cumulative_units} u
                    </td>
                    <td className="n">
                      {p.period_units >= 0 ? "+" : ""}
                      {p.period_units} u
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </figure>
      </section>

      {/* by sport */}
      <section className="card">
        <h2>Rendimiento por deporte</h2>
        <p className="sub">
          ROI por deporte sobre el total de picks. Barra proporcional al ROI; roja si
          es negativo.
        </p>
        {bySport && bySport.length === 0 && (
          <p className="sub">Sin datos por deporte todavía.</p>
        )}
        <div className="brk">
          {(bySport ?? []).map((s) => {
            const w = Math.round((Math.abs(s.roi_pct ?? 0) / maxSportRoi) * 100);
            const neg = (s.roi_pct ?? 0) < 0;
            return (
              <div className="brk-row" key={s.sport_slug}>
                <span className="s-name">
                  <SportIcon slug={s.sport_slug} /> {s.sport_name}
                </span>
                <div className="brk-bar">
                  <span className={neg ? "neg" : undefined} style={{ width: `${w}%` }} />
                </div>
                <span className={`s-val ${neg ? "neg" : "pos"}`}>{pct(s.roi_pct)}</span>
                <span className="s-meta">
                  {count(s.total_picks)} picks · {units(s.profit_units)} · yield{" "}
                  {s.yield_pct ?? "—"} %
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* monthly */}
      <section className="card">
        <h2>Resultado por mes</h2>
        <p className="sub">Unidades ganadas o perdidas cada mes. Línea de base = 0.</p>
        {bankroll && monthly.length === 0 && (
          <p className="sub">Sin datos mensuales todavía.</p>
        )}
        <div className="months" aria-hidden>
          {monthly.map((m, i) => {
            const h = Math.round((Math.abs(m.value) / maxAbs) * 46);
            const neg = m.value < 0;
            return (
              <div className="m-col" key={i}>
                <div className="m-bar-wrap">
                  <div className="m-zero" />
                  <div
                    className={`m-bar${neg ? " neg" : ""}`}
                    style={{
                      height: `${h}%`,
                      alignSelf: neg ? "flex-start" : "flex-end",
                      marginTop: neg ? "50%" : undefined,
                      marginBottom: neg ? undefined : "50%",
                    }}
                  />
                </div>
                <span className="m-lbl">{m.label}</span>
              </div>
            );
          })}
        </div>
        <details className="data-toggle">
          <summary>Ver datos por mes</summary>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th style={{ textAlign: "right" }}>Unidades</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m, i) => (
                <tr key={i}>
                  <td>{m.label}</td>
                  <td className="n">
                    {m.value >= 0 ? "+" : ""}
                    {m.value} u
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <p style={{ color: "var(--muted)", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
        <TrendingUp aria-hidden width={16} height={16} />
        ¿Quieres el detalle pick a pick?{" "}
        <a href="/resultados">Ver el histórico completo</a>
      </p>
    </div>
  );
}

function Stat({ v, l, pos }: { v: string; l: string; pos?: boolean }) {
  return (
    <div>
      <span className={`v${pos && v.startsWith("+") ? " pos" : ""}`}>{v}</span>
      <span className="l">{l}</span>
    </div>
  );
}
