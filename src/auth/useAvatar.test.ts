import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/http";

const api = vi.hoisted(() => ({
  getAvatar: vi.fn<() => Promise<Blob>>(),
  putAvatar: vi.fn<(image: Blob) => Promise<void>>(),
  deleteAvatar: vi.fn<() => Promise<void>>(),
}));
vi.mock("../api/avatar", () => api);
vi.mock("./useSession", () => ({ useSession: () => null }));

let urls = 0;
URL.createObjectURL = () => `blob:${++urls}`;
URL.revokeObjectURL = () => {};

const { avatarSnapshot, loadAvatar, removeAvatar, saveAvatar } = await import("./useAvatar");

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("avatar em memória", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.putAvatar.mockResolvedValue();
    api.deleteAvatar.mockResolvedValue();
  });

  it("uma resposta antiga não pisa a fotografia acabada de gravar", async () => {
    const pending = deferred<Blob>();
    api.getAvatar.mockReturnValueOnce(pending.promise);

    const loading = loadAvatar("u-save");
    await saveAvatar("u-save", new Blob(["nova"]));
    const saved = avatarSnapshot().url;
    pending.resolve(new Blob(["antiga"]));
    await loading;

    expect(avatarSnapshot().url).toBe(saved);
  });

  it("uma resposta antiga não traz de volta a fotografia removida", async () => {
    const pending = deferred<Blob>();
    api.getAvatar.mockReturnValueOnce(pending.promise);

    const loading = loadAvatar("u-remove");
    await removeAvatar("u-remove");
    pending.resolve(new Blob(["antiga"]));
    await loading;

    expect(avatarSnapshot().url).toBeNull();
  });

  it("um 404 fica sabido; outro erro deixa tentar de novo", async () => {
    api.getAvatar.mockRejectedValueOnce(new ApiError(500, null, "500", null));
    await loadAvatar("u-retry");
    expect(avatarSnapshot()).toMatchObject({ userId: "u-retry", url: null, known: false });

    api.getAvatar.mockRejectedValueOnce(new ApiError(404, "avatar-not-found", "404", null));
    await loadAvatar("u-retry");
    expect(avatarSnapshot()).toMatchObject({ userId: "u-retry", url: null, known: true });
  });
});
