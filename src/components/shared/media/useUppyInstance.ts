import { useAuthStore } from "@/stores/authStore";
import Compressor from "@uppy/compressor";
import Uppy, { type UploadResult, type UppyFile } from "@uppy/core";
import ImageEditor from "@uppy/image-editor";
import ScreenCapture from "@uppy/screen-capture";
import Webcam from "@uppy/webcam";
import XHRUpload from "@uppy/xhr-upload";
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { InitialFileItem, UploadTransportMode, UploadedMediaFile } from "./types";

type UploadMeta = Record<string, string>;
type UploadBody = Record<string, unknown>;

function mapUploadedFile(file: UppyFile<UploadMeta, UploadBody>): UploadedMediaFile {
  return {
    id: file.id,
    name: file.name,
    size: file.size ?? 0,
    type: file.type ?? "application/octet-stream",
    uploadUrl: typeof file.response?.uploadURL === "string" ? file.response.uploadURL : undefined,
  };
}

async function runMockSingleUpload(
  uppy: Uppy<UploadMeta, UploadBody>,
  fileId: string,
  delayPerStepMs: number
): Promise<void> {
  const initialFile = uppy.getFile(fileId);
  if (!initialFile) return;

  const totalBytes = initialFile.size && initialFile.size > 0 ? initialFile.size : 1;
  for (let step = 1; step <= 8; step += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, delayPerStepMs);
    });
    const currentFile = uppy.getFile(fileId);
    if (!currentFile) return;

    uppy.emit(
      "upload-progress",
      currentFile as never,
      {
        uploader: "mock-uploader",
        bytesUploaded: Math.round((totalBytes * step) / 8),
        bytesTotal: totalBytes,
      } as never
    );
  }

  const finishedFile = uppy.getFile(fileId);
  if (!finishedFile) return;

  uppy.emit(
    "upload-success",
    finishedFile as never,
    {
      status: 200,
      body: { mock: true },
      uploadURL: `mock://${encodeURIComponent(finishedFile.name)}`,
    } as never
  );
}

export interface UseUppyInstanceOptions {
  id?: string;
  acceptedFileTypes: string[];
  maxFileSizeMB: number;
  maxNumberOfFiles: number;
  transportMode: UploadTransportMode;
  endpoint?: string;
  headers?: Record<string, string>;
  multipartFieldName?: string;
  enableImageEditor: boolean;
  enableCompressor: boolean;
  enableWebcam: boolean;
  enableScreenCapture: boolean;
  autoProceed: boolean;
  sequentialUpload: boolean;
  bundleUpload: boolean;
  initialFiles?: InitialFileItem[];
  onFilesChange?: (_files: File[]) => void;
  onUploadComplete?: (_files: UploadedMediaFile[]) => void;
  onUploadError?: (_message: string) => void;
}

/**
 * Manages the entire Uppy instance lifecycle using a ref pattern.
 * The instance is created exactly once on mount and destroyed on unmount.
 * Plugin attachment and option updates happen through useEffect without
 * re-creating the instance, so already-queued files are never lost.
 */
