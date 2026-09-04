import { useAuth } from "@/context/AuthContext";
import { DEMO_MODE } from "./api";

/** En modo demo el panel es accesible directamente. Con Supabase conectado,
 *  requiere una sesión cuyo perfil tenga role = 'admin'. */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { loading, profile } = useAuth();
  if (DEMO_MODE) return { isAdmin: true, loading: false };
  return { isAdmin: profile?.role === "admin", loading };
}
