import { describe, expect, it } from "vitest";
import { templateImage } from "./templateImage";

describe("templateImage", () => {
  it("escolhe a fotografia pelo tipo da ementa", () => {
    expect(templateImage(["Peixe", "Semana"])).toBe("/editorial/salmon.jpg");
    expect(templateImage(["Rápida", "Mês"])).toBe("/editorial/pasta.jpg");
    expect(templateImage(["Sem carne", "Semana"])).toBe("/editorial/scene-nutricao.jpg");
  });

  it("usa a fotografia de Ementas quando não reconhece o tipo", () => {
    expect(templateImage(["Natal"])).toBe("/editorial/scene-ementas.jpg");
  });
});
