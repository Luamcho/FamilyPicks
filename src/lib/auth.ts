import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

interface AdminState {
  isAdmin: boolean;
  loading: boolean;
}

/** En modo demo el panel es accesible directamente. Con Supabase conectado,
 *  requiere una sesión cuyo perfil tenga role = 'admin'. */
export function useIsAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({
    isAdmin: !isSupabaseConfigured,
    loading: isSupabaseConfigured,
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let alive = true;
    const client = supabase;

    async function check() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        if (alive) setState({ isAdmin: false, loading: false });
        return;
      }
      const { data } = await client
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (alive)
        setState({
          isAdmin: (data as { role?: string } | null)?.role === "admin",
          loading: false,
        });
    }

    check();
    const { data: sub } = client.auth.onAuthStateChange(() => check());
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
