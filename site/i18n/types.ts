export type Lang = "pt" | "en";
export const LANGS: Lang[] = ["pt", "en"];

/** Uma entrada por página da app, pela ordem do menu da app. */
export const FEATURE_KEYS = ["today", "plan", "pantry", "lists", "cook", "recipes", "templates", "nutrition", "products", "promotions", "household"] as const;
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
    /** O título em duas linhas: a segunda vai na cor de destaque. */
    title: [string, string];
    lede: string;
    primary: string;
    secondary: string;
    /** O resumo de um dia, por baixo do título. São sempre dados de exemplo. */
    glance: { label: string; example: string; items: { label: string; value: string; note: string }[] };
    storyTitle: string;
    storyIntro: string;
    story: { key: FeatureKey; title: string; text: string; points: string[] }[];
    tourTitle: string;
    tourIntro: string;
    tourTabs: string;
    tourOpen: string;
    tourCaption: string;
    exampleTag: string;
    exampleName: string;
    exampleUnit: string;
    /** The words printed on the example carton: the big name and the kind under it. */
    exampleCarton: [string, string];
    exampleNote: string;
    pickVerdict: string;
    range: { min: string; avg: string; max: string };
    judgeTitle: string;
    judgeIntro: string;
    judge: { title: string; text: string }[];
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
    groupKitchen: string;
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
  /** Notes pinned on a capture, read with the mouse or keyboard; the positions live in site/hotspots.ts. */
  shotNotes: { label: string; notes: Partial<Record<FeatureKey, string[]>> };
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
