import type { MediaFileKind } from "@/lib/media-file-utils";

export type UploaderDisplayMode = "dashboard" | "modal";

export type UploaderPreset = "single-image" | "multi-image" | "single-pdf" | "multi-pdf" | "mixed";

export type UploaderThemeVariant = "user" | "mentor" | "admin" | "default";

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

/** A pre-existing file shown in the uploader for edit-form scenarios */
export interface InitialFileItem {
  name: string;
  /** URL on the server — shown in the Dashboard as an already-uploaded file */
  src: string;
  type?: string;
}

/** Internal shape used by uploader-presets.ts */
export interface UploaderPresetConfig {
  acceptedFileTypes: string[];
  maxNumberOfFiles: number;
  enableImageEditor: boolean;
  noteKey: string;
}
