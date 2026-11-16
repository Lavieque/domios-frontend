// Lojas físicas perto do dispositivo (DomiOS_API_Fase5.md, adenda 2026-11-09, E.1).

import { authedRequest } from "../auth/sessionStore";
import type { MoneyDto } from "./shopping";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface NearbyStoreDto {
  physicalStoreId: string;
  chainId: string;
  chainName: string;
  name: string;
  format: string | null;
  address: string | null;
  straightKm: number;
  /** Linha reta vezes o fator de estrada. */
  roadKm: number;
  roundTripKm: number;
  travelCost: MoneyDto;
  /** Formato OSM ("Mo-Sa 08:30-21:00"). */
  openingHours: string | null;
}

export interface NearbyStoresDto {
  origin: GeoPoint;
  radiusKm: number;
  costPerKm: number;
  roadFactor: number;
  /** Mais perto primeiro. */
  stores: NearbyStoreDto[];
  attribution: string;
}

/** A posição não fica guardada na Api. Sem `radiusKm`, o da casa (máximo 50). Fora de Portugal: 400 `invalid-argument`. */
export function getNearbyStores(householdId: string, origin: GeoPoint, radiusKm?: number, chainId?: string): Promise<NearbyStoresDto> {
  return authedRequest<NearbyStoresDto>(`/households/${householdId}/nearby-stores`, {
    params: { lat: origin.latitude, lng: origin.longitude, radiusKm, chainId },
  });
}
