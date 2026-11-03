/** Minúsculas e sem acentos, para comparar "Maçã" com "maca". */
export function foldText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-PT");
}

/** Cada palavra da pesquisa tem de aparecer no nome; pesquisa vazia aceita tudo. */
export function matchesSearch(name: string, query: string): boolean {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const folded = foldText(name);
  return words.every((word) => folded.includes(word));
}
