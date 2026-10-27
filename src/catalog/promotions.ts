import { daysBetween, today } from "../plan/dates";

/** Dias de calendário até ao fim, no relógio da casa (Europe/Lisbon). */
export function daysLeft(endsAt: string): number {
  return daysBetween(today(), today(new Date(endsAt)));
}

export function daysLeftLabel(endsAt: string): string {
  const days = daysLeft(endsAt);
  if (days <= 0) return "Termina hoje";
  if (days === 1) return "Termina amanhã";
  return `Termina em ${days} dias`;
}
