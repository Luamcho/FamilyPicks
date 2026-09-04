import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, BarChart3, Check, Crown } from "lucide-react";
import { BankrollChart } from "@/components/BankrollChart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatusBadge } from "@/components/bits";
import { useAuth } from "@/context/AuthContext";
import { DEMO_MODE, getBankroll, getSettledHistory, getStatsOverview } from "@/lib/api";
import { count, monthsSince, odds, pct, units } from "@/lib/format";
import type { BankrollPoint, Pick, StatsOverview } from "@/lib/types";

const FAQ = [
  {
    q: "¿Garantizáis ganancias?",
    a: "No, y desconfía de quien lo haga. Apostar conlleva riesgo de perder dinero. Lo que ofrecemos es un método consistente y un historial completo y auditable para que decidas con datos, no con promesas.",
  },
  {
    q: "¿Cómo sé que el historial es real?",
    a: "Cada pick se publica con fecha y hora antes del evento, y se registra la cuota de cierre. El histórico es público al completo —incluidas las rachas malas— y verificado por un tercero desde el primer día.",
  },
  {
    q: "¿Apuesto a través de FamilyPicks?",
    a: "No. Nosotros solo publicamos el análisis. Tú apuestas en la casa que ya uses. No gestionamos dinero de apuestas ni recibimos comisión de ninguna casa.",
  },
  {
    q: "¿Qué stake debería usar?",
    a: "Cada pick lleva un stake de 1 a 10 que refleja mi confianza. Tú decides cuánto vale una unidad para ti: una cifra que puedas perder sin que afecte a tu día a día. Nunca persigas pérdidas.",
  },
  {
    q: "¿Puedo cancelar la suscripción?",
    a: "Sí, en cualquier momento y en dos clics desde tu cuenta. Mantienes el acceso hasta el final del periodo que ya has pagado.",
  },
];

const PLANS = [
  {
    name: "Gratis",
    price: "0 €",
    period: "",
    rec: false,
    cta: "Empezar gratis",
    features: ["Picks con 24 h de retraso", "Un deporte a elegir", "Track record completo"],
  },
  {
    name: "Premium",
    price: "14 €",
    period: "/mes · IVA incl.",
    rec: true,
    cta: "Probar Premium",
    features: [
      "Todos los picks en tiempo real",
      "Todos los deportes y mercados",
      "Alertas por email",
    ],
  },
  {
    name: "VIP",
    price: "39 €",
    period: "/mes · IVA incl.",
    rec: false,
    cta: "Elegir VIP",
    features: [
      "Todo Premium + push y Telegram",
      "Picks de stake alto y valores especiales",
      "Cuota de cierre registrada",
    ],
  },
];

