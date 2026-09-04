import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home,
  Target,
  ListChecks,
  BarChart3,
  UserRound,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { RgStrip, DemoBanner } from "./bits";
import { DEMO_MODE } from "@/lib/api";
import { usePlan } from "@/context/PlanContext";
import type { PlanTier } from "@/lib/types";

const NAV = [
  { to: "/picks", label: "Picks", icon: Target },
  { to: "/resultados", label: "Resultados", icon: ListChecks },
  { to: "/stats", label: "Estadísticas", short: "Stats", icon: BarChart3 },
  { to: "/cuenta", label: "Mi cuenta", short: "Cuenta", icon: UserRound },
];

const TITLES: Record<string, string> = {
  "/picks": "Picks",
  "/resultados": "Resultados",
  "/stats": "Estadísticas",
  "/cuenta": "Mi cuenta",
};

export function AppLayout() {
  const { plan, setPlan } = usePlan();
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? "FamilyPicks";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="dot" aria-hidden />
          FamilyPicks
        </NavLink>
        <nav aria-label="Principal">
          <NavLink to="/" end className="nav-i">
            <Home aria-hidden /> Inicio
          </NavLink>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-i${isActive ? " active" : ""}`}
            >
              <Icon aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <b>Plan {planLabel(plan)}</b>
          {plan === "free" ? " · picks con 24 h de retraso." : " · picks en tiempo real."}
          <br />
          18+ · Juega con responsabilidad.
        </div>
      </aside>

      <main className="app-main">
        {DEMO_MODE && <DemoBanner />}
        <div className="topbar">
          <span className="m-brand">
            <span
              className="dot"
              aria-hidden
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "var(--primary)",
                display: "inline-block",
              }}
            />
            FamilyPicks
          </span>
          <h1>{title}</h1>
          <span className="spacer" />
          {DEMO_MODE && (
            <label
              className="plan-pill"
              title="Plan de demostración: cambia lo que ves en el feed"
            >
              <span>Demo</span>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanTier)}
                aria-label="Plan de demostración"
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--text)",
                  font: "600 12px/1 var(--font-display)",
                }}
              >
                <option value="free">Gratis</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </label>
          )}
          <ThemeToggle />
        </div>

        <Outlet />
        <RgStrip />
      </main>

      <nav className="bottomnav" aria-label="Principal (móvil)">
        <NavLink to="/" end className={({ isActive }) => `bn-i${isActive ? " active" : ""}`}>
          <Home aria-hidden /> Inicio
        </NavLink>
        {NAV.map(({ to, label, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bn-i${isActive ? " active" : ""}`}
          >
            <Icon aria-hidden /> {short ?? label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function planLabel(p: PlanTier): string {
  return p === "free" ? "Gratis" : p === "premium" ? "Premium" : "VIP";
}
