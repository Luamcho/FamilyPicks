import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { SettleControl } from "@/components/SettleControl";
import { SportIcon, EmptyState } from "@/components/bits";
import { useToast } from "@/components/Toast";
import { getAllPicks, settlePick } from "@/lib/api";
import { odds, time, units } from "@/lib/format";
import type { Pick, PickStatus } from "@/lib/types";

export function AdminDashboard() {
  const toast = useToast();
  const [picks, setPicks] = useState<Pick[] | null>(null);

  const load = useCallback(() => {
    getAllPicks().then(setPicks);
  }, []);
  useEffect(load, [load]);

  const pending = (picks ?? [])
    .filter((p) => p.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.event_start_at).getTime() - new Date(b.event_start_at).getTime(),
    );
  const settled = (picks ?? []).filter((p) => p.status !== "pending");

  const now = Date.now();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthPicks = settled.filter(
    (p) => p.settled_at && new Date(p.settled_at).getTime() >= monthStart.getTime(),
  );
  const monthProfit = monthPicks.reduce((s, p) => s + (p.result_units ?? 0), 0);
  const startedPending = pending.filter(
    (p) => new Date(p.event_start_at).getTime() <= now,
  );

  async function onSettle(id: string, status: PickStatus, closing: number | null) {
    try {
      await settlePick(id, status, closing);
      const label =
        status === "won" ? "Acierto" : status === "lost" ? "Fallo" : "Nulo";
      toast(`Pick liquidado: ${label}`);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo liquidar", "err");
    }
  }

  return (
    <div className="admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2>Resumen</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Publica y liquida picks. Todo entra al histórico público.
          </p>
        </div>
        <Link className="btn btn-primary" to="/admin/nuevo">
          <PlusCircle aria-hidden width={16} height={16} /> Publicar pick
        </Link>
      </div>

      <div className="admin-stats">
        <StatTile l="Pendientes" v={picks ? String(pending.length) : "—"} />
        <StatTile
          l="Por liquidar"
          v={picks ? String(startedPending.length) : "—"}
          alert={startedPending.length > 0}
        />
        <StatTile
          l="P&L este mes"
          v={picks ? units(monthProfit) : "—"}
          pos={monthProfit > 0}
          neg={monthProfit < 0}
        />
        <StatTile l="Picks totales" v={picks ? String(picks.length) : "—"} />
      </div>

      <section>
        <h2 style={{ fontSize: 16 }}>
          Pendientes de liquidar
          {startedPending.length > 0 && (
            <span style={{ color: "var(--pending)", fontSize: 13, marginLeft: 8 }}>
              · {startedPending.length} ya empezaron
            </span>
          )}
        </h2>
        {!picks && <p style={{ color: "var(--muted)" }}>Cargando…</p>}
        {picks && pending.length === 0 && (
          <EmptyState title="No hay picks pendientes">
            <Link className="btn btn-primary" to="/admin/nuevo">
              Publicar el primero
            </Link>
          </EmptyState>
        )}
        <div style={{ display: "grid", gap: 12 }}>
          {pending.map((p) => {
            const started = new Date(p.event_start_at).getTime() <= now;
            return (
              <div className="settle-item" key={p.id}>
                <div className="si-head">
                  <SportIcon slug={p.sport_slug} />
                  <span className="si-ev">{p.event}</span>
                  {p.is_vip && <span className="badge badge--vip">VIP</span>}
                </div>
                <div className="si-meta">
                  {p.competition} · <b>{p.selection}</b> · cuota{" "}
                  <span className="num">{odds(p.odds)}</span> · stake{" "}
                  <span className="num">{p.stake}/10</span> · inicio{" "}
                  <span className="num">{time(p.event_start_at)}</span>
                  {started ? (
                    <span style={{ color: "var(--pending)" }}> · empezado</span>
                  ) : (
                    <span> · aún no empieza</span>
                  )}
                </div>
                <SettleControl
                  suggestedClosing={p.odds}
                  onSettle={(status, closing) => onSettle(p.id, status, closing)}
                />
              </div>
            );
          })}
        </div>
      </section>

      {settled.length > 0 && (
        <section>
          <h2 style={{ fontSize: 16 }}>Últimos liquidados</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {settled.slice(0, 6).map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  fontSize: 13,
                  padding: "8px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "var(--surface)",
                }}
              >
                <SportIcon slug={p.sport_slug} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  {p.event} · {p.selection}
                </span>
                <span
                  className="num"
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
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatTile({
  l,
  v,
  pos,
  neg,
  alert,
}: {
  l: string;
  v: string;
  pos?: boolean;
  neg?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className="s-tile"
      style={alert ? { borderColor: "var(--pending)" } : undefined}
    >
      <div className="s-l">{l}</div>
      <div
        className="s-v num"
        style={{
          color: pos ? "var(--win)" : neg ? "var(--loss)" : undefined,
        }}
      >
        {v}
      </div>
    </div>
  );
}
