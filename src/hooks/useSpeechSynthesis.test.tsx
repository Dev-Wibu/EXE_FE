import i18n from "@/lib/i18n";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

import { loadResponsiveVoice, stopResponsiveVoicePlayback } from "@/lib/tts-playground";

import { useSpeechSynthesis } from "./useSpeechSynthesis";

vi.mock("@/lib/tts-playground", () => ({
  loadResponsiveVoice: vi.fn(),
  resolveResponsiveVoiceName: vi.fn((language: "vi-VN" | "en-US") =>
    language === "vi-VN" ? "Vietnamese Male" : "US English Male"
  ),
  stopResponsiveVoicePlayback: vi.fn(),
}));

const mockedLoadResponsiveVoice = vi.mocked(loadResponsiveVoice);
const mockedStopResponsiveVoicePlayback = vi.mocked(stopResponsiveVoicePlayback);

function createVoice(name: string, lang: string): SpeechSynthesisVoice {
  return {
    default: true,
    lang,
    localService: true,
    name,
    voiceURI: `${name}-${lang}`,
  } as SpeechSynthesisVoice;
}

// jsdom does not have SpeechSynthesisUtterance — mock it globally
class MockSpeechSynthesisUtterance {
  text = "";
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: ((event: Event) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

describe("useSpeechSynthesis", () => {
  let speechSynthesisSpeakMock: ReturnType<typeof vi.fn>;
  let speechSynthesisCancelMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    // @ts-expect-error jsdom mock for SpeechSynthesisUtterance
    globalThis.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

    speechSynthesisSpeakMock = vi.fn((utterance: MockSpeechSynthesisUtterance) => {
      utterance.onstart?.(new Event("start"));
    });
    speechSynthesisCancelMock = vi.fn();

    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      writable: true,
      value: {
        speak: speechSynthesisSpeakMock,
        cancel: speechSynthesisCancelMock,
        getVoices: () => [
          createVoice("Microsoft Nam", "vi-VN"),
          createVoice("Microsoft Mark", "en-US"),
        ],
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as SpeechSynthesis,
    });

    localStorage.clear();
    mockedStopResponsiveVoicePlayback.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    localStorage.clear();
    delete (globalThis as Record<string, unknown>).SpeechSynthesisUtterance;
  });

  it(t("general.useResponsivevoiceWithMaleVietnamese"), async () => {
    const responsiveSpeak = vi.fn(
      (
        _text: string,
        _voice?: string,
        options?: {
          onstart?: () => void;
          onend?: () => void;
          onerror?: () => void;
        }
      ) => {
        options?.onstart?.();
      }
    );

    mockedLoadResponsiveVoice.mockResolvedValue({
      speak: responsiveSpeak,
      cancel: vi.fn(),
      enableWindowClickHook: vi.fn(),
    });

    const { result } = renderHook(() =>
      useSpeechSynthesis("vi-VN", { strategy: "responsive-voice-first" })
    );

    expect(result.current.isSupported).toBe(true);

    await act(async () => {
      await Promise.resolve();
      result.current.speak("xin chao", 1);
      await Promise.resolve();
    });

    expect(responsiveSpeak).toHaveBeenCalledWith(
      "xin chao",
      "Vietnamese Male",
      expect.objectContaining({ rate: 1, pitch: 1, volume: 1 })
    );
    expect(result.current.activeVoiceName).toContain("Vietnamese Male");
    expect(result.current.activeVoiceName).toContain("ResponsiveVoice");
  });

