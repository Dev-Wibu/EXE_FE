import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { applicationDetailManager } from "@/services/application-detail.manager";
import { ArrowLeft, FileText, Mail, Paperclip, Send, Trash2, Upload, X } from "lucide-react";
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
  roundType?: string;
  instruction?: string;
  submissionFormat?: "file" | "text" | "any";
  currentFileUrl?: string;
  currentTextContent?: string;
  isAlreadySubmitted?: boolean;
  onSuccess?: (_result: { status?: string; message?: string; detail?: ApplicationDetail }) => void;
}

function parseEmailContent(text: string | null | undefined): {
  to: string;
  subject: string;
  body: string;
} {
  if (!text) return { to: "", subject: "", body: "" };
  let to = "";
  let subject = "";
  let body = "";
  // Extract To and Subject
  const toMatch = text.match(/^To:\s*(.+)$/m);
  const subjectMatch = text.match(/^Subject:\s*(.+)$/m);
  if (toMatch) to = toMatch[1].trim();
  if (subjectMatch) subject = subjectMatch[1].trim();
  // Extract body (everything after the first empty line after subject)
  const lines = text.split("\n");
  let bodyStarted = false;
  const bodyLines: string[] = [];
  let foundEmptyLine = false;
  for (const line of lines) {
    if (!bodyStarted) {
      if (line.startsWith("To:") || line.startsWith("Subject:")) continue;
      if (line.trim() === "") {
        foundEmptyLine = true;
        continue;
      }
      if (foundEmptyLine) {
        bodyStarted = true;
        bodyLines.push(line);
      }
    } else {
      bodyLines.push(line);
    }
  }
  body = bodyLines.join("\n").trim();
  return { to, subject, body };
}

export function RoundSubmissionDialog({
  open,
  onOpenChange,
  applicationId,
  roundName,
  roundType,
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

  const isEmailMode = roundType === "EMAIL_SIMULATOR";

  // Parse initial email fields from existing text content
  const initialEmail = parseEmailContent(currentTextContent ?? textContent);
  const [emailTo, setEmailTo] = useState(initialEmail.to);
  const [emailSubject, setEmailSubject] = useState(initialEmail.subject);
  const [emailBody, setEmailBody] = useState(initialEmail.body);

  const inputRef = useRef<HTMLInputElement>(null);

  const isTextMode =
    submissionFormat === "text" || (submissionFormat === "any" && !selectedFile && !currentFileUrl);
  const isFileMode = submissionFormat === "file" || submissionFormat === "any";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;
    const maxSize = 25 * 1024 * 1024;
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

  const buildEmailText = () => {
    return `To: ${emailTo}\nSubject: ${emailSubject}\n\n${emailBody}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let result;
      if (isEmailMode) {
        const composedText = buildEmailText();
        if (!composedText.trim()) {
          toast.error(t("userApplicationhistory.pleaseEnterContent"));
          setIsSubmitting(false);
          return;
        }
        result = await applicationDetailManager.submit({
          applicationId,
          textContent: composedText,
        });
      } else if (submissionFormat === "file") {
        if (!selectedFile) {
          toast.error(t("userApplicationhistory.pleaseSubmitYourDocument"));
          setIsSubmitting(false);
          return;
        }
        result = await applicationDetailManager.submit({ applicationId, file: selectedFile });
      } else if (submissionFormat === "text") {
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

  const handleClose = () => {
    setSelectedFile(null);
    setTextContent("");
    setFileError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80">
          <DialogTitle className="flex items-center gap-2 text-base">
            {isEmailMode ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0047AB]">
                <Mail className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0047AB]">
                <FileText className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="text-slate-900 dark:text-white">
              {roundName ?? t("userApplicationhistory.submitYourApplication")}
            </span>
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-slate-500">
            {isAlreadySubmitted
              ? t("userApplicationhistory.alreadySubmitted")
              : isEmailMode
                ? (instruction ?? t("userApplicationhistory.emailScenario"))
                : (instruction ?? t("userApplicationhistory.pleaseSubmitYourDocument"))}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isEmailMode ? (
            /* ========== GMAIL-LIKE EMAIL COMPOSE ========== */
            <div className="mt-2 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-700"
                    onClick={() => handleClose()}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    New Message
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-red-600"
                    onClick={() => {
                      setTextContent("");
                      setEmailTo("");
                      setEmailSubject("");
                    }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* To field */}
              <div className="flex items-center border-b border-slate-100 px-3 py-2 dark:border-slate-700/50">
                <span className="mr-3 w-10 text-xs text-slate-500 dark:text-slate-400">To</span>
                <input
                  type="text"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 bg-transparent text-sm text-slate-800 outline-none dark:text-slate-200"
                  disabled={isSubmitting || isAlreadySubmitted}
                />
              </div>

              {/* Subject field */}
              <div className="flex items-center border-b border-slate-100 px-3 py-2 dark:border-slate-700/50">
                <span className="mr-3 w-10 text-xs text-slate-500 dark:text-slate-400">
                  Subject
                </span>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="flex-1 bg-transparent text-sm text-slate-800 outline-none dark:text-slate-200"
                  disabled={isSubmitting || isAlreadySubmitted}
                />
              </div>

              {/* Body */}
              <div className="px-3 py-2">
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder={t("userApplicationhistory.emailPlaceholder")}
                  className="max-h-[300px] min-h-[220px] resize-y border-0 bg-transparent p-0 text-sm leading-relaxed text-slate-800 shadow-none outline-none focus-visible:ring-0 dark:text-slate-200"
                  disabled={isSubmitting || isAlreadySubmitted}
                />
              </div>

              {/* Attachment */}
              {isFileMode && (
                <>
                  {selectedFile ? (
                    <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20">
                      <Paperclip className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-green-700 dark:text-green-300">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-green-600 dark:text-green-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={handleClearFile}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mx-3 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => inputRef.current?.click()}>
                        <Paperclip className="h-3.5 w-3.5" />
                        {t("userApplicationhistory.attachFile")}
                      </Button>
                      <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isSubmitting || isAlreadySubmitted}
                      />
                    </div>
                  )}
                  {fileError && <p className="mx-3 mb-2 text-xs text-red-500">{fileError}</p>}
                </>
              )}
            </div>
          ) : (
            /* ========== STANDARD SUBMISSION FORM ========== */
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

              {currentTextContent && !textContent && !isEmailMode && (
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
              {isFileMode && !isEmailMode && (
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
              {isFileMode && isTextMode && !isEmailMode && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 border-t border-slate-200 dark:border-slate-700" />
                  <span className="text-xs text-slate-400">{t("general.or")}</span>
                  <div className="h-px flex-1 border-t border-slate-200 dark:border-slate-700" />
                </div>
              )}

              {/* Text input section */}
              {isTextMode && !isEmailMode && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("userApplicationhistory.yourAnswer")}
                  </label>
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder={instruction ?? t("userApplicationhistory.enterYourContentHere")}
                    className="max-h-[300px] min-h-[140px] resize-y"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" onClick={() => handleClose()} disabled={isSubmitting}>
              {t("general.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (isEmailMode
                  ? !emailTo.trim() || !emailSubject.trim() || !emailBody.trim()
                  : submissionFormat === "file"
                    ? !selectedFile
                    : submissionFormat === "text"
                      ? !textContent.trim()
                      : !selectedFile && !textContent.trim())
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
                  {isEmailMode ? t("common.send") : t("common.submit")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
