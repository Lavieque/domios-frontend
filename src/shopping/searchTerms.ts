/** "Pimentos" → "Pimento": o catálogo está no singular, a lista escreve-se no plural. */
export function searchTerms(label: string): string[] {
  const text = label.trim();
  const words = text.split(/\s+/);
  const singular = words.map((w) => (w.length > 3 ? w.replace(/([^s])s$/i, "$1") : w)).join(" ");
  // Sem fallback para a primeira palavra: "Massa de tomate" → "Massa" sugeria tudo menos o que se queria.
  return [...new Set([text, singular])].filter((t) => t.length >= 2);
}
