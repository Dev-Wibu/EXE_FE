import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSpeechRecognition } from "./useSpeechRecognition";

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
});
