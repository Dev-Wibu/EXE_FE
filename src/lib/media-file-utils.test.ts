import { describe, expect, it } from "vitest";

import {
  getFileExtension,
  inferFileKind,
  inferFileKindFromName,
  normalizeRelativeAssetPath,
} from "./media-file-utils";

describe("media-file-utils", () => {
  it("extracts file extension from URL with query string", () => {
    expect(getFileExtension("https://example.com/folder/file-name.pdf?token=123")).toBe(".pdf");
  });

  it("infers image kind from file name", () => {
    expect(inferFileKindFromName("anh-dai-dien.PNG")).toBe("image");
  });

  it("infers pdf kind from mime type when extension is missing", () => {
    expect(
      inferFileKind({
        fileName: "tai-lieu",
        mimeType: "application/pdf",
      })
    ).toBe("pdf");
  });

  it("normalizes relative path for browser access", () => {
    expect(normalizeRelativeAssetPath("temp-file\\Screenshot 2026-01-21 153334.png")).toBe(
      "/temp-file/Screenshot%202026-01-21%20153334.png"
    );
  });
});
