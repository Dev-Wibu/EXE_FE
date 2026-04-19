import { describe, expect, it } from "vitest";

import { hasVoiceForLanguage, selectBestSpeechVoice } from "./speech-synthesis.utils";

const createVoice = (
  name: string,
  lang: string,
  options?: { localService?: boolean; default?: boolean }
): SpeechSynthesisVoice => {
  return {
    default: options?.default ?? false,
    lang,
    localService: options?.localService ?? false,
    name,
    voiceURI: `${name}-${lang}`,
  } as SpeechSynthesisVoice;
};

describe("selectBestSpeechVoice", () => {
  it("uu tien exact lang localService", () => {
    const voices = [
      createVoice("Vietnamese Cloud", "vi-VN"),
      createVoice("Vietnamese Local", "vi-VN", { localService: true }),
      createVoice("English", "en-US", { localService: true }),
    ];

    const selected = selectBestSpeechVoice(voices, "vi-VN");
    expect(selected?.name).toBe("Vietnamese Local");
  });

  it("fallback sang voice cung prefix", () => {
    const voices = [
      createVoice("Vietnamese Generic", "vi"),
      createVoice("English", "en-US", { localService: true }),
    ];

    const selected = selectBestSpeechVoice(voices, "vi-VN");
    expect(selected?.name).toBe("Vietnamese Generic");
  });

  it("tra ve null khi khong co voice phu hop", () => {
    const voices = [createVoice("English", "en-US", { localService: true })];

    const selected = selectBestSpeechVoice(voices, "vi-VN");
    expect(selected).toBeNull();
  });
});

describe("hasVoiceForLanguage", () => {
  it("tra ve true khi co voice trung exact lang", () => {
    const voices = [createVoice("Vietnamese", "vi-VN")];
    expect(hasVoiceForLanguage(voices, "vi-VN")).toBe(true);
  });

  it("tra ve true khi co voice cung prefix", () => {
    const voices = [createVoice("Vietnamese", "vi")];
    expect(hasVoiceForLanguage(voices, "vi-VN")).toBe(true);
  });

  it("tra ve false khi khong co voice cung ngon ngu", () => {
    const voices = [createVoice("English", "en-US")];
    expect(hasVoiceForLanguage(voices, "vi-VN")).toBe(false);
  });
});
