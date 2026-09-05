import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { SettleControl } from "@/components/SettleControl";
import { useToast } from "@/components/Toast";
import { getAllPicks, removePick, settlePick } from "@/lib/api";
import { odds, shortDate, units } from "@/lib/format";
import type { Pick, PickStatus } from "@/lib/types";

type Filter = "all" | "pending" | "resolved";

export function AdminPicks() {
  const toast = useToast();
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [settling, setSettling] = useState<string | null>(null);

  const load = useCallback(() => {
    getAllPicks().then(setPicks);
  }, []);
  useEffect(load, [load]);

  const rows = useMemo(() => {
    const list = picks ?? [];
    if (filter === "pending") return list.filter((p) => p.status === "pending");
    if (filter === "resolved") return list.filter((p) => p.status !== "pending");
    return list;
  }, [picks, filter]);

  async function onSettle(id: string, status: PickStatus, closing: number | null) {
    try {
      await settlePick(id, status, closing);
      toast("Pick liquidado");
      setSettling(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al liquidar", "err");
    }
  }

  async function onDelete(p: Pick) {
    if (!window.confirm(`¿Eliminar el pick "${p.event}"? No se puede deshacer.`)) return;
    try {
      await removePick(p.id);
      toast("Pick eliminado");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al eliminar", "err");
    }
  }

  return (
    <div className="admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2>Todos los picks</h2>
        <Link className="btn btn-primary btn-sm" to="/admin/nuevo">
          <PlusCircle aria-hidden width={15} height={15} /> Publicar
        </Link>
      </div>

      <div className="chips" role="group" aria-label="Filtrar">
        {(["all", "pending", "resolved"] as Filter[]).map((v) => (
          <button
            key={v}
            type="button"
            className="chip"
            aria-pressed={filter === v}
            onClick={() => setFilter(v)}
          >
            {v === "all" ? "Todos" : v === "pending" ? "Pendientes" : "Resueltos"}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="hist">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Evento</th>
              <th>Selección</th>
              <th style={{ textAlign: "right" }}>Cuota</th>
              <th style={{ textAlign: "right" }}>Stake</th>
              <th style={{ textAlign: "right" }}>Estado / P&amp;L</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!picks && (
              <tr>
                <td colSpan={7} style={{ color: "var(--muted)" }}>
                  Cargando…
                </td>
              </tr>
            )}
            {picks && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: "var(--muted)" }}>
                  Sin picks.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} data-r={p.status === "pending" ? undefined : p.status}>
                <td className="num">
                  {shortDate(p.settled_at ?? p.published_at)}
                </td>
                <td>
                  {p.event}
                  {p.source === "ai" && (
                    <span className="badge badge--ai" style={{ marginLeft: 6 }}>
                      IA
                    </span>
                  )}
                </td>
                <td>{p.selection}</td>
                <td className="n">{odds(p.odds)}</td>
                <td className="n">{p.stake}/10</td>
                <td className="n">
                  {p.status === "pending" ? (
                    <span style={{ color: "var(--pending)" }}>Pendiente</span>
                  ) : (
                    <span
                      style={{
                        color:
                          (p.result_units ?? 0) > 0
                            ? "var(--win)"
                            : (p.result_units ?? 0) < 0
                              ? "var(--loss)"
                              : "var(--muted)",
                      }}
                    >
                      {units(p.result_units)}
                    </span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    {p.status === "pending" &&
                      (settling === p.id ? (
                        <SettleControl
                          suggestedClosing={p.odds}
                          onSettle={(s, c) => onSettle(p.id, s, c)}
                        />
                      ) : (
                        <button
                          className="del-btn"
                          type="button"
                          onClick={() => setSettling(p.id)}
                          style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
                        >
                          Liquidar
                        </button>
                      ))}
                    <button className="del-btn" type="button" onClick={() => onDelete(p)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
