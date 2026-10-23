// Casa escolhida, por utilizador, só neste browser. A Api não guarda uma
// "casa atual": um utilizador pode ser membro de várias.

const keyFor = (userId: string) => `domios.household.${userId}`;

export function getStoredHouseholdId(userId: string): string | null {
  return window.localStorage.getItem(keyFor(userId));
}

export function storeHouseholdId(userId: string, householdId: string) {
  window.localStorage.setItem(keyFor(userId), householdId);
}

/** A guardada, se ainda for uma das casas do utilizador; senão a primeira. */
export function pickHouseholdId(householdIds: string[], storedId: string | null): string | null {
  if (storedId && householdIds.includes(storedId)) return storedId;
  return householdIds[0] ?? null;
}
