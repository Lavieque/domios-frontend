import { daysBetween, shortDate, today } from "../plan/dates";
import { tr } from "../i18n";

/** Urgência pela validade, na escala fixa dos pontos (0 a 3): o tamanho do ponto diz a pressa. */
export type UrgencyLevel = 0 | 1 | 2 | 3;

export function urgency(expiresAt: string | null): { level: UrgencyLevel; label: string } {
  const t = tr().ui.urgency;
  if (!expiresAt) return { level: 0, label: t.noExpiry };
  const days = daysBetween(today(), expiresAt);
  if (days < 0) return { level: 3, label: t.expired };
  if (days === 0) return { level: 3, label: t.today };
  if (days === 1) return { level: 2, label: t.tomorrow };
  if (days <= 3) return { level: 2, label: t.days(days) };
  if (days <= 7) return { level: 1, label: t.days(days) };
  return { level: 0, label: t.until(shortDate(expiresAt)) };
}
