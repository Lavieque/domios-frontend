// Datas da página de gastos.

const monthFormat = new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric" });

function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Do dia 1 do mês, `months` - 1 meses para trás, até hoje. */
export function periodFor(months: number, today = new Date()): { from: string; to: string } {
  const from = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
  return { from: isoDay(from), to: isoDay(today) };
}

/** "2026-11" → "novembro de 2026". */
export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return monthFormat.format(new Date(year, m - 1, 1));
}
