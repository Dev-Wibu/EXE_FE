import { ExternalLink, FileText, ImageIcon, Upload, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FileUploadInputProps {
  /** ID for the input element */
  id?: string;
  /** Label for the upload field */
  label?: string;
  /** File type restriction: "image" | "pdf" | "all" */
  fileType?: "image" | "pdf" | "all";
  /** Current file URL (for existing files) */
  currentFileUrl?: string | null;
  /** File name to display */
  fileName?: string | null;
  /** Callback when file is selected */
  onFileChange: (file: File | null) => void;
  /** Callback when file is cleared */
  onClear?: () => void;
  /** Custom accept attribute (overrides fileType) */
  accept?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Placeholder text when no file is selected */
  placeholder?: string;
  /** Show preview for images */
  showPreview?: boolean;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
}

/**
 * FileUploadInput - Reusable file upload component with preview and validation
 *
 * Features:
 * - File type restriction (image, pdf, all)
 * - Image preview support
 * - Existing file URL display
 * - Clear file functionality
 * - Error state handling
 */
export function FileUploadInput({
  id,
  label,
  fileType = "all",
  currentFileUrl,
  fileName,
  onFileChange,
  onClear,
  accept,
  disabled = false,
  className,
  placeholder,
  showPreview = true,
  error,
  helpText,
}: FileUploadInputProps) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Determine accept attribute based on fileType
  const computedAccept = React.useMemo(() => {
    if (accept) return accept;
    switch (fileType) {
      case "image":
        return "image/*";
      case "pdf":
        return ".pdf,application/pdf";
      case "all":
      default:
        return "*/*";
    }
  }, [accept, fileType]);

  // Clean up blob URLs when component unmounts or preview changes
  React.useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (fileType === "pdf" && !file.type.includes("pdf")) {
      // Invalid file type for PDF
      return;
    }
    if (fileType === "image" && !file.type.startsWith("image/")) {
      // Invalid file type for image
      return;
    }

    // Clean up old preview
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    // Create preview for images
    if (showPreview && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }

    setSelectedFileName(file.name);
    onFileChange(file);
  };

  // Clear selected file
  const handleClear = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSelectedFileName(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileChange(null);
    onClear?.();
  };

  // Check if current file is an image
  const isCurrentFileImage = React.useMemo(() => {
    if (!currentFileUrl) return false;
    const url = currentFileUrl.toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].some((ext) =>
      url.includes(ext)
    );
  }, [currentFileUrl]);

  // Determine what to display
  const displayUrl = preview || (showPreview && isCurrentFileImage ? currentFileUrl : null);
  const displayFileName = selectedFileName || fileName;
  const hasFile = !!(preview || currentFileUrl);
  const isPdfFile =
    fileType === "pdf" || (displayFileName && displayFileName.toLowerCase().endsWith(".pdf"));

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}

      {/* File Preview Section */}
      {hasFile && (
        <div className="relative mb-2 rounded-lg border bg-slate-50 p-3 dark:bg-slate-800">
          {/* Image Preview */}
          {displayUrl && !isPdfFile && (
            <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-lg">
              <img
                src={displayUrl}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* PDF/Document Preview */}
          {isPdfFile && (
            <div className="flex h-32 flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-red-500" />
              <span className="mt-2 max-w-full truncate px-2 text-xs text-gray-500">
                {displayFileName || "PDF Document"}
              </span>
            </div>
          )}

          {/* Non-image file without preview */}
          {!displayUrl && !isPdfFile && currentFileUrl && (
            <div className="flex h-32 flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-blue-500" />
              <span className="mt-2 max-w-full truncate px-2 text-xs text-gray-500">
                {displayFileName || "File"}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-2 flex items-center justify-center gap-2">
            {selectedFileName ? (
              <>
                <span className="text-xs text-green-600">{selectedFileName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={handleClear}
                  disabled={disabled}
                  title="Xóa file đã chọn">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : currentFileUrl ? (
              <a
                href={currentFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
                <span>Xem file</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>
      )}

      {/* File Input */}
      <Input
        ref={inputRef}
        id={id}
        type="file"
        accept={computedAccept}
        onChange={handleFileChange}
        disabled={disabled}
        className={cn("cursor-pointer", error && "border-red-500")}
      />

      {/* Placeholder text */}
      {!hasFile && placeholder && (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          {fileType === "image" ? (
            <ImageIcon className="h-3 w-3" />
          ) : fileType === "pdf" ? (
            <FileText className="h-3 w-3" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          {placeholder}
        </p>
      )}

      {/* Help text */}
      {helpText && !error && <p className="text-muted-foreground text-xs">{helpText}</p>}

      {/* Error message */}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default FileUploadInput;
