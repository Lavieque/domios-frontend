import { daysBetween, shortDate, today } from "../plan/dates";

/** Urgência pela validade, na escala fixa dos pontos (0 a 3): o tamanho do ponto diz a pressa. */
export type UrgencyLevel = 0 | 1 | 2 | 3;

export function urgency(expiresAt: string | null): { level: UrgencyLevel; label: string } {
  if (!expiresAt) return { level: 0, label: "Sem validade" };
  const days = daysBetween(today(), expiresAt);
  if (days < 0) return { level: 3, label: "Expirou" };
  if (days === 0) return { level: 3, label: "Hoje" };
  if (days === 1) return { level: 2, label: "Amanhã" };
  if (days <= 3) return { level: 2, label: `${days} dias` };
  if (days <= 7) return { level: 1, label: `${days} dias` };
  return { level: 0, label: `Até ${shortDate(expiresAt)}` };
}
