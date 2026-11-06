export type Lang = "pt" | "en";
export const LANGS: Lang[] = ["pt", "en"];

/** Uma entrada por menu da app. A ordem é a do menu da app: "Em casa" e depois "Catálogo". */
export const FEATURE_KEYS = ["today", "plan", "pantry", "lists", "products", "promotions", "recipes", "household"] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export interface FeatureCopy {
  slug: string;
  /** O nome do menu na app (a app está em português). */
  name: string;
  /** Uma linha, usada no índice e no rodapé. */
  hint: string;
  title: string;
  lede: string;
  /** O que se faz neste menu. */
  does: { title: string; text: string }[];
  /** Como liga ao resto do DomiOS. */
  connects: string;
  /** Que menus vêm a seguir, por chave. */
  next: FeatureKey[];
  shotAlt: string;
}

export interface GuideStep {
  id: string;
  title: string;
  intro: string;
  steps: string[];
  tip?: string;
  /** Menu da app a que o passo se refere, para a captura. */
  shot?: FeatureKey;
}

export interface Dict {
  htmlLang: string;
  siteName: string;
  nav: {
    features: string;
    guide: string;
    request: string;
    enter: string;
    menuOpen: string;
    menuClose: string;
    language: string;
    skip: string;
    main: string;
    breadcrumb: string;
  };
  verdict: {
    historicLow: string;
    belowAverage: string;
    usual: string;
    aboveAverage: string;
  };
  home: {
    title: string;
    lede: string;
    primary: string;
    secondary: string;
    exampleTag: string;
    exampleName: string;
    exampleUnit: string;
    exampleNote: string;
    pickVerdict: string;
    range: { min: string; avg: string; max: string };
    judgeTitle: string;
    judgeIntro: string;
    judge: { title: string; text: string }[];
    connectedTitle: string;
    connectedIntro: string;
    groupHome: string;
    groupCatalog: string;
    flowTitle: string;
    flow: { title: string; text: string }[];
    guideTitle: string;
    guideText: string;
    guideCta: string;
    closeTitle: string;
    closeText: string;
  };
  featuresPage: {
    title: string;
    lede: string;
    groupHome: string;
    groupCatalog: string;
    seeMenu: string;
  };
  feature: {
    back: string;
    whatYouDo: string;
    connectsTitle: string;
    nextTitle: string;
    shotCaption: string;
    guideLink: string;
    cta: string;
  };
  features: Record<FeatureKey, FeatureCopy>;
  guide: {
    title: string;
    lede: string;
    onThisPage: string;
    faqTitle: string;
    faq: { q: string; a: string }[];
    cta: string;
    shotCaption: string;
  };
  guideSteps: GuideStep[];
  request: {
    title: string;
    lede: string;
    name: string;
    namePlaceholder: string;
    email: string;
    message: string;
    messageHint: string;
    submit: string;
    sending: string;
    successTitle: string;
    successText: string;
    again: string;
    errorInvalid: string;
    errorTooMany: string;
    errorGeneric: string;
    afterTitle: string;
    after: string[];
    haveAccount: string;
    enter: string;
  };
  notFound: { title: string; text: string; home: string };
  footer: { tagline: string; product: string; help: string; app: string; honest: string };
}
