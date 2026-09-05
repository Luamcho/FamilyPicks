import { useState } from "react";
import { Bookmark, Share2, ShieldCheck, Sparkles } from "lucide-react";
import type { Pick } from "@/lib/types";
import { odds, relative, time } from "@/lib/format";
import {
  ConfidenceMeter,
  OddsPill,
  SportIcon,
  StatusBadge,
} from "./bits";

export function PickCard({ pick }: { pick: Pick }) {
  const [saved, setSaved] = useState(false);

  const featured = pick.status === "pending" && (pick.confidence ?? 0) >= 4;
  const publishedInfo =
    pick.status === "pending"
      ? `Publicado ${time(pick.published_at)}`
      : pick.closing_odds != null
        ? `Cierre ${odds(pick.closing_odds)}`
        : "Registrado antes del inicio";

  return (
    <article
      className={`pick${featured ? " pick--featured" : ""}`}
      data-status={pick.status}
    >
      <div className="pk-meta">
        <span className="sport">
          <SportIcon slug={pick.sport_slug} /> {pick.competition}
        </span>
        {pick.source === "ai" && (
          <span className="badge badge--ai" title="Sugerido por IA">
            <Sparkles aria-hidden /> IA
          </span>
        )}
        <time>{relative(pick.published_at)}</time>
      </div>
      <div className="pk-event">{pick.event}</div>
      <div className="pk-sel">
        Mercado: <b>{pick.selection}</b>
      </div>
      <div className="pk-data">
        <OddsPill value={pick.odds} closing={pick.closing_odds} />
        <span className="stake">Stake {pick.stake}/10</span>
        <ConfidenceMeter value={pick.confidence} />
      </div>
      <div className="pk-foot">
        <ShieldCheck className="verif" aria-label="Publicado antes del inicio" />
        {publishedInfo}
        {pick.status === "pending" ? (
          <span className="acts">
            <button
              className="icbtn"
              type="button"
              aria-pressed={saved}
              aria-label={saved ? "Quitar de guardados" : "Guardar pick"}
              onClick={() => setSaved((s) => !s)}
            >
              <Bookmark aria-hidden fill={saved ? "currentColor" : "none"} />
            </button>
            <button className="icbtn" type="button" aria-label="Compartir pick">
              <Share2 aria-hidden />
            </button>
          </span>
        ) : (
          <span style={{ marginLeft: "auto" }}>
            <StatusBadge status={pick.status} resultUnits={pick.result_units} />
          </span>
        )}
      </div>
    </article>
  );
}
