// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PriceObservationDto } from "../api/types";

const getPriceHistory = vi.fn<() => Promise<PriceObservationDto[]>>();
vi.mock("../api/client", () => ({ getPriceHistory: () => getPriceHistory() }));

const { PriceHistory } = await import("./PriceHistory");
const { pt } = await import("../i18n/pt");

const obs = (daysAgo: number, amount: number, currency = "EUR"): PriceObservationDto => ({
  priceObservationId: `o-${daysAgo}`,
  price: { amount, currency },
  observedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  source: 1,
  confidence: 1,
  promotionId: null,
});

async function show() {
  const view = render(<PriceHistory storeId="s-1" storeOfferId="o-1" />);
  await act(async () => undefined);
  return view;
}

afterEach(() => {
  cleanup();
  getPriceHistory.mockReset();
});

describe("PriceHistory", () => {
  it("diz que está a carregar enquanto o histórico não chega", () => {
    getPriceHistory.mockReturnValue(new Promise(() => undefined));
    render(<PriceHistory storeId="s-1" storeOfferId="o-1" />);
    expect(screen.getByText(pt.ui.price.historyLoading)).toBeTruthy();
  });

  it("com duas ou mais observações, desenha o gráfico e a tabela", async () => {
    getPriceHistory.mockResolvedValue([obs(30, 1.5), obs(10, 1.2), obs(1, 1.4)]);
    await show();
    expect(screen.getByRole("img")).toBeTruthy();
    // A tabela para leitores de ecrã: cabeçalho + uma linha por observação.
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  it("com uma só observação em euros, diz que há poucas", async () => {
    getPriceHistory.mockResolvedValue([obs(3, 1.5)]);
    await show();
    expect(screen.getByText(pt.ui.price.historyTooFew)).toBeTruthy();
  });

  it("com o histórico noutra moeda, não mostra nada", async () => {
    getPriceHistory.mockResolvedValue([obs(3, 1.5, "USD"), obs(2, 1.6, "USD")]);
    const { container } = await show();
    expect(container.innerHTML).toBe("");
  });

  it("se falhar, não mostra nada", async () => {
    getPriceHistory.mockRejectedValue(new Error("offline"));
    const { container } = await show();
    expect(container.innerHTML).toBe("");
  });
});
