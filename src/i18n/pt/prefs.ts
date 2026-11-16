// Alimentos a evitar e objetivos nutricionais de um membro.

export const prefs = {
  errors: {
    forbidden: "Só o próprio membro ou um administrador da casa pode mudar isto.",
    invalid: "Algum valor não é válido. Confirma o que escreveste.",
    full: "Já há 200 alimentos nesta lista.",
    notFound: "Esse alimento já não existe.",
  },
  severity: { Avoid: "Evitar", Limit: "Pouco" },
  avoidedOf: (name: string): string => `Alimentos a evitar de ${name}`,
  avoidedNote: (name: string): string =>
    `A lista é de ${name}: o DomiOS só a repete nas receitas, não diz o que se deve comer.`,
  emptyList: "Ainda não há alimentos nesta lista.",
  remove: "Tirar",
  addFood: "Acrescentar alimento",
  addPlaceholder: "Ex.: tomate, café, cebola",
  results: "Resultados",
  howMuch: "Quanto",
  avoid: "Evitar",
  limit: "Só um pouco",
  note: "Nota",
  notePlaceholder: "Ex.: só cru, à noite",
  optional: "Opcional.",
  add: "Acrescentar",
  goalsOf: (name: string): string => `Objetivos nutricionais de ${name}`,
  goalsNote: (name: string): string =>
    `Os valores são de ${name}. Servem para comparar o que se come com o que a pessoa quer; o que ficar em branco usa a dose de referência europeia.`,
  saved: "Guardado.",
  clearGoals: "Apagar objetivos",
};
