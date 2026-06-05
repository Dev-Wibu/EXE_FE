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
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
export interface PdfPreviewViewerProps {
  source: string | Blob | File | null;
  fileName?: string;
  requireAuth?: boolean;
  className?: string;
  showToolbar?: boolean;
  fitContainer?: boolean;
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
  fitContainer = false,
}: PdfPreviewViewerProps) {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolvedSourceKey, setResolvedSourceKey] = useState<string | null>(null);
  const [resolvedFileName, setResolvedFileName] = useState(
    fileName ?? t("mediaFileUtils.documentPdf")
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const latestResolvedUrlRef = useRef<string | null>(null);
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
      revokeObjectUrlSafe(latestResolvedUrlRef.current);
      latestResolvedUrlRef.current = null;
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
        setScale(1);
        setRotation(0);
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message = error instanceof Error ? error.message : t("compShared.cannotOpenPdfFile");
        setErrorMessage(message);
        setResolvedSourceKey(sourceKey);
        setResolvedUrl((previous) => {
          revokeObjectUrlSafe(previous);
          return null;
        });
        setTotalPages(0);
        setCurrentPage(1);
        setScale(1);
        setRotation(0);
      });
    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [fileName, requireAuth, source, sourceKey, token, t]);
  useEffect(() => {
    latestResolvedUrlRef.current = resolvedUrl;
  }, [resolvedUrl]);
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
      return t("mediaFileUtils.pageStatus", { page: "--", total: "--" });
    }
    return t("mediaFileUtils.pageStatus", { page: currentPage, total: totalPages });
  }, [currentPage, totalPages, t]);
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
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white",
        fitContainer && "flex h-full min-h-0 flex-col",
        className
      )}>
      {showToolbar && (
        <div className="shrink-0 border-b bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={!canGoPrevious}
                aria-label={t("compShared.previousPage")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={!canGoNext}
                aria-label={t("compShared.nextPageTitle")}>
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
                aria-label={t("compShared.shrinkPdf")}>
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
                aria-label={t("compShared.enlargePdf")}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setRotation((currentRotation) => (currentRotation + 90) % 360)}
                aria-label={t("compShared.rotatePdf")}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleOpenInNewTab}
                disabled={!effectiveResolvedUrl}
                aria-label={t("compShared.openThePdfInA")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                disabled={!effectiveResolvedUrl}
                aria-label={t("compShared.downloadPdf")}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "overflow-auto bg-slate-100 p-3 dark:bg-slate-950",
          fitContainer ? "min-h-0 flex-1" : "max-h-[72vh]"
        )}>
        {isResolving ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <SpinnerInline label={t("compShared.loadingPdfDocument")} />
          </div>
        ) : effectiveErrorMessage ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 text-center">
            <FileWarning className="h-7 w-7 text-rose-500" />
            <p className="max-w-lg text-sm text-rose-600 dark:text-rose-400">
              {effectiveErrorMessage}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenInNewTab}
                disabled={!effectiveResolvedUrl}>
                {t("compShared.openInNewTab")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                disabled={!effectiveResolvedUrl}>
                {t("compShared.download")}
              </Button>
            </div>
          </div>
        ) : effectiveResolvedUrl ? (
          <div className="flex min-h-full justify-center">
            <Document
              file={effectiveResolvedUrl}
              loading={<SpinnerInline label={t("compShared.openingPdf")} />}
              onLoadSuccess={(documentProxy) => {
                setTotalPages(documentProxy.numPages);
                setCurrentPage(1);
              }}
              onLoadError={(error) => {
                setErrorMessage(error.message || t("compShared.cannotDisplayPdfFile"));
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
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("compShared.thereAreNoPdfFiles")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
