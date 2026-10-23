// Pedido HTTP de baixo nível à DomiOS.Api, sem sessão. Os erros chegam em
// RFC 7807 Problem Details: o `type` (ex. "invalid-credentials") é o que
// distingue os casos, nunca o texto do `title` (que vem em inglês).

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!BASE_URL) {
  throw new Error("VITE_API_BASE_URL não está definida — ver .env.example.");
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  params?: QueryParams;
  body?: unknown;
  accessToken?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly type: string | null;
  /** Segundos do cabeçalho `Retry-After` (só nos 429). */
  readonly retryAfterSeconds: number | null;

  constructor(status: number, type: string | null, message: string, retryAfterSeconds: number | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.type = type;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function buildUrl(path: string, params: QueryParams = {}): URL {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

export async function send<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.params);
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.accessToken) headers["Authorization"] = `Bearer ${options.accessToken}`;

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw await toApiError(response, url);
  }

  // 204 (logout, reset, verify) não tem corpo.
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function toApiError(response: Response, url: URL): Promise<ApiError> {
  let type: string | null = null;
  try {
    const problem = (await response.json()) as { type?: string };
    type = problem.type ?? null;
  } catch {
    // Sem corpo (ex. 401 do middleware JwtBearer).
  }

  const retryAfter = Number(response.headers.get("Retry-After"));
  return new ApiError(
    response.status,
    type,
    `${response.status} ao pedir ${url.pathname}${url.search}`,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  );
}