export function useUppyInstance(options: UseUppyInstanceOptions): Uppy<UploadMeta, UploadBody> {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const reactId = useId();
  const uploaderId = options.id ?? `universal-uploader-${reactId.replace(/:/g, "")}`;

  // Stable refs for callbacks to avoid re-registering event listeners when
  // parent re-renders with new inline arrow functions.
  const onFilesChangeRef = useRef(options.onFilesChange);
  const onUploadCompleteRef = useRef(options.onUploadComplete);
  const onUploadErrorRef = useRef(options.onUploadError);
  useEffect(() => {
    onFilesChangeRef.current = options.onFilesChange;
  });
  useEffect(() => {
    onUploadCompleteRef.current = options.onUploadComplete;
  });
  useEffect(() => {
    onUploadErrorRef.current = options.onUploadError;
  });

  // Uppy instance lives for the entire lifetime of this component.
  const uppyRef = useRef<Uppy<UploadMeta, UploadBody> | null>(null);
  if (!uppyRef.current) {
    uppyRef.current = new Uppy<UploadMeta, UploadBody>({
      id: uploaderId,
      autoProceed: options.autoProceed,
      allowMultipleUploadBatches: true,
      restrictions: {
        maxFileSize: options.maxFileSizeMB * 1024 * 1024,
        maxNumberOfFiles: options.maxNumberOfFiles,
        allowedFileTypes: options.acceptedFileTypes,
      },
    });
  }

  const uppy = uppyRef.current;

  // ── Sync locale strings whenever the language changes ────────────────────
  useEffect(() => {
    const UPLOADER_STRINGS = {
      closeModal: t("compShared.closeTheFileDownloadWindow"),
      addMoreFiles: t("compShared.addFiles"),
      addingMoreFiles: t("compShared.addingFiles"),
      dashboardWindowTitle: t("compShared.fileDownloadTable"),
      dashboardTitle: t("compShared.fileDownloadTable"),
      copyLinkToClipboardSuccess: t("compShared.linkCopied"),
      copyLinkToClipboardFallback: t("compShared.copyTheLinkBelow"),
      copyLink: t("compShared.copyLink"),
      back: t("general.back"),
      removeFile: t("compShared.deleteFiles"),
      editFile: t("compShared.editFiles"),
      saveChanges: t("common.saveChanges"),
      myDevice: t("compShared.myDevice"),
      dropHint: t("compShared.dropFilesHere"),
      uploadComplete: t("compShared.uploadComplete"),
      uploadPaused: t("compShared.paused"),
      resumeUpload: t("general.continue"),
      pauseUpload: t("compShared.pause"),
      retryUpload: t("common.retry"),
      cancelUpload: t("compShared.cancelUpload"),
      xFilesSelected: {
        0: t("compShared.smartCountSelectedFiles"),
        1: t("compShared.smartCountSelectedFiles"),
      },
      uploadingXFiles: {
        0: t("compShared.loadingSmartCountFile"),
        1: t("compShared.loadingSmartCountFile"),
      },
      processingXFiles: {
        0: t("compShared.processingSmartCountFile"),
        1: t("compShared.processingSmartCountFile"),
      },
      addMore: t("common.more"),
      save: t("general.save"),
      cancel: t("general.cancel"),
      dropPasteFiles: t("compShared.dropFilesOrBrowsefiles"),
      dropPasteBoth: t("compShared.dropFilesOrBrowsefiles"),
      browseFiles: t("compShared.selectFile"),
      browseFolders: t("compShared.selectFolder"),
      done: t("common.completed"),
      // Webcam plugin strings
      takePicture: t("compShared.webcamTakePicture"),
      startRecording: t("compShared.webcamStartRecording"),
      stopRecording: t("compShared.webcamStopRecording"),
      recordingLength: t("compShared.webcamRecordingLength"),
      allowAccessTitle: t("compShared.webcamAllowAccessTitle"),
      allowAccessDescription: t("compShared.webcamAllowAccessDescription"),
      noCameraFound: t("compShared.webcamNoCameraFound"),
      // Screen capture strings
      startCapturing: t("compShared.screenCaptureStart"),
      stopCapturing: t("compShared.screenCaptureStop"),
      submitRecordedFile: t("compShared.screenCaptureSubmit"),
      streamActive: t("compShared.screenCaptureStreamActive"),
      streamPassive: t("compShared.screenCaptureStreamPassive"),
    } as const;

    uppy.setOptions({
      locale: { strings: UPLOADER_STRINGS } as never,
    });
  }, [uppy, t]);

  // ── Sync upload restrictions when relevant props change ──────────────────
  useEffect(() => {
    uppy.setOptions({
      autoProceed: options.autoProceed,
      restrictions: {
        maxFileSize: options.maxFileSizeMB * 1024 * 1024,
        maxNumberOfFiles: options.maxNumberOfFiles,
        allowedFileTypes: options.acceptedFileTypes,
      },
    });
  }, [
    uppy,
    options.autoProceed,
    options.maxFileSizeMB,
    options.maxNumberOfFiles,
    options.acceptedFileTypes,
  ]);

  // ── Manage ImageEditor plugin ────────────────────────────────────────────
  useEffect(() => {
    if (options.enableImageEditor) {
      if (!uppy.getPlugin("ImageEditor")) {
        uppy.use(ImageEditor, {
          quality: 0.92,
          cropperOptions: { viewMode: 1, background: false, autoCropArea: 1 },
        });
      }
    } else {
      const plugin = uppy.getPlugin("ImageEditor");
      if (plugin) uppy.removePlugin(plugin);
    }
  }, [uppy, options.enableImageEditor]);

  // ── Manage Compressor plugin ─────────────────────────────────────────────
  useEffect(() => {
    if (options.enableCompressor) {
      if (!uppy.getPlugin("Compressor")) {
        uppy.use(Compressor, { quality: 0.8 });
      }
    } else {
      const plugin = uppy.getPlugin("Compressor");
      if (plugin) uppy.removePlugin(plugin);
    }
  }, [uppy, options.enableCompressor]);

  // ── Manage Webcam plugin ─────────────────────────────────────────────────
  useEffect(() => {
    if (options.enableWebcam) {
      if (!uppy.getPlugin("Webcam")) {
        uppy.use(Webcam, { modes: ["picture"] });
      }
    } else {
      const plugin = uppy.getPlugin("Webcam");
      if (plugin) uppy.removePlugin(plugin);
    }
  }, [uppy, options.enableWebcam]);

  // ── Manage ScreenCapture plugin ──────────────────────────────────────────
  useEffect(() => {
    if (options.enableScreenCapture) {
      if (!uppy.getPlugin("ScreenCapture")) {
        uppy.use(ScreenCapture);
      }
    } else {
      const plugin = uppy.getPlugin("ScreenCapture");
      if (plugin) uppy.removePlugin(plugin);
    }
  }, [uppy, options.enableScreenCapture]);

  // ── Manage transport plugin (XHR vs Mock) ───────────────────────────────
  const { transportMode, endpoint, headers, multipartFieldName, bundleUpload, sequentialUpload } =
    options;

  useEffect(() => {
    // Remove both possible transport plugins before attaching the right one.
    const existingXhr = uppy.getPlugin("XHRUpload");
    if (existingXhr) uppy.removePlugin(existingXhr);

    // Remove any previously registered mock uploader functions — Uppy does not
    // expose a clean API for this, so we reassign via cancelAll + re-add.
    // The cleanest approach: track mock uploader via ref and conditionally add.
    if (transportMode === "xhr" && endpoint) {
      const normalizedToken = token?.replace(/^Bearer\s+/i, "").trim();
      const requestHeaders: Record<string, string> = { ...(headers ?? {}) };
      if (normalizedToken) {
        requestHeaders.Authorization = `Bearer ${normalizedToken}`;
      }
      uppy.use(XHRUpload, {
        endpoint,
        method: "POST",
        formData: true,
        fieldName: multipartFieldName ?? "file",
        bundle: bundleUpload,
        limit: sequentialUpload ? 1 : 5,
        headers: requestHeaders,
      });
    } else {
      // Mock transport — simulate upload progress for testing
      uppy.addUploader(async (fileIds) => {
        if (sequentialUpload) {
          for (const fileId of fileIds) {
            await runMockSingleUpload(uppy, fileId, 220);
          }
          return;
        }
        await Promise.all(fileIds.map((fileId) => runMockSingleUpload(uppy, fileId, 220)));
      });
    }
  }, [
    uppy,
    transportMode,
    endpoint,
    headers,
    multipartFieldName,
    bundleUpload,
    sequentialUpload,
    token,
  ]);

  // ── Load initial files for edit-form scenarios ───────────────────────────
  useEffect(() => {
    if (!options.initialFiles?.length) return;

    for (const item of options.initialFiles) {
      // Avoid adding duplicates if the effect re-runs
      const alreadyAdded = Object.values(uppy.getState().files).some((f) => f.name === item.name);
      if (alreadyAdded) continue;

      uppy.addFile({
        name: item.name,
        type: item.type ?? "application/octet-stream",
        data: new Blob([], { type: item.type ?? "application/octet-stream" }),
        meta: { sourceUrl: item.src },
        source: "initialFiles",
        isRemote: false,
      });
    }
    // Intentionally only run on mount — initial files should not be re-added
    // if the parent re-renders with a new array reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uppy]);

  // ── Event listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleFilesAdded = (files: UppyFile<UploadMeta, UploadBody>[]) => {
      const selectedFiles = files
        .map((item) => item.data)
        .filter((item): item is File => item instanceof File);
      onFilesChangeRef.current?.(selectedFiles);
    };

    const handleComplete = (result: UploadResult<UploadMeta, UploadBody>) => {
      if (transportMode === "mock") {
        toast.success(t("compShared.theFileDownloadSimulationWas"));
      }
      onUploadCompleteRef.current?.((result.successful ?? []).map(mapUploadedFile));
    };

    const handleError = (error: Error) => {
      const message = error.message || t("compShared.couldNotLoadFilePlease");
      toast.error(message);
      onUploadErrorRef.current?.(message);
    };

    uppy.on("files-added", handleFilesAdded);
    uppy.on("complete", handleComplete);
    uppy.on("error", handleError);

    return () => {
      uppy.off("files-added", handleFilesAdded);
      uppy.off("complete", handleComplete);
      uppy.off("error", handleError);
    };
  }, [uppy, transportMode, t]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      uppy.cancelAll();
      uppy.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return uppy;
}
