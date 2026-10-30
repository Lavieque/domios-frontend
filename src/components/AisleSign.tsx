import type { Aisle } from "../catalog/aisles";

// Pictogramas de corredor, desenhados a um só traço (24×24, 1.6). Sem
// categoria conhecida fica um saco de compras.
const paths: Record<Aisle | "none", string> = {
  fresh: "M12 7c-1.5-1.6-5-1.8-6.4.6-1.6 2.8-.5 7.6 1.9 10.4 1.3 1.5 2.7 1.6 4.5.7 1.8.9 3.2.8 4.5-.7 2.4-2.8 3.5-7.6 1.9-10.4C17 5.2 13.5 5.4 12 7Zm0 0c0-1.6.6-3 2-4",
  fish: "M3 12c2.5-4 6-5.5 9.5-5.5 3.6 0 6 2.5 7.5 5.5-1.5 3-3.9 5.5-7.5 5.5C9 17.5 5.5 16 3 12Zm0 0-1.5-3m1.5 3-1.5 3M16 10.5v.01",
  pantry: "M8 3h8M9 3v3.5c-2 1-3 2.6-3 4.5v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8c0-1.9-1-3.5-3-4.5V3M6 13h12",
  bakery: "M4 11.5C4 8 7.6 6 12 6s8 2 8 5.5c0 1-.6 1.6-1.5 1.8V18a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-4.7C4.6 13.1 4 12.5 4 11.5ZM9 9.5l1 2m3-2.5 1 2",
  dairy: "M8 8 10 3h4l2 5v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8Zm0 0h8M8 13h8",
  home: "M9 8h4l1 3v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9l2-3Zm0 0V5h3m0 0h4l2 2M7 14h7",
  none: "M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
};

/** O sinal do corredor, na cor do corredor (herda --aisle do contentor). */
export function AisleSign({ aisle, className = "" }: { aisle: Aisle | null; className?: string }) {
  return (
    <svg className={`aisle-sign ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[aisle ?? "none"]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
