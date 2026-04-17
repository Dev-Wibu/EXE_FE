import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileWarning,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Button } from "@/components/ui/button";
import { SpinnerInline } from "@/components/ui/spinner";
import {
  downloadFromUrl,
  openUrlInNewTab,
  resolveSourceToBlobUrl,
  revokeObjectUrlSafe,
} from "@/lib/media-file-utils";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PdfPreviewViewerProps {
  source: string | Blob | File | null;
  fileName?: string;
  requireAuth?: boolean;
  className?: string;
  showToolbar?: boolean;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 3;
const SCALE_STEP = 0.2;

export function PdfPreviewViewer({
  source,
  fileName,
  requireAuth = true,
  className,
  showToolbar = true,
}: PdfPreviewViewerProps) {
  const token = useAuthStore((state) => state.token);

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolvedSourceKey, setResolvedSourceKey] = useState<string | null>(null);
  const [resolvedFileName, setResolvedFileName] = useState(fileName ?? "tai-lieu.pdf");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const sourceKey = useMemo(() => {
    if (!source) {
      return null;
    }

    if (typeof source === "string") {
      const authKey = requireAuth ? (token ?? "no-token") : "no-auth";
      return `url:${source}|auth:${authKey}|name:${fileName ?? ""}`;
    }

    if (source instanceof File) {
      return `file:${source.name}:${source.size}:${source.lastModified}|name:${fileName ?? ""}`;
    }

    return `blob:${source.size}:${source.type}|name:${fileName ?? ""}`;
  }, [fileName, requireAuth, source, token]);

  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();

    if (!source || !sourceKey) {
      return () => {
        abortController.abort();
      };
    }

    resolveSourceToBlobUrl(source, {
      token,
      requireAuth,
      signal: abortController.signal,
      fallbackFileName: fileName,
    })
      .then((resolvedSource) => {
        if (isCancelled) {
          revokeObjectUrlSafe(resolvedSource.objectUrl);
          return;
        }

        setResolvedUrl((previous) => {
          revokeObjectUrlSafe(previous);
          return resolvedSource.objectUrl;
        });
        setResolvedSourceKey(sourceKey);
        setResolvedFileName(resolvedSource.fileName);
        setErrorMessage(null);
        setTotalPages(0);
        setCurrentPage(1);
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Không thể mở tệp PDF.";
        setErrorMessage(message);
        setResolvedSourceKey(sourceKey);
        setResolvedUrl((previous) => {
          revokeObjectUrlSafe(previous);
          return null;
        });
        setTotalPages(0);
        setCurrentPage(1);
      });

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [fileName, requireAuth, source, sourceKey, token]);

  useEffect(() => {
    return () => {
      revokeObjectUrlSafe(resolvedUrl);
    };
  }, [resolvedUrl]);

  const effectiveResolvedUrl = sourceKey && resolvedSourceKey === sourceKey ? resolvedUrl : null;
  const effectiveErrorMessage = sourceKey && resolvedSourceKey === sourceKey ? errorMessage : null;
  const isResolving = Boolean(sourceKey) && resolvedSourceKey !== sourceKey;

  const canGoPrevious = currentPage > 1;
  const canGoNext = totalPages > 0 && currentPage < totalPages;

  const pageStatusLabel = useMemo(() => {
    if (!totalPages) {
      return "Trang -- / --";
    }

    return `Trang ${currentPage} / ${totalPages}`;
  }, [currentPage, totalPages]);

  const handleZoomIn = () => {
    setScale((currentScale) => Math.min(MAX_SCALE, +(currentScale + SCALE_STEP).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale((currentScale) => Math.max(MIN_SCALE, +(currentScale - SCALE_STEP).toFixed(2)));
  };

  const handleOpenInNewTab = () => {
    if (!effectiveResolvedUrl) {
      return;
    }

    openUrlInNewTab(effectiveResolvedUrl);
  };

  const handleDownload = () => {
    if (!effectiveResolvedUrl) {
      return;
    }

    downloadFromUrl(effectiveResolvedUrl, resolvedFileName);
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-white", className)}>
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={!canGoPrevious}
              aria-label="Trang trước">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={!canGoNext}
              aria-label="Trang sau">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {pageStatusLabel}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              aria-label="Thu nhỏ PDF">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-16 text-center text-sm font-medium text-slate-700 dark:text-slate-200">
              {Math.round(scale * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              aria-label="Phóng to PDF">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setRotation((currentRotation) => (currentRotation + 90) % 360)}
              aria-label="Xoay PDF">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleOpenInNewTab}
              disabled={!effectiveResolvedUrl}
              aria-label="Mở PDF ở tab mới">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={!effectiveResolvedUrl}
              aria-label="Tải PDF xuống">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="max-h-[72vh] overflow-auto bg-slate-100 p-3 dark:bg-slate-950">
        {isResolving ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <SpinnerInline label="Đang tải tài liệu PDF..." />
          </div>
        ) : effectiveErrorMessage ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 text-center">
            <FileWarning className="h-7 w-7 text-rose-500" />
            <p className="max-w-lg text-sm text-rose-600 dark:text-rose-400">
              {effectiveErrorMessage}
            </p>
          </div>
        ) : effectiveResolvedUrl ? (
          <div className="flex justify-center">
            <Document
              file={effectiveResolvedUrl}
              loading={<SpinnerInline label="Đang mở PDF..." />}
              onLoadSuccess={(documentProxy) => {
                setTotalPages(documentProxy.numPages);
                setCurrentPage(1);
              }}
              onLoadError={(error) => {
                setErrorMessage(error.message || "Không thể hiển thị tệp PDF.");
              }}>
              <Page
                pageNumber={currentPage}
                scale={scale}
                rotate={rotation}
                renderAnnotationLayer
                renderTextLayer
              />
            </Document>
          </div>
        ) : (
          <div className="flex min-h-[280px] items-center justify-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có tệp PDF để xem.</p>
          </div>
        )}
      </div>
    </div>
  );
}
