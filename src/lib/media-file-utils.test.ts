import { describe, expect, it, vi } from "vitest";

import {
  buildExternalDocumentViewerUrl,
  canEmbedExternalDocument,
  extractFileNameFromUrl,
  getFileExtension,
  inferFileKind,
  inferFileKindFromMimeType,
  inferFileKindFromName,
  normalizeRelativeAssetPath,
  revokeObjectUrlSafe,
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

  // --- getFileExtension edge cases ---

  it("returns empty string for file with no extension", () => {
    expect(getFileExtension("README")).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(getFileExtension("")).toBe("");
  });

  it("strips URL fragment before extracting extension", () => {
    expect(getFileExtension("file.pdf#page=1")).toBe(".pdf");
  });

  it("handles URL with both query and fragment", () => {
    expect(getFileExtension("file.docx?v=1#top")).toBe(".docx");
  });

  // --- inferFileKindFromName edge cases ---

  it("returns 'other' for unknown extension", () => {
    expect(inferFileKindFromName("data.xyz")).toBe("other");
  });

  it("returns 'other' for file with no extension", () => {
    expect(inferFileKindFromName("noext")).toBe("other");
  });

  // --- inferFileKindFromMimeType ---

  it("returns 'other' for null mimeType", () => {
    expect(inferFileKindFromMimeType(null)).toBe("other");
  });

  it("returns 'other' for undefined mimeType", () => {
    expect(inferFileKindFromMimeType(undefined)).toBe("other");
  });

  it("returns 'image' for image mime type", () => {
    expect(inferFileKindFromMimeType("image/png")).toBe("image");
  });

  it("returns 'document' for RTF mime type", () => {
    expect(inferFileKindFromMimeType("application/rtf")).toBe("document");
  });

  it("returns 'document' for spreadsheet mime type", () => {
    expect(
      inferFileKindFromMimeType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ).toBe("document");
  });

  it("returns 'other' for unknown mime type", () => {
    expect(inferFileKindFromMimeType("application/octet-stream")).toBe("other");
  });

  // --- inferFileKind edge cases ---

  it("returns 'other' when both fileName and mimeType are null", () => {
    expect(inferFileKind({ fileName: null, mimeType: null })).toBe("other");
  });

  it("prefers mimeType over fileName", () => {
    // mimeType says image, fileName says .docx
    expect(inferFileKind({ fileName: "file.docx", mimeType: "image/png" })).toBe("image");
  });

  // --- extractFileNameFromUrl ---

  it("extracts filename from URL path", () => {
    expect(extractFileNameFromUrl("https://example.com/files/cv.pdf")).toBe("cv.pdf");
  });

  it("extracts filename from URL with query string", () => {
    expect(extractFileNameFromUrl("https://example.com/files/cv.pdf?token=123")).toBe("cv.pdf");
  });

  it("decodes percent-encoded filename", () => {
    expect(extractFileNameFromUrl("https://example.com/files/h%E1%BB%93%20s%C6%A1.pdf")).toBe(
      "hồ sơ.pdf"
    );
  });

  // --- canEmbedExternalDocument edge cases ---

  it("allows embed when requireAuth is undefined (default)", () => {
    expect(canEmbedExternalDocument({ sourceUrl: "https://example.com/file.pdf" })).toBe(true);
  });

  it("returns false for null sourceUrl", () => {
    expect(canEmbedExternalDocument({ sourceUrl: null })).toBe(false);
  });

  it("returns false for non-http sourceUrl", () => {
    expect(canEmbedExternalDocument({ sourceUrl: "ftp://example.com/file.pdf" })).toBe(false);
  });

  // --- revokeObjectUrlSafe ---

  it("revokes blob: URLs", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    revokeObjectUrlSafe("blob:http://localhost/abc-123");
    expect(revokeSpy).toHaveBeenCalledWith("blob:http://localhost/abc-123");
    revokeSpy.mockRestore();
  });

  it("does not revoke non-blob URLs", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    revokeObjectUrlSafe("https://example.com/file.pdf");
    expect(revokeSpy).not.toHaveBeenCalled();
    revokeSpy.mockRestore();
  });

  it("does nothing for null/undefined objectUrl", () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    revokeObjectUrlSafe(null);
    revokeObjectUrlSafe(undefined);
    expect(revokeSpy).not.toHaveBeenCalled();
    revokeSpy.mockRestore();
  });
});
