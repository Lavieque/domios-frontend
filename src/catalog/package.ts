import { MeasurementUnit, measurementUnitLabels } from "../api/types";
import { localized } from "../i18n";
import { numberFormat } from "../i18n/format";

const quantity = numberFormat({ maximumFractionDigits: 2 });

/**
 * A embalagem como se lê na prateleira: "92 g" em vez de "0.092 kg", "1,5 l" em vez de "1.5 l".
 * Abaixo de 1 kg ou 1 l desce para gramas ou mililitros.
 */
export function formatPackage(amount: number, unit: MeasurementUnit): string {
  if (unit === MeasurementUnit.Kilogram && amount > 0 && amount < 1) {
    return `${quantity.format(amount * 1000)} ${measurementUnitLabels[MeasurementUnit.Gram]}`;
  }
  if (unit === MeasurementUnit.Liter && amount > 0 && amount < 1) {
    return `${quantity.format(amount * 1000)} ${measurementUnitLabels[MeasurementUnit.Milliliter]}`;
  }
  return `${quantity.format(amount)} ${measurementUnitLabels[unit]}`;
}

// A Api devolve os alergénios como as lojas os publicam, muitas vezes em inglês.
const allergenNames: Record<string, string> = localized((t) => t.enums.allergens);

/** O alergénio em português quando é um dos conhecidos; caso contrário, como veio. */
export function allergenLabel(allergen: string): string {
  return allergenNames[allergen.trim().toLowerCase()] ?? allergen;
}
