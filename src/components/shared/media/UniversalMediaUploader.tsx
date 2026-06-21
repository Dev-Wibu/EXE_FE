import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/themeStore";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import "@uppy/image-editor/css/style.min.css";
import Dashboard from "@uppy/react/dashboard";
import DashboardModal from "@uppy/react/dashboard-modal";
import "@uppy/screen-capture/css/style.min.css";
import "@uppy/webcam/css/style.min.css";
import { FileText, Upload, X, ZoomIn } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { MediaLightboxDialog } from "./MediaLightboxDialog";
import type {
  InitialFileItem,
  UploaderDisplayMode,
  UploaderPreset,
  UploaderThemeVariant,
} from "./types";
import { resolvePresetConfig } from "./uploader-presets";
import "./uploader-themes.css";
import { useUppyInstance } from "./useUppyInstance";

const PdfIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 384 512"
    xmlns="http://www.w3.org/2000/svg">
    <path d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM261.6 293c-23.4 3.7-46 12.6-67 25 18 20.4 44 26.5 59.8 26.5 24.7 0 24.5-12.4 24.5-14.7 0-9.6-9.1-13.4-17.3-36.8zm116.2-70.3H264.4c-6.6 0-12-5.4-12-12V97.3C252.4 43.6 208.8 0 155.1 0H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V222.7zM257 362.4c-19.6 0-41.6-6-63.5-24-21 10.9-42.3 19.3-63.1 24.6-21.3 23.3-43.5 39.1-57.5 39.1-12.4 0-17.4-8.8-17.4-19.1 0-14.7 13.5-29.2 38.6-43.3 11.2-6.3 25-10.8 38.9-13.5 12.1-23.5 22.3-51.4 28.5-74-7.4-23.3-13.5-51.3-8.8-70.2 4-16.1 19.3-20.9 30-20.9 9.9 0 17.5 4.3 17.5 18.1 0 23.3-15.6 50.8-21.6 69.8 9.5 17.7 21.7 32.2 35.1 42.1 23.3-5.2 45-8.4 59.2-8.4 12.1 0 20.9 3 25.4 8.7 3.6 4.6 5.4 11.1 5.4 18 0 17.1-14.6 34.6-46.7 34.6zM264.4 95.3h101.3v3.4H264.4z"></path>
  </svg>
);

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

  // ── Plugin toggles (override preset defaults when provided)
  enableImageEditor?: boolean;
  enableWebcam?: boolean;
  enableScreenCapture?: boolean;

  // ── Theme
  themeVariant?: UploaderThemeVariant;

  // ── Data
  initialFiles?: InitialFileItem[];

  // ── Callbacks
  onFilesChange?: (_files: File[]) => void;
}

/**
 * UniversalMediaUploader — the project's single entry-point for all file uploads.
 *
 * Two display modes:
 *  - "dashboard" — Full Uppy Dashboard (drag-drop, paste, progress, editor tabs)
 *  - "modal"     — Dashboard inside a modal overlay (triggered by a button)
 *
 * Use presets for common use-cases instead of wiring every restriction prop:
 *  preset="single-image" | "multi-image" | "single-pdf" | "multi-pdf" | "mixed"
 *
 * The component does NOT wrap itself in a <Card>; the caller decides the container.
 */
export function UniversalMediaUploader({
  id,
  className,
  displayMode = "modal",
  height = 460,
  note,
  preset,
  acceptedFileTypes: acceptedFileTypesProp,
  maxFileSizeMB: maxFileSizeMBProp,
  maxNumberOfFiles: maxNumberOfFilesProp,
  enableImageEditor: enableImageEditorProp,
  enableWebcam = false,
  enableScreenCapture = false,
  themeVariant = "default",
  initialFiles,
  onFilesChange,
}: UniversalMediaUploaderProps) {
  const { t } = useTranslation();

  // Resolve preset → merge with any explicit prop overrides
  const resolved = resolvePresetConfig(preset, {
    acceptedFileTypes: acceptedFileTypesProp,
    maxNumberOfFiles: maxNumberOfFilesProp,
    enableImageEditor: enableImageEditorProp,
  });

  const maxFileSizeMB = maxFileSizeMBProp ?? 10;
  const resolvedNote = note ?? t(resolved.noteKey);

  const uppy = useUppyInstance({
    id,
    acceptedFileTypes: resolved.acceptedFileTypes,
    maxFileSizeMB,
    maxNumberOfFiles: resolved.maxNumberOfFiles,
    enableImageEditor: resolved.enableImageEditor,
    enableWebcam,
    enableScreenCapture,
    initialFiles,
    onFilesChange,
  });

  const allowsVideo = resolved.acceptedFileTypes.some(
    (type) => type.startsWith("video/") || type === "*/*"
  );

  const themeClass = cn(
    `uploader-theme-${themeVariant}`,
    !allowsVideo && "hide-screen-capture-video"
  );

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
          hideProgressDetails={true}
          showSelectedFiles
          showRemoveButtonAfterComplete
          hidePauseResumeButton={true}
          hideUploadButton={true}
          doneButtonHandler={() => {
            uppy.clear();
          }}
        />
      </div>
    );
  }

  // ── Modal mode (Default) ─────────────────────────────────────────────────
  return (
    <ModalMode
      uppy={uppy}
      themeClass={themeClass}
      className={className}
      t={t}
      resolved={resolved}
    />
  );
}

// ── Modal sub-component ──────────────────────────────────────────────────────

