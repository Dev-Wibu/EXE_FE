import { describe, expect, it } from "vitest";

import {
  buildExternalDocumentViewerUrl,
  canEmbedExternalDocument,
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

  it("infers document kind from office extension", () => {
    expect(inferFileKindFromName("ho-so-ung-vien.docx")).toBe("document");
  });

  it("infers document kind from office mime type", () => {
    expect(
      inferFileKind({
        fileName: "khong-co-duoi",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
    ).toBe("document");
  });

  it("builds office viewer URL for public document", () => {
    const source = "https://example.com/files/cv.docx";

    expect(buildExternalDocumentViewerUrl(source, "office")).toContain(
      "https://view.officeapps.live.com/op/embed.aspx?src="
    );
  });

  it("builds google viewer URL for public document", () => {
    const source = "https://example.com/files/cv.docx";

    expect(buildExternalDocumentViewerUrl(source, "google")).toContain(
      "https://docs.google.com/gview?embedded=1&url="
    );
  });

  it("returns null document viewer URL for non-http source", () => {
    expect(buildExternalDocumentViewerUrl("blob:sample", "office")).toBeNull();
  });

  it("does not embed private non-cloudinary document by default", () => {
    expect(
      canEmbedExternalDocument({
        sourceUrl: "https://api.example.com/secure/cv.docx",
        requireAuth: true,
      })
    ).toBe(false);
  });

  it("allows embed for cloudinary document even when requireAuth is true", () => {
    expect(
      canEmbedExternalDocument({
        sourceUrl: "https://res.cloudinary.com/demo/raw/upload/v1/cv.docx",
        requireAuth: true,
      })
    ).toBe(true);
  });

  it("normalizes relative path for browser access", () => {
    expect(normalizeRelativeAssetPath("temp-file\\Screenshot 2026-01-21 153334.png")).toBe(
      "/temp-file/Screenshot%202026-01-21%20153334.png"
    );
  });
});
