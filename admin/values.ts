export const UNITS = [
  { value: 0, label: "Unidade" },
  { value: 1, label: "Grama (g)" },
  { value: 2, label: "Quilograma (kg)" },
  { value: 3, label: "Mililitro (ml)" },
  { value: 4, label: "Litro (l)" },
] as const;

export const unitLabel = (value: number) => UNITS.find((u) => u.value === value)?.label ?? String(value);

/** "a, b ,c" para ["a","b","c"], sem vazios nem repetidos. */
export function splitList(text: string): string[] {
  return [...new Set(text.split(",").map((s) => s.trim()).filter(Boolean))];
}

/** Aceita "12,5" e "12.5"; vazio ou inválido dá undefined. */
export function toNumber(text: string): number | undefined {
  const n = Number(text.trim().replace(",", "."));
  return text.trim() === "" || Number.isNaN(n) ? undefined : n;
}
