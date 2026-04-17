import type { MediaFileKind } from "@/lib/media-file-utils";

export type UploadTransportMode = "mock" | "xhr";

export interface UploadedMediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadUrl?: string;
}

export interface MediaViewerItem {
  id: string;
  name: string;
  src?: string;
  file?: File;
  kind?: MediaFileKind;
  mimeType?: string;
  alt?: string;
  requireAuth?: boolean;
}
