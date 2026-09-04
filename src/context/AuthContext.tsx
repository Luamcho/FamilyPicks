import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
}

interface AuthResult {
  error: string | null;
}
interface SignUpResult extends AuthResult {
  needsConfirm: boolean;
}

interface AuthCtx extends AuthState {
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  loading: false,
  session: null,
  user: null,
  profile: null,
  signIn: async () => ({ error: "Supabase no está configurado" }),
  signUp: async () => ({ error: "Supabase no está configurado", needsConfirm: false }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (m.includes("already registered") || m.includes("user already exists"))
    return "Ya existe una cuenta con ese email.";
  if (m.includes("password") && (m.includes("6") || m.includes("short")))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("unable to validate email") || (m.includes("email") && m.includes("invalid")))
    return "Ese email no parece válido.";
  if (m.includes("rate limit")) return "Demasiados intentos. Prueba de nuevo en unos minutos.";
  if (m.includes("email not confirmed"))
    return "Confirma tu email primero (revisa la bandeja de entrada).";
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: isSupabaseConfigured,
    session: null,
    user: null,
    profile: null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const client = supabase;
    let alive = true;

    async function loadProfile(userId: string): Promise<Profile | null> {
      const { data } = await client.from("profiles").select("*").eq("id", userId).single();
      return (data as Profile | null) ?? null;
    }

    async function apply(session: Session | null) {
      const profile = session?.user ? await loadProfile(session.user.id) : null;
      if (alive) setState({ loading: false, session, user: session?.user ?? null, profile });
    }

    client.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      apply(session);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return { error: "Supabase no está configurado" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  }

  async function signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<SignUpResult> {
    if (!supabase) return { error: "Supabase no está configurado", needsConfirm: false };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { error: translateAuthError(error.message), needsConfirm: false };
    return { error: null, needsConfirm: !data.session };
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (!supabase || !state.user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", state.user.id).single();
    setState((s) => ({ ...s, profile: (data as Profile | null) ?? null }));
  }

  return (
    <Ctx.Provider value={{ ...state, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
