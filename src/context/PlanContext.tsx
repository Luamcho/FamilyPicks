import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PlanTier } from "@/lib/types";

// En modo demo el plan se elige a mano para ver el comportamiento del feed.
// Con Supabase conectado vendría de profiles.plan del usuario autenticado.
const KEY = "fp-demo-plan";

interface PlanCtx {
  plan: PlanTier;
  setPlan: (p: PlanTier) => void;
}
const Ctx = createContext<PlanCtx>({ plan: "free", setPlan: () => {} });

function read(): PlanTier {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "free" || v === "premium" || v === "vip") return v;
  } catch {
    /* noop */
  }
  return "free";
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<PlanTier>(() => read());
  const setPlan = useCallback((p: PlanTier) => {
    setPlanState(p);
    try {
      localStorage.setItem(KEY, p);
    } catch {
      /* noop */
    }
  }, []);
  const value = useMemo(() => ({ plan, setPlan }), [plan, setPlan]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePlan = () => useContext(Ctx);
