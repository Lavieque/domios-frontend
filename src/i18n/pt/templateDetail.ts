// Detalhe de uma ementa pronta.

export const templateDetail = {
  title: "Ementa",
  openFailed: "Não deu para abrir esta ementa.",
  back: "Voltar às ementas",
  copySuffix: "(minha)",
  duplicate: "A mesma receita está duas vezes na mesma refeição deste dia.",
  forbiddenRecipe: "Essa receita não pode entrar nesta ementa.",
  crumb: "Ementas prontas",
  summary: (days: number, meals: number, servings: number): string =>
    `${days} ${days === 1 ? "dia" : "dias"} · ${meals} ${meals === 1 ? "refeição" : "refeições"} · ${servings} ${servings === 1 ? "dose" : "doses"} por refeição`,
  apply: "Aplicar ao plano",
  skippedOnCopy: (n: number): string =>
    n === 1
      ? "1 receita da ementa original já não está disponível e ficou de fora da cópia."
      : `${n} receitas da ementa original já não estão disponíveis e ficaram de fora da cópia.`,
  days: "Dias",
  day: "Dia",
  editDay: (n: number): string => `Editar dia ${n}`,
  edit: "Editar",
  noMeals: "Sem refeições.",
  servings: (n: number): string => `${n} ${n === 1 ? "dose" : "doses"}`,
  unavailable: "Já não está disponível",
  customize: "Personalizar",
  publishedOwn: "Esta ementa já foi publicada e não muda. Faz uma cópia para a editar.",
  copyHint: "Queres trocar receitas? Faz uma cópia desta ementa para a tua casa e edita os dias.",
  copying: "A copiar…",
  copy: "Fazer uma cópia para editar",
  editHint: "Esta ementa é da tua casa: carrega em “Editar” num dia para trocar, acrescentar ou tirar receitas.",
  policySkip: "Manter o que já está planeado",
  policyReplace: "Substituir o que já está planeado (nunca o que já foi cozinhado)",
  policyFail: "Não aplicar se houver refeições ocupadas",
  pickFirstDay: "Escolhe o primeiro dia.",
  servingsRange: "As doses têm de ser entre 1 e 50.",
  conflict: "Já há refeições planeadas nesses dias. Escolhe manter ou substituir.",
  nothingAdded: "Nada foi acrescentado ao plano.",
  created: (n: number, from: string, to: string): string =>
    `${n} ${n === 1 ? "refeição acrescentada" : "refeições acrescentadas"} de ${from} a ${to}.`,
  removed: (n: number): string => ` ${n} ${n === 1 ? "refeição substituída" : "refeições substituídas"}.`,
  skippedMeals: (n: number): string =>
    n === 1
      ? " 1 refeição do plano já estava ocupada e ficou como estava."
      : ` ${n} refeições do plano já estavam ocupadas e ficaram como estavam.`,
  skippedEntries: (n: number): string =>
    n === 1
      ? " 1 receita da ementa já não está disponível e foi saltada."
      : ` ${n} receitas da ementa já não estão disponíveis e foram saltadas.`,
  restrictions: "Atenção às restrições alimentares:",
  seePlan: "Ver o plano",
  applyAgain: "Aplicar outra vez",
  firstDay: "Primeiro dia",
  range: (fromDay: string, from: string, toDay: string, to: string): string =>
    `De ${fromDay}, ${from}, a ${toDay}, ${to}.`,
  servingsPerMeal: "Doses por refeição",
  ifTaken: "Se já houver refeições nesses dias",
  applying: "A aplicar…",
};
