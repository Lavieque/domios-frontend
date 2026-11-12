import type { GeoPoint } from "../api/nearbyStores";

// A posição do dispositivo, pedida só quando o utilizador a quer usar. Fica em memória enquanto a
// página está aberta; nunca vai para o armazenamento do browser nem é guardada pela Api.
let cached: { point: GeoPoint; at: number } | null = null;
const MAX_AGE_MS = 10 * 60 * 1000;

export class PositionError extends Error {}

/** Mensagem para o utilizador a partir do código da Geolocation API. */
export function positionErrorMessage(code: number): string {
  if (code === 1) return "Sem acesso à localização. Autoriza-a no browser para ver as lojas perto.";
  if (code === 3) return "A localização demorou demasiado. Tenta outra vez.";
  return "Não foi possível saber onde estás.";
}

/** A última posição conhecida desta página, se ainda for recente. */
export function lastDevicePosition(): GeoPoint | null {
  return cached && Date.now() - cached.at < MAX_AGE_MS ? cached.point : null;
}

export function getDevicePosition(): Promise<GeoPoint> {
  const known = lastDevicePosition();
  if (known) return Promise.resolve(known);
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new PositionError("Este browser não dá a localização."));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 4 casas decimais (~11 m) chegam para escolher lojas.
        const point = {
          latitude: Math.round(position.coords.latitude * 1e4) / 1e4,
          longitude: Math.round(position.coords.longitude * 1e4) / 1e4,
        };
        cached = { point, at: Date.now() };
        resolve(point);
      },
      (error) => reject(new PositionError(positionErrorMessage(error.code))),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: MAX_AGE_MS },
    );
  });
}
