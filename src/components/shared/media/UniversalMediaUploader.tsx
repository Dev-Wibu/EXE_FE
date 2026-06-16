import { cn } from "@/lib/utils";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import "@uppy/image-editor/css/style.min.css";
import Dashboard from "@uppy/react/dashboard";
import "@uppy/screen-capture/css/style.min.css";
import "@uppy/webcam/css/style.min.css";
import { FileText, ImageIcon, Upload, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import type {
  InitialFileItem,
  UploadedMediaFile,
  UploaderDisplayMode,
  UploaderPreset,
  UploaderThemeVariant,
  UploadTransportMode,
} from "./types";
import { resolvePresetConfig } from "./uploader-presets";
import "./uploader-themes.css";
import { useUppyInstance } from "./useUppyInstance";

export interface UniversalMediaUploaderProps {
  // ── Identity
  id?: string;
  className?: string;

  // ── Display
  displayMode?: UploaderDisplayMode;
  height?: number;
  note?: string;

  // ── Preset (sets defaults for acceptedFileTypes, maxNumberOfFiles, etc.)
  preset?: UploaderPreset;

  // ── Restrictions (override preset when provided)
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
  maxNumberOfFiles?: number;

  // ── Transport
  transportMode?: UploadTransportMode;
  endpoint?: string;
  headers?: Record<string, string>;
  multipartFieldName?: string;

  // ── Upload behaviour
  autoProceed?: boolean;
  sequentialUpload?: boolean;
  bundleUpload?: boolean;

  // ── Plugin toggles (override preset defaults when provided)
  enableImageEditor?: boolean;
  enableCompressor?: boolean;
  enableWebcam?: boolean;
  enableScreenCapture?: boolean;

  // ── Theme
  themeVariant?: UploaderThemeVariant;

  // ── Data
  initialFiles?: InitialFileItem[];

  // ── Callbacks
  onFilesChange?: (_files: File[]) => void;
  onUploadComplete?: (_files: UploadedMediaFile[]) => void;
  onUploadError?: (_message: string) => void;
}

/**
 * UniversalMediaUploader — the project's single entry-point for all file uploads.
 *
 * Three display modes:
 *  - "dashboard" — Full Uppy Dashboard (drag-drop, paste, progress, editor tabs)
 *  - "dropzone"  — Compact drag-drop zone suitable for embedding in forms/dialogs
 *  - "compact"   — Minimal file-button + selected-file list for tight spaces
 *
 * Use presets for common use-cases instead of wiring every restriction prop:
 *  preset="single-image" | "multi-image" | "single-pdf" | "multi-pdf" | "mixed"
 *
 * The component does NOT wrap itself in a <Card>; the caller decides the container.
 */
export function UniversalMediaUploader({
  id,
  className,
  displayMode = "dashboard",
  height = 460,
  note,
  preset,
  acceptedFileTypes: acceptedFileTypesProp,
  maxFileSizeMB: maxFileSizeMBProp,
  maxNumberOfFiles: maxNumberOfFilesProp,
  transportMode = "mock",
  endpoint,
  headers,
  multipartFieldName = "file",
  autoProceed = false,
  sequentialUpload = true,
  bundleUpload = false,
  enableImageEditor: enableImageEditorProp,
  enableCompressor: enableCompressorProp,
  enableWebcam = false,
  enableScreenCapture = false,
  themeVariant = "default",
  initialFiles,
  onFilesChange,
  onUploadComplete,
  onUploadError,
}: UniversalMediaUploaderProps) {
  const { t } = useTranslation();

  // Resolve preset → merge with any explicit prop overrides
  const resolved = resolvePresetConfig(preset, {
    acceptedFileTypes: acceptedFileTypesProp,
    maxNumberOfFiles: maxNumberOfFilesProp,
    enableImageEditor: enableImageEditorProp,
    enableCompressor: enableCompressorProp,
  });

  const maxFileSizeMB = maxFileSizeMBProp ?? 25;
  const resolvedNote = note ?? t(resolved.noteKey);

  const uppy = useUppyInstance({
    id,
    acceptedFileTypes: resolved.acceptedFileTypes,
    maxFileSizeMB,
    maxNumberOfFiles: resolved.maxNumberOfFiles,
    transportMode,
    endpoint,
    headers,
    multipartFieldName,
    enableImageEditor: resolved.enableImageEditor,
    enableCompressor: resolved.enableCompressor,
    enableWebcam,
    enableScreenCapture,
    autoProceed,
    sequentialUpload,
    bundleUpload,
    initialFiles,
    onFilesChange,
    onUploadComplete,
    onUploadError,
  });

  const themeClass = `uploader-theme-${themeVariant}`;

  // ── Dashboard mode ───────────────────────────────────────────────────────
  if (displayMode === "dashboard") {
    return (
      <div className={cn(themeClass, className)}>
        <Dashboard
          uppy={uppy}
          width="100%"
          height={height}
          note={resolvedNote}
          proudlyDisplayPoweredByUppy={false}
          hideProgressDetails={false}
          showSelectedFiles
          showRemoveButtonAfterComplete
          hidePauseResumeButton={transportMode === "mock"}
          doneButtonHandler={() => {
            uppy.clear();
          }}
        />
      </div>
    );
  }

  // ── Dropzone mode ────────────────────────────────────────────────────────
  if (displayMode === "dropzone") {
    return <DropzoneMode uppy={uppy} themeClass={themeClass} className={className} t={t} />;
  }

  // ── Compact mode ─────────────────────────────────────────────────────────
  return (
    <CompactMode
      uppy={uppy}
      themeClass={themeClass}
      className={className}
      t={t}
      resolved={resolved}
    />
  );
}

// ── Dropzone sub-component ───────────────────────────────────────────────────

interface SubModeProps {
  uppy: ReturnType<typeof useUppyInstance>;
  themeClass: string;
  className?: string;
  t: (_key: string) => string;
  resolved?: ReturnType<typeof resolvePresetConfig>;
}

function DropzoneMode({ uppy, themeClass, className, t }: SubModeProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [files, setFiles] = React.useState<Array<{ id: string; name: string; size: number }>>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleFilesAdded = () => {
      const uppyFiles = Object.values(uppy.getState().files);
      setFiles(uppyFiles.map((f) => ({ id: f.id, name: f.name, size: f.size ?? 0 })));
    };
    const handleFileRemoved = () => {
      const uppyFiles = Object.values(uppy.getState().files);
      setFiles(uppyFiles.map((f) => ({ id: f.id, name: f.name, size: f.size ?? 0 })));
    };
    uppy.on("files-added", handleFilesAdded);
    uppy.on("file-removed", handleFileRemoved);
    return () => {
      uppy.off("files-added", handleFilesAdded);
      uppy.off("file-removed", handleFileRemoved);
    };
  }, [uppy]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      try {
        uppy.addFile({ name: file.name, type: file.type, data: file, source: "dropzone" });
      } catch {
        // Uppy restriction errors are shown via the error event handler in the hook
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    for (const file of selectedFiles) {
      try {
        uppy.addFile({ name: file.name, type: file.type, data: file, source: "dropzone" });
      } catch {
        // Uppy restriction errors are shown via the error event handler in the hook
      }
    }
    e.target.value = "";
  };

  return (
    <div className={cn(themeClass, "space-y-2", className)}>
      <div
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all",
          "hover:border-primary hover:bg-primary/5",
          isDragging && "border-primary bg-primary/10 scale-[1.01]"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onPaste={(e) => {
          const pastedFiles = Array.from(e.clipboardData.files);
          for (const file of pastedFiles) {
            try {
              uppy.addFile({ name: file.name, type: file.type, data: file, source: "paste" });
            } catch {
              // Ignore
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}>
        <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("compShared.dropFilesOrBrowsefiles").replace(
            "%{browseFiles}",
            t("compShared.selectFile")
          )}
        </p>
        <p className="mt-1 text-xs text-slate-500">{t("compShared.supportsPhotosAndPdfsYou")}</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileInput} />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate text-sm">{file.name}</span>
                <span className="shrink-0 text-xs text-slate-400">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                type="button"
                className="ml-2 shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                onClick={() => uppy.removeFile(file.id)}
                aria-label={t("compShared.deleteFiles")}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Compact sub-component ────────────────────────────────────────────────────

function CompactMode({ uppy, themeClass, className, t, resolved }: SubModeProps) {
  const [files, setFiles] = React.useState<
    Array<{ id: string; name: string; size: number; type: string }>
  >([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isImageOnly =
    resolved?.acceptedFileTypes.length === 1 && resolved.acceptedFileTypes[0] === "image/*";

  React.useEffect(() => {
    const syncFiles = () => {
      const uppyFiles = Object.values(uppy.getState().files);
      setFiles(
        uppyFiles.map((f) => ({ id: f.id, name: f.name, size: f.size ?? 0, type: f.type ?? "" }))
      );
    };
    uppy.on("files-added", syncFiles);
    uppy.on("file-removed", syncFiles);
    return () => {
      uppy.off("files-added", syncFiles);
      uppy.off("file-removed", syncFiles);
    };
  }, [uppy]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    for (const file of selectedFiles) {
      try {
        uppy.addFile({ name: file.name, type: file.type, data: file, source: "compact" });
      } catch {
        // Uppy restriction errors are shown via the error event handler in the hook
      }
    }
    e.target.value = "";
  };

  return (
    <div className={cn(themeClass, "space-y-2", className)}>
      <button
        type="button"
        className="hover:border-primary hover:text-primary inline-flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors dark:text-slate-400"
        onClick={() => inputRef.current?.click()}
        onPaste={(e) => {
          const pastedFiles = Array.from(e.clipboardData.files);
          for (const file of pastedFiles) {
            try {
              uppy.addFile({ name: file.name, type: file.type, data: file, source: "paste" });
            } catch {
              // Ignore
            }
          }
        }}>
        {isImageOnly ? <ImageIcon className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
        {t("compShared.selectFile")}
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileInput} />
      </button>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 dark:text-slate-300">
              <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-slate-400">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                onClick={() => uppy.removeFile(file.id)}
                aria-label={t("compShared.deleteFiles")}>
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
