// Persistencia local para el MODO DEMO: permite probar el flujo completo
// (publicar pick -> liquidar) sin backend. Los cambios viven solo en este
// navegador. Con Supabase conectado esta capa no se usa.

import type { MarketCategory, Pick, PickSource, PickStatus } from "./types";
import { MOCK_PICKS, MOCK_SPORTS } from "./mock";

const ADD_KEY = "fp-demo-picks-added";
const OVERRIDE_KEY = "fp-demo-picks-overrides";

export interface NewPickInput {
  sport_slug: string;
  competition: string;
  event: string;
  market: string;
  market_category: MarketCategory;
  selection: string;
  odds: number;
  stake: number;
  confidence: number | null;
  event_start_at: string;
  source: PickSource;
  analysis?: string;
}

type Override = Partial<Pick> & { deleted?: boolean };

function readJson<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible */
  }
}

function pnl(status: PickStatus, stake: number, odds: number): number | null {
  if (status === "won") return Math.round(stake * (odds - 1) * 100) / 100;
  if (status === "lost") return -stake;
  if (status === "void" || status === "cancelled") return 0;
  return null;
}

/** Lista completa del modo demo: mock + añadidos, con overrides aplicados y
 *  los eliminados fuera. Ordenada por fecha de publicación (desc). */
export function demoPicks(): Pick[] {
  const added = readJson<Pick[]>(ADD_KEY, []);
  const overrides = readJson<Record<string, Override>>(OVERRIDE_KEY, {});
  const merged = [...added, ...MOCK_PICKS].map((p) => {
    const o = overrides[p.id];
    return o ? { ...p, ...o } : p;
  });
  return merged
    .filter((p) => !(p as Override).deleted)
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
}

export function addLocalPick(input: NewPickInput): Pick {
  const sport = MOCK_SPORTS.find((s) => s.slug === input.sport_slug);
  const pick: Pick = {
    id: `local-${Date.now()}`,
    sport_slug: input.sport_slug,
    sport_name: sport?.name ?? input.sport_slug,
    competition: input.competition,
    event: input.event,
    market: input.market,
    market_category: input.market_category,
    selection: input.selection,
    odds: input.odds,
    closing_odds: null,
    stake: input.stake,
    confidence: input.confidence,
    event_start_at: input.event_start_at,
    published_at: new Date().toISOString(),
    status: "pending",
    result_units: null,
    settled_at: null,
    source: input.source,
  };
  writeJson(ADD_KEY, [pick, ...readJson<Pick[]>(ADD_KEY, [])]);
  return pick;
}

export function settleLocalPick(
  id: string,
  status: PickStatus,
  closingOdds: number | null,
): void {
  const overrides = readJson<Record<string, Override>>(OVERRIDE_KEY, {});
  const base = [...readJson<Pick[]>(ADD_KEY, []), ...MOCK_PICKS].find(
    (p) => p.id === id,
  );
  const stake = base?.stake ?? 0;
  const odds = base?.odds ?? 1;
  overrides[id] = {
    ...(overrides[id] ?? {}),
    status,
    closing_odds: closingOdds ?? base?.closing_odds ?? null,
    result_units: pnl(status, stake, odds),
    settled_at: new Date().toISOString(),
  };
  writeJson(OVERRIDE_KEY, overrides);
}

export function deleteLocalPick(id: string): void {
  writeJson(
    ADD_KEY,
    readJson<Pick[]>(ADD_KEY, []).filter((p) => p.id !== id),
  );
  if (!id.startsWith("local-")) {
    const overrides = readJson<Record<string, Override>>(OVERRIDE_KEY, {});
    overrides[id] = { ...(overrides[id] ?? {}), deleted: true };
    writeJson(OVERRIDE_KEY, overrides);
  }
}

export function resetDemo(): void {
  try {
    localStorage.removeItem(ADD_KEY);
    localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    /* noop */
  }
}
