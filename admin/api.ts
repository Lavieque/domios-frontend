// Cliente da Api para o admin. Sessão própria (localStorage desta origem: admin.domios.pt),
// separada da app. Só entra quem a Api marca como administrador da plataforma.

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly type: string | null;

  constructor(status: number, type: string | null, title: string) {
    super(title);
    this.status = status;
    this.type = type;
  }
}

export interface Session {
  userId: string;
  email: string;
  token: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
}

interface LoginResult {
  userId: string;
  token: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  isPlatformAdmin: boolean;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  message: string | null;
  language: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  inviteExpiresAt: string | null;
  inviteUsed: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  emailVerified: boolean;
  isPlatformAdmin: boolean;
  isDisabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuditEntry {
  id: string;
  actorUserId: string;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  at: string;
}

export interface HouseholdRow {
  householdId: string;
  name: string;
  timeZone: string;
  currency: string;
  memberCount: number;
  adminCount: number;
  linkedMemberCount: number;
  createdAt: string;
  updatedAt: string;
}

/** MemberRole da Api, em número: 0 Admin, 1 Adult, 2 Child, 3 Guest. */
export const MEMBER_ROLE = { Admin: 0, Adult: 1, Child: 2, Guest: 3 } as const;

export interface HouseholdMember {
  memberId: string;
  name: string;
  role: number;
  dateOfBirth: string | null;
  dietaryRestrictions: string[];
  userId: string | null;
  userEmail: string | null;
  createdAt: string;
}

export interface HouseholdDetail {
  householdId: string;
  name: string;
  timeZone: string;
  currency: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
  members: HouseholdMember[];
}

export interface Freshness {
  count: number;
  lastUpdatedAt: string | null;
}

export interface SystemStatus {
  generatedAt: string;
  environment: string;
  version: string;
  database: { ok: boolean; latencyMs: number };
  accounts: { users: number; disabledUsers: number; platformAdmins: number; pendingAccessRequests: number; households: number; activeSessions: number };
  catalog: { products: Freshness; offers: Freshness; recipes: Freshness; activePromotions: number; promotionsLastUpdatedAt: string | null };
  email: { sender: string; configured: boolean; fromAddress: string | null; pending: number };
}

export interface CatalogProduct {
  productId: string;
  name: string;
  brand: string | null;
  category: { categoryId: string; name: string };
  barcode: string | null;
  /** ProductStatus: 0 Active, 1 Discontinued, 2 Seasonal. */
  status: number;
}

export interface CatalogChain {
  chainId: string;
  name: string;
  /** ChainStatus: 0 Active, 1 Closed. */
  status: number;
}

export interface CatalogStore {
  storeId: string;
  chainId: string;
  name: string;
  address: string;
  /** StoreStatus: 0 Active, 1 Closed. */
  status: number;
}

export interface CatalogPromotion {
  promotionId: string;
  /** PromotionType: 0 PercentageOff, 1 FixedAmountOff, 2 BuyXGetY, 3 BundlePrice. */
  type: number;
  description: string;
  startsAt: string;
  endsAt: string;
  requiresCard: boolean;
  /** PromotionStatus: 0 Active, 1 Cancelled. */
  status: number;
  discountPercent: number | null;
}

const KEY = "domios.admin.session";
const listeners = new Set<() => void>();

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function setSession(session: Session | null) {
  if (session) localStorage.setItem(KEY, JSON.stringify(session));
  else localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function base(): string {
  if (!BASE) throw new Error("VITE_API_BASE_URL não está definida — ver .env.example.");
  return BASE;
}

async function raw(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${base()}${path}`, init);
  } catch {
    throw new ApiError(0, "network", "Sem ligação à Api.");
  }
}

async function failure(response: Response): Promise<ApiError> {
  let type: string | null = null;
  let title = `Erro ${response.status}`;
  try {
    const body = (await response.json()) as { type?: string; title?: string };
    type = body.type ?? null;
    title = body.title ?? title;
  } catch {
    // corpo vazio ou não JSON
  }
  return new ApiError(response.status, type, title);
}

export async function login(email: string, password: string): Promise<void> {
  const response = await raw("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await failure(response);
  const result = (await response.json()) as LoginResult;
  if (!result.isPlatformAdmin) {
    // Termina a sessão que acabou de abrir: esta conta não administra a plataforma.
    await raw("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: result.refreshToken }),
    });
    throw new ApiError(403, "not-admin", "Esta conta não é administradora da plataforma.");
  }
  setSession({
    userId: result.userId,
    email,
    token: result.token,
    accessTokenExpiresAt: result.accessTokenExpiresAt,
    refreshToken: result.refreshToken,
  });
}

export async function logout(): Promise<void> {
  const session = getSession();
  setSession(null);
  if (session) {
    await raw("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    }).catch(() => undefined);
  }
}

// Uma renovação de cada vez: o refresh token roda a cada uso.
let refreshing: Promise<boolean> | null = null;

function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const session = getSession();
    if (!session) return false;
    const response = await raw("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!response.ok) {
      setSession(null);
      return false;
    }
    const result = (await response.json()) as LoginResult;
    if (!result.isPlatformAdmin) {
      setSession(null);
      return false;
    }
    setSession({ ...session, token: result.token, accessTokenExpiresAt: result.accessTokenExpiresAt, refreshToken: result.refreshToken });
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function authed<T>(path: string, method: string, body?: unknown): Promise<T> {
  const send = () => {
    const session = getSession();
    const headers: Record<string, string> = { Authorization: `Bearer ${session?.token ?? ""}` };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return raw(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  };
  let response = await send();
  if (response.status === 401 && (await refresh())) response = await send();
  if (response.status === 401) throw new ApiError(401, "unauthorized", "A sessão terminou. Entra de novo.");
  if (!response.ok) throw await failure(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const admin = {
  accessRequests: (status: string | undefined, page: number) =>
    authed<Paged<AccessRequest>>(`/admin/access-requests${qs({ status, page, pageSize: 25 })}`, "GET"),
  approve: (id: string) => authed<AccessRequest>(`/admin/access-requests/${id}/approve`, "POST"),
  resendInvite: (id: string) => authed<AccessRequest>(`/admin/access-requests/${id}/resend-invite`, "POST"),
  reject: (id: string) => authed<AccessRequest>(`/admin/access-requests/${id}/reject`, "POST"),
  users: (search: string, page: number) => authed<Paged<AdminUser>>(`/admin/users${qs({ search, page, pageSize: 25 })}`, "GET"),
  disable: (id: string) => authed<AdminUser>(`/admin/users/${id}/disable`, "POST"),
  enable: (id: string) => authed<AdminUser>(`/admin/users/${id}/enable`, "POST"),
  revokeSessions: (id: string) => authed<void>(`/admin/users/${id}/revoke-sessions`, "POST"),
  households: (search: string, page: number) =>
    authed<Paged<HouseholdRow>>(`/admin/households${qs({ search, page, pageSize: 25 })}`, "GET"),
  household: (id: string) => authed<HouseholdDetail>(`/admin/households/${id}`, "GET"),
  renameHousehold: (id: string, name: string) => authed<void>(`/admin/households/${id}/rename`, "POST", { name }),
  setMemberRole: (id: string, memberId: string, role: number) =>
    authed<void>(`/admin/households/${id}/members/${memberId}/role`, "POST", { role }),
  removeMember: (id: string, memberId: string) => authed<void>(`/admin/households/${id}/members/${memberId}`, "DELETE"),
  system: () => authed<SystemStatus>("/admin/system", "GET"),
  products: (search: string, page: number) =>
    authed<Paged<CatalogProduct>>(`/products${qs({ search, page, pageSize: 25, includeDiscontinued: "true" })}`, "GET"),
  updateProduct: (id: string, body: { name?: string; brand?: string }) => authed<CatalogProduct>(`/products/${id}`, "PATCH", body),
  discontinueProduct: (id: string) => authed<void>(`/products/${id}/discontinue`, "POST"),
  chains: () => authed<CatalogChain[]>("/chains", "GET"),
  setChainOpen: (id: string, open: boolean) => authed<void>(`/chains/${id}/${open ? "reopen" : "close"}`, "POST"),
  stores: (page: number) => authed<Paged<CatalogStore>>(`/stores${qs({ page, pageSize: 25 })}`, "GET"),
  setStoreOpen: (id: string, open: boolean) => authed<void>(`/stores/${id}/${open ? "reopen" : "close"}`, "POST"),
  promotions: (status: string, page: number) => authed<Paged<CatalogPromotion>>(`/promotions${qs({ status, page, pageSize: 25 })}`, "GET"),
  cancelPromotion: (id: string) => authed<void>(`/promotions/${id}/cancel`, "POST"),
  audit: (targetType: string | undefined, page: number) =>
    authed<Paged<AuditEntry>>(`/admin/audit${qs({ targetType, page, pageSize: 25 })}`, "GET"),
};
