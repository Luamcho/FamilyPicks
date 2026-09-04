import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, CreditCard, ShieldCheck, LogOut, Bell, LayoutDashboard } from "lucide-react";
import { usePlan } from "@/context/PlanContext";
import { useAuth } from "@/context/AuthContext";
import { useIsAdmin } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/api";
import type { PlanTier } from "@/lib/types";

const PLAN_NAME: Record<PlanTier, string> = {
  free: "Gratis",
  premium: "Premium",
  vip: "VIP",
};
const PLAN_DESC: Record<PlanTier, string> = {
  free: "Picks con 24 h de retraso · 1 deporte · histórico completo.",
  premium: "Todos los picks en tiempo real · todos los deportes · alertas por email.",
  vip: "Todo Premium + push y Telegram · picks de stake alto · cuota de cierre registrada.",
};

export function Account() {
  const { plan: demoPlan } = usePlan();
  const { user, profile, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const nav = useNavigate();

  if (!DEMO_MODE && loading) {
    return <div className="page-pad" style={{ color: "var(--muted)" }}>Cargando…</div>;
  }

  if (!DEMO_MODE && !user) {
    return (
      <div className="page-pad content-narrow" style={{ maxWidth: 420, textAlign: "center", paddingTop: 60 }}>
        <CreditCard aria-hidden style={{ color: "var(--primary)", width: 28, height: 28, marginBottom: 12 }} />
        <h2 style={{ fontFamily: "var(--font-display)", margin: "0 0 8px" }}>No has iniciado sesión</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px" }}>
          Entra o crea una cuenta gratis para ver tu plan y tus picks guardados.
        </p>
        <Link className="btn btn-primary" to="/entrar">
          Entrar / crear cuenta
        </Link>
      </div>
    );
  }

  const plan = DEMO_MODE ? demoPlan : (profile?.plan ?? "free");

  async function handleSignOut() {
    await signOut();
    nav("/");
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

      <section className="card" style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <CreditCard aria-hidden style={{ color: "var(--primary)" }} />
          <div style={{ flex: "1 1 200px" }}>
            <div style={{ font: "700 16px/1 var(--font-display)" }}>
              Plan {PLAN_NAME[plan]}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              {PLAN_DESC[plan]}
            </div>
          </div>
          {plan !== "vip" && (
            <a className="btn btn-primary btn-sm" href="/#planes">
              Mejorar plan
            </a>
          )}
        </div>
        {DEMO_MODE && (
          <p style={{ fontSize: 12, color: "var(--faint)", margin: 0 }}>
            En modo demo el plan se cambia con el selector "Demo" de la barra
            superior. Con la cuenta real vendría de tu suscripción.
          </p>
        )}
      </section>

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
