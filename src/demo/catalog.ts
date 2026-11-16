// Demo catalog: everything the real Api serves from its shared catalog
// (products, ingredients, chains, stores, recipes, menus). Fixed data, with
// every name in Portuguese and English so the demo follows the app language.

import { getLanguage } from "../i18n/language";

export interface L {
  pt: string;
  en: string;
}

export const l = (pt: string, en: string): L => ({ pt, en });

/** Text in the current app language. */
export function tx(value: L): string {
  return value[getLanguage()];
}

// MeasurementUnit: 0 Unit, 1 Gram, 2 Kilogram, 3 Milliliter, 4 Liter
export const U = { un: 0, g: 1, kg: 2, ml: 3, l: 4 } as const;

// ---------------------------------------------------------------- categories

export interface DemoCategory {
  id: string;
  name: L;
  scope: number;
}

export const categories: DemoCategory[] = [
  { id: "c-mercearia", name: l("Mercearia", "Pantry staples"), scope: 3 },
  { id: "c-frescos", name: l("Frutas e legumes", "Fruit and vegetables"), scope: 3 },
  { id: "c-talho", name: l("Carne e peixe", "Meat and fish"), scope: 3 },
  { id: "c-laticinios", name: l("Laticínios e ovos", "Dairy and eggs"), scope: 3 },
  { id: "c-padaria", name: l("Padaria", "Bakery"), scope: 3 },
  { id: "c-bebidas", name: l("Bebidas", "Drinks"), scope: 3 },
  { id: "c-congelados", name: l("Congelados", "Frozen"), scope: 3 },
  { id: "c-limpeza", name: l("Limpeza da casa", "Household cleaning"), scope: 2 },
];

// --------------------------------------------------------------- ingredients

export interface DemoIngredient {
  id: string;
  name: L;
  defaultUnit: number;
  /** Grams per unit, for ingredients counted in units. */
  unitWeight?: number;
  /** Product allergens carried by this ingredient. */
  allergens?: string[];
  /** Meat/fish, for diet checks. */
  animal?: "meat" | "fish";
}

export const ingredients: DemoIngredient[] = [
  { id: "i-arroz", name: l("Arroz", "Rice"), defaultUnit: U.g },
  { id: "i-massa", name: l("Massa", "Pasta"), defaultUnit: U.g, allergens: ["gluten"] },
  { id: "i-azeite", name: l("Azeite", "Olive oil"), defaultUnit: U.ml },
  { id: "i-cebola", name: l("Cebola", "Onion"), defaultUnit: U.un, unitWeight: 150 },
  { id: "i-alho", name: l("Alho", "Garlic"), defaultUnit: U.un, unitWeight: 5 },
  { id: "i-tomate", name: l("Tomate", "Tomato"), defaultUnit: U.un, unitWeight: 120 },
  { id: "i-tomate-pelado", name: l("Tomate pelado", "Canned tomatoes"), defaultUnit: U.g },
  { id: "i-batata", name: l("Batata", "Potato"), defaultUnit: U.g },
  { id: "i-cenoura", name: l("Cenoura", "Carrot"), defaultUnit: U.un, unitWeight: 80 },
  { id: "i-courgette", name: l("Curgete", "Courgette"), defaultUnit: U.un, unitWeight: 250 },
  { id: "i-pimento", name: l("Pimento", "Bell pepper"), defaultUnit: U.un, unitWeight: 160 },
  { id: "i-espinafres", name: l("Espinafres", "Spinach"), defaultUnit: U.g },
  { id: "i-alface", name: l("Alface", "Lettuce"), defaultUnit: U.un, unitWeight: 300 },
  { id: "i-pepino", name: l("Pepino", "Cucumber"), defaultUnit: U.un, unitWeight: 300 },
  { id: "i-limao", name: l("Limão", "Lemon"), defaultUnit: U.un, unitWeight: 100 },
  { id: "i-banana", name: l("Banana", "Banana"), defaultUnit: U.un, unitWeight: 120 },
  { id: "i-maca", name: l("Maçã", "Apple"), defaultUnit: U.un, unitWeight: 180 },
  { id: "i-frango", name: l("Peito de frango", "Chicken breast"), defaultUnit: U.g, animal: "meat" },
  { id: "i-carne-picada", name: l("Carne picada", "Minced beef"), defaultUnit: U.g, animal: "meat" },
  { id: "i-chourico", name: l("Chouriço", "Chouriço sausage"), defaultUnit: U.g, animal: "meat" },
  { id: "i-bacalhau", name: l("Bacalhau", "Salt cod"), defaultUnit: U.g, allergens: ["fish"], animal: "fish" },
  { id: "i-salmao", name: l("Salmão", "Salmon"), defaultUnit: U.g, allergens: ["fish"], animal: "fish" },
  { id: "i-ovo", name: l("Ovo", "Egg"), defaultUnit: U.un, unitWeight: 55, allergens: ["eggs"] },
  { id: "i-leite", name: l("Leite", "Milk"), defaultUnit: U.ml, allergens: ["milk", "lactose"] },
  { id: "i-natas", name: l("Natas", "Cream"), defaultUnit: U.ml, allergens: ["milk", "lactose"] },
  { id: "i-manteiga", name: l("Manteiga", "Butter"), defaultUnit: U.g, allergens: ["milk", "lactose"] },
  { id: "i-queijo", name: l("Queijo", "Cheese"), defaultUnit: U.g, allergens: ["milk", "lactose"] },
  { id: "i-iogurte", name: l("Iogurte natural", "Plain yoghurt"), defaultUnit: U.un, unitWeight: 125, allergens: ["milk", "lactose"] },
  { id: "i-farinha", name: l("Farinha", "Flour"), defaultUnit: U.g, allergens: ["gluten"] },
  { id: "i-acucar", name: l("Açúcar", "Sugar"), defaultUnit: U.g },
  { id: "i-grao", name: l("Grão-de-bico", "Chickpeas"), defaultUnit: U.g },
  { id: "i-feijao", name: l("Feijão encarnado", "Red kidney beans"), defaultUnit: U.g },
  { id: "i-pao", name: l("Pão", "Bread"), defaultUnit: U.un, unitWeight: 60, allergens: ["gluten"] },
  { id: "i-aveia", name: l("Flocos de aveia", "Rolled oats"), defaultUnit: U.g, allergens: ["gluten"] },
  { id: "i-cafe", name: l("Café", "Coffee"), defaultUnit: U.g },
  { id: "i-agua", name: l("Água", "Water"), defaultUnit: U.l },
  { id: "i-ervilhas", name: l("Ervilhas", "Peas"), defaultUnit: U.g },
  { id: "i-couve", name: l("Couve galega", "Portuguese kale"), defaultUnit: U.g },
  { id: "i-porco", name: l("Lombo de porco", "Pork loin"), defaultUnit: U.g, animal: "meat" },
  { id: "i-ameijoas", name: l("Amêijoas", "Clams"), defaultUnit: U.g, allergens: ["molluscs"], animal: "fish" },
  { id: "i-camarao", name: l("Camarão", "Prawns"), defaultUnit: U.g, allergens: ["crustaceans"], animal: "fish" },
  { id: "i-pato", name: l("Pato", "Duck"), defaultUnit: U.g, animal: "meat" },
  { id: "i-canela", name: l("Canela", "Cinnamon"), defaultUnit: U.g },
  { id: "i-granola", name: l("Granola", "Granola"), defaultUnit: U.g, allergens: ["gluten", "nuts"] },
  { id: "i-mel", name: l("Mel", "Honey"), defaultUnit: U.g },
  { id: "i-laranja", name: l("Laranja", "Orange"), defaultUnit: U.un, unitWeight: 180 },
  { id: "i-morango", name: l("Morangos", "Strawberries"), defaultUnit: U.g },
  { id: "i-pera", name: l("Pera", "Pear"), defaultUnit: U.un, unitWeight: 170 },
  { id: "i-brocolos", name: l("Brócolos", "Broccoli"), defaultUnit: U.g },
  { id: "i-cogumelos", name: l("Cogumelos", "Mushrooms"), defaultUnit: U.g },
  { id: "i-atum", name: l("Atum em lata", "Tinned tuna"), defaultUnit: U.g, allergens: ["fish"], animal: "fish" },
  { id: "i-sardinha", name: l("Sardinhas", "Sardines"), defaultUnit: U.g, allergens: ["fish"], animal: "fish" },
  { id: "i-pescada", name: l("Pescada", "Hake"), defaultUnit: U.g, allergens: ["fish"], animal: "fish" },
  { id: "i-coentros", name: l("Coentros", "Coriander"), defaultUnit: U.g },
  { id: "i-fiambre", name: l("Fiambre", "Ham"), defaultUnit: U.g, animal: "meat" },
];

