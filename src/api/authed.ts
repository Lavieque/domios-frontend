// Pedidos que levam o access token. Um 401 da Api renova a sessão uma vez e
// repete o pedido; sem sessão (ou se a renovação falhar) lança o 401.

import type { SessionStore } from "../auth/session";
import { ApiError, send, type RequestOptions } from "./http";

export function createAuthedRequest(store: SessionStore) {
  return async function authedRequest<T>(path: string, options: Omit<RequestOptions, "accessToken"> = {}): Promise<T> {
    const accessToken = await store.getAccessToken();
    if (!accessToken) {
      throw new ApiError(401, null, `Sem sessão ao pedir ${path}`, null);
    }

    try {
      return await send<T>(path, { ...options, accessToken });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;

      const renewed = await store.renewAfterRejection(accessToken);
      if (!renewed) throw error;
      return send<T>(path, { ...options, accessToken: renewed.accessToken });
    }
  };
}
