import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardPath, useAuthStore } from "./authStore";

// Mock the auth-session module
vi.mock("@/lib/auth-session", () => ({
  getTokenExpiresAt: vi.fn((token: string | null) => (token ? 9999999999999 : null)),
  isSessionExpired: vi.fn(() => false),
}));

// Mock socket manager to avoid import() in clearAuth
vi.mock("@/services/socket.manager", () => ({
  socketService: { disconnect: vi.fn() },
}));

beforeEach(() => {
  // Reset store to initial state
  const store = useAuthStore.getState();
  store.clearAuth();
  store.setIsLoading(true);
  localStorage.clear();
});

describe("useAuthStore — initial state", () => {
  it("has correct defaults", () => {
    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.expiresAt).toBeNull();
    expect(state.isLoading).toBe(true);
  });
});

describe("useAuthStore — actions", () => {
  it("setUser updates user", () => {
    const user = { id: 1, name: "Test", email: "t@t.com", role: "USER" } as never;
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("setUser(null) clears user", () => {
    useAuthStore.getState().setUser({ id: 1 } as never);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("setToken updates token and expiresAt", () => {
    useAuthStore.getState().setToken("abc.def.ghi");
    const state = useAuthStore.getState();
    expect(state.token).toBe("abc.def.ghi");
    expect(state.expiresAt).toBe(9999999999999);
  });

  it("setToken(null) clears token and expiresAt", () => {
    useAuthStore.getState().setToken("abc.def.ghi");
    useAuthStore.getState().setToken(null);
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.expiresAt).toBeNull();
  });

  it("setToken with empty string sets token to empty and expiresAt to null", () => {
    // Empty string is falsy → getTokenExpiresAt("") returns null via mock
    useAuthStore.getState().setToken("");
    const state = useAuthStore.getState();
    expect(state.token).toBe("");
    expect(state.expiresAt).toBeNull();
  });

  it("setIsLoggedIn updates isLoggedIn", () => {
    useAuthStore.getState().setIsLoggedIn(true);
    expect(useAuthStore.getState().isLoggedIn).toBe(true);
  });

  it("setIsLoading updates isLoading", () => {
    useAuthStore.getState().setIsLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("setExpiresAt updates expiresAt", () => {
    useAuthStore.getState().setExpiresAt(12345);
    expect(useAuthStore.getState().expiresAt).toBe(12345);
  });

  it("setExpiresAt(null) clears expiresAt", () => {
    useAuthStore.getState().setExpiresAt(12345);
    useAuthStore.getState().setExpiresAt(null);
    expect(useAuthStore.getState().expiresAt).toBeNull();
  });

  it("clearAuth resets auth state", () => {
    const store = useAuthStore.getState();
    store.setIsLoggedIn(true);
    store.setUser({ id: 1 } as never);
    store.setToken("tok");
    store.clearAuth();

    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.expiresAt).toBeNull();
  });

  it("clearAuth removes current-user-id from localStorage", () => {
    localStorage.setItem("current-user-id", "1");
    useAuthStore.getState().clearAuth();
    expect(localStorage.getItem("current-user-id")).toBeNull();
  });

  it("clearAuth triggers socket disconnect via dynamic import", async () => {
    const { socketService } = await import("@/services/socket.manager");
    useAuthStore.getState().setIsLoggedIn(true);
    useAuthStore.getState().clearAuth();
    // Wait for the dynamic import promise to resolve
    await vi.dynamicImportSettled();
    expect(socketService.disconnect).toHaveBeenCalled();
  });

  it("clearAuth handles socket disconnect failure gracefully", async () => {
    const { socketService } = await import("@/services/socket.manager");
    vi.mocked(socketService.disconnect).mockImplementationOnce(() => {
      throw new Error("disconnect failed");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // clearAuth should not throw even if socket disconnect fails
    useAuthStore.getState().setIsLoggedIn(true);
    useAuthStore.getState().clearAuth();

    await vi.dynamicImportSettled();
    // State should still be cleared
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("useAuthStore — setToken verifies mock call", () => {
  it("calls getTokenExpiresAt with the provided token", async () => {
    const { getTokenExpiresAt } = await import("@/lib/auth-session");
    useAuthStore.getState().setToken("my.jwt.token");
    expect(getTokenExpiresAt).toHaveBeenCalledWith("my.jwt.token");
  });
});

describe("getDashboardPath", () => {
  it("returns /admin for ADMIN", () => {
    expect(getDashboardPath("ADMIN")).toBe("/admin");
  });

  it("returns /mentor for MENTOR", () => {
    expect(getDashboardPath("MENTOR")).toBe("/mentor");
  });

  it("returns /staff for STAFF", () => {
    expect(getDashboardPath("STAFF")).toBe("/staff");
  });

  it("returns /user for USER", () => {
    expect(getDashboardPath("USER")).toBe("/user");
  });

  it("returns /user for unknown/undefined role", () => {
    expect(getDashboardPath()).toBe("/user");
    expect(getDashboardPath("UNKNOWN")).toBe("/user");
  });

  it("is case-insensitive", () => {
    expect(getDashboardPath("admin")).toBe("/admin");
    expect(getDashboardPath("Mentor")).toBe("/mentor");
  });

  it("returns /user for null role", () => {
    expect(getDashboardPath(null as unknown as string)).toBe("/user");
  });
});
