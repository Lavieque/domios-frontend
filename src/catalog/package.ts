import { MeasurementUnit, measurementUnitLabels } from "../api/types";

const quantity = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });

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
const allergenNames: Record<string, string> = {
  gluten: "Glúten",
  milk: "Leite",
  eggs: "Ovos",
  egg: "Ovos",
  fish: "Peixe",
  crustaceans: "Crustáceos",
  molluscs: "Moluscos",
  peanuts: "Amendoins",
  nuts: "Frutos de casca rija",
  "tree nuts": "Frutos de casca rija",
  soy: "Soja",
  soybeans: "Soja",
  soya: "Soja",
  celery: "Aipo",
  mustard: "Mostarda",
  sesame: "Sésamo",
  "sesame seeds": "Sésamo",
  sulphites: "Sulfitos",
  sulfites: "Sulfitos",
  "sulphur dioxide": "Sulfitos",
  lupin: "Tremoço",
  lactose: "Lactose",
};

/** O alergénio em português quando é um dos conhecidos; caso contrário, como veio. */
export function allergenLabel(allergen: string): string {
  return allergenNames[allergen.trim().toLowerCase()] ?? allergen;
}
