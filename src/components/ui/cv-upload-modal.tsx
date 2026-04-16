import { ExternalLink, FileText, Upload, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface CVUploadModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Current CV URL (for displaying existing CV) */
  currentCvUrl?: string | null;
  /** Current CV file name */
  currentCvName?: string | null;
  /** Callback when CV is uploaded successfully */
  onUpload: (file: File) => Promise<void>;
  /** Optional callback when existing CV is viewed */
  onViewCurrent?: () => void;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Title for the modal */
  title?: string;
  /** Description for the modal */
  description?: string;
}

/**
 * CVUploadModal - Modal chuyên dùng để upload và preview CV PDF
 *
 * Features:
 * - Chỉ accept file PDF
 * - Preview PDF file đã chọn
 * - Hiển thị CV hiện tại nếu có
 * - Loading state khi upload
 * - Validation file type
 */
export function CVUploadModal({
  isOpen,
  onOpenChange,
  currentCvUrl,
  currentCvName,
  onUpload,
  onViewCurrent,
  isUploading = false,
  title = "Upload CV",
  description = "Chọn file CV của bạn (chỉ chấp nhận file PDF)",
}: CVUploadModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Clear selected file function
  const clearState = React.useCallback(() => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [previewUrl]);

  // Clean up blob URL when component unmounts or when file changes
  React.useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      clearState();
    }
  }, [isOpen, clearState]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    // Validate file type - only PDF allowed
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Chỉ chấp nhận file PDF. Vui lòng chọn file khác.");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File quá lớn. Kích thước tối đa là 10MB.");
      return;
    }

    // Clean up old preview
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview URL for PDF
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  };

  // Handle clear button click
  const handleClear = () => {
    clearState();
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile);
      clearState();
      onOpenChange(false);
    } catch {
      setError("Có lỗi xảy ra khi upload. Vui lòng thử lại.");
    }
  };

  // Handle view current CV
  const handleViewCurrent = () => {
    if (currentCvUrl) {
      window.open(currentCvUrl, "_blank", "noopener,noreferrer");
      onViewCurrent?.();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current CV Section */}
          {currentCvUrl && !selectedFile && (
            <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-800">
              <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                CV hiện tại
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-10 w-10 text-red-500" />
                  <div>
                    <p className="max-w-[200px] truncate text-sm font-medium">
                      {currentCvName || "CV.pdf"}
                    </p>
                    <p className="text-xs text-gray-500">PDF Document</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleViewCurrent}>
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Xem CV
                </Button>
              </div>
            </div>
          )}

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  File đã chọn
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={handleClear}
                  disabled={isUploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-10 w-10 text-red-500" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* PDF Preview iframe */}
              {previewUrl && (
                <div className="mt-3 overflow-hidden rounded-md border">
                  <iframe
                    src={previewUrl}
                    title="CV Preview"
                    className="h-64 w-full"
                    style={{ border: "none" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* File Input */}
          <div className="space-y-2">
            <div
              className={cn(
                "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                "hover:border-primary hover:bg-primary/5",
                error && "border-red-300 bg-red-50",
                selectedFile && "border-green-300 bg-green-50"
              )}
              onClick={() => !isUploading && inputRef.current?.click()}>
              <Upload
                className={cn(
                  "mx-auto mb-2 h-8 w-8",
                  error ? "text-red-400" : selectedFile ? "text-green-500" : "text-gray-400"
                )}
              />
              <p className="text-sm font-medium">
                {selectedFile ? "Nhấn để chọn file khác" : "Nhấn để chọn file PDF"}
              </p>
              <p className="mt-1 text-xs text-gray-500">Chỉ chấp nhận file PDF, tối đa 10MB</p>
            </div>
            <Input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Hủy
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <>
                <Spinner size="sm" tone="white" className="mr-2" />
                Đang upload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload CV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CVUploadModal;