export const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

// ------------------------------------------------------------------ products

export interface Nutrition {
  energyKcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  saturates: number;
  fiber: number;
  salt: number;
}

const n = (energyKcal: number, protein: number, carbs: number, sugar: number, fat: number, saturates: number, fiber: number, salt: number): Nutrition => ({
  energyKcal, protein, carbs, sugar, fat, saturates, fiber, salt,
});

export interface DemoProduct {
  id: string;
  name: L;
  brand: string | null;
  categoryId: string;
  barcode: string;
  qty: number;
  unit: number;
  ingredientId: string | null;
  /** Base shelf price in euros, per package. */
  price: number;
  /** Per 100 g/ml. */
  nutrition: Nutrition;
  allergens: string[];
  imageUrl?: string | null;
  discontinued?: boolean;
  substitutedBy?: string;
}

const p = (
  id: string, name: L, brand: string | null, categoryId: string, barcode: string, qty: number, unit: number,
  ingredientId: string | null, price: number, nutrition: Nutrition, allergens: string[] = [], extra: Partial<DemoProduct> = {},
): DemoProduct => ({ id, name, brand, categoryId, barcode, qty, unit, ingredientId, price, nutrition, allergens, imageUrl: `/demo/photos/${id}.jpg`, ...extra });

export const products: DemoProduct[] = [
  p("p-arroz-carolino", l("Arroz carolino", "Carolino rice"), "Cigala", "c-mercearia", "5601234000011", 1, U.kg, "i-arroz", 1.69, n(350, 7, 78, 0.3, 0.6, 0.2, 1.4, 0)),
  p("p-arroz-basmati", l("Arroz basmati", "Basmati rice"), "Bom Sucesso", "c-mercearia", "5601234000028", 500, U.g, "i-arroz", 1.99, n(352, 8, 77, 0.2, 0.9, 0.2, 1.3, 0)),
  p("p-esparguete", l("Esparguete", "Spaghetti"), "Milaneza", "c-mercearia", "5601234000035", 500, U.g, "i-massa", 0.99, n(357, 12, 72, 3.5, 1.5, 0.3, 3, 0), ["gluten"]),
  p("p-penne", l("Massa penne", "Penne pasta"), "Nacional", "c-mercearia", "5601234000042", 500, U.g, "i-massa", 1.09, n(355, 12.5, 71, 3.2, 1.6, 0.3, 3.1, 0), ["gluten"]),
  p("p-azeite", l("Azeite virgem extra", "Extra virgin olive oil"), "Gallo", "c-mercearia", "5601234000059", 750, U.ml, "i-azeite", 6.49, n(824, 0, 0, 0, 91.6, 13.8, 0, 0)),
  p("p-tomate-pelado", l("Tomate pelado", "Peeled tomatoes"), "Guloso", "c-mercearia", "5601234000066", 400, U.g, "i-tomate-pelado", 0.89, n(22, 1.1, 3.6, 3.2, 0.2, 0, 1, 0.1)),
  p("p-grao", l("Grão-de-bico cozido", "Cooked chickpeas"), "Compal", "c-mercearia", "5601234000073", 540, U.g, "i-grao", 1.15, n(115, 6.8, 13, 0.6, 2.4, 0.3, 5.5, 0.6)),
  p("p-feijao", l("Feijão encarnado cozido", "Cooked red kidney beans"), "Compal", "c-mercearia", "5601234000080", 540, U.g, "i-feijao", 1.09, n(98, 6.5, 13, 0.5, 0.6, 0.1, 6.4, 0.5)),
  p("p-farinha", l("Farinha de trigo", "Wheat flour"), "Branca de Neve", "c-mercearia", "5601234000097", 1, U.kg, "i-farinha", 0.95, n(340, 10, 71, 1.4, 1.3, 0.2, 3, 0), ["gluten"]),
  p("p-acucar", l("Açúcar branco", "White sugar"), "RAR", "c-mercearia", "5601234000103", 1, U.kg, "i-acucar", 1.29, n(400, 0, 100, 100, 0, 0, 0, 0)),
  p("p-aveia", l("Flocos de aveia", "Rolled oats"), "Quaker", "c-mercearia", "5601234000110", 500, U.g, "i-aveia", 1.79, n(372, 13.5, 58.7, 1, 7, 1.3, 10, 0), ["gluten"]),
  p("p-cafe", l("Café moído", "Ground coffee"), "Delta", "c-mercearia", "5601234000127", 250, U.g, "i-cafe", 3.49, n(2, 0.1, 0, 0, 0, 0, 0, 0)),
  p("p-cebola", l("Cebola", "Onions"), null, "c-frescos", "2000000000011", 1, U.kg, "i-cebola", 1.19, n(40, 1.1, 9.3, 4.2, 0.1, 0, 1.7, 0)),
  p("p-alho", l("Alho", "Garlic"), null, "c-frescos", "2000000000028", 250, U.g, "i-alho", 1.49, n(149, 6.4, 33, 1, 0.5, 0.1, 2.1, 0)),
  p("p-tomate", l("Tomate chucha", "Plum tomatoes"), null, "c-frescos", "2000000000035", 1, U.kg, "i-tomate", 2.29, n(18, 0.9, 3.9, 2.6, 0.2, 0, 1.2, 0)),
  p("p-batata", l("Batata branca", "White potatoes"), null, "c-frescos", "2000000000042", 3, U.kg, "i-batata", 2.99, n(77, 2, 17, 0.8, 0.1, 0, 2.2, 0)),
  p("p-cenoura", l("Cenoura", "Carrots"), null, "c-frescos", "2000000000059", 1, U.kg, "i-cenoura", 0.99, n(41, 0.9, 9.6, 4.7, 0.2, 0, 2.8, 0.1)),
  p("p-courgette", l("Curgete", "Courgette"), null, "c-frescos", "2000000000066", 1, U.un, "i-courgette", 0.79, n(17, 1.2, 3.1, 2.5, 0.3, 0.1, 1, 0)),
  p("p-pimento", l("Pimento vermelho", "Red bell pepper"), null, "c-frescos", "2000000000073", 1, U.un, "i-pimento", 0.69, n(31, 1, 6, 4.2, 0.3, 0, 2.1, 0)),
  p("p-espinafres", l("Espinafres baby", "Baby spinach"), "Vitacress", "c-frescos", "2000000000080", 200, U.g, "i-espinafres", 1.89, n(23, 2.9, 3.6, 0.4, 0.4, 0.1, 2.2, 0.2)),
  p("p-alface", l("Alface iceberg", "Iceberg lettuce"), null, "c-frescos", "2000000000097", 1, U.un, "i-alface", 0.89, n(14, 0.9, 3, 2, 0.1, 0, 1.2, 0)),
  p("p-pepino", l("Pepino", "Cucumber"), null, "c-frescos", "2000000000103", 1, U.un, "i-pepino", 0.59, n(15, 0.7, 3.6, 1.7, 0.1, 0, 0.5, 0)),
  p("p-limao", l("Limão", "Lemons"), null, "c-frescos", "2000000000110", 500, U.g, "i-limao", 1.39, n(29, 1.1, 9.3, 2.5, 0.3, 0, 2.8, 0)),
  p("p-banana", l("Banana da Madeira", "Madeira bananas"), null, "c-frescos", "2000000000127", 1, U.kg, "i-banana", 1.79, n(89, 1.1, 22.8, 12.2, 0.3, 0.1, 2.6, 0)),
  p("p-maca", l("Maçã de Alcobaça", "Alcobaça apples"), null, "c-frescos", "2000000000134", 1, U.kg, "i-maca", 1.99, n(52, 0.3, 13.8, 10.4, 0.2, 0, 2.4, 0)),
  p("p-frango", l("Peito de frango", "Chicken breast"), null, "c-talho", "2000000000141", 600, U.g, "i-frango", 4.79, n(110, 23, 0, 0, 1.6, 0.4, 0, 0.2)),
  p("p-carne-picada", l("Carne de vaca picada", "Minced beef"), null, "c-talho", "2000000000158", 500, U.g, "i-carne-picada", 4.99, n(215, 18.6, 0, 0, 15.4, 6.3, 0, 0.2)),
  p("p-chourico", l("Chouriço de carne", "Pork chouriço"), "Nobre", "c-talho", "5601234000134", 200, U.g, "i-chourico", 2.59, n(390, 24, 2, 1, 32, 12, 0, 3.4)),
  p("p-bacalhau", l("Bacalhau demolhado", "Soaked salt cod"), "Riberalves", "c-congelados", "5601234000141", 800, U.g, "i-bacalhau", 8.99, n(82, 18, 0, 0, 0.7, 0.1, 0, 1.2), ["fish"]),
  p("p-salmao", l("Lombos de salmão", "Salmon fillets"), null, "c-talho", "2000000000165", 400, U.g, "i-salmao", 6.99, n(208, 20, 0, 0, 13, 3.1, 0, 0.1), ["fish"]),
  p("p-ervilhas", l("Ervilhas congeladas", "Frozen peas"), "Iglo", "c-congelados", "5601234000158", 450, U.g, "i-ervilhas", 1.49, n(81, 5.4, 14.5, 5.7, 0.4, 0.1, 5.1, 0)),
  p("p-ovos", l("Ovos de solo M", "Free-range eggs M"), "Matinados", "c-laticinios", "5601234000165", 12, U.un, "i-ovo", 2.99, n(143, 12.6, 0.7, 0.4, 9.5, 3.1, 0, 0.4), ["eggs"]),
  p("p-leite", l("Leite meio-gordo", "Semi-skimmed milk"), "Mimosa", "c-laticinios", "5601234000172", 1, U.l, "i-leite", 0.89, n(46, 3.3, 4.8, 4.8, 1.5, 1, 0, 0.1), ["milk", "lactose"]),
  p("p-natas", l("Natas para culinária", "Cooking cream"), "Mimosa", "c-laticinios", "5601234000189", 200, U.ml, "i-natas", 0.99, n(195, 2.5, 4, 3.5, 18, 12, 0, 0.1), ["milk", "lactose"]),
  p("p-manteiga", l("Manteiga com sal", "Salted butter"), "Mimosa", "c-laticinios", "5601234000196", 250, U.g, "i-manteiga", 2.79, n(740, 0.6, 0.6, 0.6, 82, 54, 0, 1.4), ["milk", "lactose"]),
  p("p-queijo", l("Queijo flamengo fatiado", "Sliced Edam cheese"), "Limiano", "c-laticinios", "5601234000202", 200, U.g, "i-queijo", 2.49, n(340, 25, 0.1, 0.1, 26, 17, 0, 1.6), ["milk", "lactose"]),
  p("p-iogurte", l("Iogurte natural (4 un)", "Plain yoghurt (4 pack)"), "Danone", "c-laticinios", "5601234000219", 4, U.un, "i-iogurte", 1.59, n(61, 3.6, 4.7, 4.7, 3.1, 2, 0, 0.1), ["milk", "lactose"]),
  p("p-pao", l("Pão de mistura (6 un)", "Mixed-grain rolls (6 pack)"), null, "c-padaria", "2000000000172", 6, U.un, "i-pao", 1.20, n(250, 8.5, 48, 2.5, 1.8, 0.4, 4, 1.1), ["gluten"]),
  p("p-pao-forma", l("Pão de forma integral", "Wholemeal sliced bread"), "Bimbo", "c-padaria", "5601234000226", 20, U.un, "i-pao", 2.19, n(240, 10, 41, 4, 3.5, 0.6, 6.5, 1), ["gluten"]),
  p("p-agua", l("Água mineral (6 × 1,5 L)", "Mineral water (6 × 1.5 L)"), "Luso", "c-bebidas", "5601234000233", 9, U.l, "i-agua", 2.39, n(0, 0, 0, 0, 0, 0, 0, 0)),
  p("p-sumo", l("Sumo de laranja", "Orange juice"), "Compal", "c-bebidas", "5601234000240", 1, U.l, null, 1.89, n(44, 0.6, 9.6, 9.6, 0.1, 0, 0.2, 0)),
  p("p-detergente", l("Detergente da loiça", "Dishwashing liquid"), "Fairy", "c-limpeza", "5601234000257", 650, U.ml, null, 2.29, n(0, 0, 0, 0, 0, 0, 0, 0)),
  p("p-papel", l("Rolos de cozinha (2 un)", "Kitchen roll (2 pack)"), "Renova", "c-limpeza", "5601234000264", 2, U.un, null, 1.99, n(0, 0, 0, 0, 0, 0, 0, 0)),
  p("p-couve", l("Couve galega cortada", "Shredded Portuguese kale"), null, "c-frescos", "2000000000189", 250, U.g, "i-couve", 1.49, n(35, 3, 4.4, 1, 0.6, 0.1, 3.6, 0)),
  p("p-laranja", l("Laranja do Algarve", "Algarve oranges"), null, "c-frescos", "2000000000196", 2, U.kg, "i-laranja", 2.49, n(47, 0.9, 11.8, 9.4, 0.1, 0, 2.4, 0)),
  p("p-morango", l("Morangos", "Strawberries"), null, "c-frescos", "2000000000202", 500, U.g, "i-morango", 2.99, n(32, 0.7, 7.7, 4.9, 0.3, 0, 2, 0)),
  p("p-pera", l("Pera Rocha do Oeste", "Rocha pears"), null, "c-frescos", "2000000000219", 1, U.kg, "i-pera", 1.89, n(57, 0.4, 15, 9.8, 0.1, 0, 3.1, 0)),
  p("p-brocolos", l("Brócolos", "Broccoli"), null, "c-frescos", "2000000000226", 500, U.g, "i-brocolos", 1.79, n(34, 2.8, 6.6, 1.7, 0.4, 0, 2.6, 0)),
  p("p-cogumelos", l("Cogumelos brancos", "White mushrooms"), null, "c-frescos", "2000000000233", 250, U.g, "i-cogumelos", 1.69, n(22, 3.1, 3.3, 2, 0.3, 0, 1, 0)),
  p("p-coentros", l("Coentros frescos", "Fresh coriander"), null, "c-frescos", "2000000000240", 50, U.g, "i-coentros", 0.89, n(23, 2.1, 3.7, 0.9, 0.5, 0, 2.8, 0.1)),
  p("p-porco", l("Lombo de porco", "Pork loin"), null, "c-talho", "2000000000257", 800, U.g, "i-porco", 5.59, n(143, 21, 0, 0, 6.3, 2.2, 0, 0.1)),
  p("p-pato", l("Pato inteiro", "Whole duck"), null, "c-talho", "2000000000264", 2, U.kg, "i-pato", 11.98, n(337, 19, 0, 0, 28, 9.7, 0, 0.2)),
  p("p-fiambre", l("Fiambre da perna", "Sliced ham"), "Nobre", "c-talho", "5601234000288", 200, U.g, "i-fiambre", 2.29, n(110, 18, 1.5, 1, 3.5, 1.2, 0, 2)),
  p("p-ameijoas", l("Amêijoa boa", "Clams"), null, "c-talho", "2000000000271", 500, U.g, "i-ameijoas", 6.49, n(74, 13, 2.6, 0, 1, 0.2, 0, 1.2), ["molluscs"]),
  p("p-camarao", l("Camarão cozido", "Cooked prawns"), "Pescanova", "c-congelados", "5601234000295", 400, U.g, "i-camarao", 5.99, n(99, 24, 0.2, 0, 0.3, 0.1, 0, 0.9), ["crustaceans"]),
  p("p-pescada", l("Filetes de pescada", "Hake fillets"), "Pescanova", "c-congelados", "5601234000301", 400, U.g, "i-pescada", 4.49, n(71, 15.6, 0, 0, 1, 0.2, 0, 0.3), ["fish"]),
  p("p-gelado", l("Gelado de baunilha", "Vanilla ice cream"), "Olá", "c-congelados", "5601234000318", 900, U.ml, null, 3.99, n(210, 3.5, 24, 21, 11, 7, 0, 0.1), ["milk"]),
  p("p-atum", l("Atum em azeite", "Tuna in olive oil"), "Bom Petisco", "c-mercearia", "5601234000325", 120, U.g, "i-atum", 1.59, n(198, 25, 0, 0, 11, 2, 0, 0.9), ["fish"]),
  p("p-sardinha", l("Sardinhas em tomate", "Sardines in tomato"), "Ramirez", "c-mercearia", "5601234000332", 120, U.g, "i-sardinha", 1.49, n(180, 18, 1.5, 1, 11, 3, 0, 0.8), ["fish"]),
  p("p-canela", l("Canela em pau", "Cinnamon sticks"), "Margão", "c-mercearia", "5601234000349", 30, U.g, "i-canela", 1.29, n(247, 4, 81, 2.2, 1.2, 0.3, 53, 0)),
  p("p-granola", l("Granola com frutos secos", "Nut granola"), "Kellogg's", "c-mercearia", "5601234000356", 400, U.g, "i-granola", 3.29, n(450, 10, 60, 18, 18, 3, 7, 0.1), ["gluten", "nuts"]),
  p("p-mel", l("Mel de rosmaninho", "Rosemary honey"), "Serra da Estrela", "c-mercearia", "5601234000363", 500, U.g, "i-mel", 4.99, n(304, 0.3, 82, 82, 0, 0, 0, 0)),
  p("p-broa", l("Broa de milho", "Portuguese corn bread"), null, "c-padaria", "2000000000288", 1, U.un, null, 2.49, n(230, 5.5, 46, 1.5, 2, 0.4, 3.5, 1.2), ["gluten"]),
  p("p-croissant", l("Croissants de manteiga (4 un)", "Butter croissants (4 pack)"), null, "c-padaria", "2000000000295", 4, U.un, null, 2.19, n(406, 8, 45, 11, 21, 12, 2.6, 0.9), ["gluten", "milk"]),
  p("p-pao-alentejano", l("Pão alentejano", "Alentejo bread"), null, "c-padaria", "2000000000301", 1, U.un, null, 2.69, n(250, 8.5, 50, 1.5, 1.2, 0.3, 3, 1.3), ["gluten"]),
  p("p-vinho", l("Vinho tinto do Douro", "Douro red wine"), "Esporão", "c-bebidas", "5601234000370", 750, U.ml, null, 6.99, n(85, 0.1, 2.6, 0.6, 0, 0, 0, 0)),
  p("p-cerveja", l("Cerveja (6 × 33 cl)", "Lager (6 × 33 cl)"), "Super Bock", "c-bebidas", "5601234000387", 1980, U.ml, null, 4.49, n(43, 0.4, 3.4, 0, 0, 0, 0, 0)),
  p("p-agua-gas", l("Água com gás", "Sparkling water"), "Pedras", "c-bebidas", "5601234000394", 1, U.l, null, 0.99, n(0, 0, 0, 0, 0, 0, 0, 0.1)),
  p("p-lixivia", l("Lixívia tradicional", "Bleach"), "Neoblanc", "c-limpeza", "5601234000400", 2, U.l, null, 1.49, n(0, 0, 0, 0, 0, 0, 0, 0)),
  p("p-detergente-roupa", l("Detergente da roupa", "Laundry detergent"), "Skip", "c-limpeza", "5601234000417", 2, U.l, null, 9.99, n(0, 0, 0, 0, 0, 0, 0, 0)),
  p("p-papel-higienico", l("Papel higiénico (12 rolos)", "Toilet paper (12 rolls)"), "Renova", "c-limpeza", "5601234000424", 12, U.un, null, 5.49, n(0, 0, 0, 0, 0, 0, 0, 0)),
  p("p-cereais-velho", l("Cereais de mel (antiga)", "Honey cereal (old recipe)"), "Nestlé", "c-mercearia", "5601234000271", 375, U.g, null, 2.89, n(380, 7, 80, 30, 2.5, 0.6, 5, 0.5), ["gluten"], { discontinued: true, substitutedBy: "p-aveia" }),
];

