import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ImageViewerModalProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageViewerModal({ src, alt, open, onClose }: ImageViewerModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-testid="image-viewer-overlay"
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-70 bg-black/90"
          onClick={onClose}
        />
        <DialogPrimitive.Content
          data-testid="image-viewer-content"
          className="fixed top-1/2 left-1/2 z-80 w-[95vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 outline-none"
          onOpenAutoFocus={(event) => event.preventDefault()}
          aria-label={alt ?? "Xem ảnh"}>
          <DialogPrimitive.Close
            className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Đóng ảnh">
            <X className="h-6 w-6" />
          </DialogPrimitive.Close>

          <img src={src} alt={alt ?? ""} className="max-h-[90vh] w-full rounded object-contain" />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