  describe("cancel", () => {
    it("calls speechSynthesis.cancel and stopResponsiveVoicePlayback", () => {
      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      act(() => {
        result.current.cancel();
      });

      expect(speechSynthesisCancelMock).toHaveBeenCalled();
      expect(mockedStopResponsiveVoicePlayback).toHaveBeenCalled();
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.speakingId).toBeNull();
    });

    it("is a no-op when not supported", () => {
      // Remove speechSynthesis and don't use responsive-voice-first
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      expect(result.current.isSupported).toBe(false);

      act(() => {
        result.current.cancel();
      });

      // Should not throw and cancel should not be called on undefined
      expect(result.current.isSpeaking).toBe(false);
    });
  });

  describe("toggleMute", () => {
    it("toggles isMuted and persists to localStorage", () => {
      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      expect(result.current.isMuted).toBe(false);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);
      expect(localStorage.getItem("tts-muted")).toBe("true");

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
      expect(localStorage.getItem("tts-muted")).toBe("false");
    });

    it("cancels playback when muting", () => {
      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      act(() => {
        result.current.toggleMute();
      });

      expect(speechSynthesisCancelMock).toHaveBeenCalled();
      expect(mockedStopResponsiveVoicePlayback).toHaveBeenCalled();
    });

    it("does not cancel playback when unmuting", () => {
      localStorage.setItem("tts-muted", "true");
      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      expect(result.current.isMuted).toBe(true);

      speechSynthesisCancelMock.mockClear();
      mockedStopResponsiveVoicePlayback.mockClear();

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
      // Unmuting should NOT trigger cancel
      expect(speechSynthesisCancelMock).not.toHaveBeenCalled();
      expect(mockedStopResponsiveVoicePlayback).not.toHaveBeenCalled();
    });
  });

  describe("isMuted initialization from localStorage", () => {
    it("reads isMuted=true from localStorage on mount", () => {
      localStorage.setItem("tts-muted", "true");
      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      expect(result.current.isMuted).toBe(true);
    });

    it("defaults isMuted=false when localStorage has no tts-muted", () => {
      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      expect(result.current.isMuted).toBe(false);
    });
  });

  describe("speak", () => {
    it("is a no-op for empty text", async () => {
      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      await act(async () => {
        result.current.speak("", 1);
      });

      expect(speechSynthesisSpeakMock).not.toHaveBeenCalled();
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.speakingId).toBeNull();
    });

    it("is a no-op when not supported", async () => {
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      await act(async () => {
        result.current.speak("hello", 1);
      });

      expect(result.current.isSpeaking).toBe(false);
    });

    it("calls speechSynthesis.speak for web-speech-only strategy", async () => {
      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      await act(async () => {
        result.current.speak("hello world", 1);
        // Flush async chain: speak → speakWithWebSpeech → waitForVoices → synth.speak
        await vi.runAllTimersAsync();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(speechSynthesisSpeakMock).toHaveBeenCalled();
    });

    it("tracks speakingId when utterance starts", async () => {
      speechSynthesisSpeakMock = vi.fn((utterance: MockSpeechSynthesisUtterance) => {
        utterance.onstart?.(new Event("start"));
      });

      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: {
          speak: speechSynthesisSpeakMock,
          cancel: speechSynthesisCancelMock,
          getVoices: () => [createVoice("Microsoft Nam", "vi-VN")],
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as SpeechSynthesis,
      });

      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      await act(async () => {
        result.current.speak("hello", 42);
        await vi.runAllTimersAsync();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.speakingId).toBe(42);
    });

    it("resets speakingId when utterance ends", async () => {
      let capturedUtterance: MockSpeechSynthesisUtterance | null = null;
      speechSynthesisSpeakMock = vi.fn((utterance: MockSpeechSynthesisUtterance) => {
        capturedUtterance = utterance;
        utterance.onstart?.(new Event("start"));
      });

      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: {
          speak: speechSynthesisSpeakMock,
          cancel: speechSynthesisCancelMock,
          getVoices: () => [createVoice("Microsoft Nam", "vi-VN")],
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as SpeechSynthesis,
      });

      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      await act(async () => {
        result.current.speak("hello", 7);
        await vi.runAllTimersAsync();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.speakingId).toBe(7);

      act(() => {
        capturedUtterance!.onend!(new Event("end"));
      });

      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.speakingId).toBeNull();
    });

    it("resets state when utterance errors", async () => {
      let capturedUtterance: MockSpeechSynthesisUtterance | null = null;
      speechSynthesisSpeakMock = vi.fn((utterance: MockSpeechSynthesisUtterance) => {
        capturedUtterance = utterance;
        utterance.onstart?.(new Event("start"));
      });

      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: {
          speak: speechSynthesisSpeakMock,
          cancel: speechSynthesisCancelMock,
          getVoices: () => [createVoice("Microsoft Nam", "vi-VN")],
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as SpeechSynthesis,
      });

      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      await act(async () => {
        result.current.speak("hello", 3);
        await vi.runAllTimersAsync();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.speakingId).toBe(3);

      act(() => {
        capturedUtterance!.onerror!(new Event("error"));
      });

      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.speakingId).toBeNull();
    });
  });

  describe("isSupported", () => {
    it("returns false when speechSynthesis is missing and strategy is web-speech-only", () => {
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      expect(result.current.isSupported).toBe(false);
    });

    it("returns true when speechSynthesis is missing but strategy is responsive-voice-first", () => {
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      mockedLoadResponsiveVoice.mockResolvedValue({
        speak: vi.fn(),
        cancel: vi.fn(),
        enableWindowClickHook: vi.fn(),
      });

      const { result } = renderHook(() =>
        useSpeechSynthesis("vi-VN", { strategy: "responsive-voice-first" })
      );

      expect(result.current.isSupported).toBe(true);
    });
  });

  describe("hasPreferredLanguageVoice", () => {
    it("returns null when voices list is empty (loading)", () => {
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: {
          speak: speechSynthesisSpeakMock,
          cancel: speechSynthesisCancelMock,
          getVoices: () => [],
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as SpeechSynthesis,
      });

      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      // Voices are empty initially, so returns null (loading)
      expect(result.current.hasPreferredLanguageVoice).toBeNull();
    });

    it("returns true when a matching voice exists", () => {
      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      // The beforeEach sets up voices with vi-VN
      expect(result.current.hasPreferredLanguageVoice).toBe(true);
    });

    it("returns false when no matching voice exists", () => {
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: {
          speak: speechSynthesisSpeakMock,
          cancel: speechSynthesisCancelMock,
          getVoices: () => [createVoice("Microsoft Mark", "en-US")],
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        } as unknown as SpeechSynthesis,
      });

      const { result } = renderHook(() => useSpeechSynthesis("ja-JP"));

      expect(result.current.hasPreferredLanguageVoice).toBe(false);
    });

    it("returns null when not supported", () => {
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useSpeechSynthesis("vi-VN"));

      expect(result.current.hasPreferredLanguageVoice).toBeNull();
    });

    it("returns true for responsive-voice-first when RV is available", async () => {
      mockedLoadResponsiveVoice.mockResolvedValue({
        speak: vi.fn(),
        cancel: vi.fn(),
        enableWindowClickHook: vi.fn(),
      });

      const { result } = renderHook(() =>
        useSpeechSynthesis("vi-VN", { strategy: "responsive-voice-first" })
      );

      // Wait for RV to load
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.hasPreferredLanguageVoice).toBe(true);
    });

    it("returns null while responsive-voice is still loading", () => {
      // Don't resolve the loadResponsiveVoice promise
      mockedLoadResponsiveVoice.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() =>
        useSpeechSynthesis("vi-VN", { strategy: "responsive-voice-first" })
      );

      expect(result.current.hasPreferredLanguageVoice).toBeNull();
    });
  });

  describe("responsive-voice-first fallback to web speech", () => {
    it("falls back to web speech when RV fails to load", async () => {
      mockedLoadResponsiveVoice.mockRejectedValue(new Error("RV not available"));

      const { result } = renderHook(() =>
        useSpeechSynthesis("vi-VN", { strategy: "responsive-voice-first" })
      );

      // Wait for RV load to fail
      await act(async () => {
        await vi.runAllTimersAsync();
        await Promise.resolve();
        await Promise.resolve();
      });

      // After RV fails, should fall back to web speech on speak
      await act(async () => {
        result.current.speak("fallback test", 1);
        await vi.runAllTimersAsync();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(speechSynthesisSpeakMock).toHaveBeenCalled();
    });

    it("falls back to web speech when RV voiceSupport returns false", async () => {
      mockedLoadResponsiveVoice.mockResolvedValue({
        speak: vi.fn(),
        cancel: vi.fn(),
        voiceSupport: () => false,
        enableWindowClickHook: vi.fn(),
      });

      const { result } = renderHook(() =>
        useSpeechSynthesis("vi-VN", { strategy: "responsive-voice-first" })
      );

      await act(async () => {
        await vi.runAllTimersAsync();
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        result.current.speak("fallback", 1);
        await vi.runAllTimersAsync();
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(speechSynthesisSpeakMock).toHaveBeenCalled();
    });
  });
});