export function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [bankroll, setBankroll] = useState<BankrollPoint[] | null>(null);
  const [recent, setRecent] = useState<Pick[]>([]);

  useEffect(() => {
    let alive = true;
    getStatsOverview().then((s) => alive && setStats(s));
    getBankroll("month").then((b) => alive && setBankroll(b));
    getSettledHistory().then((h) => alive && setRecent(h.slice(0, 3)));
    return () => {
      alive = false;
    };
  }, []);

  const loading = stats === null;
  const hasHistory = !loading && stats.total_picks > 0;
  const drawdown = bankroll ? minCumulative(bankroll) : 0;

  return (
    <div className="mkt">
      <header className="mkt-nav">
        <div className="nav-in">
          <span className="brand">
            <span className="dot" aria-hidden />
            FamilyPicks
          </span>
          <nav className="nav-links" aria-label="Secciones">
            <a href="#como">Cómo funciona</a>
            <a href="#historial">Historial</a>
            <a href="#planes">Planes</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="nav-cta">
            <ThemeToggle />
            <Link
              className="btn btn-ghost btn-sm ghost-link"
              to={!DEMO_MODE && user ? "/cuenta" : "/entrar"}
            >
              {!DEMO_MODE && user ? "Mi cuenta" : "Entrar"}
            </Link>
            <Link className="btn btn-primary btn-sm cta" to="/picks">
              Ver picks gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <div className="hero wrap">
          <div className="hero-grid">
            <div>
              <span className="eyebrow">
                <ShieldCheck aria-hidden /> Historial auditado y público
              </span>
              <h1>Predicciones deportivas con un historial que puedes comprobar</h1>
              <p className="lede">
                Un solo tipster. Cada pick se publica antes del inicio, con cuota y
                stake, y entra al histórico ganes o pierdas. Sin combinadas mágicas
                ni "picks del 100 %".
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary cta" to="/picks">
                  Ver picks gratis
                </Link>
                <a className="btn btn-ghost" href="#historial">
                  Ver el historial completo
                </a>
                <span className="fine">18+ · Sin tarjeta para el plan gratis</span>
              </div>
            </div>

            <aside className="proof" aria-label="Rendimiento verificado">
              <div className="proof-top">
                <BarChart3 aria-hidden /> Track record del canal
              </div>

              {loading && <p className="sub">Cargando datos…</p>}

              {!loading && !hasHistory && (
                <div style={{ padding: "10px 0" }}>
                  <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 10px" }}>
                    El historial arranca ahora. Cada pick que publique entra aquí —
                    acierto o fallo— y queda a la vista de todos.
                  </p>
                  <p style={{ fontSize: 12.5, color: "var(--faint)", margin: 0 }}>
                    Sin números inventados. Vuelve en unos días para ver la curva.
                  </p>
                </div>
              )}

              {hasHistory && bankroll && bankroll.length > 1 && (
                <BankrollChart data={bankroll} />
              )}

              {hasHistory && (
                <>
                  <div className="proof-stats">
                    <div>
                      <div className={`v ${(stats.roi_pct ?? 0) >= 0 ? "pos" : "neg"}`}>
                        {pct(stats.roi_pct)}
                      </div>
                      <div className="l">ROI</div>
                    </div>
                    <div>
                      <div className={`v ${(stats.profit_units ?? 0) >= 0 ? "pos" : "neg"}`}>
                        {units(stats.profit_units, true)}
                      </div>
                      <div className="l">Beneficio</div>
                    </div>
                    <div>
                      <div className="v">{count(stats.total_picks)}</div>
                      <div className="l">Picks</div>
                    </div>
                    <div>
                      <div className="v">
                        {stats.hit_rate_pct != null ? `${stats.hit_rate_pct} %` : "—"}
                      </div>
                      <div className="l">Acierto</div>
                    </div>
                  </div>
                  <p className="proof-foot">
                    <a href="#historial">Ver histórico</a>. Rendimiento pasado, no
                    garantiza resultados.
                  </p>
                </>
              )}
            </aside>
          </div>
        </div>

        {hasHistory && (
          <div className="strip">
            <div className="strip-in">
              <Metric v={pct(stats.roi_pct)} l="ROI" />
              <Metric
                v={stats.yield_pct != null ? `${stats.yield_pct} %` : "—"}
                l="Yield"
              />
              <Metric v={count(stats.total_picks)} l="Picks registrados" />
              <Metric v={`${drawdown < 0 ? drawdown.toFixed(0) : "0"} u`} l="Drawdown máx." />
              <Metric
                v={
                  stats.first_pick_at
                    ? new Date(stats.first_pick_at).toLocaleDateString("es-ES", {
                        month: "short",
                        year: "numeric",
                      })
                    : "—"
                }
                l="Primer pick"
              />
            </div>
          </div>
        )}

        <section className="blk wrap" id="como">
          <h2>Cómo funciona</h2>
          <p className="intro">
            Nada de cajas negras. El proceso es el mismo para cada pick y queda
            registrado.
          </p>
          <div className="steps">
            <Step n="01" t="Publico el pick antes del inicio">
              Evento, mercado, selección, cuota a la que entro y stake sobre 10. Con
              marca de tiempo.
            </Step>
            <Step n="02" t="Se registra la cuota de cierre">
              Al empezar el partido guardo la cuota de cierre de Pinnacle. Es la
              prueba de que había valor.
            </Step>
            <Step n="03" t="Entra al histórico, siempre">
              Acierto, fallo o nulo: todo suma al track record público. No se borra
              ni se esconde nada.
            </Step>
          </div>
        </section>

        <section className="blk wrap" id="historial">
          <h2>El historial, en abierto</h2>
          <p className="intro">
            La curva de banca y los últimos picks resueltos. El histórico completo,
            pick a pick, está en la sección de estadísticas.
          </p>
          <div className="proof2">
            <div className="panel">
              <h3>Evolución del bankroll</h3>
              <p className="sub">Unidades acumuladas sobre una banca fija.</p>
              {loading ? (
                <p className="sub">Cargando…</p>
              ) : bankroll && bankroll.length > 1 ? (
                <>
                  <BankrollChart data={bankroll} />
                  <figcaption>
                    {units(stats?.profit_units ?? 0, true) + " "}
                    acumulado · drawdown máximo{" "}
                    <b className="neg">{drawdown < 0 ? drawdown.toFixed(0) : "0"} u</b> ·{" "}
                    {count(stats?.total_picks ?? 0)} apuestas.
                  </figcaption>
                </>
              ) : (
                <p className="sub">
                  La curva aparecerá aquí en cuanto haya picks resueltos.
                </p>
              )}
            </div>
            <div>
              <div className="panel" style={{ height: "100%" }}>
                <h3>Últimos picks resueltos</h3>
                <p className="sub">Incluye los que salieron mal. Así es esto.</p>
                {recent.length === 0 ? (
                  <p className="sub" style={{ marginTop: 12 }}>
                    Aún no hay picks resueltos.
                  </p>
                ) : (
                  <div className="picks-mini">
                    {recent.map((p) => (
                      <article key={p.id} className="pk-mini" data-r={p.status}>
                        <div className="pk-t">
                          <span>{p.competition}</span>
                          <time>resuelto</time>
                        </div>
                        <div className="pk-e">{p.event}</div>
                        <div className="pk-s">
                          Mercado: <b>{p.selection}</b>
                        </div>
                        <div className="pk-b">
                          <span className="odds">{odds(p.odds)}</span>
                          <span style={{ marginLeft: "auto" }}>
                            <StatusBadge
                              status={p.status}
                              resultUnits={p.result_units}
                            />
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="blk wrap" id="quien">
          <h2>Quién está detrás</h2>
          <p className="intro">Una persona, no una redacción de veinte "expertos".</p>
          <div className="who">
            <div className="who-card">
              <div className="who-av" aria-hidden />
              <div className="who-name">
                FamilyPicks <ShieldCheck aria-label="Historial auditado y público" />
              </div>
              <div className="who-role">Tipster · fútbol europeo y NBA</div>
              {hasHistory && (
                <div className="who-mini">
                  <div>
                    <span className={`v ${(stats.roi_pct ?? 0) >= 0 ? "pos" : "neg"}`}>
                      {pct(stats.roi_pct)}
                    </span>
                    <span className="l">ROI</span>
                  </div>
                  <div>
                    <span className="v">{count(stats.total_picks)}</span>
                    <span className="l">Picks</span>
                  </div>
                  <div>
                    <span className="v">{monthsSince(stats.first_pick_at)}</span>
                    <span className="l">Activo</span>
                  </div>
                </div>
              )}
            </div>
            <div className="who-text">
              <p>
                Llevo años apostando a <b>valor</b>: comparo mi precio con el de
                mercado y solo publico cuando creo que la cuota es más alta de lo que
                debería. Nada de corazonadas ni de "hoy toca ganar lo perdido".
              </p>
              <p>
                Uso <b>stakes de 1 a 10</b> sobre una banca fija y registro la{" "}
                <b>cuota de cierre</b> de cada pick. Si mis picks batían al cierre de
                forma consistente, el resultado a largo plazo llega solo. Y si dejan
                de hacerlo, se verá en el mismo histórico.
              </p>
              <p>
                El objetivo no es que apuestes más, es que apuestes <b>mejor</b> y
                dentro de tus límites.
              </p>
            </div>
          </div>
        </section>

        <section className="blk wrap" id="planes">
          <h2>Planes</h2>
          <p className="intro">
            Se diferencian por cuándo y cómo recibes los picks. El historial completo
            es público en todos.
          </p>
          <div className="plans">
            {PLANS.map((p) => (
              <div key={p.name} className={`plan${p.rec ? " plan--rec" : ""}`}>
                <div className="p-name">
                  {p.name}
                  {p.rec && <span className="tag">Más elegido</span>}
                  {p.name === "VIP" && <Crown aria-hidden width={15} height={15} style={{ color: "var(--vip)" }} />}
                </div>
                <div className="p-price">
                  {p.price} {p.period && <small>{p.period}</small>}
                </div>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>
                      <Check aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
                <Link className={`btn ${p.rec ? "btn-primary" : "btn-ghost"}`} to="/picks">
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "18px 0 0" }}>
            Cancela cuando quieras, en dos clics. Sin permanencia ni renovación oculta.
          </p>
        </section>

        <section className="blk wrap" id="faq">
          <h2>Preguntas frecuentes</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="wrap">
          <div className="final">
            <h2>Empieza con el plan gratis</h2>
            <p>
              Ves los picks con 24 h de retraso y el historial completo desde el
              primer día. Sin tarjeta.
            </p>
            <Link className="btn btn-primary cta" to="/picks">
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </main>

      <footer className="mkt-footer" id="juego-responsable">
        <div className="wrap">
          <div className="f-rg">
            <span className="b18">18+</span>
            <span>Juega con responsabilidad.</span>
            <a href="#" style={{ display: "inline", margin: 0 }}>
              Recursos de ayuda
            </a>
            <span aria-hidden>·</span>
            <a href="#" style={{ display: "inline", margin: 0 }}>
              Autoexclusión
            </a>
            <span aria-hidden>·</span>
            <span>Establece límites de tiempo y dinero antes de empezar.</span>
          </div>
          <div className="f-cols">
            <div>
              <span className="brand" style={{ marginBottom: 10 }}>
                <span className="dot" aria-hidden /> FamilyPicks
              </span>
              <p style={{ maxWidth: "36ch" }}>
                Predicciones deportivas de un tipster, con historial verificado. No
                somos una casa de apuestas.
              </p>
            </div>
            <div>
              <strong>Producto</strong>
              <a href="#historial">Historial</a>
              <a href="#planes">Planes</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <strong>Legal</strong>
              <a href="#">Términos</a>
              <a href="#">Privacidad</a>
              <a href="#">Juego responsable</a>
            </div>
          </div>
          <p className="f-legal">
            Las predicciones no garantizan resultados. Apostar conlleva riesgo de
            pérdida económica; juega solo con dinero que puedas permitirte perder.
            Contenido reservado a mayores de 18 años. FamilyPicks no acepta apuestas
            ni gestiona fondos de apuestas. Rendimiento pasado; no es indicativo de
            resultados futuros.
          </p>
        </div>
      </footer>
    </div>
  );
}

function minCumulative(points: BankrollPoint[]): number {
  // drawdown máximo = mayor caída desde un pico anterior
  let peak = points.length ? points[0].cumulative_units : 0;
  let dd = 0;
  for (const p of points) {
    peak = Math.max(peak, p.cumulative_units);
    dd = Math.min(dd, p.cumulative_units - peak);
  }
  return Math.round(dd);
}

function Metric({ v, l }: { v: string; l: string }) {
  return (
    <div className="m">
      <span className="v">{v}</span>
      <span className="l">{l}</span>
    </div>
  );
}

function Step({ n, t, children }: { n: string; t: string; children: ReactNode }) {
  return (
    <div className="step">
      <span className="n">{n}</span>
      <h3>{t}</h3>
      <p>{children}</p>
    </div>
  );
}
