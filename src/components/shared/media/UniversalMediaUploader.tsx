import Uppy, { type UploadResult, type UppyFile } from "@uppy/core";
import ImageEditor from "@uppy/image-editor";
import Dashboard from "@uppy/react/dashboard";
import XHRUpload from "@uppy/xhr-upload";
import { useEffect, useId, useMemo } from "react";
import { toast } from "sonner";

import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import "@uppy/image-editor/css/style.min.css";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";

import type { UploadTransportMode, UploadedMediaFile } from "./types";

type UploadMeta = Record<string, never>;
type UploadBody = Record<string, unknown>;

export interface UniversalMediaUploaderProps {
  id?: string;
  title?: string;
  description?: string;
  transportMode?: UploadTransportMode;
  endpoint?: string;
  headers?: Record<string, string>;
  multipartFieldName?: string;
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
  maxNumberOfFiles?: number;
  autoProceed?: boolean;
  sequentialUpload?: boolean;
  bundleUpload?: boolean;
  height?: number;
  note?: string;
  onFilesChange?: (_files: File[]) => void;
  onUploadComplete?: (_files: UploadedMediaFile[]) => void;
  onUploadError?: (_message: string) => void;
}

const UPLOADER_STRINGS = {
  closeModal: "Đóng cửa sổ tải tệp",
  addMoreFiles: "Thêm tệp",
  addingMoreFiles: "Đang thêm tệp",
  dashboardWindowTitle: "Bảng tải tệp",
  dashboardTitle: "Bảng tải tệp",
  copyLinkToClipboardSuccess: "Đã sao chép liên kết",
  copyLinkToClipboardFallback: "Sao chép liên kết bên dưới",
  copyLink: "Sao chép liên kết",
  back: "Quay lại",
  removeFile: "Xóa tệp",
  editFile: "Chỉnh sửa tệp",
  saveChanges: "Lưu thay đổi",
  myDevice: "Thiết bị của tôi",
  dropHint: "Thả tệp vào đây",
  uploadComplete: "Tải lên hoàn tất",
  uploadPaused: "Đã tạm dừng",
  resumeUpload: "Tiếp tục",
  pauseUpload: "Tạm dừng",
  retryUpload: "Thử lại",
  cancelUpload: "Hủy tải lên",
  xFilesSelected: {
    0: "%{smart_count} tệp đã chọn",
    1: "%{smart_count} tệp đã chọn",
  },
  uploadingXFiles: {
    0: "Đang tải %{smart_count} tệp",
    1: "Đang tải %{smart_count} tệp",
  },
  processingXFiles: {
    0: "Đang xử lý %{smart_count} tệp",
    1: "Đang xử lý %{smart_count} tệp",
  },
  addMore: "Thêm",
  save: "Lưu",
  cancel: "Hủy",
  dropPasteFiles: "Thả tệp hoặc %{browseFiles}",
  dropPasteBoth: "Thả tệp hoặc %{browseFiles}",
  browseFiles: "chọn tệp",
  browseFolders: "chọn thư mục",
  done: "Hoàn tất",
} as const;

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
  if (!initialFile) {
    return;
  }

  const totalBytes = initialFile.size && initialFile.size > 0 ? initialFile.size : 1;

  for (let step = 1; step <= 8; step += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, delayPerStepMs);
    });

    const currentFile = uppy.getFile(fileId);
    if (!currentFile) {
      return;
    }

    const bytesUploaded = Math.round((totalBytes * step) / 8);
    uppy.emit(
      "upload-progress",
      currentFile as never,
      {
        uploader: "mock-uploader",
        bytesUploaded,
        bytesTotal: totalBytes,
      } as never
    );
  }

  const finishedFile = uppy.getFile(fileId);
  if (!finishedFile) {
    return;
  }

  uppy.emit(
    "upload-success",
    finishedFile as never,
    {
      status: 200,
      body: {
        mock: true,
      },
      uploadURL: `mock://${encodeURIComponent(finishedFile.name)}`,
    } as never
  );
}

