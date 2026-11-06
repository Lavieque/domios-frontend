import { useState } from "react";
import { admin, type CatalogCategory, type CatalogProduct, type Nutrition } from "../api";
import { EditForm, Field } from "../fields";
import { UNITS, splitList, toNumber } from "../values";
import { describe } from "../hooks";

const NUTRITION: { key: keyof Nutrition; label: string }[] = [
  { key: "energyKcal", label: "Energia (kcal)" },
  { key: "protein", label: "Proteína (g)" },
  { key: "carbs", label: "Hidratos (g)" },
  { key: "sugar", label: "Açúcares (g)" },
  { key: "fat", label: "Gordura (g)" },
  { key: "saturates", label: "Saturados (g)" },
  { key: "fiber", label: "Fibra (g)" },
  { key: "salt", label: "Sal (g)" },
];

const EMPTY: Nutrition = { energyKcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, saturates: 0, fiber: 0, salt: 0 };

/** Criar (sem `product`) ou editar um produto. Valores nutricionais por 100 g ou 100 ml, como no resto da app. */
export function ProductForm({
  product,
  categories,
  onSaved,
  onCancel,
}: {
  product?: CatalogProduct;
  categories: CatalogCategory[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [categoryId, setCategoryId] = useState(product?.category.categoryId ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [allergens, setAllergens] = useState((product?.allergens ?? []).join(", "));
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [quantity, setQuantity] = useState(product ? String(product.packageQuantity) : "");
  const [unit, setUnit] = useState(product?.packageUnit ?? 1);
  const [nutrition, setNutrition] = useState<Record<keyof Nutrition, string>>(() => {
    const source = product?.nutritionFacts ?? EMPTY;
    return Object.fromEntries(NUTRITION.map(({ key }) => [key, String(source[key])])) as Record<keyof Nutrition, string>;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const facts = {} as Nutrition;
    for (const { key, label } of NUTRITION) {
      const value = toNumber(nutrition[key]);
      if (value === undefined || value < 0) return setError(`${label}: indica um número igual ou maior que zero.`);
      facts[key] = value;
    }
    if (!categoryId) return setError("Escolhe uma categoria.");

    setBusy(true);
    setError(null);
    try {
      if (product) {
        await admin.updateProduct(product.productId, {
          name: name.trim(),
          brand: brand.trim(),
          categoryId,
          imageUrl: imageUrl.trim(),
          allergens: splitList(allergens),
          nutritionFacts: facts,
        });
      } else {
        const amount = toNumber(quantity);
        if (amount === undefined || amount <= 0) {
          setBusy(false);
          return setError("Indica a quantidade da embalagem (maior que zero).");
        }
        await admin.createProduct({
          name: name.trim(),
          categoryId,
          packageQuantity: amount,
          packageUnit: unit,
          nutritionFacts: facts,
          brand: brand.trim() || null,
          barcode: barcode.trim() || null,
          imageUrl: imageUrl.trim() || null,
          allergens: splitList(allergens),
        });
      }
      onSaved();
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <EditForm busy={busy} error={error} submitLabel={product ? "Guardar" : "Criar produto"} onCancel={onCancel} onSubmit={save}>
      <Field label="Nome">
        <input type="text" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Marca">
        <input type="text" maxLength={120} value={brand} onChange={(e) => setBrand(e.target.value)} />
      </Field>
      <Field label="Categoria">
        <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Escolher…</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Imagem (endereço)">
        <input type="text" inputMode="url" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </Field>
      {!product && (
        <>
          <Field label="Quantidade da embalagem">
            <input type="text" inputMode="decimal" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
          <Field label="Unidade">
            <select value={unit} onChange={(e) => setUnit(Number(e.target.value))}>
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Código de barras">
            <input type="text" inputMode="numeric" maxLength={32} value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          </Field>
        </>
      )}
      <Field label="Alergénios" wide hint="Separados por vírgula.">
        <input type="text" value={allergens} onChange={(e) => setAllergens(e.target.value)} />
      </Field>
      <fieldset className="edit-field-wide edit-nutrition">
        <legend>Nutrição, por 100 g ou 100 ml</legend>
        {NUTRITION.map(({ key, label }) => (
          <Field key={key} label={label}>
            <input type="text" inputMode="decimal" value={nutrition[key]} onChange={(e) => setNutrition({ ...nutrition, [key]: e.target.value })} />
          </Field>
        ))}
      </fieldset>
    </EditForm>
  );
}
