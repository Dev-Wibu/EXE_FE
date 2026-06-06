import i18n from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

vi.mock("@/lib/api", () => ({
  fetchClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
}));

import { fetchClient } from "@/lib/api";
import { notificationManager } from "./notification.manager";

const mockGet = fetchClient.GET as ReturnType<typeof vi.fn>;
const mockPost = fetchClient.POST as ReturnType<typeof vi.fn>;

describe("NotificationManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getByUserId", () => {
    it("returns notifications for a user", async () => {
      const notifications = [
        { id: 1, title: "Test", message: "Hello", isRead: false, createdAt: "2026-01-01" },
      ];
      mockGet.mockResolvedValueOnce({ data: notifications, error: null });

      const result = await notificationManager.getByUserId(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(notifications);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Network error"));

      const result = await notificationManager.getByUserId(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockRejectedValueOnce("string error");

      const result = await notificationManager.getByUserId(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToLoadNotification"));
    });
  });

  describe("create", () => {
    it("creates a notification with id:0 and default values", async () => {
      const notification = { id: 1, title: "New", message: "Created" };
      mockPost.mockResolvedValueOnce({ data: notification, error: null });

      const result = await notificationManager.create({ title: "New", message: "Created" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(notification);

      // Verify payload includes id:0 and defaults
      const sentBody = mockPost.mock.calls[0]?.[1] as { body: Record<string, unknown> };
      expect(sentBody.body).toMatchObject({
        id: 0,
        title: "New",
        message: "Created",
        isRead: false,
      });
      expect(typeof (sentBody.body as Record<string, unknown>).createAt).toBe("string");
    });

    it("preserves explicit isRead and createAt values", async () => {
      mockPost.mockResolvedValueOnce({ data: { id: 2 }, error: null });

      await notificationManager.create({
        title: "T",
        message: "M",
        isRead: true,
        createAt: "2026-01-01T00:00:00Z",
      });

      const sentBody = mockPost.mock.calls[0]?.[1] as { body: Record<string, unknown> };
      expect(sentBody.body).toMatchObject({
        isRead: true,
        createAt: "2026-01-01T00:00:00Z",
      });
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("Create failed"));

      const result = await notificationManager.create({ title: "X", message: "Y" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Create failed");
    });
  });

  describe("markAsRead", () => {
    it("marks notification as read", async () => {
      mockGet.mockResolvedValueOnce({ data: true, error: null });

      const result = await notificationManager.markAsRead(1);

      expect(result.success).toBe(true);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await notificationManager.markAsRead(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockRejectedValueOnce("string error");

      const result = await notificationManager.markAsRead(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.notificationsCannotBeMarkedAs"));
    });
  });

  describe("unsupported methods", () => {
    it("getAll returns error", async () => {
      const result = await notificationManager.getAll();
      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.pleaseUseTheGetbyuseridMethod"));
    });

    it("getById returns error", async () => {
      const result = await notificationManager.getById(1);
      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.theApiDoesNotSupport"));
    });

    it("update returns error", async () => {
      const result = await notificationManager.update(1, {});
      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.notificationUpdatesAreNotSupported"));
    });

    it("delete returns error", async () => {
      const result = await notificationManager.delete(1);
      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.clearingNotificationsIsNotSupported"));
    });
  });
});
