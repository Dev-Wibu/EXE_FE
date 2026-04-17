export type MediaFileKind = "image" | "pdf" | "other";

const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".avif",
  ".heic",
  ".heif",
] as const;

const PDF_EXTENSIONS = [".pdf"] as const;

export interface ResolveBlobSourceOptions {
  token?: string | null;
  requireAuth?: boolean;
  signal?: AbortSignal;
  headers?: HeadersInit;
  fallbackFileName?: string;
}

export interface ResolvedBlobSource {
  objectUrl: string;
  blob: Blob;
  fileName: string;
}

function sanitizeBearerToken(token: string | null | undefined): string | undefined {
  if (!token) {
    return undefined;
  }

  const normalized = token.replace(/^Bearer\s+/i, "").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function parseContentDispositionFileName(contentDisposition: string | null): string | undefined {
  if (!contentDisposition) {
    return undefined;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (!simpleMatch?.[1]) {
    return undefined;
  }

  return simpleMatch[1].trim();
}

export function getFileExtension(nameOrUrl: string): string {
  const cleanInput = nameOrUrl.split("?")[0]?.split("#")[0] ?? "";
  const lastDot = cleanInput.lastIndexOf(".");

  if (lastDot < 0) {
    return "";
  }

  return cleanInput.slice(lastDot).toLowerCase();
}

export function inferFileKindFromName(nameOrUrl: string): MediaFileKind {
  const extension = getFileExtension(nameOrUrl);

  if (IMAGE_EXTENSIONS.includes(extension as (typeof IMAGE_EXTENSIONS)[number])) {
    return "image";
  }

  if (PDF_EXTENSIONS.includes(extension as (typeof PDF_EXTENSIONS)[number])) {
    return "pdf";
  }

  return "other";
}

export function inferFileKindFromMimeType(mimeType: string | null | undefined): MediaFileKind {
  if (!mimeType) {
    return "other";
  }

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.includes("pdf")) {
    return "pdf";
  }

  return "other";
}

export function inferFileKind(params: {
  fileName?: string | null;
  mimeType?: string | null;
}): MediaFileKind {
  const mimeKind = inferFileKindFromMimeType(params.mimeType);
  if (mimeKind !== "other") {
    return mimeKind;
  }

  if (params.fileName) {
    return inferFileKindFromName(params.fileName);
  }

  return "other";
}

export function extractFileNameFromUrl(url: string): string {
  const pathname = url.split("?")[0]?.split("#")[0] ?? "";
  const lastSegment = pathname.split("/").pop();

  if (!lastSegment) {
    return "tai-lieu";
  }

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

export function revokeObjectUrlSafe(objectUrl: string | null | undefined): void {
  if (!objectUrl) {
    return;
  }

  if (!objectUrl.startsWith("blob:")) {
    return;
  }

  URL.revokeObjectURL(objectUrl);
}

export async function resolveSourceToBlobUrl(
  source: string | Blob | File,
  options: ResolveBlobSourceOptions = {}
): Promise<ResolvedBlobSource> {
  if (source instanceof Blob) {
    const fileName =
      source instanceof File ? source.name : options.fallbackFileName?.trim() || "tai-lieu.pdf";

    return {
      objectUrl: URL.createObjectURL(source),
      blob: source,
      fileName,
    };
  }

  const token = sanitizeBearerToken(options.token);
  const headers = new Headers(options.headers ?? {});

  if ((options.requireAuth ?? true) && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(source, {
    method: "GET",
    headers,
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Không thể tải tệp (${response.status})`);
  }

  const blob = await response.blob();
  const fileName =
    parseContentDispositionFileName(response.headers.get("content-disposition")) ||
    options.fallbackFileName?.trim() ||
    extractFileNameFromUrl(source);

  return {
    objectUrl: URL.createObjectURL(blob),
    blob,
    fileName,
  };
}

export function openUrlInNewTab(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadFromUrl(url: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function normalizeRelativeAssetPath(path: string): string {
  const normalized = path.replace(/\\/g, "/").trim();
  const segments = normalized.split("/").filter((segment) => segment.length > 0);

  return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}
