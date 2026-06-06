import type { Notification } from "@/services/notification.manager";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  broadcastNotificationCreated,
  subscribeToNotificationCreated,
} from "./notification-alert-bus";

// Mock BroadcastChannel
const mockPostMessage = vi.fn();
const mockClose = vi.fn();
let channelHandler: ((event: MessageEvent) => void) | null = null;

class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    channelHandler = (e: MessageEvent) => this.onmessage?.(e);
  }

  postMessage = mockPostMessage;
  close = mockClose;
}

Object.defineProperty(globalThis, "BroadcastChannel", {
  value: MockBroadcastChannel,
  writable: true,
});

const mockNotification: Notification = {
  id: 1,
  title: "Test",
  message: "Hello",
  isRead: false,
  createAt: "2026-01-01T00:00:00Z",
};

describe("broadcastNotificationCreated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("sends notification via BroadcastChannel", () => {
    broadcastNotificationCreated(mockNotification);
    expect(mockPostMessage).toHaveBeenCalledWith(mockNotification);
    expect(mockClose).toHaveBeenCalled();
  });

  it("also writes to localStorage alongside BroadcastChannel", () => {
    // Save real localStorage and replace with a mock to capture calls
    const realLocalStorage = globalThis.localStorage;
    const mockSetItem = vi.fn();
    const mockRemoveItem = vi.fn();
    const mockGetItem = vi.fn(() => null);
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        getItem: mockGetItem,
        clear: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    try {
      broadcastNotificationCreated(mockNotification);
      expect(mockPostMessage).toHaveBeenCalledWith(mockNotification);
      // Verify localStorage.setItem was called with the correct payload structure
      expect(mockSetItem).toHaveBeenCalledWith(
        "exe-fe:notification-alert",
        expect.stringContaining("notification-created")
      );
      // Verify the notification data is in the payload
      const payload = JSON.parse(mockSetItem.mock.calls[0][1] as string);
      expect(payload.notification).toEqual(mockNotification);
      expect(payload.type).toBe("notification-created");
      expect(typeof payload.timestamp).toBe("number");
      // Verify localStorage.removeItem cleans up the event key
      expect(mockRemoveItem).toHaveBeenCalledWith("exe-fe:notification-alert");
      expect(mockClose).toHaveBeenCalled();
    } finally {
      // Restore real localStorage for subsequent tests
      Object.defineProperty(globalThis, "localStorage", {
        value: realLocalStorage,
        writable: true,
        configurable: true,
      });
    }
  });

  it("throws no error when localStorage is unavailable", () => {
    // Simulate localStorage being unavailable
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("SecurityError");
    };
    expect(() => broadcastNotificationCreated(mockNotification)).not.toThrow();
    Storage.prototype.setItem = original;
  });

  it("does not throw when localStorage.setItem throws (quota exceeded)", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    // Should not throw — BroadcastChannel is primary path, localStorage is fallback
    expect(() => broadcastNotificationCreated(mockNotification)).not.toThrow();
  });
});

describe("subscribeToNotificationCreated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    channelHandler = null;
  });

  it("returns an unsubscribe function", () => {
    const unsub = subscribeToNotificationCreated(vi.fn());
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("calls handler when BroadcastChannel message arrives", () => {
    const handler = vi.fn();
    subscribeToNotificationCreated(handler);

    // Simulate message
    if (channelHandler) {
      channelHandler(new MessageEvent("message", { data: mockNotification }));
    }
    expect(handler).toHaveBeenCalledWith(mockNotification);
  });

  it("calls handler on storage event", () => {
    const handler = vi.fn();
    subscribeToNotificationCreated(handler);

    const storageEvent = new StorageEvent("storage", {
      key: "exe-fe:notification-alert",
      newValue: JSON.stringify({
        type: "notification-created",
        notification: mockNotification,
        timestamp: Date.now(),
      }),
    });
    window.dispatchEvent(storageEvent);
    expect(handler).toHaveBeenCalledWith(mockNotification);
  });

  it("ignores storage events with wrong key", () => {
    const handler = vi.fn();
    subscribeToNotificationCreated(handler);

    const storageEvent = new StorageEvent("storage", {
      key: "wrong-key",
      newValue: JSON.stringify({ notification: mockNotification }),
    });
    window.dispatchEvent(storageEvent);
    expect(handler).not.toHaveBeenCalled();
  });

  it("cleans up listeners on unsubscribe", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const unsub = subscribeToNotificationCreated(vi.fn());
    unsub();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("storage", expect.any(Function));
  });

  it("ignores storage event with null newValue", () => {
    const handler = vi.fn();
    subscribeToNotificationCreated(handler);

    const storageEvent = new StorageEvent("storage", {
      key: "exe-fe:notification-alert",
      newValue: null,
    });
    window.dispatchEvent(storageEvent);
    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores storage event with malformed JSON", () => {
    const handler = vi.fn();
    subscribeToNotificationCreated(handler);

    const storageEvent = new StorageEvent("storage", {
      key: "exe-fe:notification-alert",
      newValue: "not-valid-json{{{",
    });
    window.dispatchEvent(storageEvent);
    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores storage event with valid JSON but non-object notification", () => {
    const handler = vi.fn();
    subscribeToNotificationCreated(handler);

    const storageEvent = new StorageEvent("storage", {
      key: "exe-fe:notification-alert",
      newValue: JSON.stringify({ type: "notification-created", notification: "not-an-object" }),
    });
    window.dispatchEvent(storageEvent);
    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores BroadcastChannel message with non-object data", () => {
    const handler = vi.fn();
    subscribeToNotificationCreated(handler);

    if (channelHandler) {
      channelHandler(new MessageEvent("message", { data: null }));
      channelHandler(new MessageEvent("message", { data: "string" }));
      channelHandler(new MessageEvent("message", { data: 42 }));
    }
    expect(handler).not.toHaveBeenCalled();
  });
});
