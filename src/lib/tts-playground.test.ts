import { describe, expect, it, vi } from "vitest";

import {
  buildGoogleTranslateTtsUrl,
  resolveResponsiveVoiceName,
  stopGoogleAudioPlayback,
} from "./tts-playground";

describe("resolveResponsiveVoiceName", () => {
  it("tra ve voice tieng Viet cho vi-VN", () => {
    expect(resolveResponsiveVoiceName("vi-VN")).toBe("Vietnamese Female");
  });

  it("tra ve voice tieng Anh cho en-US", () => {
    expect(resolveResponsiveVoiceName("en-US")).toBe("US English Female");
  });
});

describe("buildGoogleTranslateTtsUrl", () => {
  it("tao dung URL cho tieng Viet", () => {
    const url = new URL(buildGoogleTranslateTtsUrl("xin chao", "vi-VN"));

    expect(url.origin).toBe("https://translate.google.com");
    expect(url.pathname).toBe("/translate_tts");
    expect(url.searchParams.get("tl")).toBe("vi");
    expect(url.searchParams.get("client")).toBe("tw-ob");
    expect(url.searchParams.get("q")).toBe("xin chao");
  });

  it("tao dung URL cho tieng Anh", () => {
    const url = new URL(buildGoogleTranslateTtsUrl("hello", "en-US"));
    expect(url.searchParams.get("tl")).toBe("en");
  });
});

describe("stopGoogleAudioPlayback", () => {
  it("pause va reset currentTime", () => {
    const pause = vi.fn();
    const audio = {
      pause,
      currentTime: 12,
    } as unknown as HTMLAudioElement;

    stopGoogleAudioPlayback(audio);

    expect(pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
  });

  it("khong throw khi audio la null", () => {
    expect(() => stopGoogleAudioPlayback(null)).not.toThrow();
  });
});
