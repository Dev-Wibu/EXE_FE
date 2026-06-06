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
const mockFetchGet = fetchClient.GET as ReturnType<typeof vi.fn>;

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
      expect(result.error).toBe(t("general.wrongEmail"));
    });

    it("should map 429 rate-limit to too-many-attempts message", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: undefined,
        error: {
          status: 429,
          data: "Too many requests",
        },
      });

      const result = await authManager.login({
        email: "user@test.com",
        password: "123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.youHaveEnteredIncorrectlyToo"));
    });

    it("should map 403 error to locked message", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: undefined,
        error: {
          status: 403,
          data: "Account is locked",
        },
      });

      const result = await authManager.login({
        email: "locked@test.com",
        password: "123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.accountHasBeenLocked"));
    });

    it("should return login-data-not-received when data is null", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await authManager.login({
        email: "user@test.com",
        password: "123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.loginDataNotReceivedFrom"));
    });

    it("should return login-data-not-received when data is empty string", async () => {
      mockFetchPost.mockResolvedValueOnce({
        data: "   ",
        error: null,
      });

      const result = await authManager.login({
        email: "user@test.com",
        password: "123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.loginDataNotReceivedFrom"));
    });

    it("should return normalized error on non-Response catch", async () => {
      mockFetchPost.mockRejectedValueOnce(new TypeError("fetch failed"));

      const result = await authManager.login({
        email: "user@test.com",
        password: "123",
      });

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe("string");
      expect(result.error!.length).toBeGreaterThan(0);
    });

    it("should return error when error is non-Error throw (raw message passed through)", async () => {
      mockFetchPost.mockRejectedValueOnce("string error");

      const result = await authManager.login({
        email: "user@test.com",
        password: "123",
      });

      expect(result.success).toBe(false);
      // getNormalizedErrorMessage extracts raw message for non-generic strings
      expect(result.error).toBe("string error");
    });
  });

  describe("getGoogleLoginUrl", () => {
    it("returns a URL string", () => {
      const url = authManager.getGoogleLoginUrl();
      expect(typeof url).toBe("string");
      expect(url.length).toBeGreaterThan(0);
    });
  });

  describe("hasGoogleCallbackPayload", () => {
    it("returns true when URL has token param", () => {
      expect(authManager.hasGoogleCallbackPayload("http://app.com/callback?token=abc")).toBe(true);
    });

    it("returns true when URL has error param", () => {
      expect(authManager.hasGoogleCallbackPayload("http://app.com/callback?error=denied")).toBe(
        true
      );
    });

    it("returns false when URL has no OAuth params", () => {
      expect(authManager.hasGoogleCallbackPayload("http://app.com/home")).toBe(false);
    });
  });

  describe("getGoogleCallbackError", () => {
    it("extracts error_description from query", () => {
      const error = authManager.getGoogleCallbackError(
        "http://app.com/callback?error_description=User+denied+access"
      );
      expect(error).toBe("User denied access");
    });

    it("extracts error from query", () => {
      const error = authManager.getGoogleCallbackError(
        "http://app.com/callback?error=access_denied"
      );
      expect(error).toBe("access_denied");
    });

    it("returns undefined when no error params", () => {
      const error = authManager.getGoogleCallbackError("http://app.com/callback?token=abc");
      expect(error).toBeUndefined();
    });
  });

  describe("consumeGoogleCallbackFromUrl", () => {
    it("extracts user and token from callback URL", () => {
      const token = createJwt({ sub: "42", email: "g@test.com", name: "G User", role: "USER" });
      const url = `http://app.com/callback?token=${token}`;

      const result = authManager.consumeGoogleCallbackFromUrl(url);

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe(token);
      expect(result.data?.user.email).toBe("g@test.com");
    });

    it("returns error when no token in URL", () => {
      const result = authManager.consumeGoogleCallbackFromUrl(
        "http://app.com/callback?error=denied"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.googleLoginTokenNotFound"));
    });
  });

  describe("logout", () => {
    it("returns success", async () => {
      const result = await authManager.logout();
      expect(result.success).toBe(true);
    });
  });

  describe("checkMentorStatus", () => {
    it("returns mentor status on success", async () => {
      const status = { status: "pending", submittedAt: "2026-01-01" };
      mockFetchGet.mockResolvedValueOnce({ data: status });

      const result = await authManager.checkMentorStatus();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(status);
    });

    it("returns error on failure", async () => {
      mockFetchGet.mockRejectedValueOnce(new Error("fail"));

      const result = await authManager.checkMentorStatus();

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe("string");
    });
  });

  describe("refreshToken", () => {
    it("returns new token on success", async () => {
      mockFetchPost.mockResolvedValueOnce({ data: { token: "new.jwt.token" } });

      const result = await authManager.refreshToken();

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe("new.jwt.token");
    });

    it("returns error on failure", async () => {
      mockFetchPost.mockRejectedValueOnce(new Error("fail"));

      const result = await authManager.refreshToken();

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe("string");
    });
  });
});
