/** Fundos fotográficos por área do editorial (ficheiros em public/editorial). */
const SCENES: { prefix: string; image: string }[] = [
  { prefix: "/produtos", image: "/editorial/scene-produtos.jpg" },
];

/** A fotografia de fundo da área onde o utilizador está; null = página ainda no desenho Folha do Dia. */
export function editorialScene(pathname: string): string | null {
  return SCENES.find((scene) => pathname === scene.prefix || pathname.startsWith(`${scene.prefix}/`))?.image ?? null;
}

const COLLAPSED_KEY = "domios.rail-collapsed";

export function readRailCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeRailCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    /* sem armazenamento: o estado vale só para esta sessão */
  }
}
