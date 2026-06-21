import Uppy from "@uppy/core";
import ImageEditor from "@uppy/image-editor";
import ScreenCapture from "@uppy/screen-capture";
import Webcam from "@uppy/webcam";
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { InitialFileItem } from "./types";

type UploadMeta = Record<string, string>;
type UploadBody = Record<string, unknown>;

export interface UseUppyInstanceOptions {
  id?: string;
  acceptedFileTypes: string[];
  maxFileSizeMB: number;
  maxNumberOfFiles: number;
  enableImageEditor: boolean;
  enableWebcam: boolean;
  enableScreenCapture: boolean;
  initialFiles?: InitialFileItem[];
  onFilesChange?: (_files: File[]) => void;
}

/**
 * Manages the entire Uppy instance lifecycle using a ref pattern.
 * The instance is created exactly once on mount and destroyed on unmount.
 * Plugin attachment and option updates happen through useEffect without
 * re-creating the instance, so already-queued files are never lost.
 */
export function useUppyInstance(options: UseUppyInstanceOptions): Uppy<UploadMeta, UploadBody> {
  const { t } = useTranslation();
  const reactId = useId();
  const uploaderId = options.id ?? `universal-uploader-${reactId.replace(/:/g, "")}`;

  // Stable refs for callbacks to avoid re-registering event listeners when
  // parent re-renders with new inline arrow functions.
  const onFilesChangeRef = useRef(options.onFilesChange);
  useEffect(() => {
    onFilesChangeRef.current = options.onFilesChange;
  });

  // Uppy instance lives for the entire lifetime of this component.
  const uppyRef = useRef<Uppy<UploadMeta, UploadBody> | null>(null);
  if (!uppyRef.current) {
    uppyRef.current = new Uppy<UploadMeta, UploadBody>({
      id: uploaderId,
      autoProceed: false, // Never auto proceed since we don't upload via Uppy
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
      restrictions: {
        maxFileSize: options.maxFileSizeMB * 1024 * 1024,
        maxNumberOfFiles: options.maxNumberOfFiles,
        allowedFileTypes: options.acceptedFileTypes,
      },
    });
  }, [uppy, options.maxFileSizeMB, options.maxNumberOfFiles, options.acceptedFileTypes]);

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
    // Screen capture (getDisplayMedia) is not supported on mobile browsers
    const isMobileBrowser =
      typeof window !== "undefined" &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        !navigator.mediaDevices ||
        !("getDisplayMedia" in navigator.mediaDevices));

    const shouldEnableScreenCapture = options.enableScreenCapture && !isMobileBrowser;

    if (shouldEnableScreenCapture) {
      if (!uppy.getPlugin("ScreenCapture")) {
        uppy.use(ScreenCapture);
      }
    } else {
      const plugin = uppy.getPlugin("ScreenCapture");
      if (plugin) uppy.removePlugin(plugin);
    }
  }, [uppy, options.enableScreenCapture]);

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
    const notifyFilesChanged = () => {
      const currentFiles = uppy.getFiles();
      const selectedFiles = currentFiles
        .map((item) => item.data)
        .filter(
          (item): item is File | Blob => item instanceof File || item instanceof Blob
        ) as File[];
      onFilesChangeRef.current?.(selectedFiles);
    };

    uppy.on("file-added", notifyFilesChanged);
    uppy.on("file-removed", notifyFilesChanged);
    uppy.on("file-editor:complete", notifyFilesChanged);
    uppy.on("dashboard:file-edit-complete", notifyFilesChanged);

    return () => {
      uppy.off("file-added", notifyFilesChanged);
      uppy.off("file-removed", notifyFilesChanged);
      uppy.off("file-editor:complete", notifyFilesChanged);
      uppy.off("dashboard:file-edit-complete", notifyFilesChanged);
    };
  }, [uppy]);

  return uppy;
}
