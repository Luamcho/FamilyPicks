import type { ReactNode } from "react";
import {
  Check,
  Minus,
  X,
  Clock,
  Circle,
  CircleDot,
  Shield,
  Activity,
} from "lucide-react";
import type { PickStatus } from "@/lib/types";
import { units } from "@/lib/format";

export function SportIcon({ slug, className }: { slug: string; className?: string }) {
  const map: Record<string, typeof Circle> = {
    futbol: CircleDot,
    baloncesto: Circle,
    tenis: Circle,
    "futbol-americano": Shield,
  };
  const Cmp = map[slug] ?? Activity;
  return <Cmp className={className} aria-hidden />;
}

export function StatusBadge({
  status,
  resultUnits,
}: {
  status: PickStatus;
  resultUnits?: number | null;
}) {
  if (status === "pending") {
    return (
      <span className="badge badge--pending">
        <Clock aria-hidden /> Pendiente
      </span>
    );
  }
  if (status === "won") {
    return (
      <span className="badge badge--win">
        <Check aria-hidden /> {resultUnits != null ? units(resultUnits) : "Acierto"}
      </span>
    );
  }
  if (status === "lost") {
    return (
      <span className="badge badge--loss">
        <X aria-hidden /> {resultUnits != null ? units(resultUnits) : "Fallo"}
      </span>
    );
  }
  return (
    <span className="badge badge--push">
      <Minus aria-hidden /> Nulo · {units(0)}
    </span>
  );
}

export function ConfidenceMeter({ value }: { value: number | null }) {
  const v = value ?? 0;
  const label =
    v >= 5 ? "máxima" : v === 4 ? "alta" : v === 3 ? "media" : v <= 2 ? "baja" : "—";
  return (
    <span
      className="meter"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={v}
      aria-label={`Confianza: ${label}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= v ? "on" : undefined} />
      ))}
    </span>
  );
}

export function OddsPill({
  value,
  closing,
}: {
  value: number;
  closing?: number | null;
}) {
  let move: ReactNode = null;
  if (closing != null) {
    if (value > closing)
      move = (
        <>
          <span className="up" aria-hidden>
            ▲
          </span>
          <span className="sr-only">cuota mejor que el cierre</span>
        </>
      );
    else if (value < closing)
      move = (
        <>
          <span className="down" aria-hidden>
            ▼
          </span>
          <span className="sr-only">cuota peor que el cierre</span>
        </>
      );
  }
  return (
    <span className="odds">
      {move}
      {value.toFixed(2)}
    </span>
  );
}

export function RgStrip() {
  return (
    <div className="rg-strip" id="juego-responsable">
      <span className="b18">18+</span>
      <span>Juega con responsabilidad</span>
      <span aria-hidden>·</span>
      <a href="#">Recursos de ayuda</a>
      <span aria-hidden>·</span>
      <span>
        Las predicciones no garantizan resultados. Apostar conlleva riesgo de
        pérdida económica.
      </span>
    </div>
  );
}

export function DemoBanner() {
  return (
    <div
      style={{
        background: "var(--pending-bg)",
        color: "var(--pending)",
        borderBottom: "1px solid var(--border)",
        font: "600 12px/1.4 var(--font-display)",
        padding: "8px 18px",
        textAlign: "center",
      }}
    >
      Modo demo · datos de ejemplo. Conecta Supabase (VITE_SUPABASE_URL) para datos
      reales.
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Activity aria-hidden />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
