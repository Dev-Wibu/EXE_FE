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
  downloadFromUrl,
  inferFileKind,
  openUrlInNewTab,
  revokeObjectUrlSafe,
} from "@/lib/media-file-utils";

import { PdfPreviewViewer } from "./PdfPreviewViewer";
import type { MediaViewerItem } from "./types";

export interface MediaLightboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  const [manualIndex, setManualIndex] = useState<number | null>(null);
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

  const imageObjectUrl = useMemo(() => {
    if (!open || !currentItem?.file || currentKind !== "image") {
      return null;
    }

    return URL.createObjectURL(currentItem.file);
  }, [currentItem, currentKind, open]);

  useEffect(() => {
    return () => {
      revokeObjectUrlSafe(imageObjectUrl);
    };
  }, [imageObjectUrl]);

  const imageUrl =
    currentKind === "image"
      ? ((currentItem?.file ? imageObjectUrl : currentItem?.src) ?? null)
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

    downloadFromUrl(imageUrl, currentItem.name || "anh-preview");
  };

  const handleOpenCurrentImage = () => {
    if (!imageUrl) {
      return;
    }

    openUrlInNewTab(imageUrl);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="flex h-[95vh] max-w-[96vw] flex-col gap-0 p-0"
        showCloseButton={false}>
        <DialogHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base">{currentItem?.name ?? "Xem media"}</DialogTitle>
              <DialogDescription className="text-xs">
                Trình xem toàn màn hình cho ảnh và PDF ({currentPositionLabel})
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
                    aria-label="Thu nhỏ ảnh">
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
                    aria-label="Phóng to ảnh">
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
                    aria-label="Xoay trái ảnh">
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
                    aria-label="Xoay phải ảnh">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleOpenCurrentImage}
                    disabled={!imageUrl}
                    aria-label="Mở ảnh ở tab mới">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleDownloadCurrentImage}
                    disabled={!imageUrl}
                    aria-label="Tải ảnh xuống">
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
                aria-label="Media trước">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={goNext}
                disabled={!canNavigate}
                aria-label="Media sau">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleDialogOpenChange(false)}
                aria-label="Đóng trình xem media">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-black/90 p-3">
          {!currentItem ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-200">
              Không có media để hiển thị.
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
                <SpinnerInline label="Đang tải ảnh..." />
              </div>
            )
          ) : currentKind === "pdf" ? (
            <PdfPreviewViewer
              source={currentItem.file ?? currentItem.src ?? null}
              fileName={currentItem.file?.name ?? currentItem.name}
              requireAuth={currentItem.requireAuth ?? true}
              className="h-full border-slate-800"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-200">
              Định dạng này chưa hỗ trợ xem trực tiếp.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