export const productById = new Map(products.map((x) => [x.id, x]));

/** The generic product of an ingredient: the first one linked to it. */
export function genericProductFor(ingredientId: string): DemoProduct | undefined {
  return products.find((x) => x.ingredientId === ingredientId && !x.discontinued);
}

// -------------------------------------------------------- chains and stores

export interface DemoChain {
  id: string;
  name: string;
  logo: string;
  /** Price multiplier against the base price. */
  factor: number;
  storeId: string;
}

export const chains: DemoChain[] = [
  { id: "ch-continente", name: "Continente", logo: "/chains/continente.svg", factor: 1.0, storeId: "st-continente" },
  { id: "ch-pingodoce", name: "Pingo Doce", logo: "/chains/pingo-doce.png", factor: 0.98, storeId: "st-pingodoce" },
  { id: "ch-lidl", name: "Lidl", logo: "/chains/lidl.svg", factor: 0.92, storeId: "st-lidl" },
  { id: "ch-auchan", name: "Auchan", logo: "/chains/auchan.svg", factor: 1.03, storeId: "st-auchan" },
];

export const chainById = new Map(chains.map((c) => [c.id, c]));

export function storeName(chain: DemoChain): string {
  return `${chain.name} Online`;
}

export interface DemoPhysicalStore {
  id: string;
  chainId: string;
  name: string;
  format: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
}

