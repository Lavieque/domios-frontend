// Páginas: casa nova, receitas feitas, histórico, listas de compras.

export const createHousehold = {
  invalid: "Preenche o nome da casa e o teu nome.",
  title: "Criar casa",
  lede: "A casa junta a despensa, as listas de compras e o plano de refeições. Ficas como administrador e podes acrescentar o resto da família depois.",
  name: "Nome da casa",
  yourName: "O teu nome",
  creating: "A criar…",
};

export const cooked = {
  back: "O que posso cozinhar",
  title: "Receitas feitas",
  subtitle: (household: string) => `O que já se cozinhou em ${household}`,
  empty:
    "Ainda não registaste nenhuma refeição a partir de uma receita. Quando cozinhares uma do plano ou da página da receita, aparece aqui.",
  times: (n: number): string => (n === 1 ? "vez" : "vezes"),
  saveAgain: "Guardar para fazer outra vez",
  last: (date: string) => `Última a ${date}`,
  saved: "Guardada",
  unavailable: "Já não está disponível",
};

export const history = {
  title: "Histórico",
  subtitle: "O que mudou na casa, do mais recente para o mais antigo.",
  area: "Área do histórico",
  empty: "Nada registado aqui ainda.",
};

export const lists = {
  title: "Listas de compras",
  status: "Estado",
  open: "Abertas",
  completed: "Concluídas",
  cancelled: "Canceladas",
  listName: "Nome da lista",
  newListPlaceholder: "Nome da nova lista (opcional)",
  defaultName: (date: string): string => `Lista de ${date}`,
  creating: "A criar…",
  newList: "Nova lista",
  none: { 0: "Sem listas abertas.", 1: "Sem listas concluídas.", 2: "Sem listas canceladas." },
  empty: "Vazia",
  progress: (left: number, bought: number, total: number) => `${left} por comprar · ${bought} de ${total} comprados`,
};
