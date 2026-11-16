// O avatar do próprio utilizador (DomiOS_API_Fase3.md, adenda 2026-11-12).
// A imagem vai e vem em bytes, não em JSON. O <img> não leva o token, por isso
// mostra-se por um URL blob: criado aqui.

import { authedRequest } from "../auth/sessionStore";

/** O avatar guardado, ou um erro 404 `avatar-not-found` quando não há. */
export function getAvatar(): Promise<Blob> {
  return authedRequest<Blob>("/account/avatar", { responseType: "blob" });
}

/** Substitui o avatar. A imagem já vem reduzida (ver prepareAvatar). */
export function putAvatar(image: Blob): Promise<void> {
  return authedRequest<void>("/account/avatar", { method: "PUT", blob: image });
}

/** Remove o avatar; não faz mal se não houver. */
export function deleteAvatar(): Promise<void> {
  return authedRequest<void>("/account/avatar", { method: "DELETE" });
}
