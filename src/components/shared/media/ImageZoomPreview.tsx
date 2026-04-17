import { useState } from "react";

import { cn } from "@/lib/utils";

import { MediaLightboxDialog } from "./MediaLightboxDialog";

export interface ImageZoomPreviewProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  imageClassName?: string;
  requireAuth?: boolean;
}

export function ImageZoomPreview({
  src,
  alt,
  title,
  className,
  imageClassName,
  requireAuth = false,
}: ImageZoomPreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn(
          "group relative overflow-hidden rounded-xl border bg-slate-100 text-left dark:bg-slate-900",
          className
        )}
        onClick={() => setOpen(true)}>
        <img
          src={src}
          alt={alt}
          className={cn(
            "h-full max-h-72 w-full object-cover transition duration-300 group-hover:scale-[1.02]",
            imageClassName
          )}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-3 py-2 text-sm text-white">
          {title ?? "Nhấn để xem ảnh phóng to"}
        </div>
      </button>

      <MediaLightboxDialog
        open={open}
        onOpenChange={setOpen}
        items={[
          {
            id: "image-zoom-preview",
            name: title ?? alt,
            src,
            alt,
            kind: "image",
            requireAuth,
          },
        ]}
      />
    </>
  );
}
