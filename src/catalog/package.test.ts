import { describe, expect, it } from "vitest";
import { MeasurementUnit } from "../api/types";
import { allergenLabel, formatPackage } from "./package";

describe("formatPackage", () => {
  it("desce para gramas e mililitros abaixo de 1", () => {
    expect(formatPackage(0.092, MeasurementUnit.Kilogram)).toBe("92 g");
    expect(formatPackage(0.33, MeasurementUnit.Liter)).toBe("330 ml");
  });

  it("usa vírgula decimal e mantém a unidade acima de 1", () => {
    expect(formatPackage(1.5, MeasurementUnit.Liter)).toBe("1,5 l");
    expect(formatPackage(500, MeasurementUnit.Gram)).toBe("500 g");
    expect(formatPackage(6, MeasurementUnit.Unit)).toBe("6 un");
  });
});

describe("allergenLabel", () => {
  it("traduz os alergénios conhecidos e deixa os outros como vieram", () => {
    expect(allergenLabel("Milk")).toBe("Leite");
    expect(allergenLabel("gluten")).toBe("Glúten");
    expect(allergenLabel("Aveia")).toBe("Aveia");
  });
});