export function UniversalMediaUploader({
  id,
  title = "Tải ảnh và tài liệu",
  description = "Kéo thả, copy-paste hoặc chọn nhiều tệp để tải lên theo đợt.",
  transportMode = "mock",
  endpoint,
  headers,
  multipartFieldName = "file",
  acceptedFileTypes = ["image/*", ".pdf", "application/pdf"],
  maxFileSizeMB = 25,
  maxNumberOfFiles = 20,
  autoProceed = false,
  sequentialUpload = true,
  bundleUpload = false,
  height = 460,
  note = "Hỗ trợ ảnh và PDF. Có thể kéo thả, copy-paste và tải nhiều đợt.",
  onFilesChange,
  onUploadComplete,
  onUploadError,
}: UniversalMediaUploaderProps) {
  const token = useAuthStore((state) => state.token);
  const reactId = useId();
  const uploaderId = id ?? `universal-media-uploader-${reactId.replace(/:/g, "")}`;

  const uppy = useMemo(() => {
    const uploader = new Uppy<UploadMeta, UploadBody>({
      id: uploaderId,
      autoProceed,
      allowMultipleUploadBatches: true,
      restrictions: {
        maxFileSize: maxFileSizeMB * 1024 * 1024,
        maxNumberOfFiles,
        allowedFileTypes: acceptedFileTypes,
      },
      locale: {
        strings: UPLOADER_STRINGS,
      } as never,
    });

    uploader.use(ImageEditor, {
      quality: 0.92,
      cropperOptions: {
        viewMode: 1,
        background: false,
        autoCropArea: 1,
      },
    });

    if (transportMode === "xhr" && endpoint) {
      const requestHeaders: Record<string, string> = {
        ...(headers ?? {}),
      };

      const normalizedToken = token?.replace(/^Bearer\s+/i, "").trim();
      if (normalizedToken) {
        requestHeaders.Authorization = `Bearer ${normalizedToken}`;
      }

      uploader.use(XHRUpload, {
        endpoint,
        method: "POST",
        formData: true,
        fieldName: multipartFieldName,
        bundle: bundleUpload,
        limit: sequentialUpload ? 1 : 5,
        headers: requestHeaders,
      });
    } else {
      uploader.addUploader(async (fileIds) => {
        if (sequentialUpload) {
          for (const fileId of fileIds) {
            await runMockSingleUpload(uploader, fileId, 220);
          }
          return;
        }

        await Promise.all(fileIds.map((fileId) => runMockSingleUpload(uploader, fileId, 220)));
      });
    }

    return uploader;
  }, [
    acceptedFileTypes,
    autoProceed,
    bundleUpload,
    endpoint,
    headers,
    maxFileSizeMB,
    maxNumberOfFiles,
    multipartFieldName,
    sequentialUpload,
    token,
    transportMode,
    uploaderId,
  ]);

  useEffect(() => {
    return () => {
      uppy.cancelAll();
      uppy.destroy();
    };
  }, [uppy]);

  useEffect(() => {
    const handleFilesAdded = (files: UppyFile<UploadMeta, UploadBody>[]) => {
      if (!onFilesChange) {
        return;
      }

      const selectedFiles = files
        .map((item) => item.data)
        .filter((item): item is File => item instanceof File);

      onFilesChange(selectedFiles);
    };

    const handleComplete = (result: UploadResult<UploadMeta, UploadBody>) => {
      if (transportMode === "mock") {
        toast.success("Đã mô phỏng tải tệp thành công.");
      }

      onUploadComplete?.((result.successful ?? []).map(mapUploadedFile));
    };

    const handleError = (error: Error) => {
      const message = error.message || "Không thể tải tệp. Vui lòng thử lại.";
      toast.error(message);
      onUploadError?.(message);
    };

    uppy.on("files-added", handleFilesAdded);
    uppy.on("complete", handleComplete);
    uppy.on("error", handleError);

    return () => {
      uppy.off("files-added", handleFilesAdded);
      uppy.off("complete", handleComplete);
      uppy.off("error", handleError);
    };
  }, [onFilesChange, onUploadComplete, onUploadError, transportMode, uppy]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Dashboard
          uppy={uppy}
          width="100%"
          height={height}
          note={note}
          proudlyDisplayPoweredByUppy={false}
          hideProgressDetails={false}
          showSelectedFiles
          showRemoveButtonAfterComplete
          hidePauseResumeButton={transportMode === "mock"}
          doneButtonHandler={() => {
            uppy.clear();
          }}
        />
      </CardContent>
    </Card>
  );
}
