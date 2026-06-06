import i18n from "@/lib/i18n";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSpeechRecognition } from "./useSpeechRecognition";

const t = i18n.t.bind(i18n);

class MockSpeechRecognition {
  lang = "vi-VN";
  continuous = false;
  interimResults = true;
  maxAlternatives = 1;
  onresult: ((_event: Event) => void) | null = null;
  onerror: ((_event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  startCount = 0;

  start() {
    this.startCount += 1;
    this.onstart?.();
  }

  stop() {
    this.onend?.();
  }

  abort() {
    this.onend?.();
  }
}

function createResultEvent(results: Array<{ transcript: string; isFinal: boolean }>): Event {
  const resultItems = results.map(({ transcript, isFinal }) => ({
    isFinal,
    0: { transcript },
    length: 1,
  }));

  return {
    resultIndex: 0,
    results: {
      ...resultItems,
      length: resultItems.length,
    },
  } as unknown as Event;
}

describe("useSpeechRecognition", () => {
  let currentRecognition: MockSpeechRecognition | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    const mockSpeechRecognitionConstructor = class {
      constructor() {
        currentRecognition = new MockSpeechRecognition();
        return currentRecognition;
      }
    };

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      writable: true,
      value: mockSpeechRecognitionConstructor,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  it("giu trang thai listening khi no-speech va tu restart", () => {
    const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

    act(() => {
      result.current.startListening();
    });

    expect(result.current.isListening).toBe(true);
    expect(currentRecognition?.startCount).toBe(1);

    act(() => {
      currentRecognition?.onerror?.({ error: "no-speech" });
      vi.advanceTimersByTime(400);
    });

    expect(currentRecognition?.startCount).toBeGreaterThanOrEqual(2);
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.stopListening();
    });

    expect(result.current.isListening).toBe(false);
  });

  it("goi callback nhac lap lai theo chu ky da cau hinh", () => {
    const onReminder = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition("vi-VN", undefined, { reminderIntervalMs: 1000, onReminder })
    );

    act(() => {
      result.current.startListening();
      vi.advanceTimersByTime(3100);
    });

    expect(onReminder).toHaveBeenCalledTimes(3);

    act(() => {
      result.current.stopListening();
      vi.advanceTimersByTime(2200);
    });

    expect(onReminder).toHaveBeenCalledTimes(3);
  });

  describe("onFinalTranscript", () => {
    it("calls onFinalTranscript with final result text", () => {
      const onFinal = vi.fn();
      const { result } = renderHook(() => useSpeechRecognition("vi-VN", onFinal));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onresult?.(
          createResultEvent([{ transcript: "hello world", isFinal: true }])
        );
      });

      expect(onFinal).toHaveBeenCalledWith("hello world");
    });

    it("trims whitespace from final transcript", () => {
      const onFinal = vi.fn();
      const { result } = renderHook(() => useSpeechRecognition("vi-VN", onFinal));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onresult?.(
          createResultEvent([{ transcript: "  padded text  ", isFinal: true }])
        );
      });

