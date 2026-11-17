import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n";
import { today } from "../plan/dates";
import { resetDemo, startTour } from "./install";
import { getState } from "./state";
import {
  DEMO_API_EVENT,
  STEP_RULES,
  TOUR_EVENT,
  applyRequest,
  currentStep,
  readTour,
  setTourStatus,
  skipStep,
  writeTour,
  type DemoApiDetail,
  type StepId,
  type TourState,
} from "./tour";

interface StepText {
  title: string;
  body: string;
  cta: string;
  /** A second way to do the same step (recipes as well as menus). */
  alt?: { label: string; to: string };
  /** Label for skipping, when the step is optional. */
  skip?: string;
}

const text = {
  pt: {
    welcome: {
      eyebrow: "Demo do DomiOS",
      title: "Bem-vindo a casa",
      lede: "Monta a tua casa passo a passo: crias a casa, planeias a semana, fazes as compras ao melhor preço, arrumas a despensa e cozinhas. Cada passo diz-te onde carregar.",
      name: "Como te chamas?",
      namePlaceholder: "O teu nome",
      start: "Começar configuração",
      skip: "Saltar e ver o demo preenchido",
      note: "Começar parte de uma casa vazia. Os dados de exemplo voltam com “Repor demo”, na barra do topo.",
    },
    step: (n: number, total: number) => `Passo ${n} de ${total}`,
    tour: "Tour guiado",
    done: (title: string) => `Feito: ${title}`,
    skipStep: "Saltar passo",
    exit: "Sair do tour",
    minimize: "Minimizar o tour",
    expand: "Abrir o tour",
    finish: "Terminar",
    sample: "Carregar dados de exemplo",
    sampleConfirm: "Trocar a tua casa pelos dados de exemplo?",
    exitConfirm: "Sair do tour? Continuas com o que já criaste.",
    steps: {
      household: {
        title: "Cria a tua casa",
        body: "Dá um nome à casa. O teu nome já está no formulário: és o primeiro membro.",
        cta: "Abrir o formulário",
      },
      members: {
        title: "Junta quem vive contigo",
        body: "Em “Acrescentar membro”, junta a família. As doses e as restrições alimentares de cada um entram no plano e nas receitas.",
        cta: "Ir para a casa",
        skip: "Vivo sozinho",
      },
      plan: {
        title: "Planeia a semana",
        body: "Abre uma ementa, põe a data de início em hoje e carrega em “Aplicar ao plano”. Também dá para abrir uma receita e carregar em “Adicionar ao plano”.",
        cta: "Ver ementas",
        alt: { label: "ou receitas", to: "/receitas" },
      },
      list: {
        title: "Põe o que falta na lista",
        body: "No plano da semana, carrega em “Pôr o que falta na lista”. Só entra o que não tens na despensa.",
        cta: "Abrir o plano",
      },
      compare: {
        title: "Compara as lojas",
        body: "Na lista, carrega em “Comparar lojas”: vês onde o cesto fica mais barato, já com o custo da deslocação.",
        cta: "Abrir a lista",
      },
      buy: {
        title: "Vai às compras",
        body: "Marca os artigos como comprados à medida que os pões no cesto. Basta um para continuar.",
        cta: "Abrir a lista",
      },
      pantry: {
        title: "Arruma na despensa",
        body: "Com as compras feitas, carrega em “Pôr na despensa”. Os artigos entram com validade e preço pago.",
        cta: "Abrir a lista",
      },
      cook: {
        title: "Cozinha uma refeição",
        body: "No plano, na refeição de hoje, carrega em “Cozinhei”. A despensa desconta os ingredientes e as sobras ficam guardadas.",
        cta: "Abrir o plano",
      },
      cookNothingToday: {
        title: "Cozinha uma refeição",
        body: "Ainda não há nada planeado para hoje, e só se cozinha o que é de hoje ou de dias passados. Abre uma receita e carrega em “Adicionar ao plano”, com a data de hoje.",
        cta: "Escolher uma receita",
      },
      end: {
        title: "A casa está a andar",
        body: "A receita que fizeste está em “Receitas feitas”. Na lista de receitas fica marcada com um ✓: passa o rato por cima para ver quando foi.",
        cta: "Ver receitas feitas",
      },
    } satisfies Record<StepId | "cookNothingToday", StepText>,
  },
  en: {
    welcome: {
      eyebrow: "DomiOS demo",
      title: "Welcome home",
      lede: "Set up your home step by step: create the household, plan the week, shop at the best price, stock the pantry and cook. Each step tells you where to click.",
      name: "What's your name?",
      namePlaceholder: "Your name",
      start: "Start setting up",
      skip: "Skip and see the filled-in demo",
      note: "Starting begins with an empty home. The sample data comes back with “Reset demo” in the top bar.",
    },
    step: (n: number, total: number) => `Step ${n} of ${total}`,
    tour: "Guided tour",
    done: (title: string) => `Done: ${title}`,
    skipStep: "Skip step",
    exit: "Leave the tour",
    minimize: "Minimise the tour",
    expand: "Open the tour",
    finish: "Finish",
    sample: "Load the sample data",
    sampleConfirm: "Replace your household with the sample data?",
    exitConfirm: "Leave the tour? You keep what you've made so far.",
    steps: {
      household: {
        title: "Create your household",
        body: "Give your home a name. Your name is already in the form: you're the first member.",
        cta: "Open the form",
      },
      members: {
        title: "Add who lives with you",
        body: "Under “Add member”, bring in the family. Each person's portions and dietary needs feed the plan and the recipes.",
        cta: "Go to the household",
        skip: "I live alone",
      },
      plan: {
        title: "Plan the week",
        body: "Open a menu, set the start date to today and press “Apply to plan”. You can also open a recipe and press “Add to plan”.",
        cta: "See menus",
        alt: { label: "or recipes", to: "/receitas" },
      },
      list: {
        title: "Put what's missing on the list",
        body: "On the week's plan, press “Put what's missing on the list”. Only what isn't in the pantry goes on it.",
        cta: "Open the plan",
      },
      compare: {
        title: "Compare the stores",
        body: "On the list, press “Compare stores”: see where the basket is cheapest, travel cost included.",
        cta: "Open the list",
      },
      buy: {
        title: "Go shopping",
        body: "Tick items as bought as they go in the basket. One is enough to move on.",
        cta: "Open the list",
      },
      pantry: {
        title: "Stock the pantry",
        body: "With the shopping done, press “Put in pantry”. Items go in with their expiry date and the price you paid.",
        cta: "Open the list",
      },
      cook: {
        title: "Cook a meal",
        body: "On the plan, on today's meal, press “I cooked it”. The pantry takes off the ingredients and keeps any leftovers.",
        cta: "Open the plan",
      },
      cookNothingToday: {
        title: "Cook a meal",
        body: "Nothing is planned for today yet, and only today's or past meals can be cooked. Open a recipe and press “Add to plan”, with today's date.",
        cta: "Pick a recipe",
      },
      end: {
        title: "Your home is up and running",
        body: "The recipe you made is under “Cooked recipes”. In the recipe list it carries a ✓: hover over it to see when.",
        cta: "See cooked recipes",
      },
    } satisfies Record<StepId | "cookNothingToday", StepText>,
  },
};