interface SubModeProps {
  uppy: ReturnType<typeof useUppyInstance>;
  themeClass: string;
  className?: string;
  t: (_key: string) => string;
  resolved?: ReturnType<typeof resolvePresetConfig>;
}

function ModalMode({ uppy, themeClass, className, t }: SubModeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(-1);
  const [isDragging, setIsDragging] = React.useState(false);
  const [files, setFiles] = React.useState<
    Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      previewUrl?: string;
      data?: File;
    }>
  >([]);

  React.useEffect(() => {
    const syncFiles = () => {
      const uppyFiles = Object.values(uppy.getState().files);
      setFiles(
        uppyFiles.map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size ?? 0,
          type: f.type ?? "",
          previewUrl: f.preview,
          data: f.data instanceof File ? f.data : undefined,
        }))
      );
    };
    uppy.on("files-added", syncFiles);
    uppy.on("file-removed", syncFiles);
    uppy.on("thumbnail:generated", syncFiles);
    return () => {
      uppy.off("files-added", syncFiles);
      uppy.off("file-removed", syncFiles);
      uppy.off("thumbnail:generated", syncFiles);
    };
  }, [uppy]);

  const { theme: appTheme } = useThemeStore();
  const uppyTheme = appTheme === "system" ? "auto" : appTheme;

  React.useEffect(() => {
    if (isOpen && themeClass) {
      const classes = themeClass.split(" ").filter(Boolean);
      document.body.classList.add(...classes);
      return () => {
        document.body.classList.remove(...classes);
      };
    }
  }, [isOpen, themeClass]);

  // Handle native drag & drop to add files directly
  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        droppedFiles.forEach((file) => {
          try {
            uppy.addFile({
              name: file.name,
              type: file.type,
              data: file,
              source: "Local",
              isRemote: false,
            });
          } catch {
            // Silently ignore duplicates
          }
        });
      }
    },
    [uppy]
  );

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent) => {
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        const pastedFiles = Array.from(e.clipboardData.files);
        pastedFiles.forEach((file) => {
          try {
            uppy.addFile({
              name: file.name,
              type: file.type,
              data: file,
              source: "Local",
              isRemote: false,
            });
          } catch {
            // Silently ignore duplicates
          }
        });
      }
    },
    [uppy]
  );

  // Map Uppy files → MediaViewerItem[] for the Lightbox
  const lightboxItems = files.map((f) => ({
    id: f.id,
    name: f.name,
    file: f.data,
    mimeType: f.type,
    requireAuth: false,
  }));

  const isPdf = (type: string) => type === "application/pdf" || type === "application/x-pdf";

  const modalContent = (
    <DashboardModal
      uppy={uppy}
      open={isOpen}
      theme={uppyTheme}
      onRequestClose={() => setIsOpen(false)}
      closeModalOnClickOutside
      browserBackButtonClose={true}
      disablePageScrollWhenModalOpen={true}
      proudlyDisplayPoweredByUppy={false}
      hideProgressDetails={true}
      showSelectedFiles
      showRemoveButtonAfterComplete
      hidePauseResumeButton={true}
      hideUploadButton={true}
      doneButtonHandler={() => setIsOpen(false)}
    />
  );

  return (
    <div
      className={cn(themeClass, className)}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}>
      {/* 
        Render DashboardModal into a Portal attached directly to document.body.
        This isolates the `position: fixed` element from any parent components (like <Card>)
        that use `backdrop-blur` or `transform` which create new containing blocks.
      */}
      {typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent}

      {/* Lightbox for full-size preview */}
      {lightboxItems.length > 0 && lightboxIndex >= 0 && (
        <MediaLightboxDialog
          open={lightboxIndex >= 0}
          onOpenChange={(open) => {
            if (!open) setLightboxIndex(-1);
          }}
          items={lightboxItems}
          initialIndex={lightboxIndex}
        />
      )}

      {files.length === 0 ? (
        /* ── Empty state trigger ───────────────────────────────────────── */
        <div
          className={cn(
            "group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]",
            isDragging
              ? "scale-[1.02] border-[#0047AB] bg-[#0047AB]/5 dark:border-[#66B2FF] dark:bg-[#66B2FF]/10"
              : "border-slate-300 bg-white/80 hover:border-[#0047AB]/60 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-[#66B2FF]/70 dark:hover:bg-slate-900"
          )}
          onClick={() => setIsOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsOpen(true);
          }}>
          <Upload className="mb-2 h-6 w-6 text-slate-400 group-hover:text-[#0047AB] dark:group-hover:text-[#66B2FF]" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("compShared.clickToOpenUploader")}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t("compShared.supportsAdvancedFeatures")}</p>
        </div>
      ) : (
        /* ── File list ─────────────────────────────────────────────────── */
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-xs dark:border-slate-700 dark:bg-slate-950">
                {/* Thumbnail with zoom overlay */}
                <button
                  type="button"
                  className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={t("compShared.viewMedia") + " " + file.name}>
                  {file.previewUrl ? (
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                    />
                  ) : isPdf(file.type) ? (
                    <div className="flex h-full w-full items-center justify-center bg-red-50 dark:bg-red-950/30">
                      <PdfIcon className="h-6 w-6 text-red-500" />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  {/* Zoom-in overlay on hover */}
                  {(file.previewUrl || isPdf(file.type)) && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    uppy.removeFile(file.id);
                  }}
                  aria-label={t("compShared.deleteFiles")}>
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          {/* Edit / change button */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={() => setIsOpen(true)}>
            <Upload className="h-4 w-4" />
            {t("compShared.editOrChangeFiles")}
          </button>
        </div>
      )}
    </div>
  );
}