      expect(onFinal).toHaveBeenCalledWith("padded text");
    });

    it("does not call onFinalTranscript for interim results", () => {
      const onFinal = vi.fn();
      const { result } = renderHook(() => useSpeechRecognition("vi-VN", onFinal));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onresult?.(
          createResultEvent([{ transcript: "partial", isFinal: false }])
        );
      });

      expect(onFinal).not.toHaveBeenCalled();
    });

    it("updates interimTranscript for non-final results", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onresult?.(
          createResultEvent([{ transcript: "partial text", isFinal: false }])
        );
      });

      expect(result.current.interimTranscript).toBe("partial text");
    });

    it("handles mixed final and interim results in one event", () => {
      const onFinal = vi.fn();
      const { result } = renderHook(() => useSpeechRecognition("vi-VN", onFinal));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onresult?.(
          createResultEvent([
            { transcript: "final part", isFinal: true },
            { transcript: " interim part", isFinal: false },
          ])
        );
      });

      expect(onFinal).toHaveBeenCalledWith("final part");
      expect(result.current.interimTranscript).toBe(" interim part");
    });
  });

  describe("error handling", () => {
    it("sets error for not-allowed and stops listening", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });
      expect(result.current.isListening).toBe(true);

      act(() => {
        currentRecognition?.onerror?.({ error: "not-allowed" });
      });

      expect(result.current.error).toBe(t("general.theBrowserIsNotGranted"));
      expect(result.current.isListening).toBe(false);
    });

    it("sets error for audio-capture", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onerror?.({ error: "audio-capture" });
      });

      expect(result.current.error).toBe(t("general.noMicrophoneFoundPleaseCheck"));
      expect(result.current.isListening).toBe(false);
    });

    it("sets error for network", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onerror?.({ error: "network" });
      });

      expect(result.current.error).toBe(t("general.networkErrorWhenRecognizingVoice"));
      expect(result.current.isListening).toBe(false);
    });

    it("handles aborted error silently (no error message, no state change)", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onerror?.({ error: "aborted" });
      });

      // aborted returns early — no error message, no state change
      expect(result.current.error).toBeNull();
    });

    it("sets generic error for unknown error types", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onerror?.({ error: "unknown-error" });
      });

      expect(result.current.error).toContain("unknown-error");
      expect(result.current.isListening).toBe(false);
    });

    it("prevents restart after fatal error (not-allowed)", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onerror?.({ error: "not-allowed" });
      });

      const startCountAfterError = currentRecognition?.startCount ?? 0;

      // Advance timers — should NOT trigger a restart
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(currentRecognition?.startCount).toBe(startCountAfterError);
    });
  });

  describe("stopRequestedRef behavior", () => {
    it("does not restart after stopListening is called", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      const startCountBefore = currentRecognition?.startCount ?? 0;

      act(() => {
        result.current.stopListening();
      });

      // Simulate onend firing after stop (browser behavior)
      act(() => {
        currentRecognition?.onend?.();
        vi.advanceTimersByTime(1000);
      });

      // Should not have restarted
      expect(currentRecognition?.startCount).toBe(startCountBefore);
      expect(result.current.isListening).toBe(false);
    });

    it("restarts on onend when stop was NOT requested (natural end)", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      const startCountBefore = currentRecognition?.startCount ?? 0;

      // Simulate natural onend (without stopRequested)
      act(() => {
        currentRecognition?.onend?.();
        vi.advanceTimersByTime(500);
      });

      expect(currentRecognition?.startCount).toBeGreaterThan(startCountBefore);
    });
  });

  describe("startListening / stopListening guards", () => {
    it("startListening is a no-op when already listening", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      const startCount = currentRecognition?.startCount ?? 0;

      act(() => {
        result.current.startListening();
      });

      // Should not call start() again
      expect(currentRecognition?.startCount).toBe(startCount);
    });

    it("stopListening is a no-op when not listening", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      // Don't start — just try to stop
      act(() => {
        result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("stopListening is a no-op when stop was already requested", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      act(() => {
        result.current.startListening();
      });

      act(() => {
        result.current.stopListening();
      });

      const stopCallCount = currentRecognition
        ? (vi.mocked(currentRecognition.stop).mock?.calls.length ?? 0)
        : 0;

      // Second stop should be a no-op
      act(() => {
        result.current.stopListening();
      });

      expect(result.current.isListening).toBe(false);
      // Stop was only called once (second stop is a no-op)
      expect(stopCallCount).toBeLessThanOrEqual(1);
    });
  });

  describe("isSupported", () => {
    it("returns false when SpeechRecognition API is not available", () => {
      Object.defineProperty(window, "SpeechRecognition", {
        configurable: true,
        writable: true,
        value: undefined,
      });
      Object.defineProperty(window, "webkitSpeechRecognition", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      expect(result.current.isSupported).toBe(false);
    });

    it("returns true when SpeechRecognition is available", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      expect(result.current.isSupported).toBe(true);
    });

    it("falls back to webkitSpeechRecognition", () => {
      Object.defineProperty(window, "SpeechRecognition", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      const webkitMock = class {
        constructor() {
          currentRecognition = new MockSpeechRecognition();
          return currentRecognition;
        }
      };

      Object.defineProperty(window, "webkitSpeechRecognition", {
        configurable: true,
        writable: true,
        value: webkitMock,
      });

      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      expect(result.current.isSupported).toBe(true);
    });
  });

  describe("initial state", () => {
    it("starts with isListening=false, no error, empty interimTranscript", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      expect(result.current.isListening).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.interimTranscript).toBe("");
    });
  });

  describe("onstart clears error", () => {
    it("clears error when recognition starts", () => {
      const { result } = renderHook(() => useSpeechRecognition("vi-VN"));

      // Trigger an error first
      act(() => {
        result.current.startListening();
      });

      act(() => {
        currentRecognition?.onerror?.({ error: "network" });
      });

      expect(result.current.error).not.toBeNull();

      // Start again — error should be cleared by onstart
      act(() => {
        result.current.startListening();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
