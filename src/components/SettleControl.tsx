import { useState } from "react";
import type { PickStatus } from "@/lib/types";

interface Props {
  suggestedClosing?: number | null;
  onSettle: (status: PickStatus, closingOdds: number | null) => Promise<void> | void;
}

export function SettleControl({ suggestedClosing, onSettle }: Props) {
  const [closing, setClosing] = useState(
    suggestedClosing != null ? String(suggestedClosing) : "",
  );
  const [busy, setBusy] = useState<PickStatus | null>(null);

  async function run(status: PickStatus) {
    setBusy(status);
    try {
      const co = closing.trim() ? Number(closing.replace(",", ".")) : null;
      await onSettle(status, Number.isFinite(co as number) ? (co as number) : null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="settle-controls">
      <input
        className="close-odds"
        type="text"
        inputMode="decimal"
        value={closing}
        onChange={(e) => setClosing(e.target.value)}
        placeholder="Cierre"
        aria-label="Cuota de cierre"
      />
      <button
        className="res-btn win"
        type="button"
        disabled={busy !== null}
        onClick={() => run("won")}
      >
        {busy === "won" ? "…" : "Acierto"}
      </button>
      <button
        className="res-btn loss"
        type="button"
        disabled={busy !== null}
        onClick={() => run("lost")}
      >
        {busy === "lost" ? "…" : "Fallo"}
      </button>
      <button
        className="res-btn void"
        type="button"
        disabled={busy !== null}
        onClick={() => run("void")}
      >
        {busy === "void" ? "…" : "Nulo"}
      </button>
    </div>
  );
}
