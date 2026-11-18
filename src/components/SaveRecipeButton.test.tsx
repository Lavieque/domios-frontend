// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const listSavedRecipes = vi.fn();
const saveRecipe = vi.fn();
const removeSavedRecipe = vi.fn();
vi.mock("../api/savedRecipes", () => ({
  listSavedRecipes: (householdId: string) => listSavedRecipes(householdId),
  saveRecipe: (householdId: string, recipeId: string) => saveRecipe(householdId, recipeId),
  removeSavedRecipe: (householdId: string, recipeId: string) => removeSavedRecipe(householdId, recipeId),
}));

const { SaveRecipeButton } = await import("./SaveRecipeButton");
const { pt } = await import("../i18n/pt");

const flush = () => act(async () => undefined);

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("SaveRecipeButton", () => {
  it("guarda uma receita que ainda não estava guardada", async () => {
    listSavedRecipes.mockResolvedValue([]);
    saveRecipe.mockResolvedValue({});
    render(<SaveRecipeButton householdId="h-1" recipeId="r-1" />);
    await flush();
    const button = screen.getByRole("button");
    const before = button.textContent;
    fireEvent.click(button);
    await flush();
    expect(saveRecipe).toHaveBeenCalledWith("h-1", "r-1");
    expect(screen.getByRole("button").textContent).not.toBe(before);
  });

  it("tira dos guardados uma receita que já lá estava", async () => {
    listSavedRecipes.mockResolvedValue([{ recipeId: "r-1" }]);
    removeSavedRecipe.mockResolvedValue(undefined);
    render(<SaveRecipeButton householdId="h-1" recipeId="r-1" />);
    await flush();
    fireEvent.click(screen.getByRole("button"));
    await flush();
    expect(removeSavedRecipe).toHaveBeenCalledWith("h-1", "r-1");
  });

  it("se não conseguir ver os guardados, diz porquê", async () => {
    listSavedRecipes.mockRejectedValue(new Error("offline"));
    render(<SaveRecipeButton householdId="h-1" recipeId="r-1" />);
    await flush();
    expect(screen.getByText(pt.ui.saveRecipe.checkFailed)).toBeTruthy();
  });

  it("noutra receita, volta a perguntar à Api em vez de herdar o clique anterior", async () => {
    listSavedRecipes.mockResolvedValue([]);
    saveRecipe.mockResolvedValue({});
    const { rerender } = render(<SaveRecipeButton householdId="h-1" recipeId="r-1" />);
    await flush();
    const unsaved = screen.getByRole("button").textContent;
    fireEvent.click(screen.getByRole("button"));
    await flush();
    rerender(<SaveRecipeButton householdId="h-1" recipeId="r-2" />);
    await flush();
    expect(listSavedRecipes).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button").textContent).toBe(unsaved);
  });
});
