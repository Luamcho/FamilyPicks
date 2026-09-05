import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldCheck, LogOut, Bell, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/api";

export function Account() {
  const { user, profile, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const nav = useNavigate();

  if (!DEMO_MODE && loading) {
    return <div className="page-pad" style={{ color: "var(--muted)" }}>Cargando…</div>;
  }

  if (!DEMO_MODE && !user) {
    return (
      <div className="page-pad content-narrow" style={{ maxWidth: 420, textAlign: "center", paddingTop: 60 }}>
        <User aria-hidden style={{ color: "var(--primary)", width: 28, height: 28, marginBottom: 12 }} />
        <h2 style={{ fontFamily: "var(--font-display)", margin: "0 0 8px" }}>No has iniciado sesión</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px" }}>
          Entra con tu cuenta para ver tus picks.
        </p>
        <Link className="btn btn-primary" to="/entrar">
          Entrar
        </Link>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    nav("/entrar");
  }

  return (
    <div className="page-pad content-narrow" style={{ display: "grid", gap: 18 }}>
      {!DEMO_MODE && user && (
        <section className="card" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#0EA5E9,#6366F1)", flex: "none" }} />
          <div style={{ flex: "1 1 200px" }}>
            <div style={{ font: "700 15px/1 var(--font-display)" }}>
              {profile?.display_name ?? user.email}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>{user.email}</div>
          </div>
          {isAdmin && (
            <Link className="btn btn-ghost btn-sm" to="/admin">
              <LayoutDashboard aria-hidden width={15} height={15} /> Panel del tipster
            </Link>
          )}
        </section>
      )}

      <section className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck aria-hidden style={{ color: "var(--win)" }} width={18} height={18} />
          <span style={{ font: "600 14px/1 var(--font-display)" }}>Verificación de edad</span>
          <span className="badge badge--win" style={{ marginLeft: "auto" }}>
            <CheckCircle2 aria-hidden /> Verificado 18+
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          Confirmaste ser mayor de edad al entrar. Puedes revocarlo borrando los
          datos del sitio en tu navegador.
        </p>
      </section>

      <section className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bell aria-hidden width={18} height={18} style={{ color: "var(--muted)" }} />
          <span style={{ font: "600 14px/1 var(--font-display)" }}>Juego responsable</span>
        </div>
        <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
          Recordatorio de tiempo de sesión
          <input type="checkbox" defaultChecked aria-label="Recordatorio de tiempo de sesión" />
        </label>
        <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
          Resumen semanal de resultados por email
          <input type="checkbox" aria-label="Resumen semanal por email" />
        </label>
        <p style={{ fontSize: 12, color: "var(--faint)", margin: 0 }}>
          ¿Necesitas ayuda? <a href="#">Recursos de juego responsable</a> ·{" "}
          <a href="#">Autoexclusión</a>
        </p>
      </section>

      <button
        className="btn btn-ghost"
        type="button"
        style={{ justifySelf: "start" }}
        onClick={DEMO_MODE ? () => alert("Autenticación pendiente en modo demo (sin Supabase conectado).") : handleSignOut}
      >
        <LogOut aria-hidden width={15} height={15} /> Cerrar sesión
      </button>
    </div>
  );
}
