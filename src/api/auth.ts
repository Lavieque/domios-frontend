// Rotas /auth anónimas da Api (DomiOS_API_Fase3.md, adenda 2026-10-22). As
// duas que levam o access token estão em account.ts.

import { send } from "./http";

/** Mesmo corpo no login e no refresh. `token` é o access token. */
export interface LoginResultDto {
  userId: string;
  token: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  emailVerified: boolean;
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function login(email: string, password: string): Promise<LoginResultDto> {
  return send<LoginResultDto>("/auth/login", { method: "POST", body: { email, password } });
}

export function register(email: string, password: string): Promise<{ userId: string }> {
  return send<{ userId: string }>("/auth/register", { method: "POST", body: { email, password } });
}

export function refresh(refreshToken: string): Promise<LoginResultDto> {
  return send<LoginResultDto>("/auth/refresh", { method: "POST", body: { refreshToken } });
}

export function logout(refreshToken: string): Promise<void> {
  return send<void>("/auth/logout", { method: "POST", body: { refreshToken } });
}

export function forgotPassword(email: string): Promise<void> {
  return send<void>("/auth/password/forgot", { method: "POST", body: { email } });
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return send<void>("/auth/password/reset", { method: "POST", body: { token, newPassword } });
}

export function verifyEmail(token: string): Promise<void> {
  return send<void>("/auth/email/verify", { method: "POST", body: { token } });
}
