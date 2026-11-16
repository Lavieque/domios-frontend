import type { CallerHouseholdDto } from "../api/households";

// Casa escolhida, por utilizador, só neste browser. A Api não guarda uma
// "casa atual": um utilizador pode ser membro de várias.

const keyFor = (userId: string) => `domios.household.${userId}`;

export function getStoredHouseholdId(userId: string): string | null {
  return window.localStorage.getItem(keyFor(userId));
}

export function storeHouseholdId(userId: string, householdId: string) {
  window.localStorage.setItem(keyFor(userId), householdId);
}

// Última lista de casas vista (`GET /households`), também por utilizador. Serve
// para os ecrãs da casa arrancarem logo, sem esperar pela lista; a lista é
// sempre pedida de novo por trás e corrige esta cópia se algo mudou.

const listKeyFor = (userId: string) => `domios.households.${userId}`;

export function getStoredHouseholds(userId: string): CallerHouseholdDto[] | null {
  const raw = window.localStorage.getItem(listKeyFor(userId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.every(
      (h: Partial<CallerHouseholdDto> | null) =>
        typeof h?.householdId === "string" && typeof h.memberId === "string" && typeof h.name === "string",
    );
    return valid ? (parsed as CallerHouseholdDto[]) : null;
  } catch {
    return null;
  }
}

export function storeHouseholds(userId: string, households: CallerHouseholdDto[]) {
  window.localStorage.setItem(listKeyFor(userId), JSON.stringify(households));
}

/** Ao sair da sessão: não deixar os nomes das casas neste browser. */
export function forgetStoredHouseholds(userId: string) {
  window.localStorage.removeItem(listKeyFor(userId));
}

/** A guardada, se ainda for uma das casas do utilizador; senão a primeira. */
export function pickHouseholdId(householdIds: string[], storedId: string | null): string | null {
  if (storedId && householdIds.includes(storedId)) return storedId;
  return householdIds[0] ?? null;
}
