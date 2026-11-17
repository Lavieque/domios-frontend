import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TOUR_EVENT,
  TOUR_KEY,
  applyRequest,
  clearTour,
  currentStep,
  freshTour,
  readTour,
  skipStep,
  writeTour,
  type DemoApiDetail,
  type TourState,
} from "./tour";

function stubWindow() {
  const values = new Map<string, string>();
  const events: string[] = [];
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
    },
    dispatchEvent: (event: Event) => {
      events.push(event.type);
      return true;
    },
  });
  return { values, events };
}

afterEach(() => {
  clearTour();
  vi.unstubAllGlobals();
});

const active = (done: string[] = [], extra: Partial<TourState> = {}): TourState => ({ ...freshTour("active", "Marta"), done, ...extra });
const call = (method: string, path: string, body?: unknown, result?: unknown): DemoApiDetail => ({ method, path, body, result });

describe("readTour / writeTour", () => {
  it("sem nada guardado, começa nas boas-vindas", () => {
    stubWindow();
    expect(readTour().status).toBe("welcome");
  });

  it("guarda, avisa quem ouve e volta a ler o mesmo", () => {
    const { values, events } = stubWindow();
    const tour = active(["household"], { listId: "sl-1", planFrom: "2026-11-17" });
    writeTour(tour);
    expect(JSON.parse(values.get(TOUR_KEY)!)).toEqual(tour);
    expect(events).toEqual([TOUR_EVENT]);
    expect(readTour()).toEqual(tour);
  });

  it("aceita um estado só com o status (o que o script das capturas escreve)", () => {
    const { values } = stubWindow();
    values.set(TOUR_KEY, JSON.stringify({ status: "off" }));
    expect(readTour()).toEqual(freshTour("off"));
  });

  it("um estado estragado volta às boas-vindas", () => {
    const { values } = stubWindow();
    values.set(TOUR_KEY, "{not json");
    expect(readTour().status).toBe("welcome");
    values.set(TOUR_KEY, JSON.stringify({ status: "flying" }));
    expect(readTour().status).toBe("welcome");
  });
});

describe("currentStep", () => {
  it("é o primeiro passo por fazer, pela ordem do tour", () => {
    expect(currentStep(active())).toBe("household");
    expect(currentStep(active(["household", "members"]))).toBe("plan");
    expect(currentStep(active(["household", "plan"]))).toBe("members");
  });

  it("com tudo feito fica no cartão final", () => {
    const all = ["household", "members", "plan", "list", "compare", "buy", "pantry", "cook"];
    expect(currentStep(active(all))).toBe("end");
  });
});

describe("applyRequest", () => {
  it("cada passo fecha com o pedido certo à Api", () => {
    const cases: [DemoApiDetail, string][] = [
      [call("POST", "/households"), "household"],
      [call("POST", "/households/h-1/members"), "members"],
      [call("POST", "/households/h-1/planned-meals"), "plan"],
      [call("POST", "/households/h-1/planned-meals/from-template"), "plan"],
      [call("POST", "/households/h-1/planned-meals/shopping-list"), "list"],
      [call("GET", "/households/h-1/shopping-lists/sl-1/store-comparison"), "compare"],
      [call("POST", "/households/h-1/shopping-lists/sl-1/items/sli-1/purchase"), "buy"],
      [call("POST", "/households/h-1/shopping-lists/sl-1/store-in-pantry"), "pantry"],
      [call("POST", "/households/h-1/planned-meals/pm-1/cook"), "cook"],
    ];
    for (const [detail, step] of cases) {
      expect(applyRequest(active(), detail).done, `${detail.method} ${detail.path}`).toEqual([step]);
    }
  });

  it("ler não fecha passos de escrita, e o método conta", () => {
    expect(applyRequest(active(), call("GET", "/households"))).toEqual(active());
    expect(applyRequest(active(), call("GET", "/households/h-1/planned-meals"))).toEqual(active());
    expect(applyRequest(active(), call("POST", "/households/h-1/shopping-lists/sl-1/items/sli-1/unpurchase")).done).toEqual([]);
  });

  it("fora de ordem também conta, e não repete um passo já feito", () => {
    const tour = applyRequest(active(["household"]), call("POST", "/households/h-1/planned-meals/pm-1/cook"));
    expect(tour.done).toEqual(["household", "cook"]);
    expect(currentStep(tour)).toBe("members");
    expect(applyRequest(tour, call("POST", "/households/h-1/planned-meals/pm-2/cook"))).toBe(tour);
  });

  it("sem nada de novo devolve o mesmo objeto (não grava outra vez)", () => {
    const tour = active(["household"], { listId: "sl-1", planFrom: "2026-11-17" });
    expect(applyRequest(tour, call("GET", "/households/h-1/pantry-items"))).toBe(tour);
  });

  it("guarda a lista para onde foi o plano", () => {
    const tour = applyRequest(active(), call("POST", "/households/h-1/planned-meals/shopping-list", { shoppingListId: "sl-9" }));
    expect(tour.listId).toBe("sl-9");
  });

  it("sem lista do plano, fica com a primeira lista onde se mexeu", () => {
    const tour = applyRequest(active(), call("POST", "/households/h-1/shopping-lists/sl-3/items/sli-1/purchase"));
    expect(tour.listId).toBe("sl-3");
    expect(applyRequest(tour, call("GET", "/households/h-1/shopping-lists/sl-4/store-comparison")).listId).toBe("sl-3");
  });

  it("guarda o primeiro dia planeado, de uma ementa ou de uma receita", () => {
    const fromTemplate = applyRequest(active(), call("POST", "/households/h-1/planned-meals/from-template", {}, { from: "2026-11-23" }));
    expect(fromTemplate.planFrom).toBe("2026-11-23");
    const fromRecipe = applyRequest(active(), call("POST", "/households/h-1/planned-meals", {}, { date: "2026-11-17" }));
    expect(fromRecipe.planFrom).toBe("2026-11-17");
    expect(applyRequest(fromTemplate, call("POST", "/households/h-1/planned-meals", {}, { date: "2026-11-17" })).planFrom).toBe("2026-11-23");
  });
});

describe("skipStep", () => {
  it("marca o passo como feito sem mexer no resto", () => {
    const tour = active(["household"]);
    expect(skipStep(tour, "members").done).toEqual(["household", "members"]);
    expect(skipStep(tour, "household")).toBe(tour);
  });
});
