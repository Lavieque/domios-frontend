import { daysBetween, today } from "../plan/dates";
import { tr } from "../i18n";

/** Dias de calendário até ao fim, no relógio da casa (Europe/Lisbon). */
export function daysLeft(endsAt: string): number {
  return daysBetween(today(), today(new Date(endsAt)));
}

export function daysLeftLabel(endsAt: string): string {
  const days = daysLeft(endsAt);
  const t = tr().ui.promotion;
  if (days <= 0) return t.endsToday;
  if (days === 1) return t.endsTomorrow;
  return t.endsInDays(days);
}
