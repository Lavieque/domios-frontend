// Páginas: cozinhar, lojas perto, gastos, desperdício.

export const cook = {
  title: "O que posso cozinhar",
  subtitle: (household: string) => `Com o que tens na despensa de ${household}`,
  cooked: "Receitas já feitas",
  suggestion: "Sugestão para hoje",
  meta: (servings: number, available: number, required: number) =>
    `${servings} ${servings === 1 ? "pessoa" : "pessoas"} · ${available} de ${required} ingredientes em casa`,
  yours: "As tuas receitas",
  noSaved: {
    before: "Ainda não guardaste receitas. Abre uma",
    link: "receita",
    after: "e carrega em “Guardar receita”; as que pões na lista de compras ficam guardadas sozinhas.",
  },
  alsoPossible: "Também dá para fazer",
  nothingElse: "Nada mais com o que está na despensa.",
  seePantry: "Ver a despensa",
};

export const stores = {
  title: "Lojas perto",
  subtitle: "Supermercados com preços no DomiOS, o mais perto primeiro, com o custo de ir e voltar",
  chain: "Cadeia",
  allChains: "Todas as cadeias",
  needLocation:
    "Para mostrar as lojas perto, o DomiOS precisa da localização deste dispositivo. Usa-a só neste pedido e não a guarda.",
  useLocation: "Usar a minha localização",
  searching: "A procurar lojas…",
  summary: (count: number, km: string, perKm: string) =>
    `${count === 1 ? "1 loja" : `${count} lojas`} a menos de ${km} km · deslocação a ${perKm}/km. O raio e o custo por km mudam-se em`,
  household: "Casa",
  none: "Nenhuma loja no raio. Aumenta a distância máxima em Casa.",
  hours: (hours: string) => `Horário: ${hours}`,
  roundTrip: (cost: string) => `ida e volta ${cost}`,
  attribution: (source: string) => `Distâncias aproximadas pela estrada. Lojas: ${source}.`,
};

export const spending = {
  back: "Listas de compras",
  title: "Gastos",
  subtitle: (household: string) => `O que se comprou em ${household}, por mês e por loja`,
  period: "Período",
  lastMonths: (n: number) => `Últimos ${n} meses`,
  total: "Total",
  estimated: (shelf: string, typed: string) => `${shelf} pelo preço da prateleira no dia da compra; ${typed} escrito por vocês.`,
  withoutPrice: (n: number) =>
    `${n === 1 ? "1 compra sem preço" : `${n} compras sem preço`} fora do total: escolhe a loja da lista ou escreve quanto pagaste.`,
  empty: {
    before: "Ainda não há compras neste período. Marca os itens de uma",
    link: "lista",
    after: "como comprados e escolhe a loja: o preço entra aqui.",
  },
  moreWithoutPrice: (n: number): string => (n === 1 ? "Mais 1 compra sem preço." : `Mais ${n} compras sem preço.`),
  noStore: "Sem loja",
  purchases: (n: number): string => (n === 1 ? "1 compra" : `${n} compras`),
  estimatedPart: (value: string) => `, ${value} estimado`,
  estimatedOnly: ", estimado",
};

export const waste = {
  back: "Despensa",
  title: "Desperdício",
  subtitle: (household: string) => `O que se deitou fora em ${household}`,
  thisMonth: "Este mês",
  last3: "Últimos 3 meses",
  last12: "Últimos 12 meses",
  thrownAway: "Deitado fora",
  items: (n: number): string => (n === 1 ? "1 artigo" : `${n} artigos`),
  ofFinished: "Do que se acabou",
  worth: "Valia cerca de",
  valued: (valued: number, total: number) => `Valor de ${valued} de ${total}: os outros não têm preço de compra.`,
  none: "Nada deitado fora neste período.",
  why: "Porquê",
  noReason: "Sem motivo",
  noReasonInline: "sem motivo",
  what: "O quê",
  articles: "Artigos",
  mistakeNote: "“Registado por engano” não conta no total nem na percentagem.",
};
