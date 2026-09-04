import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DEMO_MODE } from "@/lib/api";

type Mode = "login" | "signup";

export function Login() {
  const { signIn, signUp } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/picks";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setBusy(true);
    if (mode === "login") {
      const { error } = await signIn(email.trim(), password);
      setBusy(false);
      if (error) setError(error);
      else nav(from, { replace: true });
    } else {
      const { error, needsConfirm } = await signUp(
        email.trim(),
        password,
        displayName.trim() || email.split("@")[0],
      );
      setBusy(false);
      if (error) setError(error);
      else if (needsConfirm) setConfirmSent(true);
      else nav(from, { replace: true });
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link to="/" className="brand">
          <span className="dot" aria-hidden />
          FamilyPicks
        </Link>
        <ThemeToggle />
      </div>

      <div className="auth-center">
        <div className="auth-card">
          {confirmSent ? (
            <>
              <MailCheck aria-hidden style={{ color: "var(--primary)", width: 26, height: 26, marginBottom: 10 }} />
              <h1>Revisa tu correo</h1>
              <p className="sub">
                Te enviamos un enlace de confirmación a <b>{email}</b>. Ábrelo para
                activar tu cuenta y podrás entrar.
              </p>
              <button className="btn btn-ghost" type="button" onClick={() => { setConfirmSent(false); setMode("login"); }}>
                Volver a entrar
              </button>
            </>
          ) : (
            <>
              <h1>{mode === "login" ? "Entrar" : "Crear cuenta"}</h1>
              <p className="sub">
                {mode === "login"
                  ? "Accede para ver tus picks y tu plan."
                  : "El plan gratis no pide tarjeta."}
              </p>

              <div className="auth-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  onClick={() => { setMode("login"); setError(null); }}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  onClick={() => { setMode("signup"); setError(null); }}
                >
                  Crear cuenta
                </button>
              </div>

              {error && <div className="auth-error" role="alert">{error}</div>}
              {DEMO_MODE && (
                <div className="auth-error" style={{ background: "var(--pending-bg)", color: "var(--pending)" }}>
                  Modo demo: Supabase no está conectado, así que el login no puede
                  autenticar de verdad.
                </div>
              )}

              <form className="form-grid" onSubmit={submit} noValidate>
                {mode === "signup" && (
                  <div className="field">
                    <label htmlFor="name">Nombre</label>
                    <input
                      id="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Cómo te llamamos"
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                  />
                </div>
                <div className="field">
                  <label htmlFor="password">Contraseña</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  {mode === "signup" && <span className="hint">Al menos 6 caracteres.</span>}
                </div>

                <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 4 }}>
                  {busy ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="auth-foot">18+ · Juega con responsabilidad</p>
    </div>
  );
}