export const physicalStores: DemoPhysicalStore[] = [
  { id: "ps-cont-colombo", chainId: "ch-continente", name: "Continente Colombo", format: "hypermarket", address: "Av. Lusíada, 1500-392 Lisboa", lat: 38.7547, lng: -9.1887, hours: "Mo-Su 08:00-23:00" },
  { id: "ps-cont-telheiras", chainId: "ch-continente", name: "Continente Bom Dia Telheiras", format: "supermarket", address: "R. Prof. Francisco Gentil, 1600-625 Lisboa", lat: 38.7609, lng: -9.1649, hours: "Mo-Su 08:00-22:00" },
  { id: "ps-pd-alvalade", chainId: "ch-pingodoce", name: "Pingo Doce Alvalade", format: "supermarket", address: "Av. da Igreja 12, 1700-239 Lisboa", lat: 38.7505, lng: -9.1428, hours: "Mo-Su 08:30-21:00" },
  { id: "ps-pd-benfica", chainId: "ch-pingodoce", name: "Pingo Doce Benfica", format: "supermarket", address: "Estr. de Benfica 400, 1500-101 Lisboa", lat: 38.7468, lng: -9.1925, hours: "Mo-Su 08:30-21:00" },
  { id: "ps-lidl-areeiro", chainId: "ch-lidl", name: "Lidl Areeiro", format: "discount", address: "Av. João XXI 42, 1000-302 Lisboa", lat: 38.7415, lng: -9.1347, hours: "Mo-Su 08:00-22:00" },
  { id: "ps-lidl-lumiar", chainId: "ch-lidl", name: "Lidl Lumiar", format: "discount", address: "Alameda das Linhas de Torres 130, 1750-147 Lisboa", lat: 38.7702, lng: -9.1584, hours: "Mo-Su 08:00-22:00" },
  { id: "ps-auchan-amoreiras", chainId: "ch-auchan", name: "Auchan Amoreiras", format: "supermarket", address: "Av. Eng. Duarte Pacheco, 1070-103 Lisboa", lat: 38.7233, lng: -9.1615, hours: "Mo-Su 09:00-23:00" },
  { id: "ps-cont-saldanha", chainId: "ch-continente", name: "Continente Modelo Saldanha", format: "supermarket", address: "Av. Fontes Pereira de Melo 42, 1050-119 Lisboa", lat: 38.7339, lng: -9.1458, hours: "Mo-Su 08:00-22:00" },
  { id: "ps-pd-campo-ourique", chainId: "ch-pingodoce", name: "Pingo Doce Campo de Ourique", format: "supermarket", address: "R. Ferreira Borges 52, 1350-133 Lisboa", lat: 38.7175, lng: -9.1667, hours: "Mo-Su 08:30-21:30" },
  { id: "ps-lidl-benfica", chainId: "ch-lidl", name: "Lidl Benfica", format: "discount", address: "Estr. de Benfica 701, 1500-087 Lisboa", lat: 38.7512, lng: -9.2016, hours: "Mo-Su 08:00-22:00" },
  { id: "ps-auchan-alfragide", chainId: "ch-auchan", name: "Auchan Alfragide", format: "hypermarket", address: "Estr. Nacional 117, 2614-520 Amadora", lat: 38.7347, lng: -9.2168, hours: "Mo-Su 08:30-23:00" },
  { id: "ps-auchan-olivais", chainId: "ch-auchan", name: "My Auchan Olivais", format: "convenience", address: "Av. de Berlim 15, 1800-031 Lisboa", lat: 38.7631, lng: -9.1206, hours: "Mo-Su 08:00-21:00" },
];

export const physicalStoreById = new Map(physicalStores.map((s) => [s.id, s]));

/** Where the demo pretends the device is when the browser has no position. */
export const DEMO_ORIGIN = { latitude: 38.7489, longitude: -9.1604 };

// ------------------------------------------------------------------- recipes

export interface DemoRecipeIngredient {
  ingredientId: string;
  amount: number;
  unit: number;
  optional?: boolean;
  notes?: L;
}

export interface DemoRecipe {
  id: string;
  title: L;
  description: L;
  servings: number;
  prep: number;
  cook: number;
  difficulty: number;
  dishType: number;
  mainProtein: number | null;
  imageUrl: string | null;
  tags: L[];
  ingredients: DemoRecipeIngredient[];
  steps: { text: L; minutes?: number }[];
}

const ri = (ingredientId: string, amount: number, unit: number, optional = false): DemoRecipeIngredient => ({ ingredientId, amount, unit, optional });

