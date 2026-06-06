import i18n from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

vi.mock("@/lib/api", () => ({
  fetchClient: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}));

import { fetchClient } from "@/lib/api";
import { userManager } from "./user.manager";

const mockGet = fetchClient.GET as ReturnType<typeof vi.fn>;
const mockPost = fetchClient.POST as ReturnType<typeof vi.fn>;

describe("UserManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("returns user profile on success", async () => {
      const profile = { id: 1, name: "Test User", email: "test@test.com" };
      mockGet.mockResolvedValueOnce({ data: profile, error: null });

      const result = await userManager.getProfile();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(profile);
      expect(mockGet).toHaveBeenCalledWith("/api/users/me", expect.any(Object));
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Unauthorized"));

      const result = await userManager.getProfile();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("updateProfile", () => {
    it("omits email when unchanged to prevent duplicate-email error", async () => {
      const currentProfile = { id: 1, email: "same@test.com", name: "Old", password: "hashed" };
      mockGet.mockResolvedValueOnce({ data: currentProfile });
      mockPost.mockResolvedValueOnce({ data: { id: 1, name: "New" } });

      await userManager.updateProfile({ email: "same@test.com", name: "New" });

      const sentBody = mockPost.mock.calls[0]?.[1] as { body: Record<string, unknown> };
      expect(sentBody.body).not.toHaveProperty("email");
      expect(sentBody.body.name).toBe("New");
    });

    it("includes email when changed", async () => {
      const currentProfile = { id: 1, email: "old@test.com", password: "hashed" };
      mockGet.mockResolvedValueOnce({ data: currentProfile });
      mockPost.mockResolvedValueOnce({ data: { id: 1 } });

      await userManager.updateProfile({ email: "new@test.com" });

      const sentBody = mockPost.mock.calls[0]?.[1] as { body: Record<string, unknown> };
      expect(sentBody.body.email).toBe("new@test.com");
    });

    it("re-injects password from current profile when not provided", async () => {
      const currentProfile = { id: 1, email: "test@test.com", password: "hashed-pw" };
      mockGet.mockResolvedValueOnce({ data: currentProfile });
      mockPost.mockResolvedValueOnce({ data: { id: 1 } });

      await userManager.updateProfile({ name: "Updated" });

      const sentBody = mockPost.mock.calls[0]?.[1] as { body: Record<string, unknown> };
      expect(sentBody.body.password).toBe("hashed-pw");
    });

    it("preserves provided password instead of re-injecting", async () => {
      const currentProfile = { id: 1, email: "test@test.com", password: "old-hash" };
      mockGet.mockResolvedValueOnce({ data: currentProfile });
      mockPost.mockResolvedValueOnce({ data: { id: 1 } });

      await userManager.updateProfile({ password: "new-pw" });

      const sentBody = mockPost.mock.calls[0]?.[1] as { body: Record<string, unknown> };
      expect(sentBody.body.password).toBe("new-pw");
    });

    it("proceeds normally when getProfile fails", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));
      mockPost.mockResolvedValueOnce({ data: { id: 1 } });

      const result = await userManager.updateProfile({ name: "Test" });

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalled();
    });

    it("returns error on POST failure", async () => {
      mockGet.mockResolvedValueOnce({ data: { id: 1, email: "t@t.com" } });
      mockPost.mockRejectedValueOnce(new Error("Update failed"));

      const result = await userManager.updateProfile({ name: "X" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });

  describe("updatePassword", () => {
    it("updates password successfully", async () => {
      mockPost.mockResolvedValueOnce({ data: { message: "OK" }, error: null });

      const result = await userManager.updatePassword("old123", "new456");

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledWith(
        "/api/users/password",
        expect.objectContaining({
          body: { currentPassword: "old123", newPassword: "new456" },
        })
      );
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("Wrong password"));

      const result = await userManager.updatePassword("old", "new");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Wrong password");
    });
  });

  describe("getSettings", () => {
    it("returns user settings", async () => {
      const settings = { theme: "dark", language: "vi" };
      mockGet.mockResolvedValueOnce({ data: settings, error: null });

      const result = await userManager.getSettings();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(settings);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await userManager.getSettings();

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("updateSettings", () => {
    it("updates user settings", async () => {
      const settings = { theme: "light" };
      mockPost.mockResolvedValueOnce({ data: settings, error: null });

      const result = await userManager.updateSettings(settings);

      expect(result.success).toBe(true);
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("fail"));

      const result = await userManager.updateSettings({});

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("subscribePlan", () => {
    it("sends correct params for plan subscription", async () => {
      const user = { id: 1, planId: 2 };
      mockPost.mockResolvedValueOnce({ data: user, error: null });

      const result = await userManager.subscribePlan(1, 2);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(user);
      expect(mockPost).toHaveBeenCalledWith("/api/users/subscribe", {
        params: { userId: 1, planId: 2 },
      });
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("fail"));

      const result = await userManager.subscribePlan(1, 2);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("getActiveSubscription", () => {
    it("returns active subscription on success", async () => {
      const subscription = { planId: 1, planName: "BASIC", remainingSessions: 5 };
      mockGet.mockResolvedValueOnce({ data: subscription });

      const result = await userManager.getActiveSubscription(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(subscription);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await userManager.getActiveSubscription(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockRejectedValueOnce("string error");

      const result = await userManager.getActiveSubscription(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToLoadActiveMembership"));
    });
  });
});
