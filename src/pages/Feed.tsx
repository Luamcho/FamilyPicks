import { useEffect, useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { PickCard } from "@/components/PickCard";
import { EmptyState } from "@/components/bits";
import { getPicks, getStatsOverview } from "@/lib/api";
import { usePlan } from "@/context/PlanContext";
import { pct, units } from "@/lib/format";
import type { Pick, StatsOverview } from "@/lib/types";

type SortMode = "recent" | "odds" | "confidence";

const SPORTS = [
  { v: "all", label: "Todos" },
  { v: "futbol", label: "Fútbol" },
  { v: "baloncesto", label: "Baloncesto" },
  { v: "tenis", label: "Tenis" },
  { v: "futbol-americano", label: "NFL" },
];
const STATUS = [
  { v: "all", label: "Todos" },
  { v: "pending", label: "Pendientes" },
  { v: "resolved", label: "Resueltos" },
];

function dayKey(iso: string): string {
  const dt = new Date(iso);
  const today = new Date();
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (dt.toDateString() === today.toDateString()) return "Hoy";
  if (dt.toDateString() === y.toDateString()) return "Ayer";
  return dt.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

export function Feed() {
  const { plan } = usePlan();
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortMode>("recent");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    getPicks(plan).then((p) => alive && setPicks(p));
    getStatsOverview().then((s) => alive && setStats(s));
    return () => {
      alive = false;
    };
  }, [plan]);

  const filtered = useMemo(() => {
    if (!picks) return [];
    const term = q.trim().toLowerCase();
    return picks
      .filter((p) => sport === "all" || p.sport_slug === sport)
      .filter((p) => {
        if (status === "pending") return p.status === "pending";
        if (status === "resolved") return p.status !== "pending";
        return true;
      })
      .filter(
        (p) =>
          !term ||
          p.event.toLowerCase().includes(term) ||
          p.competition.toLowerCase().includes(term) ||
          p.selection.toLowerCase().includes(term),
      )
      .sort((a, b) => {
        if (sort === "odds") return b.odds - a.odds;
        if (sort === "confidence") return (b.confidence ?? 0) - (a.confidence ?? 0);
        return (
          new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        );
      });
  }, [picks, sport, status, sort, q]);

  const groups = useMemo(() => {
    const m = new Map<string, Pick[]>();
    for (const p of filtered) {
      const k = dayKey(p.published_at);
      const arr = m.get(k);
      if (arr) arr.push(p);
      else m.set(k, [p]);
    }
    return [...m.entries()];
  }, [filtered]);

  const todayCount = picks?.filter((p) => dayKey(p.published_at) === "Hoy").length ?? 0;
  const pendingCount = picks?.filter((p) => p.status === "pending").length ?? 0;

  return (
    <>
      <div className="toolbar">
        <label className="search">
          <Search aria-hidden width={18} height={18} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar equipo, liga o mercado"
            aria-label="Buscar picks"
          />
        </label>
        <div className="sortbox">
          <ArrowUpDown aria-hidden width={16} height={16} />
          <label htmlFor="sort" className="sr-only">
            Ordenar
          </label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
            <option value="recent">Más recientes</option>
            <option value="odds">Mayor cuota</option>
            <option value="confidence">Mayor confianza</option>
          </select>
        </div>
      </div>

      <div className="filters">
        <p className="chips-label">Deporte</p>
        <div className="chips" role="group" aria-label="Filtrar por deporte">
          {SPORTS.map((s) => (
            <button
              key={s.v}
              type="button"
              className="chip"
              aria-pressed={sport === s.v}
              onClick={() => setSport(s.v)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="chips-label" style={{ marginTop: 14 }}>
          Estado
        </p>
        <div className="chips" role="group" aria-label="Filtrar por estado">
          {STATUS.map((s) => (
            <button
              key={s.v}
              type="button"
              className="chip"
              aria-pressed={status === s.v}
              onClick={() => setStatus(s.v)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="summary" aria-label="Resumen">
        <Tile l="Picks hoy" v={String(todayCount)} />
        <Tile l="Pendientes" v={String(pendingCount)} />
        <Tile l="Beneficio total" v={units(stats?.profit_units ?? null)} pos />
        <Tile l="Racha" v={stats ? `${stats.current_streak} W` : "—"} />
        <Tile l="ROI · 90 días" v={pct(stats?.roi_pct ?? null)} pos />
      </div>

      <div className="feed">
        {!picks && <p style={{ color: "var(--muted)", padding: 8 }}>Cargando picks…</p>}
        {picks && filtered.length === 0 && (
          <EmptyState title="Ningún pick con estos filtros">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setSport("all");
                setStatus("all");
                setQ("");
              }}
            >
              Quitar filtros
            </button>
          </EmptyState>
        )}
        {groups.map(([label, items]) => (
          <div key={label}>
            <div className="day">{label}</div>
            <div className="pick-grid">
              {items.map((p) => (
                <PickCard key={p.id} pick={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Tile({ l, v, pos }: { l: string; v: string; pos?: boolean }) {
  return (
    <div className="s-tile">
      <div className="s-l">{l}</div>
      <div className={`s-v num${pos && v.startsWith("+") ? " pos" : ""}`}>{v}</div>
    </div>
  );
}
