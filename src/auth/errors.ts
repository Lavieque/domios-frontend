import { ApiError } from "../api/http";

/**
 * Mensagem para mostrar ao utilizador. `byType` traduz os `type` do Problem
 * Details que o ecrã espera; o resto cai nas mensagens genéricas.
 */
export function describeError(error: unknown, byType: Record<string, string> = {}): string {
  if (error instanceof ApiError) {
    if (error.type && byType[error.type]) return byType[error.type];
    if (error.status === 429) return tooManyRequests(error.retryAfterSeconds);
    return `Algo correu mal (${error.status}). Tenta de novo.`;
  }
  return "Não foi possível contactar o DomiOS. Verifica a ligação e tenta de novo.";
}

function tooManyRequests(retryAfterSeconds: number | null): string {
  if (!retryAfterSeconds) return "Demasiadas tentativas. Espera um pouco e tenta de novo.";
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return retryAfterSeconds < 90
    ? `Demasiadas tentativas. Tenta de novo daqui a ${retryAfterSeconds} segundos.`
    : `Demasiadas tentativas. Tenta de novo daqui a ${minutes} minutos.`;
}

