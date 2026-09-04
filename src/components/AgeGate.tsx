import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

const KEY = "fp-age-ok";

export function AgeGate() {
  const [state, setState] = useState<"checking" | "ask" | "ok" | "blocked">(
    "checking",
  );

  useEffect(() => {
    let ok = false;
    try {
      ok = localStorage.getItem(KEY) === "1";
    } catch {
      /* noop */
    }
    setState(ok ? "ok" : "ask");
  }, []);

  useEffect(() => {
    if (state === "ask" || state === "blocked") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [state]);

  if (state === "checking" || state === "ok") return null;

  if (state === "blocked") {
    return (
      <div className="ag-blocked" role="alert">
        <div>
          <h2>Este sitio es solo para mayores de 18 años</h2>
          <p>
            Si crees que el juego puede ser un problema para ti o para alguien
            cercano, busca ayuda en los recursos de juego responsable de tu país.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="agegate" role="dialog" aria-modal="true" aria-labelledby="ag-title">
      <div className="ag-box">
        <ShieldAlert aria-hidden />
        <h2 id="ag-title">¿Tienes 18 años o más?</h2>
        <p>
          FamilyPicks publica contenido sobre apuestas deportivas. El acceso está
          reservado a personas mayores de edad en su jurisdicción.
        </p>
        <div className="ag-actions">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              try {
                localStorage.setItem(KEY, "1");
              } catch {
                /* noop */
              }
              setState("ok");
            }}
          >
            Sí, tengo 18+
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setState("blocked")}
          >
            Salir
          </button>
        </div>
        <a className="link" href="#juego-responsable">
          Juega con responsabilidad
        </a>
      </div>
    </div>
  );
}
