import { describe, expect, it } from "vitest";

import { composeTranscriptDraft, resolveAutoSendDraft } from "./speech.utils";

describe("composeTranscriptDraft", () => {
  it("ghep input va interim transcript theo thu tu", () => {
    expect(composeTranscriptDraft("Toi da toi uu API", " voi Redis cache")).toBe(
      "Toi da toi uu API voi Redis cache"
    );
  });

  it("chuan hoa khoang trang du thua", () => {
    expect(composeTranscriptDraft("  hello    world  ", "  from   AI  ")).toBe(
      "hello world from AI"
    );
  });

  it("tra ve chuoi rong neu khong co du lieu", () => {
    expect(composeTranscriptDraft("   ", "")).toBe("");
  });

  it("van hoat dong neu chi co interim transcript", () => {
    expect(composeTranscriptDraft("", "xin chao")).toBe("xin chao");
  });
});

describe("resolveAutoSendDraft", () => {
  it("prioritizes the current composer input", () => {
    expect(resolveAutoSendDraft("Tra loi tu nguoi dung", "interim speech")).toBe(
      "Tra loi tu nguoi dung"
    );
  });

  it("falls back to interim speech when composer input is empty", () => {
    expect(resolveAutoSendDraft("   ", "Noi dung tam thoi")).toBe("Noi dung tam thoi");
  });

  it("returns empty string when both inputs are blank", () => {
    expect(resolveAutoSendDraft("", "   ")).toBe("");
  });
});
