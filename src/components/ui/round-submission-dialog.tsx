import { Button } from "@/components/ui/button";
import { CodeReviewSubmissionModal } from "@/components/ui/code-review-submission-modal";
import { CodingSubmissionModal } from "@/components/ui/coding-submission-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailPreviewDialog } from "@/components/ui/email-preview-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { applicationDetailManager } from "@/services/application-detail.manager";
import { Copy, ExternalLink, FileText, Mail, Send, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { components } from "../../../schema-from-be";

type ApplicationDetail = components["schemas"]["ApplicationDetail"];
type CodingProblemSnapshot = components["schemas"]["CodingProblemSnapshot"];
type CodeReviewProblemSnapshot = components["schemas"]["CodeReviewProblemSnapshot"];

export interface RoundSubmissionDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  applicationId: number;
  roundId?: number;
  roundName?: string;
  roundType?: string;
  instruction?: string;
  submissionFormat?: "file" | "text" | "any";
  currentFileUrl?: string;
  currentTextContent?: string;
  emailSubmissionId?: number | null;
  // CODING round specific
  codingProblems?: CodingProblemSnapshot[];
  codingProblemsId?: number[];
  timeLimitMinutes?: number;
  // CODE_REVIEW round specific
  codeReviewProblems?: CodeReviewProblemSnapshot[];
  onSuccess?: (_result: { status?: string; message?: string; detail?: ApplicationDetail }) => void;
}

const SYSTEM_EMAIL = "tuyendung@inblue.org";

