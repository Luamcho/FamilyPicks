import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { getSettledHistory, getStatsOverview } from "@/lib/api";
import { count, odds, pct, shortDate, units } from "@/lib/format";
import type { Pick, StatsOverview } from "@/lib/types";

type Key = "date" | "event" | "selection" | "odds" | "close" | "pnl";
type Dir = "asc" | "desc";

export function Results() {
  const [rows, setRows] = useState<Pick[] | null>(null);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [key, setKey] = useState<Key>("date");
  const [dir, setDir] = useState<Dir>("desc");

  useEffect(() => {
    let alive = true;
    getSettledHistory().then((r) => alive && setRows(r));
    getStatsOverview().then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(() => {
    if (!rows) return [];
    const mul = dir === "asc" ? 1 : -1;
    const val = (p: Pick): number | string => {
      switch (key) {
        case "date":
          return new Date(p.settled_at ?? p.published_at).getTime();
        case "event":
          return p.event.toLowerCase();
        case "selection":
          return p.selection.toLowerCase();
        case "odds":
          return p.odds;
        case "close":
          return p.closing_odds ?? 0;
        case "pnl":
          return p.result_units ?? 0;
        default:
          return 0;
      }
    };
    return [...rows].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av < bv) return -1 * mul;
      if (av > bv) return 1 * mul;
      return 0;
    });
  }, [rows, key, dir]);

  const sortBy = (k: Key) => {
    if (k === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setKey(k);
      setDir(k === "event" || k === "selection" ? "asc" : "desc");
    }
  };
  const ariaSort = (k: Key): "ascending" | "descending" | undefined =>
    k === key ? (dir === "asc" ? "ascending" : "descending") : undefined;

  const exportCsv = () => {
    const head = ["fecha", "evento", "seleccion", "cuota", "cierre", "beneficio_u"];
    const lines = sorted.map((p) =>
      [
        new Date(p.settled_at ?? p.published_at).toISOString().slice(0, 10),
        p.event,
        p.selection,
        p.odds,
        p.closing_odds ?? "",
        p.result_units ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "familypicks-historico.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page-pad content-narrow">
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, margin: "0 0 6px" }}>
        Histórico completo
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 18px", maxWidth: "60ch" }}>
        Todos los picks liquidados, sin selección. Ordena por cualquier columna.
      </p>

      <div className="hist-top">
        <span className="kv">
          <span>P&amp;L</span>{" "}
          <b className={(stats?.profit_units ?? 0) >= 0 ? "pos" : "neg"}>
            {units(stats?.profit_units ?? null)}
          </b>
        </span>
        <span className="kv">
          <span>ROI</span> <b>{pct(stats?.roi_pct ?? null)}</b>
        </span>
        <span className="kv">
          <span>Apuestas</span> <b>{count(stats?.total_picks ?? null)}</b>
        </span>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={exportCsv}
          style={{ marginLeft: "auto" }}
        >
          <Download aria-hidden width={15} height={15} /> Exportar CSV
        </button>
      </div>

      <div className="table-wrap">
        <table className="hist">
          <thead>
            <tr>
              <th onClick={() => sortBy("date")} aria-sort={ariaSort("date")}>
                Fecha
              </th>
              <th onClick={() => sortBy("event")} aria-sort={ariaSort("event")}>
                Evento
              </th>
              <th onClick={() => sortBy("selection")} aria-sort={ariaSort("selection")}>
                Selección
              </th>
              <th
                onClick={() => sortBy("odds")}
                aria-sort={ariaSort("odds")}
                style={{ textAlign: "right" }}
              >
                Cuota
              </th>
              <th
                onClick={() => sortBy("close")}
                aria-sort={ariaSort("close")}
                className="col-close"
                style={{ textAlign: "right" }}
              >
                Cierre
              </th>
              <th
                onClick={() => sortBy("pnl")}
                aria-sort={ariaSort("pnl")}
                style={{ textAlign: "right" }}
              >
                Beneficio
              </th>
            </tr>
          </thead>
          <tbody>
            {!rows && (
              <tr>
                <td colSpan={6} style={{ color: "var(--muted)" }}>
                  Cargando…
                </td>
              </tr>
            )}
            {sorted.map((p) => (
              <tr key={p.id} data-r={p.status}>
                <td className="num">{shortDate(p.settled_at ?? p.published_at)}</td>
                <td>{p.event}</td>
                <td>{p.selection}</td>
                <td className="n">{odds(p.odds)}</td>
                <td className="n col-close">{odds(p.closing_odds)}</td>
                <td className="n">
                  {p.result_units == null ? (
                    "—"
                  ) : p.result_units > 0 ? (
                    <span className="pos">{units(p.result_units)}</span>
                  ) : p.result_units < 0 ? (
                    <span className="neg">{units(p.result_units)}</span>
                  ) : (
                    units(0)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
