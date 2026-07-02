"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { CodeReviewSubmission as CodeReviewSubmissionType } from "@/services/application-detail.manager";
import { applicationDetailManager } from "@/services/application-detail.manager";
import { codeReviewProblemManager } from "@/services/code-review-problem.manager";
import Editor from "@monaco-editor/react";
import { AlertCircle, Eye, Plus, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { components } from "../../../schema-from-be";

type CodeReviewProblemSnapshot = components["schemas"]["CodeReviewProblemSnapshot"];
type SchemaCodeReviewSubmission = components["schemas"]["CodeReviewSubmission"];

export interface CodeReviewSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: number;
  roundId?: number;
  roundName?: string;
  codeReviewProblems?: CodeReviewProblemSnapshot[];
  codeReviewProblemsId?: number[];
  instruction?: string;
  onSuccess?: (message?: string) => void;
}

type Severity = "CRITICAL" | "WARNING" | "INFO";

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; className: string; dotClassName: string }
> = {
  CRITICAL: {
    label: "Critical",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
    dotClassName: "bg-red-500",
  },
  WARNING: {
    label: "Warning",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
    dotClassName: "bg-amber-500",
  },
  INFO: {
    label: "Info",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
    dotClassName: "bg-blue-500",
  },
};

interface UserIssue extends Omit<SchemaCodeReviewSubmission, "lineNumber"> {
  lineNumber: number | null;
}

