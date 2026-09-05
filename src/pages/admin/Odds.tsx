import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import { useToast } from "@/components/Toast";
import { bestPrices, getOdds, guessSportSlug, listOddsSports } from "@/lib/odds";
import type { OddsGame, OddsQuota, OddsSport } from "@/lib/odds";
import { time } from "@/lib/format";

export function AdminOdds() {
  const toast = useToast();
  const nav = useNavigate();
  const [sports, setSports] = useState<OddsSport[] | null>(null);
  const [sportsError, setSportsError] = useState<string | null>(null);
  const [sportKey, setSportKey] = useState("");
  const [games, setGames] = useState<OddsGame[] | null>(null);
  const [quota, setQuota] = useState<OddsQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedSports, setLoadedSports] = useState(false);

  useEffect(() => {
    let alive = true;
    listOddsSports()
      .then((s) => {
        if (!alive) return;
        const active = s.filter((x) => x.active && !x.has_outrights);
        setSports(active);
        setLoadedSports(true);
      })
      .catch((e) => {
        if (!alive) return;
        setSportsError(e instanceof Error ? e.message : "No se pudo cargar la lista de deportes");
        setLoadedSports(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, OddsSport[]>();
    for (const s of sports ?? []) {
      const arr = m.get(s.group);
      if (arr) arr.push(s);
      else m.set(s.group, [s]);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [sports]);

  async function search() {
    if (!sportKey) return;
    setLoading(true);
    setGames(null);
    try {
      const res = await getOdds(sportKey);
      setGames(res.games);
      setQuota(res.quota);
      if (res.games.length === 0) toast("Sin partidos próximos para ese deporte");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error al consultar cuotas", "err");
    } finally {
      setLoading(false);
    }
  }

  function useOutcome(game: OddsGame, outcomeName: string, price: number) {
    const sport = sports?.find((s) => s.key === game.sport_key);
    nav("/admin/nuevo", {
      state: {
        prefill: {
          sport_slug: guessSportSlug(sport?.group ?? ""),
          competition: game.sport_title,
          event: `${game.home_team} vs ${game.away_team}`,
          market: "Ganador",
          market_category: "moneyline",
          selection: outcomeName,
          odds: price,
          event_start_at: game.commence_time,
        },
      },
    });
  }

  return (
    <div className="admin-page">
      <div>
        <h2>Cuotas en vivo</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Datos de The Odds API. Elige un partido y una selección para prellenar el
          formulario de publicar — tú decides stake, confianza y si lo marcas como
          IA o manual.
        </p>
      </div>

      <div className="card" style={{ display: "grid", gap: 14 }}>
        {sportsError && <div className="auth-error">{sportsError}</div>}
        {!loadedSports && <p style={{ color: "var(--muted)" }}>Cargando deportes…</p>}
        {loadedSports && !sportsError && (
          <div className="form-grid cols-2">
            <div className="field">
              <label htmlFor="sportKey">Deporte / liga</label>
              <select id="sportKey" value={sportKey} onChange={(e) => setSportKey(e.target.value)}>
                <option value="">Elige…</option>
                {grouped.map(([group, list]) => (
                  <optgroup key={group} label={group}>
                    {list.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn btn-primary" type="button" disabled={!sportKey || loading} onClick={search}>
                {loading ? <RefreshCw className="spin" aria-hidden width={15} height={15} /> : <Search aria-hidden width={15} height={15} />}
                {loading ? " Buscando…" : " Buscar cuotas"}
              </button>
            </div>
          </div>
        )}
        {quota && (
          <p style={{ fontSize: 11.5, color: "var(--faint)", margin: 0 }}>
            Cuota de la API: {quota.used ?? "—"} usadas · {quota.remaining ?? "—"} restantes este mes.
          </p>
        )}
      </div>

      {games && games.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {games.map((g) => {
            const best = bestPrices(g);
            return (
              <div className="settle-item" key={g.id}>
                <div className="si-head">
                  <span className="si-ev">
                    {g.home_team} vs {g.away_team}
                  </span>
                </div>
                <div className="si-meta">
                  {g.sport_title} · inicio <span className="num">{time(g.commence_time)}</span>{" "}
                  {new Date(g.commence_time).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  {" · "}
                  {g.bookmakers.length} casas comparadas
                </div>
                <div className="settle-controls" style={{ flexWrap: "wrap" }}>
                  {Object.entries(best).map(([name, { price, bookmaker }]) => (
                    <button
                      key={name}
                      className="res-btn"
                      type="button"
                      title={`Mejor precio: ${bookmaker}`}
                      onClick={() => useOutcome(g, name, price)}
                    >
                      {name} · <span className="num">{price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
