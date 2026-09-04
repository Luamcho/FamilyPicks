import { CheckCircle2, CreditCard, ShieldCheck, LogOut, Bell } from "lucide-react";
import { usePlan } from "@/context/PlanContext";
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
  const { plan } = usePlan();

  return (
    <div className="page-pad content-narrow" style={{ display: "grid", gap: 18 }}>
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
          <span
            className="badge badge--win"
            style={{ marginLeft: "auto" }}
          >
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
        onClick={() => alert("Autenticación pendiente de conectar con Supabase.")}
      >
        <LogOut aria-hidden width={15} height={15} /> Cerrar sesión
      </button>
    </div>
  );
}
