import i18n from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

import { authManager } from "./auth.manager";

// Mock the fetchClient
vi.mock("@/lib/api", () => ({
  fetchClient: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}));

import { fetchClient } from "@/lib/api";

const mockFetchPost = fetchClient.POST as ReturnType<typeof vi.fn>;

const toBase64Url = (value: string) => {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const createJwt = (payload: Record<string, unknown>) => {
  const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.`;
};

describe("AuthManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should authenticate via /api/auth/login and map backend user", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: {
          token: "abc.def.ghi",
          user: {
            id: 1,
            name: "Test Mentor",
            email: "mentor@test.com",
            role: "ROLE_MENTOR",
            avatarUrl: "https://example.com/avatar.jpg",
          },
        },
        error: null,
      });

      const result = await authManager.login({
        email: "mentor@test.com",
        password: "test123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.role).toBe("MENTOR");
      expect(result.data?.user.fullName).toBe("Test Mentor");
      expect(result.data?.user.email).toBe("mentor@test.com");
      expect(result.data?.token).toBe("abc.def.ghi");
      expect(fetchClient.POST).toHaveBeenCalledWith("/api/auth/login", {
        body: {
          email: "mentor@test.com",
          password: "test123",
        },
        parseAs: "text",
      });
    });

    it("should preserve wallet balance from backend user payload", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: {
          token: "abc.def.ghi",
          user: {
            id: 8,
            name: "Nguyen Van A",
            email: "a@gmail.com",
            role: "ROLE_USER",
            walletBalance: 150000,
          },
        },
        error: null,
      });

      const result = await authManager.login({
        email: "a@gmail.com",
        password: "12345",
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.walletBalance).toBe(150000);
    });

    it("should build user from JWT payload when API returns token string", async () => {
      const token = createJwt({
        sub: "12",
        email: "user@test.com",
        name: "Token User",
        role: "ROLE_USER",
      });

      mockFetchPost.mockResolvedValueOnce({
        data: token,
        error: null,
      });

      const result = await authManager.login({
        email: "user@test.com",
        password: "pass123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.id).toBe("12");
      expect(result.data?.user.role).toBe("USER");
      expect(result.data?.user.fullName).toBe("Token User");
      expect(result.data?.token).toBe(token);
    });

    it("should unwrap quoted token string when response is text", async () => {
      const token = createJwt({
        sub: "34",
        email: "quoted@test.com",
        name: "Quoted Token User",
        role: "ROLE_USER",
      });

      mockFetchPost.mockResolvedValueOnce({
        data: `"${token}"`,
        error: null,
      });

      const result = await authManager.login({
        email: "quoted@test.com",
        password: "pass123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe(token);
      expect(result.data?.user.id).toBe("34");
      expect(result.data?.user.fullName).toBe("Quoted Token User");
    });

    it("should return locked message when account is inactive", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: {
          user: {
            id: 99,
            name: "Locked User",
            email: "locked@test.com",
            role: "USER",
            isActive: false,
          },
        },
        error: null,
      });

      const result = await authManager.login({
        email: "locked@test.com",
        password: "test123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.accountHasBeenLocked"));
    });

    it("should return API error message when auth API fails", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: undefined,
        error: {
          message: "Invalid credentials",
        },
      });

      const result = await authManager.login({
        email: "user@test.com",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
    });

    it("should map 401 bad credentials to wrong-password message", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: undefined,
        error: {
          status: 401,
          data: "Bad credentials",
        },
      });

      const result = await authManager.login({
        email: "binhan@gmail.com",
        password: "wrong123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.wrongPassword"));
    });

    it("should map 404 user-not-found to wrong-email message", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: undefined,
        error: {
          status: 404,
          data: "User not found with email: notfound@example.com",
        },
      });

      const result = await authManager.login({
        email: "notfound@example.com",
        password: "123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Sai email");
    });
  });
});
