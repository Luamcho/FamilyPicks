import { NavLink, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, PlusCircle, List, Radar, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useIsAdmin } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/api";

export function AdminLayout() {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "60dvh", color: "var(--muted)" }}>
        Comprobando permisos…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-display)" }}>Panel restringido</h1>
        <p style={{ color: "var(--muted)" }}>
          El panel del tipster solo está disponible para la cuenta de administración.
        </p>
        <Link className="btn btn-ghost" to="/entrar">
          <ArrowLeft aria-hidden width={15} height={15} /> Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/picks" className="brand">
          <span className="dot" aria-hidden />
          FamilyPicks
        </Link>
        <div className="admin-tag">Panel del tipster</div>
        <nav aria-label="Panel">
          <NavLink to="/admin" end className={({ isActive }) => `nav-i${isActive ? " active" : ""}`}>
            <LayoutDashboard aria-hidden /> Resumen
          </NavLink>
          <NavLink to="/admin/cuotas" className={({ isActive }) => `nav-i${isActive ? " active" : ""}`}>
            <Radar aria-hidden /> Cuotas
          </NavLink>
          <NavLink to="/admin/nuevo" className={({ isActive }) => `nav-i${isActive ? " active" : ""}`}>
            <PlusCircle aria-hidden /> Publicar pick
          </NavLink>
          <NavLink to="/admin/picks" className={({ isActive }) => `nav-i${isActive ? " active" : ""}`}>
            <List aria-hidden /> Todos los picks
          </NavLink>
        </nav>
        <div className="side-foot">
          <Link to="/picks" style={{ color: "var(--muted)" }}>
            ← Volver al feed
          </Link>
        </div>
      </aside>

      <main className="app-main">
        {DEMO_MODE && (
          <div className="demo-strip">
            Modo demo · los picks que publiques o liquides se guardan solo en este
            navegador.
          </div>
        )}
        <div className="topbar">
          <span className="m-brand">
            <span className="dot" aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--primary)", display: "inline-block" }} />
            Panel
          </span>
          <span className="spacer" />
          <ThemeToggle />
        </div>
        <nav className="admin-mobnav" aria-label="Panel (móvil)">
          <NavLink to="/admin" end className={({ isActive }) => `chip${isActive ? " chip-on" : ""}`}>
            Resumen
          </NavLink>
          <NavLink to="/admin/cuotas" className={({ isActive }) => `chip${isActive ? " chip-on" : ""}`}>
            Cuotas
          </NavLink>
          <NavLink to="/admin/nuevo" className={({ isActive }) => `chip${isActive ? " chip-on" : ""}`}>
            Publicar
          </NavLink>
          <NavLink to="/admin/picks" className={({ isActive }) => `chip${isActive ? " chip-on" : ""}`}>
            Todos
          </NavLink>
        </nav>
        <Outlet />
      </main>
    </div>
  );
}
