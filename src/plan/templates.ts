/**
 * As descrições das ementas começam muitas vezes pelo próprio nome
 * ("Mês Rápido: ao almoço…"). Ao lado do título, esse prefixo só repete.
 */
export function withoutNamePrefix(description: string, name: string): string {
  const prefix = `${name}:`;
  if (!description.toLocaleLowerCase("pt-PT").startsWith(prefix.toLocaleLowerCase("pt-PT"))) return description;
  const rest = description.slice(prefix.length).trim();
  return rest === "" ? description : rest.charAt(0).toLocaleUpperCase("pt-PT") + rest.slice(1);
}
