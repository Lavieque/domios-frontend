/** Interruptor "Só supermercado": tira as categorias que não são de supermercado. */
export function GroceryOnlyToggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" className="chip" aria-pressed={value} onClick={() => onChange(!value)}>
      Só supermercado
    </button>
  );
}
