import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { Target, ListChecks, BarChart3, UserRound, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { RgStrip, DemoBanner } from "./bits";
import { DEMO_MODE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/lib/auth";

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
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const { isAdmin } = useIsAdmin();
  const title = TITLES[pathname] ?? "FamilyPicks";

  // App privada de un solo usuario: sin sesión, no hay nada que ver.
  if (!DEMO_MODE && !loading && !user) {
    return <Navigate to="/entrar" state={{ from: pathname }} replace />;
  }
  if (!DEMO_MODE && loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100dvh", color: "var(--muted)" }}>
        Cargando…
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/picks" className="brand">
          <span className="dot" aria-hidden />
          FamilyPicks
        </NavLink>
        <nav aria-label="Principal">
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
          {isAdmin && (
            <>
              <NavLink to="/admin" style={{ color: "var(--primary)", fontWeight: 600 }}>
                <LayoutDashboard aria-hidden style={{ width: 13, height: 13, verticalAlign: -2 }} /> Panel del
                tipster →
              </NavLink>
              <br />
              <br />
            </>
          )}
          Uso privado · 18+ · Juega con responsabilidad.
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
          <ThemeToggle />
        </div>

        <Outlet />
        <RgStrip />
      </main>

      <nav className="bottomnav" aria-label="Principal (móvil)">
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
