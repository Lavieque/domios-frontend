import { apiBase } from "./config";
import type { Lang } from "./i18n";

export interface AccessRequestInput {
  name: string;
  email: string;
  message: string;
  language: Lang;
  /** Honeypot: humans never see this field, bots fill it. */
  website: string;
}

export class AccessRequestError extends Error {
  readonly status: number | null;

  constructor(status: number | null) {
    super(status === null ? "network" : `status ${status}`);
    this.status = status;
  }
}

/** POST /access-requests. The Api answers 202 whether or not the address is already known. */
export async function submitAccessRequest(input: AccessRequestInput): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}/access-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim(),
        message: input.message.trim() || null,
        language: input.language,
        website: input.website,
      }),
    });
  } catch {
    throw new AccessRequestError(null);
  }
  if (!response.ok) throw new AccessRequestError(response.status);
}
