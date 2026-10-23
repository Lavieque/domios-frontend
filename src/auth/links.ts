/** Lê `#token=...` dos links dos emails (a Api põe o token no fragmento, nunca na query). */
export function tokenFromHash(hash: string): string | null {
  return new URLSearchParams(hash.replace(/^#/, "")).get("token");
}

/** Só caminhos deste site: `?next=//outro.site` ou `https://...` voltam à visão geral. */
export function safeNextPath(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