/** A recipe meal planned for today and not cooked yet: what the cook step needs. */
function hasMealToday(): boolean {
  const day = today();
  return getState().planned.some((p) => p.date === day && p.status === 0 && p.recipeId !== null);
}

/** Re-reads `hasMealToday` after every Api request (planning, skipping, cooking). */
function useMealToday(): boolean {
  const [value, setValue] = useState(hasMealToday);
  useEffect(() => {
    const sync = () => setValue(hasMealToday());
    window.addEventListener(DEMO_API_EVENT, sync);
    return () => window.removeEventListener(DEMO_API_EVENT, sync);
  }, []);
  return value;
}

/** Steps counted on the card ("Step 3 of 8"): the closing card isn't one. */
const COUNTED = STEP_RULES.filter((s) => s.id !== "end").map((s) => s.id);

function useTour(): [TourState, (next: TourState) => void] {
  const [tour, setTour] = useState(readTour);

  useEffect(() => {
    const sync = () => setTour(readTour());
    const onApi = (event: Event) => {
      const current = readTour();
      if (current.status !== "active") return;
      const next = applyRequest(current, (event as CustomEvent<DemoApiDetail>).detail);
      if (next !== current) writeTour(next);
    };
    window.addEventListener(TOUR_EVENT, sync);
    window.addEventListener(DEMO_API_EVENT, onApi);
    // Another tab of the demo moved the tour on.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TOUR_EVENT, sync);
      window.removeEventListener(DEMO_API_EVENT, onApi);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return [tour, writeTour];
}

/** The guided tour of the demo: the welcome dialog, then one card per step. */
export function DemoTour() {
  const [tour, save] = useTour();

  // Room under the page while the card is up, so it never hides the last buttons.
  useEffect(() => {
    if (tour.status !== "active") return;
    document.documentElement.dataset.demoTour = "on";
    return () => {
      delete document.documentElement.dataset.demoTour;
    };
  }, [tour.status]);

  if (tour.status === "welcome") return <Welcome />;
  if (tour.status === "active") return <StepCard tour={tour} save={save} />;
  return null;
}

function Welcome() {
  const t = text[useLanguage()].welcome;
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  function start(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    startTour(name.trim());
  }

  return (
    <div className="demo-tour-overlay">
      <form className="demo-tour-welcome" role="dialog" aria-modal="true" aria-labelledby="demo-tour-title" onSubmit={start}>
        <p className="demo-tour-eyebrow">{t.eyebrow}</p>
        <h2 id="demo-tour-title">{t.title}</h2>
        <p className="demo-tour-lede">{t.lede}</p>
        <label className="form-field">
          <span>{t.name}</span>
          <input
            ref={input}
            type="text"
            autoComplete="given-name"
            required
            maxLength={200}
            placeholder={t.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="demo-tour-actions">
          <button type="submit" className="button-primary" disabled={busy || !name.trim()}>
            {t.start}
          </button>
          <button type="button" className="link-button" onClick={() => setTourStatus("off")} disabled={busy}>
            {t.skip}
          </button>
        </div>
        <p className="demo-tour-note">{t.note}</p>
      </form>
    </div>
  );
}

function StepCard({ tour, save }: { tour: TourState; save: (next: TourState) => void }) {
  const t = text[useLanguage()];
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const id = currentStep(tour);
  const mealToday = useMealToday();
  // Cooking needs a meal for today; without one the step sends to the recipes instead.
  const nothingToday = id === "cook" && !mealToday;
  const step: StepText = nothingToday ? t.steps.cookNothingToday : t.steps[id];
  const [minimized, setMinimized] = useState(false);
  const [justDone, setJustDone] = useState<string | null>(null);
  const previous = useRef(id);

  // A step that finishes on its own gets a short "Done" before the next one.
  useEffect(() => {
    if (previous.current === id) return;
    const finished = t.steps[previous.current].title;
    previous.current = id;
    setJustDone(finished);
    setMinimized(false);
    const timer = window.setTimeout(() => setJustDone(null), 3200);
    return () => window.clearTimeout(timer);
  }, [id, t]);

  const listPath = tour.listId ? `/listas/${tour.listId}` : "/listas";
  const target: Record<StepId, string> = {
    household: "/casa/nova",
    members: "/casa",
    plan: "/ementas",
    list: tour.planFrom ? `/plano?semana=${tour.planFrom}` : "/plano",
    compare: listPath,
    buy: listPath,
    pantry: listPath,
    cook: "/plano",
    end: "/cozinhar/feitas",
  };
  const to = nothingToday ? "/receitas" : target[id];
  const here = pathname + search === to;
  const n = COUNTED.indexOf(id) + 1;

  function go() {
    navigate(to, id === "household" ? { state: { memberName: tour.name } } : undefined);
  }

  function exit() {
    if (id !== "end" && !window.confirm(t.exitConfirm)) return;
    save({ ...tour, status: "off" });
  }

  if (minimized) {
    return (
      <button type="button" className="demo-tour-pill" onClick={() => setMinimized(false)} aria-label={t.expand}>
        <span className="demo-tour-pill-dot" aria-hidden="true" />
        {n > 0 ? `${t.tour} · ${n}/${COUNTED.length}` : t.tour}
      </button>
    );
  }

  return (
    <aside className="demo-tour-card" aria-live="polite" aria-label={t.tour}>
      <div className="demo-tour-head">
        <p className="demo-tour-eyebrow">{n > 0 ? t.step(n, COUNTED.length) : t.tour}</p>
        <button type="button" className="demo-tour-icon" onClick={() => setMinimized(true)} aria-label={t.minimize} title={t.minimize}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 8h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {n > 0 && (
        <ol className="demo-tour-progress" aria-hidden="true">
          {COUNTED.map((s, i) => (
            <li key={s} data-state={tour.done.includes(s) ? "done" : i === n - 1 ? "now" : undefined} />
          ))}
        </ol>
      )}
      {justDone && <p className="demo-tour-done">✓ {t.done(justDone)}</p>}
      <h2 className="demo-tour-title">{step.title}</h2>
      <p className="demo-tour-body">{step.body}</p>
      <div className="demo-tour-actions">
        {!here && (
          <button type="button" className="button-primary" onClick={go}>
            {step.cta}
          </button>
        )}
        {step.alt && pathname !== step.alt.to && (
          <Link to={step.alt.to} className="demo-tour-alt">
            {step.alt.label}
          </Link>
        )}
        {id === "end" ? (
          <>
            <button type="button" className={here ? "button-primary" : "button-secondary"} onClick={() => save({ ...tour, status: "off" })}>
              {t.finish}
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => window.confirm(t.sampleConfirm) && resetDemo({ skipTour: true })}
            >
              {t.sample}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="link-button"
            onClick={() => {
              // Skipped, not done: no "Done" line for it.
              previous.current = currentStep(skipStep(tour, id));
              setJustDone(null);
              save(skipStep(tour, id));
            }}
          >
            {step.skip ?? t.skipStep}
          </button>
        )}
      </div>
      {id !== "end" && (
        <button type="button" className="demo-tour-exit link-button" onClick={exit}>
          {t.exit}
        </button>
      )}
    </aside>
  );
}
