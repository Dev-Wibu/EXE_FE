import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpinnerInline } from "@/components/ui/spinner";
import {
  buildExternalDocumentViewerUrl,
  canEmbedExternalDocument,
  downloadFromUrl,
  type ExternalDocumentViewerProvider,
  inferFileKind,
  openUrlInNewTab,
  revokeObjectUrlSafe,
} from "@/lib/media-file-utils";

import { PdfPreviewViewer } from "./PdfPreviewViewer";
import type { MediaViewerItem } from "./types";

export interface MediaLightboxDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  items: MediaViewerItem[];
  initialIndex?: number;
}

const MIN_IMAGE_SCALE = 0.5;
const MAX_IMAGE_SCALE = 3;
const IMAGE_SCALE_STEP = 0.25;

export function MediaLightboxDialog({
  open,
  onOpenChange,
  items,
  initialIndex = 0,
}: MediaLightboxDialogProps) {
  const { t } = useTranslation();
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [documentViewerProvider, setDocumentViewerProvider] =
    useState<ExternalDocumentViewerProvider>("office");
  const [imageTransform, setImageTransform] = useState<{
    index: number;
    scale: number;
    rotation: number;
  }>({
    index: -1,
    scale: 1,
    rotation: 0,
  });

  const boundedInitialIndex = useMemo(
    () => Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0)),
    [initialIndex, items.length]
  );

  const activeIndex = manualIndex ?? boundedInitialIndex;
  const currentItem = items[activeIndex];

  const currentKind = useMemo(() => {
    if (!currentItem) {
      return "other";
    }

    if (currentItem.kind) {
      return currentItem.kind;
    }

    return inferFileKind({
      fileName: currentItem.file?.name ?? currentItem.name ?? currentItem.src,
      mimeType: currentItem.file?.type ?? currentItem.mimeType,
    });
  }, [currentItem]);

  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const [documentObjectUrl, setDocumentObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !currentItem?.file || currentKind !== "image") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(currentItem.file);
    setImageObjectUrl(url);

    return () => {
      revokeObjectUrlSafe(url);
    };
  }, [currentItem, currentKind, open]);

  useEffect(() => {
    if (!open || currentKind !== "document" || !currentItem?.file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocumentObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(currentItem.file);
    setDocumentObjectUrl(url);

    return () => {
      revokeObjectUrlSafe(url);
    };
  }, [currentItem, currentKind, open]);

  const imageUrl =
    currentKind === "image"
      ? ((currentItem?.file ? imageObjectUrl : currentItem?.src) ?? null)
      : null;

  const documentUrl =
    currentKind === "document"
      ? ((currentItem?.file ? documentObjectUrl : currentItem?.src) ?? null)
      : null;

  const documentRequireAuth = currentItem?.requireAuth ?? true;
  const canEmbedDocument =
    currentKind === "document" &&
    canEmbedExternalDocument({
      sourceUrl: documentUrl,
      requireAuth: documentRequireAuth,
    });

  const documentViewerUrl =
    canEmbedDocument && documentUrl
      ? buildExternalDocumentViewerUrl(documentUrl, documentViewerProvider)
      : null;

  const imageScale = imageTransform.index === activeIndex ? imageTransform.scale : 1;
  const imageRotation = imageTransform.index === activeIndex ? imageTransform.rotation : 0;

  const canNavigate = items.length > 1;

  const goPrevious = useCallback(() => {
    if (!items.length) {
      return;
    }

    setManualIndex((index) => {
      const currentIndex = index ?? boundedInitialIndex;
      return (currentIndex - 1 + items.length) % items.length;
    });
  }, [boundedInitialIndex, items.length]);

  const goNext = useCallback(() => {
    if (!items.length) {
      return;
    }

    setManualIndex((index) => {
      const currentIndex = index ?? boundedInitialIndex;
      return (currentIndex + 1) % items.length;
    });
  }, [boundedInitialIndex, items.length]);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setManualIndex(null);
        setDocumentViewerProvider("office");
        setImageTransform({
          index: -1,
          scale: 1,
          rotation: 0,
        });
      }

      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && canNavigate) {
        event.preventDefault();
        goPrevious();
      }

      if (event.key === "ArrowRight" && canNavigate) {
        event.preventDefault();
        goNext();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handleDialogOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canNavigate, goNext, goPrevious, handleDialogOpenChange, open]);

  const currentPositionLabel = items.length > 0 ? `${activeIndex + 1}/${items.length}` : "0/0";

  const handleDownloadCurrentImage = () => {
    if (!imageUrl || !currentItem) {
      return;
    }

    downloadFromUrl(imageUrl, currentItem.name || t("common.imagePreview"));
  };

  const handleOpenCurrentImage = () => {
    if (!imageUrl) {
      return;
    }

    openUrlInNewTab(imageUrl);
  };

  const handleDownloadCurrentDocument = () => {
    if (!documentUrl || !currentItem) {
      return;
    }

    downloadFromUrl(documentUrl, currentItem.name || t("mediaFileUtils.document"));
  };

  const handleOpenCurrentDocument = () => {
    if (!documentUrl) {
      return;
    }

    openUrlInNewTab(documentUrl);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="flex h-[95vh] max-w-[96vw] flex-col gap-0 p-0"
        showCloseButton={false}>
        <DialogHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base">
                {currentItem?.name ?? t("compShared.viewMedia")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t("compShared.fullScreenViewerForPhotos")}
                {currentPositionLabel})
              </DialogDescription>
            </div>

            <div className="flex items-center gap-1">
              {currentKind === "image" && (
                <>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setImageTransform((previous) => {
                        const baseScale = previous.index === activeIndex ? previous.scale : 1;
                        const baseRotation = previous.index === activeIndex ? previous.rotation : 0;

                        return {
                          index: activeIndex,
                          scale: Math.max(
                            MIN_IMAGE_SCALE,
                            +(baseScale - IMAGE_SCALE_STEP).toFixed(2)
                          ),
                          rotation: baseRotation,
                        };
                      });
                    }}
                    disabled={!imageUrl}
                    aria-label={t("compShared.zoomOutThePhoto")}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setImageTransform((previous) => {
                        const baseScale = previous.index === activeIndex ? previous.scale : 1;
                        const baseRotation = previous.index === activeIndex ? previous.rotation : 0;

                        return {
                          index: activeIndex,
                          scale: Math.min(
                            MAX_IMAGE_SCALE,
                            +(baseScale + IMAGE_SCALE_STEP).toFixed(2)
                          ),
                          rotation: baseRotation,
                        };
                      });
                    }}
                    disabled={!imageUrl}
                    aria-label={t("compShared.enlargeThePhoto")}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setImageTransform((previous) => {
                        const baseScale = previous.index === activeIndex ? previous.scale : 1;
                        const baseRotation = previous.index === activeIndex ? previous.rotation : 0;

                        return {
                          index: activeIndex,
                          scale: baseScale,
                          rotation: baseRotation - 90,
                        };
                      });
                    }}
                    disabled={!imageUrl}
                    aria-label={t("compShared.rotatePhotoLeft")}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setImageTransform((previous) => {
                        const baseScale = previous.index === activeIndex ? previous.scale : 1;
                        const baseRotation = previous.index === activeIndex ? previous.rotation : 0;

                        return {
                          index: activeIndex,
                          scale: baseScale,
                          rotation: baseRotation + 90,
                        };
                      });
                    }}
                    disabled={!imageUrl}
                    aria-label={t("compShared.rotatePhotoRight")}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleOpenCurrentImage}
                    disabled={!imageUrl}
                    aria-label={t("compShared.openTheImageInA")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleDownloadCurrentImage}
                    disabled={!imageUrl}
                    aria-label={t("compShared.downloadPhotos")}>
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}

              {currentKind === "document" && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant={documentViewerProvider === "office" ? "default" : "ghost"}
                    onClick={() => setDocumentViewerProvider("office")}
                    disabled={!canEmbedDocument}
                    aria-label={t("compShared.viewDocumentsUsingOfficeViewer")}>
                    Office
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={documentViewerProvider === "google" ? "default" : "ghost"}
                    onClick={() => setDocumentViewerProvider("google")}
                    disabled={!canEmbedDocument}
                    aria-label={t("compShared.viewDocumentsUsingGoogleViewer")}>
                    Google
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleOpenCurrentDocument}
                    disabled={!documentUrl}
                    aria-label={t("compShared.openTheDocumentInA")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleDownloadCurrentDocument}
                    disabled={!documentUrl}
                    aria-label={t("compShared.downloadDocuments")}>
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={goPrevious}
                disabled={!canNavigate}
                aria-label={t("compShared.mediaFirst")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={goNext}
                disabled={!canNavigate}
                aria-label={t("compShared.mediaNext")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleDialogOpenChange(false)}
                aria-label={t("compShared.closeTheMediaViewer")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden bg-black/90 p-3">
          {!currentItem ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-200">
              {t("compShared.thereIsNoMediaTo")}
            </div>
          ) : currentKind === "image" ? (
            imageUrl ? (
              <div className="flex h-full items-center justify-center overflow-auto">
                <img
                  src={imageUrl}
                  alt={currentItem.alt ?? currentItem.name}
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                  }}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <SpinnerInline label={t("compShared.loadingPhotos")} />
              </div>
            )
          ) : currentKind === "pdf" ? (
            <PdfPreviewViewer
              source={currentItem.file ?? currentItem.src ?? null}
              fileName={currentItem.file?.name ?? currentItem.name}
              requireAuth={currentItem.requireAuth ?? true}
              fitContainer
              className="h-full border-slate-800"
            />
          ) : currentKind === "document" ? (
            documentViewerUrl ? (
              <div className="flex h-full min-h-0 flex-col gap-3">
                <iframe
                  key={`${currentItem.id}-${documentViewerProvider}`}
                  src={documentViewerUrl}
                  title={t("general.viewDocument", { var_0: currentItem.name })}
                  className="h-full w-full rounded-lg border border-slate-700 bg-white"
                />
                <p className="text-center text-xs text-slate-300">
                  {t("compShared.ifYouCanTView")}
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-200">
                <p className="max-w-lg text-sm">{t("compShared.thisDocumentCannotBeDirectly")}</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button type="button" variant="outline" onClick={handleOpenCurrentDocument}>
                    {t("compShared.openInNewTab")}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDownloadCurrentDocument}>
                    {t("compShared.download")}
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-200">
              {t("compShared.thisFormatDoesNotSupport")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
