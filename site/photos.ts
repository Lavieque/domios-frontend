import type { FeatureKey } from "./i18n";

/** The kitchen photographs the app uses as scenes, one per page. */
export const SCENE: Record<FeatureKey, string> = {
  today: "/photos/kitchen.webp",
  plan: "/photos/scene-plano.jpg",
  pantry: "/photos/pantry.webp",
  lists: "/photos/scene-compras.jpg",
  cook: "/photos/scene-cozinhar.jpg",
  recipes: "/photos/scene-receitas.jpg",
  templates: "/photos/scene-ementas.jpg",
  nutrition: "/photos/scene-nutricao.jpg",
  products: "/photos/scene-produtos.jpg",
  promotions: "/photos/scene-promocoes.jpg",
  household: "/photos/scene-casa.jpg",
};

export const PHOTO = {
  kitchen: "/photos/kitchen.webp",
  pantry: "/photos/pantry.webp",
  guide: "/photos/scene-plano.jpg",
  request: "/photos/scene-casa.jpg",
};
