/** Fundos fotográficos por área (ficheiros em public/editorial); a primeira regra que bater ganha. */
const SCENES: { match: (pathname: string) => boolean; image: string; area: string }[] = [
  { match: (p) => p === "/", image: "/editorial/background.png", area: "hoje" },
  { match: (p) => p.startsWith("/despensa"), image: "/editorial/pantry.png", area: "despensa" },
  { match: (p) => p.startsWith("/plano"), image: "/editorial/scene-plano.jpg", area: "plano" },
  { match: (p) => p.startsWith("/listas"), image: "/editorial/scene-compras.jpg", area: "compras" },
  { match: (p) => p.startsWith("/cozinhar"), image: "/editorial/scene-cozinhar.jpg", area: "cozinhar" },
  { match: (p) => p.startsWith("/receitas"), image: "/editorial/scene-receitas.jpg", area: "receitas" },
  { match: (p) => p.startsWith("/ementas"), image: "/editorial/scene-ementas.jpg", area: "ementas" },
  { match: (p) => p.startsWith("/nutricao"), image: "/editorial/scene-nutricao.jpg", area: "nutricao" },
  { match: (p) => p.startsWith("/produtos"), image: "/editorial/scene-produtos.jpg", area: "produtos" },
  { match: (p) => p.startsWith("/promocoes"), image: "/editorial/scene-promocoes.jpg", area: "promocoes" },
  { match: (p) => p.startsWith("/casa") || p.startsWith("/conta"), image: "/editorial/scene-casa.jpg", area: "casa" },
];

/** A fotografia de fundo da área onde o utilizador está; as páginas sem área (entrar, registar…) usam a da cozinha. */
export function editorialScene(pathname: string): { image: string; area: string } {
  return SCENES.find((scene) => scene.match(pathname)) ?? { image: "/editorial/background.png", area: "entrar" };
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
