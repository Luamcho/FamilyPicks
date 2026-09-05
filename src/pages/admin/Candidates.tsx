import { useEffect, useState } from "react";
import { Sparkles, Check, X, RefreshCw } from "lucide-react";
import { useToast } from "@/components/Toast";
import {
  approveCandidate,
  dismissCandidate,
  generatePicksNow,
  getPendingCandidates,
  type PickCandidate,
} from "@/lib/pickCandidates";
import { odds as fmtOdds, time, shortDate } from "@/lib/format";

export function AdminCandidates() {
  const toast = useToast();
  const [candidates, setCandidates] = useState<PickCandidate[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function load() {
    try {
      setCandidates(await getPendingCandidates());
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudieron cargar los candidatos", "err");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onGenerate() {
    setGenerating(true);
    try {
      const res = await generatePicksNow();
      if (res.candidates_count > 0) {
        toast(`${res.candidates_count} pick(s) nuevo(s) para revisar`);
      } else {
        toast(res.note ?? "No se encontraron picks para hoy", "err");
      }
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al generar picks", "err");
    } finally {
      setGenerating(false);
    }
  }

  async function onApprove(id: string) {
    setBusyId(id);
    try {
      await approveCandidate(id);
      toast("Pick publicado");
      setCandidates((prev) => prev?.filter((c) => c.id !== id) ?? null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo aprobar", "err");
    } finally {
      setBusyId(null);
    }
  }

  async function onDismiss(id: string) {
    setBusyId(id);
    try {
      await dismissCandidate(id);
      setCandidates((prev) => prev?.filter((c) => c.id !== id) ?? null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo descartar", "err");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2>Candidatos IA</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Cada día la automatización revisa los partidos con cuotas de Hard Rock Bet y
            propone picks aquí. Nada se publica hasta que apruebas uno.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={onGenerate} disabled={generating}>
          <RefreshCw aria-hidden width={15} height={15} /> {generating ? "Generando…" : "Generar ahora"}
        </button>
      </div>

      {candidates === null && <p className="sub">Cargando…</p>}

      {candidates && candidates.length === 0 && (
        <div className="card" style={{ textAlign: "center", color: "var(--muted)", padding: "32px 16px" }}>
          No hay candidatos pendientes. Dale a "Generar ahora" o espera a la corrida diaria.
        </div>
      )}

      {candidates?.map((c) => (
        <div key={c.id} className="card" style={{ display: "grid", gap: 10 }}>
          <div className="si-head">
            <span className="si-ev">{c.event}</span>
            <span className="badge badge--ai">
              <Sparkles aria-hidden width={12} height={12} /> IA
            </span>
          </div>
          <div className="si-meta">
            {c.sport_name} · {c.competition} · {shortDate(c.event_start_at)} {time(c.event_start_at)} · casa{" "}
            <span className="num">{c.bookmaker}</span>
          </div>
          <div className="settle-controls" style={{ flexWrap: "wrap" }}>
            <span className="res-btn" style={{ cursor: "default" }}>
              {c.market}: {c.selection} · <span className="num">{fmtOdds(c.odds)}</span>
            </span>
            <span className="res-btn" style={{ cursor: "default" }}>
              Stake {c.stake}/10 · Confianza {c.confidence ?? "—"}/5
            </span>
          </div>
          {c.analysis && <p className="sub" style={{ margin: 0 }}>{c.analysis}</p>}
          <div className="form-actions">
            <button
              className="btn btn-primary"
              type="button"
              disabled={busyId === c.id}
              onClick={() => onApprove(c.id)}
            >
              <Check aria-hidden width={15} height={15} /> Aprobar y publicar
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={busyId === c.id}
              onClick={() => onDismiss(c.id)}
            >
              <X aria-hidden width={15} height={15} /> Descartar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
