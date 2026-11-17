// Páginas: ementas (lista), promoções, receitas (lista).

export const lists2 = {
  searching: "A procurar…",
  andMore: (n: number) => ` e mais ${n}`,
  all: "Todas",
  allCategories: "Todas as categorias",
  category: "Categoria",
};

export const templates = {
  title: "Ementas prontas",
  subtitle: "Planos de uma semana, quinzena ou mês para aplicar ao teu plano a partir de um dia",
  all: "Todas as ementas",
  count: (total: string, n: number, searching: boolean): string =>
    `${total} ${searching ? (n === 1 ? "encontrada" : "encontradas") : n === 1 ? "ementa" : "ementas"}`,
  search: "Pesquisar ementas",
  searchPlaceholder: "Pesquisar ementas…",
  noneFound: "Nenhuma ementa com essa pesquisa.",
  nonePublished: "Ainda não há ementas publicadas.",
  days: (n: number): string => (n === 1 ? "dia" : "dias"),
  meals: (n: number) => `${n} ${n === 1 ? "refeição" : "refeições"}`,
  servings: (n: number) => `${n} ${n === 1 ? "dose" : "doses"}`,
  mine: "As minhas ementas",
  editable: "Dá para editar",
};

export const promotions = {
  title: "Promoções",
  subtitle: "Em promoção na última leitura de cada loja, dos últimos 3 dias.",
  filters: "Filtros",
  filtersCount: (n: number) => `Filtros · ${n}`,
  clear: "Limpar",
  card: "Cartão",
  anyCard: "Com e sem cartão",
  cardOnly: "Só com cartão",
  noCard: "Só sem cartão",
  minDiscount: "Desconto mínimo",
  anyDiscount: "Qualquer desconto",
  orMore: (value: number) => `${value}% ou mais`,
  count: (total: string, n: number) => `${total} ${n === 1 ? "produto" : "produtos"} em promoção`,
  none: "Sem promoções ativas neste momento.",
};

export const recipes = {
  title: "Receitas",
  forCooking: "Para cozinhar, planear ou pôr na lista",
  withFilters: (total: string, n: number) => `${total} ${n === 1 ? "receita" : "receitas"} com estes filtros`,
  published: (total: string) => `${total} receitas publicadas, para cozinhar, planear ou pôr na lista`,
  ourPick: "Da nossa seleção",
  explore: "Explorar receitas",
  search: "Pesquisar receitas",
  searchPlaceholder: "Pesquisar receitas…",
  difficulty: "Dificuldade",
  anyDifficulty: "Qualquer dificuldade",
  mainProtein: "Proteína principal",
  none: "Sem receitas com estes filtros.",
  cookedMark: (times: number, last: string) =>
    `Já foi feita ${times === 1 ? "1 vez" : `${times} vezes`}, a última a ${last}.`,
  cookedShort: "Feita",
};
