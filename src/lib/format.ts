const nf = (min: number, max: number) =>
  new Intl.NumberFormat("es-ES", { minimumFractionDigits: min, maximumFractionDigits: max });

const int0 = new Intl.NumberFormat("es-ES");

/** +3,60 u / −4,00 u / 0,00 u */
export function units(n: number | null | undefined, withSign = true): string {
  if (n === null || n === undefined) return "—";
  const s = nf(2, 2).format(Math.abs(n));
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${withSign ? sign : n < 0 ? "−" : ""}${s} u`;
}

/** 2.10 — cuotas siempre con 2 decimales y punto decimal */
export function odds(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toFixed(2);
}

/** +14,2 % */
export function pct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${nf(digits, digits).format(Math.abs(n))} %`;
}

export function count(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return int0.format(n);
}

const rtf = new Intl.RelativeTimeFormat("es-ES", { numeric: "auto" });

/** "hace 2 h", "ayer", "en 6 h" */
export function relative(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (abs < hour) return rtf.format(Math.round(diff / min), "minute");
  if (abs < day) return rtf.format(Math.round(diff / hour), "hour");
  if (abs < 7 * day) return rtf.format(Math.round(diff / day), "day");
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/** "20:15" */
export function time(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

/** "3 sept" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

/** "mar. 2024" */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { month: "short", year: "numeric" });
}

export function monthsSince(iso: string | null | undefined): string {
  if (!iso) return "—";
  const months = Math.max(
    1,
    Math.round((Date.now() - new Date(iso).getTime()) / (30 * 86_400_000)),
  );
  return `${months} m`;
}
