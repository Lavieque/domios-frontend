// Datas do plano como a Api as quer: "YYYY-MM-DD", sem hora nem fuso. As
// contas fazem-se em UTC para nunca saltar um dia com a mudança de hora.

export type IsoDate = string;

function parse(date: IsoDate): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function format(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/** Hoje no relógio local (que é o da casa: todas em Europe/Lisbon). */
export function today(now: Date = new Date()): IsoDate {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return format(d);
}

/** Dias de `from` até `to` (negativo se `to` for antes). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

/** Segunda-feira da semana de `date`. */
export function startOfWeek(date: IsoDate): IsoDate {
  const weekday = parse(date).getUTCDay(); // 0 = domingo
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}

export function weekDays(monday: IsoDate): IsoDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function isIsoDate(value: string | null): value is IsoDate {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) && format(parse(value)) === value;
}

const weekdayFormat = new Intl.DateTimeFormat("pt-PT", { weekday: "long", timeZone: "UTC" });
const shortFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", timeZone: "UTC" });
const longFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "segunda-feira" */
export function weekdayName(date: IsoDate): string {
  return weekdayFormat.format(parse(date));
}

/** "Segunda-feira", para títulos (o CSS `capitalize` daria "Segunda-Feira"). */
export function weekdayTitle(date: IsoDate): string {
  const name = weekdayName(date);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** "26/10/2026" → "26 de out." */
export function shortDate(date: IsoDate): string {
  return shortFormat.format(parse(date));
}

export function longDate(date: IsoDate): string {
  return longFormat.format(parse(date));
}
