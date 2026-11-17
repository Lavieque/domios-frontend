// Guided tour of the demo: where the visitor is in it, kept in this browser.
// Steps finish on their own when the fake Api sees the matching request
// (install.ts announces every request it answers), so the tour follows what
// the visitor really does instead of a "Next" button.

export const TOUR_KEY = "domios.demo.tour";
export const DEMO_API_EVENT = "domios-demo:api";
/** Fired on every change, so the banner and the tour card stay in step. */
export const TOUR_EVENT = "domios-demo:tour";

/** welcome: the first-visit dialog. active: steps on screen. off: skipped or finished. */
export type TourStatus = "welcome" | "active" | "off";

export interface TourState {
  status: TourStatus;
  /** Ids of the finished (or skipped) steps. */
  done: string[];
  /** What the visitor said to call them, for the household form. */
  name: string;
  /** The list made from the plan, so the shopping steps can open it. */
  listId: string | null;
  /** First day the visitor planned, so the plan opens on that week. */
  planFrom: string | null;
}

export interface DemoApiDetail {
  method: string;
  path: string;
  body: unknown;
  result: unknown;
}

export const freshTour = (status: TourStatus, name = ""): TourState => ({ status, done: [], name, listId: null, planFrom: null });
const fresh = (status: TourStatus) => freshTour(status);

let memory: TourState | null = null;

export function readTour(): TourState {
  try {
    const raw = window.localStorage.getItem(TOUR_KEY);
    if (!raw) return memory ?? fresh("welcome");
    const parsed = JSON.parse(raw) as Partial<TourState>;
    if (parsed.status !== "welcome" && parsed.status !== "active" && parsed.status !== "off") return fresh("welcome");
    return {
      status: parsed.status,
      done: Array.isArray(parsed.done) ? parsed.done.filter((x): x is string => typeof x === "string") : [],
      name: typeof parsed.name === "string" ? parsed.name : "",
      listId: typeof parsed.listId === "string" ? parsed.listId : null,
      planFrom: typeof parsed.planFrom === "string" ? parsed.planFrom : null,
    };
  } catch {
    return memory ?? fresh("welcome");
  }
}

export function writeTour(tour: TourState): void {
  try {
    window.localStorage.setItem(TOUR_KEY, JSON.stringify(tour));
  } catch {
    // No storage: the tour lasts for this page only.
  }
  memory = tour;
  window.dispatchEvent(new Event(TOUR_EVENT));
}

export function setTourStatus(status: TourStatus): void {
  writeTour(status === "welcome" ? fresh("welcome") : { ...readTour(), status });
}

export function clearTour(): void {
  memory = null;
  try {
    window.localStorage.removeItem(TOUR_KEY);
  } catch {
    // Nothing to clear.
  }
}

export type StepId = "household" | "members" | "plan" | "list" | "compare" | "buy" | "pantry" | "cook" | "end";

interface StepRule {
  id: StepId;
  /** The request that finishes the step; none for the last one. */
  finishedBy?: RegExp;
  method?: string;
}

const H = "/households/[^/]+";

export const STEP_RULES: StepRule[] = [
  { id: "household", method: "POST", finishedBy: /^\/households$/ },
  { id: "members", method: "POST", finishedBy: new RegExp(`^${H}/members$`) },
  { id: "plan", method: "POST", finishedBy: new RegExp(`^${H}/planned-meals(/from-template)?$`) },
  { id: "list", method: "POST", finishedBy: new RegExp(`^${H}/planned-meals/shopping-list$`) },
  { id: "compare", method: "GET", finishedBy: new RegExp(`^${H}/shopping-lists/[^/]+/store-comparison$`) },
  { id: "buy", method: "POST", finishedBy: new RegExp(`^${H}/shopping-lists/[^/]+/items/[^/]+/purchase$`) },
  { id: "pantry", method: "POST", finishedBy: new RegExp(`^${H}/shopping-lists/[^/]+/store-in-pantry$`) },
  { id: "cook", method: "POST", finishedBy: new RegExp(`^${H}/planned-meals/[^/]+/cook$`) },
  { id: "end" },
];

/** The first step not yet done; the last one stays until the visitor closes it. */
export function currentStep(tour: TourState): StepId {
  return STEP_RULES.find((s) => !tour.done.includes(s.id))?.id ?? "end";
}

/** The tour after the Api answered `detail`: steps it finishes, and the list it names. */
export function applyRequest(tour: TourState, detail: DemoApiDetail): TourState {
  const finished = STEP_RULES.filter(
    (s) => s.finishedBy && s.method === detail.method && s.finishedBy.test(detail.path) && !tour.done.includes(s.id),
  ).map((s) => s.id);

  let listId = tour.listId;
  const body = detail.body as { shoppingListId?: unknown } | undefined;
  if (detail.method === "POST" && /\/planned-meals\/shopping-list$/.test(detail.path) && typeof body?.shoppingListId === "string") {
    listId = body.shoppingListId;
  } else if (!listId) {
    const match = detail.path.match(/\/shopping-lists\/([^/]+)\//);
    if (match) listId = match[1];
  }

  let planFrom = tour.planFrom;
  if (!planFrom && detail.method === "POST" && /\/planned-meals(\/from-template)?$/.test(detail.path)) {
    const result = detail.result as { from?: unknown; date?: unknown } | undefined;
    const day = result?.from ?? result?.date;
    if (typeof day === "string") planFrom = day;
  }

  if (finished.length === 0 && listId === tour.listId && planFrom === tour.planFrom) return tour;
  return { ...tour, done: [...tour.done, ...finished], listId, planFrom };
}

export function skipStep(tour: TourState, id: StepId): TourState {
  return tour.done.includes(id) ? tour : { ...tour, done: [...tour.done, id] };
}
