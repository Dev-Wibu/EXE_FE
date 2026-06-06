import type { Notification } from "@/services/notification.manager";
import { beforeEach, describe, expect, it } from "vitest";
import { useNotificationStore } from "./notificationStore";

const mockNotification: Notification = {
  id: 1,
  title: "Test",
  message: "Hello",
  isRead: false,
  createAt: "2026-01-01T00:00:00Z",
};

const mockReadNotification: Notification = {
  id: 2,
  title: "Read",
  message: "Already read",
  isRead: true,
  createAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  const store = useNotificationStore.getState();
  store.setNotifications([]);
  store.setUnreadCount(0);
  store.closeDropdown();
  localStorage.clear();
});

describe("useNotificationStore — initial state", () => {
  it("has correct defaults", () => {
    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications).toEqual([]);
    expect(state.isDropdownOpen).toBe(false);
  });
});

describe("useNotificationStore — setUnreadCount", () => {
  it("sets unread count", () => {
    useNotificationStore.getState().setUnreadCount(5);
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });
});

describe("useNotificationStore — incrementUnread / decrementUnread", () => {
  it("increments unread count", () => {
    useNotificationStore.getState().setUnreadCount(3);
    useNotificationStore.getState().incrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(4);
  });

  it("increments from 0 to 1 (boundary)", () => {
    useNotificationStore.getState().setUnreadCount(0);
    useNotificationStore.getState().incrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it("decrements unread count", () => {
    useNotificationStore.getState().setUnreadCount(3);
    useNotificationStore.getState().decrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it("decrements from 1 to 0 (boundary)", () => {
    useNotificationStore.getState().setUnreadCount(1);
    useNotificationStore.getState().decrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("does not go below 0", () => {
    useNotificationStore.getState().setUnreadCount(0);
    useNotificationStore.getState().decrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});

describe("useNotificationStore — markAsRead", () => {
  it("marks a notification as read and decrements count", () => {
    useNotificationStore.getState().setNotifications([mockNotification]);
    useNotificationStore.getState().setUnreadCount(1);

    useNotificationStore.getState().markAsRead(1);

    const state = useNotificationStore.getState();
    expect(state.notifications[0].isRead).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("does not decrement count if already read", () => {
    // Use non-zero unreadCount to verify the skip logic actually works
    // (if unreadCount were 0, Math.max(0, 0-anything) would always be 0 — false positive)
    useNotificationStore.getState().setNotifications([mockReadNotification]);
    useNotificationStore.getState().setUnreadCount(2);

    useNotificationStore.getState().markAsRead(2);

    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it("does not change state for non-existent notification id", () => {
    useNotificationStore.getState().setNotifications([mockNotification]);
    useNotificationStore.getState().setUnreadCount(1);

    useNotificationStore.getState().markAsRead(999);

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.notifications[0].isRead).toBe(false);
  });

  it("marks one of multiple notifications as read", () => {
    const secondUnread: Notification = { ...mockNotification, id: 3, title: "Second" };
    useNotificationStore.getState().setNotifications([mockNotification, secondUnread]);
    useNotificationStore.getState().setUnreadCount(2);

    useNotificationStore.getState().markAsRead(1);

    const state = useNotificationStore.getState();
    expect(state.notifications[0].isRead).toBe(true);
    expect(state.notifications[1].isRead).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it("does not mutate the already-read notification's isRead field", () => {
    useNotificationStore.getState().setNotifications([mockReadNotification]);
    useNotificationStore.getState().setUnreadCount(0);

    useNotificationStore.getState().markAsRead(2);

    expect(useNotificationStore.getState().notifications[0].isRead).toBe(true);
  });
});

describe("useNotificationStore — markAllAsRead", () => {
  it("marks all notifications as read", () => {
    useNotificationStore.getState().setNotifications([mockNotification, mockReadNotification]);
    useNotificationStore.getState().setUnreadCount(1);

    useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.notifications.every((n) => n.isRead)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("marks all as read on empty array without error", () => {
    useNotificationStore.getState().setNotifications([]);
    useNotificationStore.getState().setUnreadCount(0);
    useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });
});

describe("useNotificationStore — toggleDropdown / closeDropdown", () => {
  it("toggles dropdown", () => {
    useNotificationStore.getState().toggleDropdown();
    expect(useNotificationStore.getState().isDropdownOpen).toBe(true);
    useNotificationStore.getState().toggleDropdown();
    expect(useNotificationStore.getState().isDropdownOpen).toBe(false);
  });

  it("closes dropdown", () => {
    useNotificationStore.getState().toggleDropdown();
    useNotificationStore.getState().closeDropdown();
    expect(useNotificationStore.getState().isDropdownOpen).toBe(false);
  });
});

describe("useNotificationStore — addNotification", () => {
  it("prepends notification and increments unread", () => {
    useNotificationStore.getState().addNotification(mockNotification);
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBe(1);
    expect(state.notifications[0].title).toBe("Test");
    expect(state.notifications[0].message).toBe("Hello");
    expect(state.notifications[0].isRead).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it("does not increment unread for read notification", () => {
    useNotificationStore.getState().addNotification(mockReadNotification);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("prepends to existing notifications and increments count", () => {
    useNotificationStore.getState().addNotification(mockReadNotification);
    useNotificationStore.getState().setUnreadCount(0);
    useNotificationStore.getState().addNotification(mockNotification);
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.notifications[0].id).toBe(1); // prepended
    expect(state.notifications[1].id).toBe(2); // existing
    expect(state.unreadCount).toBe(1);
  });

  it("does not increment unread when adding read notification to non-empty list", () => {
    useNotificationStore.getState().addNotification(mockNotification);
    useNotificationStore.getState().setUnreadCount(1);
    useNotificationStore.getState().addNotification(mockReadNotification);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });
});

describe("useNotificationStore — addNotification with undefined isRead", () => {
  it("treats undefined isRead as unread (increments count)", () => {
    const noIsRead = { id: 99, title: "No isRead", message: "test", createAt: "2026-01-01" };
    useNotificationStore.getState().addNotification(noIsRead as unknown as Notification);
    // undefined isRead is falsy → increments unreadCount
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });
});

describe("useNotificationStore — setNotifications", () => {
  it("sets notifications and calculates unread count", () => {
    // Pre-set a stale unread count to verify setNotifications overwrites it
    useNotificationStore.getState().setUnreadCount(999);
    useNotificationStore.getState().setNotifications([mockNotification, mockReadNotification]);
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(1);
  });

  it("sets empty array and resets unread count to 0", () => {
    useNotificationStore.getState().setUnreadCount(5);
    useNotificationStore.getState().setNotifications([]);
    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("sets all-read notifications and count to 0", () => {
    useNotificationStore.getState().setNotifications([mockReadNotification]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("sets all-unread notifications and counts correctly", () => {
    const secondUnread: Notification = { ...mockNotification, id: 3, title: "Second" };
    useNotificationStore.getState().setNotifications([mockNotification, secondUnread]);
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });
});

describe("useNotificationStore — partialize (persistence)", () => {
  it("only persists unreadCount to localStorage", () => {
    useNotificationStore.getState().setNotifications([mockNotification, mockReadNotification]);
    useNotificationStore.getState().setUnreadCount(1);
    useNotificationStore.getState().toggleDropdown();

    // Zustand persist writes on set() — flush by calling rehydrate
    useNotificationStore.persist.rehydrate();

    const raw = localStorage.getItem("notification-storage");
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw!);

    // Only unreadCount should be persisted (per partialize)
    expect(persisted.state.unreadCount).toBe(1);
    // Notifications and isDropdownOpen should NOT be persisted
    expect(persisted.state.notifications).toBeUndefined();
    expect(persisted.state.isDropdownOpen).toBeUndefined();
  });
});

describe("useNotificationStore — markAsRead with duplicate IDs", () => {
  it("marks ALL matching notifications read but only decrements count by 1", () => {
    // Source code uses map() for notifications (marks ALL matches) but find() for count (only checks if any unread exists)
    const dup1: Notification = { ...mockNotification, id: 5, isRead: false };
    const dup2: Notification = { ...mockNotification, id: 5, isRead: false, title: "Dup" };
    useNotificationStore.getState().setNotifications([dup1, dup2]);
    useNotificationStore.getState().setUnreadCount(2);

    useNotificationStore.getState().markAsRead(5);

    const state = useNotificationStore.getState();
    // map() marks ALL matching IDs as read
    expect(state.notifications[0].isRead).toBe(true);
    expect(state.notifications[1].isRead).toBe(true);
    // find() returns first match → decrements by 1 only
    expect(state.unreadCount).toBe(1);
  });
});
