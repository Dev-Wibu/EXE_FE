import type { UploaderPreset, UploaderPresetConfig } from "./types";

const PRESET_CONFIGS: Record<UploaderPreset, UploaderPresetConfig> = {
  "single-image": {
    acceptedFileTypes: ["image/*"],
    maxNumberOfFiles: 1,
    enableImageEditor: true,
    noteKey: "compShared.presetSingleImageNote",
  },
  "multi-image": {
    acceptedFileTypes: ["image/*"],
    maxNumberOfFiles: 10,
    enableImageEditor: true,
    noteKey: "compShared.presetMultiImageNote",
  },
  "single-pdf": {
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxNumberOfFiles: 1,
    enableImageEditor: false,
    noteKey: "compShared.presetSinglePdfNote",
  },
  "multi-pdf": {
    acceptedFileTypes: [".pdf", "application/pdf"],
    maxNumberOfFiles: 10,
    enableImageEditor: false,
    noteKey: "compShared.presetMultiPdfNote",
  },
  mixed: {
    acceptedFileTypes: ["image/*", ".pdf", "application/pdf"],
    maxNumberOfFiles: 10,
    enableImageEditor: true,
    noteKey: "compShared.presetMixedNote",
  },
};

export interface ResolvedPresetConfig {
  acceptedFileTypes: string[];
  maxNumberOfFiles: number;
  enableImageEditor: boolean;
  noteKey: string;
}

/**
 * Merges a named preset with user-provided overrides.
 * User-provided values (even undefined) take precedence so callers
 * can opt-in to the preset as a default while still overriding individual fields.
 */
export function resolvePresetConfig(
  preset: UploaderPreset | undefined,
  overrides: {
    acceptedFileTypes?: string[];
    maxNumberOfFiles?: number;
    enableImageEditor?: boolean;
  }
): ResolvedPresetConfig {
  const base = preset ? PRESET_CONFIGS[preset] : PRESET_CONFIGS.mixed;

  return {
    acceptedFileTypes: overrides.acceptedFileTypes ?? base.acceptedFileTypes,
    maxNumberOfFiles: overrides.maxNumberOfFiles ?? base.maxNumberOfFiles,
    enableImageEditor: overrides.enableImageEditor ?? base.enableImageEditor,
    noteKey: base.noteKey,
  };
}
