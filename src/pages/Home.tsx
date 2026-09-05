import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DEMO_MODE } from "@/lib/api";

/** App privada: "/" no es una landing pública, solo decide a dónde ir. */
export function Home() {
  const { user, loading } = useAuth();

  if (DEMO_MODE) return <Navigate to="/picks" replace />;
  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100dvh", color: "var(--muted)" }}>
        Cargando…
      </div>
    );
  }
  return <Navigate to={user ? "/picks" : "/entrar"} replace />;
}
