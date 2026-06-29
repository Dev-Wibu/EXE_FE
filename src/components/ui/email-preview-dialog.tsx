import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useEmailSubmission } from "@/hooks/useEmailSubmission";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronDown, ChevronUp, Mail, Paperclip, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailSubmissionId: number | null;
}

export function EmailPreviewDialog({
  open,
  onOpenChange,
  emailSubmissionId,
}: EmailPreviewDialogProps) {
  const { t } = useTranslation();
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const {
    data: email,
    isLoading,
    isError,
  } = useEmailSubmission(emailSubmissionId ?? 0, open && emailSubmissionId !== null);

  const isLongContent = (email?.bodyText?.length ?? 0) > 1000;
  const shouldTruncate = isLongContent && !isContentExpanded;

  const handleClose = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) setIsContentExpanded(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />

        {/* Content - Full control với max-height + overflow */}
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
            "max-h-[90vh] max-w-2xl overflow-hidden rounded-xl border bg-white shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "dark:border-slate-700 dark:bg-slate-900"
          )}>
          {/* Fixed Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0047AB]">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t("emailPreview.title")}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-0.5 text-xs text-slate-500">
                  {t("emailPreview.description")}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
              <X className="h-5 w-5" />
              <span className="sr-only">{t("emailPreview.close")}</span>
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-4">
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Spinner size="lg" />
                <p className="mt-3 text-sm text-slate-500">{t("emailPreview.loading")}</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                  <Mail className="h-8 w-8 text-red-400" />
                </div>
                <p className="font-medium text-red-600 dark:text-red-400">
                  {t("emailPreview.fetchError")}
                </p>
                <p className="mt-1 text-sm text-slate-500">{t("emailPreview.fetchErrorRetry")}</p>
              </div>
            )}

            {/* Email Content */}
            {email && !isLoading && (
              <div className="space-y-4">
                {/* Email Card */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  {/* Subject & Sender Header */}
                  <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0047AB]/10">
                        <Mail className="h-5 w-5 text-[#0047AB]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                          {email.subject || t("emailPreview.noSubject")}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-medium">{t("emailPreview.from")}:</span>
                          <span className="truncate">{email.senderEmail}</span>
                          {email.receivedAt && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span>{new Date(email.receivedAt).toLocaleString("vi-VN")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="px-5 py-4">
                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
                      <pre
                        className={cn(
                          "m-0 font-sans text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300",
                          shouldTruncate && "max-h-64 overflow-hidden"
                        )}>
                        {email.bodyText}
                      </pre>
                      {shouldTruncate && (
                        <div className="relative -mt-8 flex flex-col items-center justify-center bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pt-12 dark:from-slate-900/50 dark:via-slate-900/50 dark:to-transparent">
                          <button
                            onClick={() => setIsContentExpanded(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0047AB] shadow-md transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700">
                            <ChevronDown className="h-4 w-4" />
                            {t("emailPreview.readMore")}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expand/Collapse Button (when expanded) */}
                    {isContentExpanded && isLongContent && (
                      <button
                        onClick={() => setIsContentExpanded(false)}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
                        <ChevronUp className="h-4 w-4" />
                        {t("emailPreview.collapse")}
                      </button>
                    )}
                  </div>

                  {/* Attachments */}
                  {email.attachmentUrls && email.attachmentUrls !== "[]" ? (
                    <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-700">
                      <div className="mb-3 flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                          {t("emailPreview.attachments")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const urls = JSON.parse(email.attachmentUrls ?? "[]") as string[];
                            return urls.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                                  "border-slate-200 bg-white text-slate-700",
                                  "hover:border-[#0047AB]/50 hover:bg-[#0047AB]/5 hover:text-[#0047AB]",
                                  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                  "dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                                )}>
                                <Paperclip className="h-4 w-4" />
                                <span className="max-w-[200px] truncate">
                                  {url.split("/").pop() ??
                                    t("emailPreview.attachment", { index: i + 1 })}
                                </span>
                              </a>
                            ));
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                  ) : null}

                  {/* Status Badge */}
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          email.status === "PROCESSED"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : email.status === "ERROR"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        )}>
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            email.status === "PROCESSED"
                              ? "bg-green-500"
                              : email.status === "ERROR"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          )}
                        />
                        {email.status === "PROCESSED"
                          ? t("emailPreview.statusProcessed")
                          : email.status === "ERROR"
                            ? t("emailPreview.statusError")
                            : email.status}
                      </span>
                      <span className="text-xs text-slate-400">ID: {emailSubmissionId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="border-t border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-end">
              <Button variant="outline" onClick={() => handleClose(false)}>
                {t("emailPreview.close")}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
