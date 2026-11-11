/**
 * As ementas não têm fotografia na Api: cada uma ganha uma pelo tipo que as etiquetas dizem
 * (as mesmas fotografias de pratos do preview editorial, em public/editorial).
 */
const byTag: { tag: string; image: string }[] = [
  { tag: "peixe", image: "/editorial/salmon.jpg" },
  { tag: "vegetariana", image: "/editorial/salad.jpg" },
  { tag: "sem carne", image: "/editorial/scene-nutricao.jpg" },
  { tag: "rápida", image: "/editorial/pasta.jpg" },
  { tag: "variada", image: "/editorial/soup.png" },
];

export function templateImage(tags: string[]): string {
  const lower = tags.map((tag) => tag.trim().toLowerCase());
  return byTag.find((entry) => lower.includes(entry.tag))?.image ?? "/editorial/scene-ementas.jpg";
}