export function RoundSubmissionDialog({
  open,
  onOpenChange,
  applicationId,
  roundId,
  roundName,
  roundType,
  instruction,
  submissionFormat = "any",
  currentFileUrl,
  currentTextContent,
  emailSubmissionId,
  codingProblems,
  codingProblemsId,
  timeLimitMinutes,
  codeReviewProblems,
  onSuccess,
}: RoundSubmissionDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState(currentTextContent ?? "");

  // Email mode state
  const [copied, setCopied] = useState(false);

  // Email preview dialog state
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  const isEmailMode = roundType === "EMAIL_SIMULATOR";
  const isCodingMode = roundType === "CODING";
  const isCodeReviewMode = roundType === "CODE_REVIEW";

  // Filter old emails from instruction and replace with system email
  const filteredInstruction = instruction
    ? instruction.replace(/hanptse\d+@fpt\.edu\.vn|[\w.-]+@[\w.-]+\.\w+/gi, SYSTEM_EMAIL)
    : "";

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let result;
      if (submissionFormat === "file") {
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
    setCopied(false);
    onOpenChange(false);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SYSTEM_EMAIL);
    setCopied(true);
    toast.success(t("userApplicationhistory.copiedEmail"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySubject = () => {
    const subject = `[INBLUE-APP-${applicationId}]`;
    navigator.clipboard.writeText(subject);
    toast.success(t("userApplicationhistory.copiedSubject"));
  };

  const handleOpenEmailClient = () => {
    const subject = `[INBLUE-APP-${applicationId}]`;
    window.open(`mailto:${SYSTEM_EMAIL}?subject=${encodeURIComponent(subject)}`, "_blank");
  };

  // If CODING mode, render the full IDE modal instead
  if (isCodingMode) {
    return (
      <CodingSubmissionModal
        open={open}
        onOpenChange={onOpenChange}
        applicationId={applicationId}
        roundId={roundId ?? 0}
        roundName={roundName}
        codingProblems={codingProblems!}
        codingProblemsId={codingProblemsId}
        instruction={instruction}
        timeLimitMinutes={timeLimitMinutes}
        onSuccess={(message) => {
          onOpenChange(false);
          onSuccess?.({ message });
        }}
      />
    );
  }

  // If CODE_REVIEW mode, render the code review modal
  if (isCodeReviewMode) {
    return (
      <CodeReviewSubmissionModal
        open={open}
        onOpenChange={onOpenChange}
        applicationId={applicationId}
        roundId={roundId}
        roundName={roundName}
        codeReviewProblems={codeReviewProblems}
        codeReviewProblemsId={
          codeReviewProblems?.map((p) => p.problemId).filter(Boolean) as number[]
        }
        instruction={instruction}
        onSuccess={(message) => {
          onOpenChange(false);
          onSuccess?.({ message });
        }}
      />
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0047AB]">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="text-slate-900 dark:text-white">
                {roundName ?? t("userApplicationhistory.emailRound")}
              </span>
            </DialogTitle>
            <DialogDescription className="text-left text-xs text-slate-500">
              {t("userApplicationhistory.emailInstructions")}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isEmailMode ? (
              /* ========== EMAIL SIMULATOR MODE ========== */
              <div className="space-y-5">
                {/* Instruction from JD */}
                {filteredInstruction && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {t("userApplicationhistory.instructions")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-blue-700 dark:text-blue-300">
                      {filteredInstruction}
                    </p>
                  </div>
                )}

                {/* Email sending instructions */}
                <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 dark:border-amber-700 dark:bg-amber-900/10">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-amber-800 dark:text-amber-200">
                      {t("userApplicationhistory.sendRealEmail")}
                    </span>
                  </div>

                  <p className="mb-4 text-sm text-amber-700 dark:text-amber-300">
                    {t("userApplicationhistory.sendRealEmailDesc")}
                  </p>

                  {/* Subject Pattern */}
                  <div className="mb-3 rounded-lg bg-white p-4 dark:bg-slate-800">
                    <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      {t("userApplicationhistory.emailSubject")}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-1 items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-800 dark:bg-purple-900/30">
                        <span className="font-mono text-sm font-semibold text-purple-700 dark:text-purple-300">
                          [INBLUE-APP-{applicationId}]
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopySubject}
                        className="shrink-0 gap-2 border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/30">
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {t("userApplicationhistory.subjectNotice")}
                    </p>
                  </div>

                  {/* Target email address */}
                  <div className="mb-4 rounded-lg bg-white p-4 dark:bg-slate-800">
                    <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                      {t("userApplicationhistory.targetAddress")}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                        <Mail className="h-5 w-5 shrink-0 text-[#0047AB]" />
                        <span className="font-mono text-base font-semibold text-slate-900 dark:text-white">
                          {SYSTEM_EMAIL}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyEmail}
                        className="shrink-0 gap-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30">
                        <Copy className="h-4 w-4" />
                        {copied
                          ? t("userApplicationhistory.copied")
                          : t("userApplicationhistory.copy")}
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={handleOpenEmailClient}
                      className="flex-1 gap-2 bg-[#0047AB] hover:bg-[#003d91]">
                      <ExternalLink className="h-4 w-4" />
                      {t("userApplicationhistory.openEmailClient")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleCopyEmail();
                        handleCopySubject();
                      }}
                      className="flex-1 gap-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30">
                      <Copy className="h-4 w-4" />
                      {t("userApplicationhistory.copyAll")}
                    </Button>
                  </div>
                </div>

                {/* View submitted email (if exists) */}
                {emailSubmissionId && emailSubmissionId > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                        <Send className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {t("userApplicationhistory.emailSent")}
                      </span>
                    </div>
                    <p className="mb-3 text-xs text-green-600 dark:text-green-400">
                      {t("userApplicationhistory.emailSentDesc")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailPreviewOpen(true)}
                      className="gap-2 border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/30">
                      <Mail className="h-4 w-4" />
                      {t("userApplicationhistory.viewSentEmail")}
                    </Button>
                  </div>
                )}

                {/* Tips */}
                <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-800/50">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    {t("userApplicationhistory.note")}
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-blue-500">1.</span>
                      {t("userApplicationhistory.note1")}{" "}
                      <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">
                        [INBLUE-APP-{applicationId}]
                      </code>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-blue-500">2.</span>
                      {t("userApplicationhistory.note2")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-blue-500">3.</span>
                      {t("userApplicationhistory.note3")} <strong>{SYSTEM_EMAIL}</strong>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-blue-500">4.</span>
                      {t("userApplicationhistory.note4")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-blue-500">5.</span>
                      {t("userApplicationhistory.note5")}
                    </li>
                  </ul>
                </div>
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
                      className="max-h-[300px] min-h-[140px] resize-y"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed Footer - Only show for non-email modes */}
          {!isEmailMode && (
            <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-4">
                <Button variant="outline" onClick={() => handleClose()} disabled={isSubmitting}>
                  {t("general.cancel")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    (submissionFormat === "file"
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
                      {t("common.submit")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Preview Dialog */}
      {emailSubmissionId && emailSubmissionId > 0 && (
        <EmailPreviewDialog
          open={emailPreviewOpen}
          onOpenChange={setEmailPreviewOpen}
          emailSubmissionId={emailSubmissionId}
        />
      )}
    </>
  );
}