export function CodeReviewSubmissionModal({
  open,
  onOpenChange,
  applicationId,
  roundId,
  roundName,
  codeReviewProblems,
  codeReviewProblemsId,
  instruction,
  onSuccess,
}: CodeReviewSubmissionModalProps) {
  const { t } = useTranslation();

  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [userIssues, setUserIssues] = useState<Record<number, UserIssue[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [loadedProblems, setLoadedProblems] = useState<CodeReviewProblemSnapshot[]>([]);

  // Merge: use pre-loaded problems from props, or fetch by IDs
  const problems = loadedProblems.length > 0 ? loadedProblems : (codeReviewProblems ?? []);

  // Fetch full problem details when modal opens (when IDs are provided but full data is missing)
  useEffect(() => {
    if (!open) return;

    const idsToFetch = codeReviewProblemsId?.filter((id) => {
      // Only fetch if we don't already have full data in codeReviewProblems
      const hasFullData = codeReviewProblems?.some(
        (p) => p.problemId === id && (p.files?.length ?? 0) > 0
      );
      return !hasFullData;
    });

    if (!idsToFetch || idsToFetch.length === 0) {
      setLoadedProblems([]);
      return;
    }

    setIsLoadingProblems(true);
    Promise.all(idsToFetch.map((id) => codeReviewProblemManager.getById(id)))
      .then((results) => {
        const fetched: CodeReviewProblemSnapshot[] = [];
        results.forEach((res) => {
          if (res.success && res.data) {
            fetched.push({
              problemId: res.data.id,
              title: res.data.title,
              difficulty: res.data.difficulty as "EASY" | "MEDIUM" | "HARD",
              language: res.data.language,
              problemStatement: res.data.problemStatement,
              files: res.data.files ?? [],
              expectedIssues: res.data.expectedIssues ?? [],
            });
          }
        });
        setLoadedProblems(fetched);
      })
      .catch(() => {
        toast.error(t("adminCodeReviewProblem.errorLoadList"));
      })
      .finally(() => setIsLoadingProblems(false));
  }, [open, codeReviewProblemsId, codeReviewProblems, t]);

  const currentProblem = problems?.[activeProblemIdx];
  const currentFiles = currentProblem?.files ?? [];
  const currentFile = activeFileIdx < currentFiles.length ? currentFiles[activeFileIdx] : null;
  const currentIssues = userIssues[activeProblemIdx] ?? [];

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setActiveProblemIdx(0);
      setActiveFileIdx(0);
      setUserIssues({});
      setShowPreview(false);
    }
  }, [open]);

  const getMonacoLanguage = (lang: string | undefined): string => {
    if (!lang) return "plaintext";
    const map: Record<string, string> = {
      java: "java",
      javascript: "javascript",
      js: "javascript",
      typescript: "typescript",
      ts: "typescript",
      python: "python",
      py: "python",
      csharp: "csharp",
      "c#": "csharp",
      cpp: "cpp",
      "c++": "cpp",
      c: "c",
      go: "go",
      rust: "rust",
      kotlin: "kotlin",
      swift: "swift",
      php: "php",
      ruby: "ruby",
      sql: "sql",
      xml: "xml",
      html: "html",
      css: "css",
    };
    return map[lang.toLowerCase()] ?? "plaintext";
  };

  const addIssue = useCallback(
    (severity: Severity = "WARNING") => {
      const newIssue: UserIssue = {
        filename: currentFile?.filename ?? "",
        lineNumber: null,
        severity,
        description: "",
      };
      setUserIssues((prev) => ({
        ...prev,
        [activeProblemIdx]: [...(prev[activeProblemIdx] ?? []), newIssue],
      }));
    },
    [activeProblemIdx, currentFile]
  );

  const updateIssue = useCallback(
    (issueIdx: number, field: keyof UserIssue, value: string | number | null) => {
      setUserIssues((prev) => {
        const prevIssues = prev[activeProblemIdx] ?? [];
        const updated = [...prevIssues];
        updated[issueIdx] = { ...updated[issueIdx], [field]: value };
        return { ...prev, [activeProblemIdx]: updated };
      });
    },
    [activeProblemIdx]
  );

  const removeIssue = useCallback(
    (issueIdx: number) => {
      setUserIssues((prev) => ({
        ...prev,
        [activeProblemIdx]: (prev[activeProblemIdx] ?? []).filter((_, i) => i !== issueIdx),
      }));
    },
    [activeProblemIdx]
  );

  const handleSubmit = async () => {
    const submissions: CodeReviewSubmissionType[] = [];
    for (const issues of Object.values(userIssues)) {
      for (const issue of issues) {
        if (
          issue.description?.trim() &&
          issue.filename &&
          issue.lineNumber != null &&
          issue.severity
        ) {
          submissions.push({
            filename: issue.filename,
            lineNumber: issue.lineNumber,
            severity: issue.severity,
            description: issue.description,
          });
        }
      }
    }

    if (submissions.length === 0) {
      toast.error(t("userApplicationhistory.pleaseAddAtLeastOneIssue"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await applicationDetailManager.submitCodeReview({
        applicationId,
        roundId: roundId ?? 0,
        submissions,
      });

      if (result.success) {
        toast.success(result.data?.message ?? t("common.applicationSubmittedSuccessfully"));
        onOpenChange(false);
        onSuccess?.(result.data?.message);
      } else {
        toast.error(result.error ?? t("common.anErrorHasOccurred"));
      }
    } catch {
      toast.error(t("common.anErrorHasOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Object.values(userIssues).some((issues) =>
    issues.some((i) => i.description?.trim())
  );

  const totalIssuesFound = Object.values(userIssues).reduce(
    (sum, issues) => sum + issues.filter((i) => i.description?.trim()).length,
    0
  );

  const currentProblemExpectedIssues = currentProblem?.expectedIssues ?? [];
  const currentFoundCount = currentIssues.filter((i) => i.description?.trim()).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] max-w-5xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0047AB]">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-900 dark:text-white">
              {roundName ?? t("userApplicationhistory.codeReviewRound")}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Problem Statement + Code */}
          <div className="flex flex-1 flex-col overflow-hidden border-r border-slate-200 dark:border-slate-700">
            {/* Problem Header */}
            <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              {isLoadingProblems && (
                <div className="mb-2 flex items-center gap-2">
                  <Spinner size="sm" tone="primary" />
                  <span className="text-xs text-slate-500">{t("common.loading")}...</span>
                </div>
              )}
              {problems && problems.length > 1 && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t("userApplicationhistory.problem")}:
                  </span>
                  <div className="flex gap-1">
                    {problems.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveProblemIdx(idx);
                          setActiveFileIdx(0);
                        }}
                        className={cn(
                          "h-6 min-w-6 rounded px-2 text-xs font-medium transition-colors",
                          idx === activeProblemIdx
                            ? "bg-[#0047AB] text-white"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                        )}>
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {currentProblem?.title ?? t("userApplicationhistory.codeReviewTitle")}
              </h3>
              {currentProblem?.difficulty && (
                <span className="mt-1 inline-block rounded bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {currentProblem.difficulty}
                </span>
              )}
              {currentProblem?.language && (
                <span className="ml-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {currentProblem.language}
                </span>
              )}
              {instruction && (
                <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                  {instruction}
                </p>
              )}
            </div>

            {/* File tabs */}
            {currentFiles.length > 0 && (
              <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800/50">
                {currentFiles.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveFileIdx(idx)}
                    className={cn(
                      "shrink-0 rounded px-3 py-1 text-xs font-medium transition-colors",
                      idx === activeFileIdx
                        ? "bg-white text-[#0047AB] shadow-sm dark:bg-slate-700 dark:text-blue-300"
                        : "text-slate-500 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                    )}>
                    {file.filename?.split("/").pop() ?? `File ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Code Editor (read-only) */}
            <div className="flex-1 overflow-hidden">
              {currentFile?.content ? (
                <Editor
                  height="100%"
                  language={getMonacoLanguage(currentFile.language)}
                  value={currentFile.content}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  {t("userApplicationhistory.noCodeFilesAvailable")}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Issue Reporter */}
          <div className="flex w-96 flex-col overflow-hidden bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="shrink-0 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t("userApplicationhistory.foundIssues")}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    {currentFoundCount} / {currentProblemExpectedIssues.length}{" "}
                    {t("userApplicationhistory.issuesFound")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-7 gap-1 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    {t("userApplicationhistory.preview")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addIssue("WARNING")}
                    className="h-7 gap-1 border-[#0047AB] text-xs text-[#0047AB] hover:bg-[#0047AB]/10">
                    <Plus className="h-3.5 w-3.5" />
                    {t("userApplicationhistory.addIssue")}
                  </Button>
                </div>
              </div>

              {/* Severity legend */}
              <div className="mt-2 flex items-center gap-3">
                {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((sev) => (
                  <div key={sev} className="flex items-center gap-1">
                    <div
                      className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_CONFIG[sev].dotClassName)}
                    />
                    <span className="text-[10px] text-slate-500">{SEVERITY_CONFIG[sev].label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {showPreview && currentProblemExpectedIssues.length > 0 && (
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <h4 className="mb-2 text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    {t("userApplicationhistory.expectedIssues")} (
                    {currentProblemExpectedIssues.length})
                  </h4>
                  <div className="space-y-1.5">
                    {currentProblemExpectedIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded bg-white p-2 dark:bg-slate-900">
                        <span
                          className={cn(
                            "mt-0.5 shrink-0",
                            SEVERITY_CONFIG[(issue.severity as Severity) ?? "WARNING"].dotClassName,
                            "h-1.5 w-1.5 rounded-full"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10px] text-slate-500">
                              L{issue.lineNumber}
                            </span>
                            <span
                              className={cn(
                                "rounded px-1 py-0.5 text-[9px] font-medium",
                                SEVERITY_CONFIG[(issue.severity as Severity) ?? "WARNING"].className
                              )}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-600 dark:text-slate-400">
                            {issue.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("userApplicationhistory.noIssuesFoundYet")}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                    {t("userApplicationhistory.clickAddIssueToStart")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        SEVERITY_CONFIG[(issue.severity as Severity) ?? "WARNING"].className,
                        "border-current/20"
                      )}>
                      <div className="mb-2 flex items-center justify-between">
                        {/* Severity selector */}
                        <div className="flex gap-1">
                          {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((sev) => (
                            <button
                              key={sev}
                              onClick={() => updateIssue(idx, "severity", sev)}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
                                issue.severity === sev
                                  ? SEVERITY_CONFIG[sev].className
                                  : "bg-transparent text-current/50 hover:bg-transparent hover:text-current"
                              )}>
                              {SEVERITY_CONFIG[sev].label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => removeIssue(idx)}
                          className="shrink-0 text-current/50 hover:text-current/80">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Line number */}
                      <div className="mb-2">
                        <label className="mb-1 block text-[10px] font-medium text-current/70">
                          {t("userApplicationhistory.lineNumber")}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={issue.lineNumber ?? ""}
                          onChange={(e) =>
                            updateIssue(
                              idx,
                              "lineNumber",
                              e.target.value ? parseInt(e.target.value, 10) : null
                            )
                          }
                          placeholder="e.g. 42"
                          className="w-full rounded border border-current/20 bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-current/40 focus:outline-none"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="mb-1 block text-[10px] font-medium text-current/70">
                          {t("userApplicationhistory.issueDescription")}
                        </label>
                        <textarea
                          value={issue.description}
                          onChange={(e) => updateIssue(idx, "description", e.target.value)}
                          placeholder={t("userApplicationhistory.describeTheIssue")}
                          rows={3}
                          className="w-full resize-none rounded border border-current/20 bg-transparent px-2 py-1 text-xs focus:ring-1 focus:ring-current/40 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  {totalIssuesFound} {t("userApplicationhistory.issuesReported")}
                </span>
                <span>
                  {currentProblemExpectedIssues.length} {t("userApplicationhistory.expected")}
                </span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting || isLoadingProblems}
                className="w-full gap-2 bg-[#0047AB] text-white hover:bg-[#003d91] disabled:bg-slate-300">
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" tone="white" />
                    {t("compUi.submitting")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("common.submit")} ({totalIssuesFound})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
