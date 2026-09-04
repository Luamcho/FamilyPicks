import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Kind = "ok" | "err";
interface ToastItem {
  id: number;
  msg: string;
  kind: Kind;
}

const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((msg: string, kind: Kind = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3500,
    );
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toaster" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
