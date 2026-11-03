// Código de barras lido na embalagem (GET /barcodes/{barcode}): o catálogo da
// casa primeiro, depois o Open Food Facts. 404 = ninguém conhece este código.

import { authedRequest } from "../auth/sessionStore";
import type { MeasurementUnit } from "./types";

export interface BarcodeLookupResult {
  /** Sempre GTIN-14 (um EAN-13 ganha um zero à frente). */
  barcode: string;
  source: "catalog" | "openfoodfacts";
  name: string;
  brand: string | null;
  imageUrl: string | null;
  packageQuantity: number | null;
  packageUnit: MeasurementUnit | null;
  productId: string | null;
}

/** Só dígitos, 8 a 14 — o que a API aceita. */
export function isBarcode(value: string): boolean {
  return /^\d{8,14}$/.test(value);
}

export function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  return authedRequest<BarcodeLookupResult>(`/barcodes/${barcode}`);
}
