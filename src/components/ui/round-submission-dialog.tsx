import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { applicationDetailManager } from "@/services/application-detail.manager";
import { FileText, Send, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { components } from "../../../schema-from-be";

type ApplicationDetail = components["schemas"]["ApplicationDetail"];

export interface RoundSubmissionDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  applicationId: number;
  roundName?: string;
  instruction?: string;
  submissionFormat?: "file" | "text" | "any";
  currentFileUrl?: string;
  currentTextContent?: string;
  isAlreadySubmitted?: boolean;
  onSuccess?: (_result: { status?: string; message?: string; detail?: ApplicationDetail }) => void;
}

export function RoundSubmissionDialog({
  open,
  onOpenChange,
  applicationId,
  roundName,
  instruction,
  submissionFormat = "any",
  currentFileUrl,
  currentTextContent,
  isAlreadySubmitted,
  onSuccess,
}: RoundSubmissionDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState(currentTextContent ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const isTextMode =
    submissionFormat === "text" || (submissionFormat === "any" && !selectedFile && !currentFileUrl);
  const isFileMode = submissionFormat === "file" || submissionFormat === "any";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;
    // Accept any file type for generic submission
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      setFileError(t("compUi.fileIsTooLargeMaximum"));
      return;
    }
    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let result;
      // Respect the submission format
      if (submissionFormat === "file") {
        // File-only round (e.g., CV_SCREENING)
        if (!selectedFile) {
          toast.error(t("userApplicationhistory.pleaseSubmitYourDocument"));
          setIsSubmitting(false);
          return;
        }
        result = await applicationDetailManager.submit({ applicationId, file: selectedFile });
      } else if (submissionFormat === "text") {
        // Text-only round (e.g., EMAIL_SIMULATOR)
        if (!textContent.trim()) {
          toast.error(t("userApplicationhistory.pleaseEnterContent"));
          setIsSubmitting(false);
          return;
        }
        result = await applicationDetailManager.submit({
          applicationId,
          textContent: textContent.trim(),
        });
      } else {
        // "any" mode: accept either
        if (textContent.trim()) {
          result = await applicationDetailManager.submit({
            applicationId,
            textContent: textContent.trim(),
          });
        } else if (selectedFile) {
          result = await applicationDetailManager.submit({ applicationId, file: selectedFile });
        } else {
          toast.error(t("userApplicationhistory.pleaseEnterContent"));
          setIsSubmitting(false);
          return;
        }
      }

      if (result.success) {
        const submissionResult = {
          status: result.data?.status,
          message: result.data?.message,
          detail: result.data?.detail,
        };
        onOpenChange(false);
        setSelectedFile(null);
        setTextContent("");
        onSuccess?.(submissionResult);
      } else {
        toast.error(result.error ?? t("common.anErrorHasOccurred"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClose = (_open?: boolean) => {
    setSelectedFile(null);
    setTextContent("");
    setFileError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0047AB]" />
            {roundName ?? t("userApplicationhistory.submitYourApplication")}
          </DialogTitle>
          <DialogDescription className="text-left">
            {isAlreadySubmitted
              ? t("userApplicationhistory.alreadySubmitted")
              : (instruction ?? t("userApplicationhistory.pleaseSubmitYourDocument"))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current submission preview */}
          {currentFileUrl && !selectedFile && (
            <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-800">
              <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("userApplicationhistory.currentSubmission")}
              </p>
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                <a
                  href={currentFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-[#0047AB] underline hover:text-[#003d91] dark:text-[#66B2FF]">
                  {currentFileUrl.split("/").pop() ?? "Uploaded file"}
                </a>
              </div>
            </div>
          )}

          {currentTextContent && !textContent && (
            <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-800">
              <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("userApplicationhistory.currentSubmission")}
              </p>
              <p className="line-clamp-3 text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {currentTextContent}
              </p>
            </div>
          )}

          {/* File upload section */}
          {isFileMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("userApplicationhistory.uploadFile")}
              </label>
              {selectedFile ? (
                <div className="flex items-center gap-3 overflow-hidden rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <FileText className="h-5 w-5 shrink-0 text-green-600" />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-green-700 dark:text-green-300">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={handleClearFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                    "border-slate-300 hover:border-[#0047AB] hover:bg-[#0047AB]/5",
                    "dark:border-slate-600 dark:hover:border-[#66B2FF] dark:hover:bg-[#66B2FF]/5"
                  )}
                  onClick={() => inputRef.current?.click()}>
                  <Upload className="mx-auto mb-2 h-7 w-7 text-slate-400" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t("userApplicationhistory.clickToSelectFile")}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {t("userApplicationhistory.maxFileSize25mb")}
                  </p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              {fileError && <p className="text-xs text-red-500">{fileError}</p>}
            </div>
          )}

          {/* Divider */}
          {isFileMode && isTextMode && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 border-t border-slate-200 dark:border-slate-700" />
              <span className="text-xs text-slate-400">{t("general.or")}</span>
              <div className="h-px flex-1 border-t border-slate-200 dark:border-slate-700" />
            </div>
          )}

          {/* Text input section */}
          {isTextMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("userApplicationhistory.yourAnswer")}
              </label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={instruction ?? t("userApplicationhistory.enterYourContentHere")}
                className="min-h-[140px] resize-y"
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose()} disabled={isSubmitting}>
            {t("general.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (submissionFormat === "file" ? !selectedFile : false) ||
              (submissionFormat === "text" ? !textContent.trim() : false) ||
              (submissionFormat === "any" ? !selectedFile && !textContent.trim() : false)
            }
            className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
            {isSubmitting ? (
              <>
                <Spinner size="sm" tone="white" />
                {t("compUi.uploading")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("common.submit")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