// DishType: 0 Main, 1 Soup, 2 Starter, 3 Side, 4 Salad, 5 Dessert, 6 Breakfast. MainProtein: 0 Meat, 1 Fish, 2 Seafood, 3 Vegetarian.
export const recipes: DemoRecipe[] = [
  {
    id: "r-esparguete-bolonhesa", title: l("Esparguete à bolonhesa", "Spaghetti bolognese"),
    description: l("O clássico de família: molho de carne lento e muito tomate.", "The family classic: slow meat sauce and plenty of tomato."),
    servings: 4, prep: 15, cook: 35, difficulty: 0, dishType: 0, mainProtein: 0, imageUrl: "/editorial/pasta.jpg",
    tags: [l("família", "family"), l("massa", "pasta")],
    ingredients: [ri("i-massa", 400, U.g), ri("i-carne-picada", 500, U.g), ri("i-tomate-pelado", 400, U.g), ri("i-cebola", 1, U.un), ri("i-alho", 2, U.un), ri("i-cenoura", 1, U.un), ri("i-azeite", 30, U.ml), ri("i-queijo", 40, U.g, true)],
    steps: [
      { text: l("Pica a cebola, o alho e a cenoura. Aloura em azeite.", "Chop the onion, garlic and carrot. Soften them in olive oil."), minutes: 8 },
      { text: l("Junta a carne e deixa ganhar cor.", "Add the beef and let it brown."), minutes: 7 },
      { text: l("Acrescenta o tomate e deixa apurar em lume brando.", "Add the tomatoes and simmer gently."), minutes: 20 },
      { text: l("Coze a massa e serve com o molho e queijo ralado.", "Cook the pasta and serve with the sauce and grated cheese."), minutes: 10 },
    ],
  },
  {
    id: "r-sopa-legumes", title: l("Sopa de legumes", "Vegetable soup"),
    description: l("Sopa reconfortante que aproveita os legumes da semana.", "Comforting soup that uses up the week's vegetables."),
    servings: 6, prep: 15, cook: 30, difficulty: 0, dishType: 1, mainProtein: 3, imageUrl: "/editorial/soup.png",
    tags: [l("vegetariana", "vegetarian"), l("aproveitamento", "use it up")],
    ingredients: [ri("i-batata", 500, U.g), ri("i-cenoura", 3, U.un), ri("i-courgette", 1, U.un), ri("i-cebola", 1, U.un), ri("i-espinafres", 100, U.g), ri("i-azeite", 30, U.ml)],
    steps: [
      { text: l("Descasca e corta os legumes em pedaços.", "Peel and chop the vegetables."), minutes: 15 },
      { text: l("Coze tudo, menos os espinafres, em água temperada.", "Boil everything except the spinach in salted water."), minutes: 25 },
      { text: l("Tritura, junta os espinafres e um fio de azeite.", "Blend, then add the spinach and a drizzle of olive oil."), minutes: 5 },
    ],
  },
  {
    id: "r-salmao-forno", title: l("Salmão no forno com batata", "Baked salmon with potatoes"),
    description: l("Lombos de salmão com limão e batatas a murro.", "Salmon fillets with lemon and crushed potatoes."),
    servings: 2, prep: 10, cook: 30, difficulty: 0, dishType: 0, mainProtein: 1, imageUrl: "/editorial/salmon.jpg",
    tags: [l("peixe", "fish"), l("forno", "oven")],
    ingredients: [ri("i-salmao", 400, U.g), ri("i-batata", 500, U.g), ri("i-limao", 1, U.un), ri("i-alho", 2, U.un), ri("i-azeite", 40, U.ml)],
    steps: [
      { text: l("Coze as batatas com pele até ficarem macias.", "Boil the potatoes in their skins until tender."), minutes: 20 },
      { text: l("Tempera o salmão com limão, alho e azeite.", "Season the salmon with lemon, garlic and olive oil."), minutes: 5 },
      { text: l("Leva ao forno a 200 °C com as batatas esmagadas.", "Bake at 200 °C with the crushed potatoes."), minutes: 15 },
    ],
  },
  {
    id: "r-salada-grao", title: l("Salada de grão", "Chickpea salad"),
    description: l("Salada fresca e rápida para o almoço.", "A quick, fresh lunch salad."),
    servings: 2, prep: 15, cook: 0, difficulty: 0, dishType: 4, mainProtein: 3, imageUrl: null,
    tags: [l("rápida", "quick"), l("vegetariana", "vegetarian")],
    ingredients: [ri("i-grao", 400, U.g), ri("i-tomate", 2, U.un), ri("i-pepino", 1, U.un), ri("i-cebola", 0.5, U.un), ri("i-azeite", 30, U.ml), ri("i-limao", 0.5, U.un)],
    steps: [
      { text: l("Escorre e passa o grão por água.", "Drain and rinse the chickpeas.") },
      { text: l("Corta o tomate, o pepino e a cebola.", "Chop the tomato, cucumber and onion.") },
      { text: l("Mistura e tempera com azeite e limão.", "Mix and dress with olive oil and lemon.") },
    ],
  },
  {
    id: "r-bacalhau-bras", title: l("Bacalhau à Brás", "Bacalhau à Brás (cod with eggs and potatoes)"),
    description: l("Bacalhau desfiado com batata palha e ovo.", "Shredded cod with straw potatoes and egg."),
    servings: 4, prep: 20, cook: 20, difficulty: 1, dishType: 0, mainProtein: 1, imageUrl: null,
    tags: [l("tradicional", "traditional"), l("peixe", "fish")],
    ingredients: [ri("i-bacalhau", 400, U.g), ri("i-batata", 500, U.g), ri("i-ovo", 6, U.un), ri("i-cebola", 2, U.un), ri("i-alho", 2, U.un), ri("i-azeite", 60, U.ml)],
    steps: [
      { text: l("Corta a batata em palha fina e frita.", "Cut the potatoes into fine straws and fry them."), minutes: 15 },
      { text: l("Aloura a cebola e o alho, junta o bacalhau desfiado.", "Soften onion and garlic, add the shredded cod."), minutes: 10 },
      { text: l("Junta a batata e os ovos batidos, mexendo sem secar.", "Fold in the potatoes and beaten eggs without drying them."), minutes: 5 },
    ],
  },
  {
    id: "r-frango-caril", title: l("Caril de frango", "Chicken curry"),
    description: l("Caril suave com natas e arroz basmati.", "Mild curry with cream and basmati rice."),
    servings: 4, prep: 15, cook: 25, difficulty: 1, dishType: 0, mainProtein: 0, imageUrl: null,
    tags: [l("família", "family")],
    ingredients: [ri("i-frango", 600, U.g), ri("i-arroz", 300, U.g), ri("i-cebola", 1, U.un), ri("i-alho", 2, U.un), ri("i-natas", 200, U.ml), ri("i-tomate-pelado", 200, U.g), ri("i-azeite", 20, U.ml)],
    steps: [
      { text: l("Corta o frango em cubos e aloura com cebola e alho.", "Dice the chicken and brown it with onion and garlic."), minutes: 10 },
      { text: l("Junta o tomate, o caril e as natas. Deixa apurar.", "Add the tomatoes, curry and cream. Simmer."), minutes: 15 },
      { text: l("Serve com arroz basmati cozido.", "Serve with boiled basmati rice."), minutes: 15 },
    ],
  },
  {
    id: "r-omelete-espinafres", title: l("Omelete de espinafres", "Spinach omelette"),
    description: l("Jantar rápido de dez minutos.", "A ten-minute supper."),
    servings: 2, prep: 5, cook: 8, difficulty: 0, dishType: 0, mainProtein: 3, imageUrl: null,
    tags: [l("rápida", "quick"), l("vegetariana", "vegetarian")],
    ingredients: [ri("i-ovo", 4, U.un), ri("i-espinafres", 100, U.g), ri("i-queijo", 40, U.g, true), ri("i-manteiga", 10, U.g)],
    steps: [
      { text: l("Bate os ovos e salteia os espinafres na manteiga.", "Beat the eggs and wilt the spinach in butter."), minutes: 3 },
      { text: l("Verte os ovos, junta o queijo e dobra a omelete.", "Pour in the eggs, add the cheese and fold."), minutes: 5 },
    ],
  },
  {
    id: "r-papas-aveia", title: l("Papas de aveia com banana", "Banana porridge"),
    description: l("Pequeno-almoço quente e saciante.", "A warm, filling breakfast."),
    servings: 2, prep: 2, cook: 6, difficulty: 0, dishType: 6, mainProtein: 3, imageUrl: null,
    tags: [l("pequeno-almoço", "breakfast")],
    ingredients: [ri("i-aveia", 80, U.g), ri("i-leite", 400, U.ml), ri("i-banana", 1, U.un)],
    steps: [
      { text: l("Aquece o leite com a aveia, mexendo sempre.", "Heat the milk with the oats, stirring all the time."), minutes: 5 },
      { text: l("Serve com banana às rodelas.", "Serve with sliced banana."), minutes: 1 },
    ],
  },
  {
    id: "r-feijoada-legumes", title: l("Chili de feijão com legumes", "Bean and vegetable chilli"),
    description: l("Panela única, boa para levar para o trabalho.", "One-pot dish that travels well to work."),
    servings: 4, prep: 10, cook: 30, difficulty: 0, dishType: 0, mainProtein: 3, imageUrl: null,
    tags: [l("vegetariana", "vegetarian"), l("marmita", "lunchbox")],
    ingredients: [ri("i-feijao", 540, U.g), ri("i-tomate-pelado", 400, U.g), ri("i-pimento", 1, U.un), ri("i-cebola", 1, U.un), ri("i-alho", 2, U.un), ri("i-arroz", 250, U.g), ri("i-azeite", 20, U.ml)],
    steps: [
      { text: l("Aloura a cebola, o alho e o pimento.", "Soften the onion, garlic and pepper."), minutes: 8 },
      { text: l("Junta o tomate e o feijão e deixa apurar.", "Add the tomatoes and beans and simmer."), minutes: 20 },
      { text: l("Serve com arroz branco.", "Serve with white rice."), minutes: 15 },
    ],
  },
  {
    id: "r-arroz-frango", title: l("Arroz de frango com chouriço", "Chicken and chouriço rice"),
    description: l("Arroz malandrinho de domingo.", "Soupy Sunday rice."),
    servings: 4, prep: 15, cook: 30, difficulty: 1, dishType: 0, mainProtein: 0, imageUrl: null,
    tags: [l("tradicional", "traditional"), l("domingo", "sunday")],
    ingredients: [ri("i-frango", 600, U.g), ri("i-arroz", 300, U.g), ri("i-chourico", 100, U.g), ri("i-cebola", 1, U.un), ri("i-tomate", 2, U.un), ri("i-ervilhas", 150, U.g), ri("i-azeite", 30, U.ml)],
    steps: [
      { text: l("Aloura o frango com o chouriço e a cebola.", "Brown the chicken with the chouriço and onion."), minutes: 12 },
      { text: l("Junta o tomate e água, depois o arroz e as ervilhas.", "Add the tomatoes and water, then the rice and peas."), minutes: 18 },
    ],
  },
  {
    id: "r-bolo-iogurte", title: l("Bolo de iogurte", "Yoghurt cake"),
    description: l("O bolo das avós: mede-se tudo no copo do iogurte.", "Grandma's cake: everything is measured in the yoghurt pot."),
    servings: 8, prep: 15, cook: 40, difficulty: 0, dishType: 5, mainProtein: 3, imageUrl: null,
    tags: [l("sobremesa", "dessert")],
    ingredients: [ri("i-iogurte", 1, U.un), ri("i-ovo", 3, U.un), ri("i-acucar", 250, U.g), ri("i-farinha", 300, U.g), ri("i-azeite", 100, U.ml), ri("i-limao", 1, U.un, true)],
    steps: [
      { text: l("Bate os ovos com o açúcar até ficar fofo.", "Beat the eggs and sugar until fluffy."), minutes: 5 },
      { text: l("Junta o iogurte, o óleo e a farinha.", "Fold in the yoghurt, oil and flour."), minutes: 5 },
      { text: l("Leva ao forno a 180 °C.", "Bake at 180 °C."), minutes: 40 },
    ],
  },
  {
    id: "r-tosta-mista", title: l("Tosta mista", "Ham and cheese toastie"),
    description: l("Lanche rápido.", "A quick snack."),
    servings: 1, prep: 2, cook: 5, difficulty: 0, dishType: 7, mainProtein: 0, imageUrl: null,
    tags: [l("lanche", "snack")],
    ingredients: [ri("i-pao", 2, U.un), ri("i-fiambre", 40, U.g), ri("i-queijo", 40, U.g), ri("i-manteiga", 10, U.g)],
    steps: [{ text: l("Recheia o pão e torra na frigideira com manteiga.", "Fill the bread and toast it in a pan with butter."), minutes: 5 }],
  },
  {
    id: "r-caldo-verde", title: l("Caldo verde", "Caldo verde (kale soup)"),
    description: l("A sopa portuguesa de couve, batata e uma rodela de chouriço.", "Portugal's kale and potato soup with a slice of chouriço."),
    servings: 4, prep: 10, cook: 25, difficulty: 0, dishType: 1, mainProtein: 0, imageUrl: null,
    tags: [l("tradicional", "traditional"), l("sopa", "soup")],
    ingredients: [ri("i-batata", 600, U.g), ri("i-couve", 250, U.g), ri("i-cebola", 1, U.un), ri("i-alho", 2, U.un), ri("i-chourico", 80, U.g, true), ri("i-azeite", 40, U.ml)],
    steps: [
      { text: l("Coze a batata, a cebola e o alho em água temperada.", "Boil the potatoes, onion and garlic in salted water."), minutes: 20 },
      { text: l("Tritura e junta a couve cortada fininha.", "Blend, then add the finely shredded kale."), minutes: 5 },
      { text: l("Serve com um fio de azeite e uma rodela de chouriço.", "Serve with a drizzle of olive oil and a slice of chouriço."), minutes: 1 },
    ],
  },
  {
    id: "r-arroz-pato", title: l("Arroz de pato", "Duck rice"),
    description: l("Arroz no forno com pato desfiado e chouriço estaladiço.", "Oven-baked rice with shredded duck and crisp chouriço."),
    servings: 6, prep: 30, cook: 90, difficulty: 2, dishType: 0, mainProtein: 0, imageUrl: null,
    tags: [l("domingo", "sunday"), l("tradicional", "traditional")],
    ingredients: [ri("i-pato", 1500, U.g), ri("i-arroz", 500, U.g), ri("i-chourico", 150, U.g), ri("i-cebola", 1, U.un), ri("i-cenoura", 1, U.un), ri("i-laranja", 1, U.un, true)],
    steps: [
      { text: l("Coze o pato com cebola e cenoura. Guarda o caldo.", "Simmer the duck with onion and carrot. Keep the stock."), minutes: 60 },
      { text: l("Desfia o pato e coze o arroz no caldo.", "Shred the duck and cook the rice in the stock."), minutes: 15 },
      { text: l("Monta em camadas, cobre com chouriço e leva ao forno.", "Layer it up, top with chouriço and bake."), minutes: 20 },
    ],
  },
  {
    id: "r-porco-alentejana", title: l("Carne de porco à alentejana", "Alentejo pork with clams"),
    description: l("Porco marinado em vinho e alho, com amêijoas e batata frita.", "Pork marinated in wine and garlic, with clams and fried potatoes."),
    servings: 4, prep: 20, cook: 30, difficulty: 1, dishType: 0, mainProtein: 0, imageUrl: null,
    tags: [l("tradicional", "traditional")],
    ingredients: [ri("i-porco", 600, U.g), ri("i-ameijoas", 500, U.g), ri("i-batata", 600, U.g), ri("i-alho", 4, U.un), ri("i-coentros", 15, U.g), ri("i-azeite", 50, U.ml)],
    steps: [
      { text: l("Marina o porco em alho e colorau de véspera.", "Marinate the pork in garlic and paprika overnight."), minutes: 10 },
      { text: l("Frita a batata aos cubos.", "Fry the diced potatoes."), minutes: 15 },
      { text: l("Aloura o porco, junta as amêijoas até abrirem e os coentros.", "Brown the pork, add the clams until they open, then the coriander."), minutes: 12 },
    ],
  },
  {
    id: "r-arroz-doce", title: l("Arroz doce", "Portuguese rice pudding"),
    description: l("Sobremesa cremosa com limão e canela polvilhada.", "Creamy dessert with lemon and a dusting of cinnamon."),
    servings: 6, prep: 5, cook: 40, difficulty: 0, dishType: 5, mainProtein: 3, imageUrl: null,
    tags: [l("sobremesa", "dessert"), l("tradicional", "traditional")],
    ingredients: [ri("i-arroz", 200, U.g), ri("i-leite", 1000, U.ml), ri("i-acucar", 180, U.g), ri("i-limao", 1, U.un), ri("i-canela", 5, U.g), ri("i-ovo", 2, U.un, true)],
    steps: [
      { text: l("Coze o arroz em água com casca de limão.", "Cook the rice in water with lemon peel."), minutes: 10 },
      { text: l("Junta o leite aos poucos, mexendo sempre.", "Add the milk a little at a time, stirring."), minutes: 25 },
      { text: l("Adoça, deixa arrefecer e polvilha com canela.", "Sweeten, let it cool and dust with cinnamon."), minutes: 5 },
    ],
  },
  {
    id: "r-cozido", title: l("Cozido à portuguesa", "Portuguese boiled dinner"),
    description: l("Carnes, enchidos e legumes cozidos no mesmo tacho.", "Meats, sausages and vegetables cooked in one pot."),
    servings: 6, prep: 30, cook: 120, difficulty: 2, dishType: 0, mainProtein: 0, imageUrl: null,
    tags: [l("domingo", "sunday"), l("tradicional", "traditional")],
    ingredients: [ri("i-porco", 600, U.g), ri("i-frango", 600, U.g), ri("i-chourico", 200, U.g), ri("i-couve", 500, U.g), ri("i-batata", 800, U.g), ri("i-cenoura", 3, U.un)],
    steps: [
      { text: l("Coze as carnes em água temperada.", "Boil the meats in salted water."), minutes: 80 },
      { text: l("Junta os enchidos, a cenoura e a batata.", "Add the sausages, carrots and potatoes."), minutes: 25 },
      { text: l("Coze a couve no caldo e serve tudo junto.", "Cook the kale in the stock and serve everything together."), minutes: 15 },
    ],
  },
  {
    id: "r-iogurte-granola", title: l("Taça de iogurte com granola", "Yoghurt and granola bowl"),
    description: l("Iogurte, fruta fresca e granola estaladiça.", "Yoghurt, fresh fruit and crunchy granola."),
    servings: 1, prep: 5, cook: 0, difficulty: 0, dishType: 6, mainProtein: 3, imageUrl: null,
    tags: [l("pequeno-almoço", "breakfast"), l("rápida", "quick")],
    ingredients: [ri("i-iogurte", 1, U.un), ri("i-granola", 40, U.g), ri("i-maca", 0.5, U.un), ri("i-mel", 10, U.g, true)],
    steps: [{ text: l("Põe o iogurte na taça, junta a fruta, a granola e o mel.", "Spoon the yoghurt into a bowl and top with fruit, granola and honey."), minutes: 5 }],
  },
  {
    id: "r-sopa-feijao-couve", title: l("Sopa de feijão com couve", "Bean and cabbage soup"),
    description: l("Sopa espessa e reconfortante para os dias frios.", "Thick, comforting soup for cold days."),
    servings: 6, prep: 10, cook: 35, difficulty: 0, dishType: 1, mainProtein: 3, imageUrl: null,
    tags: [l("sopa", "soup"), l("poupança", "budget")],
    ingredients: [ri("i-feijao", 540, U.g), ri("i-couve", 250, U.g), ri("i-batata", 400, U.g), ri("i-cenoura", 2, U.un), ri("i-cebola", 1, U.un), ri("i-azeite", 30, U.ml)],
    steps: [
      { text: l("Coze a batata, a cenoura e a cebola com metade do feijão.", "Boil the potato, carrot and onion with half the beans."), minutes: 25 },
      { text: l("Tritura, junta o resto do feijão e a couve.", "Blend, then add the rest of the beans and the kale."), minutes: 10 },
    ],
  },
  {
    id: "r-salada-atum", title: l("Salada de atum", "Tuna salad"),
    description: l("Atum, ovo cozido e legumes crocantes.", "Tuna, boiled egg and crisp vegetables."),
    servings: 2, prep: 15, cook: 10, difficulty: 0, dishType: 4, mainProtein: 1, imageUrl: null,
    tags: [l("rápida", "quick"), l("marmita", "lunchbox")],
    ingredients: [ri("i-atum", 240, U.g), ri("i-ovo", 2, U.un), ri("i-alface", 0.5, U.un), ri("i-tomate", 2, U.un), ri("i-cebola", 0.5, U.un), ri("i-azeite", 20, U.ml)],
    steps: [
      { text: l("Coze os ovos durante dez minutos.", "Boil the eggs for ten minutes."), minutes: 10 },
      { text: l("Junta a alface, o tomate, a cebola e o atum escorrido.", "Combine the lettuce, tomato, onion and drained tuna."), minutes: 5 },
    ],
  },
  {
    id: "r-pescada-legumes", title: l("Pescada no forno com legumes", "Baked hake with vegetables"),
    description: l("Filetes de pescada com brócolos, cenoura e arroz.", "Hake fillets with broccoli, carrots and rice."),
    servings: 4, prep: 10, cook: 25, difficulty: 0, dishType: 0, mainProtein: 1, imageUrl: null,
    tags: [l("peixe", "fish"), l("leve", "light")],
    ingredients: [ri("i-pescada", 400, U.g), ri("i-brocolos", 300, U.g), ri("i-cenoura", 2, U.un), ri("i-arroz", 250, U.g), ri("i-limao", 1, U.un), ri("i-azeite", 30, U.ml)],
    steps: [
      { text: l("Tempera a pescada com limão e azeite.", "Season the hake with lemon and olive oil."), minutes: 5 },
      { text: l("Leva ao forno com os legumes a 200 °C.", "Bake with the vegetables at 200 °C."), minutes: 20 },
      { text: l("Serve com arroz branco.", "Serve with white rice."), minutes: 15 },
    ],
  },
  {
    id: "r-massa-cogumelos", title: l("Massa com cogumelos e tomate", "Pasta with mushrooms and tomato"),
    description: l("Jantar vegetariano num só tacho.", "A one-pot vegetarian supper."),
    servings: 4, prep: 10, cook: 20, difficulty: 0, dishType: 0, mainProtein: 3, imageUrl: null,
    tags: [l("vegetariana", "vegetarian"), l("rápida", "quick")],
    ingredients: [ri("i-massa", 400, U.g), ri("i-cogumelos", 250, U.g), ri("i-tomate-pelado", 400, U.g), ri("i-alho", 2, U.un), ri("i-cebola", 1, U.un), ri("i-queijo", 40, U.g, true)],
    steps: [
      { text: l("Salteia a cebola, o alho e os cogumelos.", "Sauté the onion, garlic and mushrooms."), minutes: 8 },
      { text: l("Junta o tomate e deixa apurar enquanto a massa coze.", "Add the tomatoes and simmer while the pasta cooks."), minutes: 12 },
    ],
  },
  {
    id: "r-salada-fruta", title: l("Salada de fruta", "Fruit salad"),
    description: l("Fruta da época com sumo de laranja.", "Seasonal fruit in orange juice."),
    servings: 4, prep: 15, cook: 0, difficulty: 0, dishType: 5, mainProtein: 3, imageUrl: null,
    tags: [l("sobremesa", "dessert"), l("leve", "light")],
    ingredients: [ri("i-laranja", 2, U.un), ri("i-maca", 1, U.un), ri("i-banana", 2, U.un), ri("i-morango", 250, U.g), ri("i-pera", 1, U.un)],
    steps: [{ text: l("Corta a fruta, rega com sumo de laranja e serve fresca.", "Chop the fruit, pour over orange juice and serve chilled."), minutes: 15 }],
  },
  {
    id: "r-sardinhas-assadas", title: l("Sardinhas assadas com batata", "Grilled sardines with potatoes"),
    description: l("O sabor dos Santos Populares em casa.", "A taste of Lisbon's summer festivals at home."),
    servings: 4, prep: 10, cook: 20, difficulty: 0, dishType: 0, mainProtein: 1, imageUrl: null,
    tags: [l("peixe", "fish"), l("verão", "summer")],
    ingredients: [ri("i-sardinha", 800, U.g), ri("i-batata", 600, U.g), ri("i-pimento", 2, U.un), ri("i-alface", 0.5, U.un), ri("i-azeite", 30, U.ml)],
    steps: [
      { text: l("Coze as batatas com pele.", "Boil the potatoes in their skins."), minutes: 20 },
      { text: l("Assa as sardinhas e os pimentos na grelha.", "Grill the sardines and peppers."), minutes: 10 },
    ],
  },
  {
    id: "r-salada-mista", title: l("Salada mista", "Mixed salad"),
    description: l("Acompanhamento fresco para qualquer refeição.", "A fresh side for any meal."),
    servings: 4, prep: 10, cook: 0, difficulty: 0, dishType: 3, mainProtein: 3, imageUrl: "/editorial/salad.jpg",
    tags: [l("vegetariana", "vegetarian"), l("acompanhamento", "side")],
    ingredients: [ri("i-alface", 1, U.un), ri("i-tomate", 2, U.un), ri("i-pepino", 1, U.un), ri("i-cebola", 0.5, U.un), ri("i-azeite", 30, U.ml)],
    steps: [{ text: l("Lava, corta e tempera com azeite e sal.", "Wash, slice and dress with olive oil and salt."), minutes: 10 }],
  },
];

