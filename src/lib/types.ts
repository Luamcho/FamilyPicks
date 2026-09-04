export type PlanTier = "free" | "premium" | "vip";
export type PickStatus = "pending" | "won" | "lost" | "void" | "cancelled";
export type MarketCategory =
  | "goals_lines"
  | "handicap"
  | "moneyline"
  | "btts"
  | "totals"
  | "player_props"
  | "other";

export interface Sport {
  id: number;
  slug: string;
  name: string;
  icon: string;
}

export interface Pick {
  id: string;
  sport_slug: string;
  sport_name: string;
  competition: string;
  event: string;
  market: string;
  market_category: MarketCategory;
  selection: string;
  odds: number;
  closing_odds: number | null;
  stake: number;
  confidence: number | null;
  event_start_at: string;
  published_at: string;
  status: PickStatus;
  result_units: number | null;
  settled_at: string | null;
  is_vip: boolean;
  /** true when the current viewer's plan can't see this pick yet (free + still delayed) */
  locked?: boolean;
  /** hours left until a free viewer can see it */
  unlock_in_hours?: number;
}

export interface StatsOverview {
  total_picks: number;
  won: number;
  lost: number;
  void: number;
  staked_units: number;
  profit_units: number;
  roi_pct: number | null;
  yield_pct: number | null;
  hit_rate_pct: number | null;
  current_streak: number;
  first_pick_at: string | null;
  last_pick_at: string | null;
}

export interface SportStat {
  sport_slug: string;
  sport_name: string;
  total_picks: number;
  staked_units: number;
  profit_units: number;
  roi_pct: number | null;
  yield_pct: number | null;
  hit_rate_pct: number | null;
}

export interface BankrollPoint {
  bucket_start: string;
  period_units: number;
  cumulative_units: number;
}

export interface Profile {
  id: string;
  display_name: string;
  role: "user" | "admin";
  plan: PlanTier;
  plan_renews_at: string | null;
  age_verified_at: string | null;
}
