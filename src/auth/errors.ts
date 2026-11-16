import { ApiError } from "../api/http";
import { tr } from "../i18n";

/**
 * Mensagem para mostrar ao utilizador. `byType` traduz os `type` do Problem
 * Details que o ecrã espera; o resto cai nas mensagens genéricas.
 */
export function describeError(error: unknown, byType: Record<string, string> = {}): string {
  if (error instanceof ApiError) {
    if (error.type && byType[error.type]) return byType[error.type];
    if (error.status === 429) return tooManyRequests(error.retryAfterSeconds);
    return tr().errors.generic(error.status);
  }
  return tr().errors.offline;
}

function tooManyRequests(retryAfterSeconds: number | null): string {
  const t = tr().errors;
  if (!retryAfterSeconds) return t.tooManyRequests;
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return retryAfterSeconds < 90
    ? t.tooManyRequestsSeconds(retryAfterSeconds)
    : t.tooManyRequestsMinutes(minutes);
}