for (const r of recipes) r.imageUrl ??= `/demo/photos/${r.id}.jpg`;

export const recipeById = new Map(recipes.map((r) => [r.id, r]));

// --------------------------------------------------------- menus (templates)

export interface DemoTemplate {
  id: string;
  name: L;
  description: L;
  durationDays: number;
  servingsBasis: number;
  tags: L[];
  /** Menus have no photo in the real Api; the demo gives each its own. */
  imageUrl?: string;
  /** [dayIndex, mealType (1 lunch, 2 dinner, 0 breakfast), recipeId] */
  entries: [number, number, string][];
}

export const templates: DemoTemplate[] = [
  {
    id: "t-semana-familia", name: l("Semana em família", "Family week"),
    description: l("Sete dias de pratos que agradam a miúdos e graúdos.", "Seven days of dishes the whole family enjoys."),
    durationDays: 7, servingsBasis: 4, tags: [l("família", "family"), l("variada", "varied")],
    entries: [
      [0, 1, "r-sopa-legumes"], [0, 2, "r-esparguete-bolonhesa"],
      [1, 1, "r-salada-grao"], [1, 2, "r-frango-caril"],
      [2, 1, "r-caldo-verde"], [2, 2, "r-omelete-espinafres"],
      [3, 1, "r-feijoada-legumes"], [3, 2, "r-salmao-forno"],
      [4, 1, "r-salada-atum"], [4, 2, "r-bacalhau-bras"],
      [5, 1, "r-arroz-frango"], [5, 2, "r-tosta-mista"],
      [6, 0, "r-papas-aveia"], [6, 1, "r-cozido"], [6, 2, "r-salada-fruta"],
    ],
  },
  {
    id: "t-sabores-portugueses", name: l("Sabores portugueses", "Portuguese flavours"),
    description: l("Uma semana de clássicos, do caldo verde ao arroz doce.", "A week of classics, from caldo verde to rice pudding."),
    durationDays: 7, servingsBasis: 4, tags: [l("tradicional", "traditional")],
    entries: [
      [0, 1, "r-caldo-verde"], [0, 2, "r-bacalhau-bras"],
      [1, 2, "r-porco-alentejana"], [2, 2, "r-arroz-frango"],
      [3, 1, "r-sopa-feijao-couve"], [3, 2, "r-sardinhas-assadas"],
      [4, 2, "r-arroz-pato"], [5, 1, "r-cozido"], [5, 2, "r-arroz-doce"],
      [6, 1, "r-caldo-verde"], [6, 2, "r-bacalhau-bras"],
    ],
  },
  {
    id: "t-vegetariana", name: l("Cinco dias vegetarianos", "Five vegetarian days"),
    description: l("Sem carne nem peixe, com muitas leguminosas e legumes.", "No meat or fish, plenty of pulses and vegetables."),
    durationDays: 5, servingsBasis: 2, tags: [l("vegetariana", "vegetarian")],
    entries: [
      [0, 1, "r-salada-grao"], [0, 2, "r-massa-cogumelos"],
      [1, 1, "r-feijoada-legumes"], [1, 2, "r-omelete-espinafres"],
      [2, 1, "r-sopa-legumes"], [2, 2, "r-sopa-feijao-couve"],
      [3, 1, "r-salada-mista"], [3, 2, "r-massa-cogumelos"],
      [4, 0, "r-iogurte-granola"], [4, 2, "r-sopa-legumes"],
    ],
  },
  {
    id: "t-peixe", name: l("Semana do mar", "A week by the sea"),
    description: l("Peixe cinco vezes por semana, simples e no forno.", "Fish five times a week, simple and oven-baked."),
    durationDays: 5, servingsBasis: 4, tags: [l("peixe", "fish")],
    entries: [
      [0, 2, "r-salmao-forno"], [1, 2, "r-pescada-legumes"], [2, 1, "r-salada-atum"],
      [2, 2, "r-bacalhau-bras"], [3, 2, "r-sardinhas-assadas"], [4, 2, "r-pescada-legumes"],
    ],
  },
  {
    id: "t-rapida", name: l("Jantares em 20 minutos", "20-minute dinners"),
    description: l("Para os dias em que se chega tarde a casa.", "For the days you get home late."),
    durationDays: 5, servingsBasis: 2, tags: [l("rápida", "quick")],
    entries: [
      [0, 2, "r-omelete-espinafres"], [1, 2, "r-massa-cogumelos"], [2, 2, "r-tosta-mista"],
      [3, 2, "r-salada-atum"], [4, 2, "r-salada-grao"],
    ],
  },
  {
    id: "t-marmitas", name: l("Marmitas para o trabalho", "Work lunchboxes"),
    description: l("Almoços que se fazem ao domingo e aguentam a semana.", "Lunches cooked on Sunday that last the week."),
    durationDays: 5, servingsBasis: 2, tags: [l("marmita", "lunchbox")],
    entries: [
      [0, 1, "r-feijoada-legumes"], [1, 1, "r-frango-caril"], [2, 1, "r-salada-atum"],
      [3, 1, "r-arroz-frango"], [4, 1, "r-salada-grao"],
    ],
  },
  {
    id: "t-pequenos-almocos", name: l("Pequenos-almoços da semana", "Breakfasts for the week"),
    description: l("Começar o dia com aveia, iogurte e fruta.", "Start the day with oats, yoghurt and fruit."),
    durationDays: 7, servingsBasis: 2, tags: [l("pequeno-almoço", "breakfast")],
    entries: [
      [0, 0, "r-papas-aveia"], [1, 0, "r-iogurte-granola"], [2, 0, "r-papas-aveia"], [3, 0, "r-iogurte-granola"],
      [4, 0, "r-salada-fruta"], [5, 0, "r-tosta-mista"], [6, 0, "r-papas-aveia"],
    ],
  },
  {
    id: "t-poupanca", name: l("Semana poupada", "Budget week"),
    description: l("Pratos baratos que reaproveitam o que sobra.", "Cheap dishes that reuse what's left."),
    durationDays: 5, servingsBasis: 4, tags: [l("poupança", "budget")],
    entries: [
      [0, 2, "r-feijoada-legumes"], [1, 2, "r-sopa-feijao-couve"], [2, 2, "r-arroz-frango"],
      [3, 2, "r-omelete-espinafres"], [4, 2, "r-esparguete-bolonhesa"],
    ],
  },
  {
    id: "t-fim-de-semana", name: l("Fim de semana em casa", "A weekend at home"),
    description: l("Almoços demorados e uma sobremesa para partilhar.", "Long lunches and a dessert to share."),
    durationDays: 2, servingsBasis: 6, tags: [l("domingo", "sunday")],
    entries: [
      [0, 0, "r-iogurte-granola"], [0, 1, "r-arroz-pato"], [0, 2, "r-caldo-verde"],
      [1, 0, "r-papas-aveia"], [1, 1, "r-cozido"], [1, 2, "r-arroz-doce"],
    ],
  },
  {
    id: "t-leve", name: l("Semana leve", "Light week"),
    description: l("Saladas, sopas e peixe, com pouca gordura.", "Salads, soups and fish, low in fat."),
    durationDays: 5, servingsBasis: 2, tags: [l("leve", "light")],
    entries: [
      [0, 1, "r-salada-mista"], [0, 2, "r-sopa-legumes"], [1, 1, "r-salada-atum"], [1, 2, "r-pescada-legumes"],
      [2, 1, "r-salada-grao"], [2, 2, "r-sopa-legumes"], [3, 1, "r-salada-mista"], [3, 2, "r-salmao-forno"],
      [4, 1, "r-salada-fruta"], [4, 2, "r-omelete-espinafres"],
    ],
  },
  {
    id: "t-sopas", name: l("Semana das sopas", "Soup week"),
    description: l("Uma sopa por dia ao almoço, com o jantar a condizer.", "A soup every lunchtime, with a dinner to match."),
    durationDays: 5, servingsBasis: 4, tags: [l("sopa", "soup"), l("inverno", "winter")],
    entries: [
      [0, 1, "r-caldo-verde"], [0, 2, "r-omelete-espinafres"],
      [1, 1, "r-sopa-legumes"], [1, 2, "r-pescada-legumes"],
      [2, 1, "r-sopa-feijao-couve"], [2, 2, "r-frango-caril"],
      [3, 1, "r-caldo-verde"], [3, 2, "r-massa-cogumelos"],
      [4, 1, "r-sopa-legumes"], [4, 2, "r-salmao-forno"],
    ],
  },
  {
    id: "t-doces", name: l("Doces de fim de semana", "Weekend treats"),
    description: l("Sobremesas e lanches caseiros para sábado e domingo.", "Homemade desserts and teas for Saturday and Sunday."),
    durationDays: 2, servingsBasis: 6, tags: [l("sobremesa", "dessert")],
    entries: [
      [0, 0, "r-iogurte-granola"], [0, 3, "r-bolo-iogurte"], [0, 2, "r-salada-fruta"],
      [1, 0, "r-papas-aveia"], [1, 3, "r-arroz-doce"],
    ],
  },
];

for (const t of templates) t.imageUrl ??= `/demo/photos/${t.id}.jpg`;
