import { PaginationControl } from "@/components/shared/PaginationControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CodingRoundGrader } from "@/components/ui/coding-round-grader";
import { EmailPreviewDialog } from "@/components/ui/email-preview-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useApplications } from "@/hooks/useApplication";
import {
  useApplicationDetail,
  useApplicationDetails,
  useApplicationDetailsForReviewer,
  useHrScore,
} from "@/hooks/useApplicationDetails";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { formatDateTime } from "@/lib/formatting";
import i18n from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Mail,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { components } from "../../../../schema-from-be";
const t = i18n.t.bind(i18n);

type ApplicationDetail = components["schemas"]["ApplicationDetail"];
type SubmissionData = components["schemas"]["SubmissionData"];
type AiFeedback = components["schemas"]["AiFeedback"];

// Unified display type for both Admin and Staff
interface GradingListItem {
  id: number;
  jdId?: number;
  status: string;
  currentRoundOrder?: number;
  overallScore?: number;
  // Staff-only fields
  detailId?: number;
  detailStatus?: string;
  detail?: ApplicationDetail;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: t("status.pendingSubmit"),
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  SUBMITTED: {
    label: t("adminQuizsetmanagement.submitted"),
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  AI_EVALUATED: {
    label: t("status.aiGraded"),
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  COMPLETED: {
    label: t("general.completed"),
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  ERROR: {
    label: t("common.error"),
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

const RESULT_CONFIG: Record<string, { label: string; className: string }> = {
  PASSED: {
    label: t("userApplicationhistory.passed"),
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  FAILED: {
    label: t("userApplicationhistory.failed"),
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

// ============================================================
// Expandable Round Card
// ============================================================

interface RoundCardProps {
  detail: ApplicationDetail;
  isExpanded: boolean;
  isStartGrading: boolean;
  onToggle: () => void;
  onStartGrading: () => void;
  onViewEmailSubmission: (emailSubmissionId: number) => void;
  onHrScoreSuccess: () => void;
}

function RoundCard({
  detail,
  isExpanded,
  isStartGrading,
  onToggle,
  onStartGrading,
  onViewEmailSubmission,
  onHrScoreSuccess,
}: RoundCardProps) {
  const { mutate: submitScore, isPending: isSubmitting } = useHrScore({
    onSuccess: onHrScoreSuccess,
  });

  const statusCfg = STATUS_CONFIG[detail.status ?? ""] ?? { label: detail.status, className: "" };
  const resultCfg = detail.finalResult ? RESULT_CONFIG[detail.finalResult] : null;
  const needsHrScore =
    detail.status === "AI_EVALUATED" && (detail.hrScore === undefined || detail.hrScore === null);
  const hasExistingGrade = detail.hrScore !== undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [isPass, setIsPass] = useState(detail.finalResult === "PASSED");
  const [score, setScore] = useState(
    detail.hrScore !== undefined
      ? String(detail.hrScore)
      : detail.aiScore !== undefined
        ? String(Math.round(detail.aiScore))
        : ""
  );
  const [note, setNote] = useState(detail.hrNote ?? "");

  const data = detail.submissionData as SubmissionData | undefined;

  const handleSubmit = () => {
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || score.trim() === "") {
      toast.error(t("grading.invalidScore"));
      return;
    }
    const clampedScore = Math.min(100, Math.max(0, scoreNum));
    submitScore({
      applicationDetailId: detail.id!,
      isPass,
      note: note.trim(),
      score: clampedScore,
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        isExpanded
          ? "border-[#0047AB] shadow-md dark:border-[#0047AB]"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600",
        needsHrScore && !hasExistingGrade && !isExpanded && "border-amber-300 dark:border-amber-700"
      )}>
      {/* Card Header - Always visible */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {/* Expand/Collapse icon or Grading button */}
          {needsHrScore && !hasExistingGrade && !isExpanded ? (
            <Button
              type="button"
              size="sm"
              onClick={onStartGrading}
              className="h-8 gap-1.5 bg-amber-500 px-3 text-xs font-medium text-white hover:bg-amber-600">
              <ClipboardCheck className="h-3.5 w-3.5" />
              {t("grading.grade")}
            </Button>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              className={cn(
                "transition-col flex h-8 w-8 items-center justify-center rounded-lg",
                isExpanded
                  ? "bg-[#0047AB] text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              )}>
              <ChevronRight
                className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")}
              />
            </button>
          )}

          {/* Round info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {t("userApplicationhistory.round")} #{detail.roundId}
              </h3>
              <Badge className={cn("px-1.5 py-0 text-[10px]", statusCfg.className)}>
                {statusCfg.label}
              </Badge>
              {resultCfg && (
                <Badge className={cn("px-1.5 py-0 text-[10px]", resultCfg.className)}>
                  {resultCfg.label}
                </Badge>
              )}
              {needsHrScore && !hasExistingGrade && (
                <Badge
                  variant="outline"
                  className="border-amber-400 px-1.5 py-0 text-[10px] text-amber-600">
                  {t("grading.needsGrading")}
                </Badge>
              )}
            </div>

            {/* Quick scores */}
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
              {detail.aiScore !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-purple-400 text-purple-400" />
                  AI: <span className="font-medium text-purple-600">{detail.aiScore}</span>
                </span>
              )}
              {detail.hrScore !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  HR: <span className="font-medium text-[#0047AB]">{detail.hrScore}</span>
                </span>
              )}
              {detail.finalScore !== undefined && (
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  Final: {detail.finalScore}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: completion indicator */}
        <div className="flex items-center gap-2">
          {detail.completedAt && (
            <span className="text-xs text-slate-400">{formatDateTime(detail.completedAt)}</span>
          )}
          {detail.finalResult === "PASSED" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {detail.finalResult === "FAILED" && <XCircle className="h-5 w-5 text-red-500" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-700">
          <div className="space-y-4">
            {/* Submission Content */}
            {data && (
              <div>
                <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t("submission.content")}
                </h4>
                <SubmissionPreview detail={detail} onViewEmailSubmission={onViewEmailSubmission} />
              </div>
            )}

            {/* AI Feedback */}
            {(detail.aiScore !== undefined || detail.aiFeedback) && (
              <div>
                <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t("grading.aiFeedback")}
                </h4>
                <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                  <AIFeedbackPanel feedback={detail.aiFeedback} score={detail.aiScore} />
                </div>
              </div>
            )}

            <Separator />

            {/* HR Grading Section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {hasExistingGrade
                    ? isEditing
                      ? t("grading.editScore")
                      : t("grading.hrResult")
                    : t("grading.hrGrading")}
                </h4>
                {hasExistingGrade && isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setScore(String(detail.hrScore ?? detail.aiScore ?? ""));
                      setNote(detail.hrNote ?? "");
                    }}
                    className="h-7 gap-1.5 text-xs">
                    {t("common.cancel")}
                  </Button>
                )}
              </div>

              {/* Existing Grade Display - Đã chấm */}
              {hasExistingGrade && !isEditing && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                      <span className="text-3xl font-bold text-[#0047AB]">{detail.hrScore}</span>
                      <span className="text-base text-slate-400">/100</span>
                    </div>
                    <div className="h-10 w-px bg-green-200 dark:bg-green-800" />
                    <Badge
                      className={
                        detail.finalResult === "PASSED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }>
                      {detail.finalResult === "PASSED"
                        ? t("userApplicationhistory.passed")
                        : t("userApplicationhistory.failed")}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1.5 text-xs">
                    {t("adminPracticequestionmanagement.fix")}
                  </Button>
                </div>
              )}

              {/* Grading Form - Chưa chấm, đang sửa, hoặc bấm nút "Chấm" */}
              {(!hasExistingGrade || isEditing || isStartGrading) && (
                <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  {/* AI Score Reference */}
                  {detail.aiScore !== undefined && (
                    <div className="rounded-lg bg-purple-50 p-2.5 dark:bg-purple-900/20">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Star className="h-3.5 w-3.5 fill-purple-400 text-purple-400" />
                        {t("grading.aiScoreReference")}{" "}
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {detail.aiScore}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Decision */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t("grading.decision")}
                    </label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={isPass ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "flex-1 gap-1.5 text-sm",
                          isPass ? "bg-green-600 hover:bg-green-700" : ""
                        )}
                        onClick={() => setIsPass(true)}>
                        <ThumbsUp className="h-4 w-4" />
                        {t("userApplicationhistory.passed")}
                      </Button>
                      <Button
                        type="button"
                        variant={!isPass ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "flex-1 gap-1.5 text-sm",
                          !isPass ? "bg-red-600 hover:bg-red-700" : ""
                        )}
                        onClick={() => setIsPass(false)}>
                        <ThumbsDown className="h-4 w-4" />
                        {t("userApplicationhistory.failed")}
                      </Button>
                    </div>
                  </div>

                  {/* Score Input */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t("grading.hrScore")}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder={t("grading.enterScore")}
                      className="w-full"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      {t("general.notes")}
                    </label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t("grading.enterHrNotes")}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full gap-1.5",
                      isPass ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    )}>
                    {isSubmitting ? (
                      <>
                        <Spinner className="h-4 w-4" />
                        {t("common.saving")}
                      </>
                    ) : (
                      <>
                        {isPass ? (
                          <ThumbsUp className="h-4 w-4" />
                        ) : (
                          <ThumbsDown className="h-4 w-4" />
                        )}
                        {t("general.save")} {t("grading.hrResult")}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Existing HR Note */}
              {detail.hrNote && !isEditing && (
                <div className="mt-4">
                  <h5 className="mb-2 text-xs font-semibold text-slate-500">
                    {t("general.notes")} HR
                  </h5>
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-sm whitespace-pre-wrap text-blue-700 dark:text-blue-300">
                      {detail.hrNote}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Submission Preview
// ============================================================

interface SubmissionPreviewProps {
  detail: ApplicationDetail;
  onViewEmailSubmission?: (emailSubmissionId: number) => void;
}

function SubmissionPreview({ detail, onViewEmailSubmission }: SubmissionPreviewProps) {
  const data = detail.submissionData as SubmissionData | undefined;
  const [localExpanded, setLocalExpanded] = useState(false);

  if (!data) return null;

  const emailSubmissionId = data.emailSubmissionId;

  // Email content
  if (data.textContent) {
    const isEmail =
      data.textContent.includes("To:") ||
      data.textContent.includes("Subject:") ||
      data.textContent.includes(t("email.dear")) ||
      data.textContent.includes("Dear");
    const lines = data.textContent.split("\n");
    const shouldTruncate = lines.length > 12;
    const displayLines = localExpanded ? lines : lines.slice(0, 12);

    return (
      <div className="space-y-3">
        {/* Email type indicator */}
        {isEmail && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {t("email.submissionEmail")}
            </span>
          </div>
        )}

        {/* Email content */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          {displayLines.map((line, i) => (
            <p
              key={i}
              className={cn(
                "text-sm text-slate-700 dark:text-slate-300",
                line.trim() === "" ? "h-2" : ""
              )}>
              {line}
            </p>
          ))}
          {shouldTruncate && !localExpanded && (
            <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-400 dark:border-slate-700">
              ... +{lines.length - 12} {t("general.linesRemaining")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Expand/Collapse email */}
          {shouldTruncate && (
            <button
              type="button"
              onClick={() => setLocalExpanded(!localExpanded)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5",
                "text-xs font-medium transition-colors",
                localExpanded
                  ? "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
              )}>
              {localExpanded ? (
                <>
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  {t("common.collapse")}
                </>
              ) : (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  {t("general.viewFull")}
                  {lines.length} {t("compCodeSubmissionViewer.lines")}
                </>
              )}
            </button>
          )}

          {/* View original email */}
          {emailSubmissionId && emailSubmissionId > 0 && (
            <button
              type="button"
              onClick={() => onViewEmailSubmission?.(emailSubmissionId)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5",
                "text-xs font-medium text-blue-700 hover:bg-blue-100",
                "dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30",
                "transition-colors"
              )}>
              <Mail className="h-3.5 w-3.5" />
              {t("emailPreview.viewSubmittedEmail")}
            </button>
          )}
        </div>
      </div>
    );
  }

  // File upload (CV, etc.)
  if (data.fileUrl) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            {t("submission.submittedFile")}
          </span>
        </div>
        <a
          href={data.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5",
            "text-xs font-medium text-blue-700 hover:bg-blue-100",
            "dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30",
            "transition-colors"
          )}>
          <FileText className="h-3.5 w-3.5" />
          {t("submission.viewSubmittedFile")}
        </a>
      </div>
    );
  }

  // Quiz answers
  if (data.quizAnswers && data.quizAnswers.length > 0) {
    const correct = data.quizAnswers.filter((a) => a.isCorrect).length;
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span>
          {correct}/{data.quizAnswers.length} {t("userApplicationQuiz.correctAnswers")}
        </span>
      </div>
    );
  }

  // Code submissions (CODING round) — use IDE-style grader
  if (data.codeSubmissions && data.codeSubmissions.length > 0) {
    return <CodingRoundGrader detail={detail} />;
  }

  // Code review submissions
  if (data.codeReviewSubmissions && data.codeReviewSubmissions.length > 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400">
        <ClipboardCheck className="h-4 w-4" />
        <span>
          {data.codeReviewSubmissions.length} {t("review.issuesReviewed")}
        </span>
      </div>
    );
  }

  return null;
}

// ============================================================
// AI Feedback Panel
// ============================================================

function AIFeedbackPanel({ feedback, score }: { feedback?: AiFeedback; score?: number }) {
  if (!feedback && score === undefined) return null;

  const em = feedback?.extraMetrics as Record<string, unknown> | undefined;
  const overallMatch =
    typeof em?.["Overall CV Match"] === "number" ? (em["Overall CV Match"] as number) : null;
  const skillsMatch =
    typeof em?.["Skills Match Score"] === "number" ? (em["Skills Match Score"] as number) : null;
  const experienceMatch =
    typeof em?.["Experience Match Score"] === "number"
      ? (em["Experience Match Score"] as number)
      : null;
  const educationMatch =
    typeof em?.["Education Match Score"] === "number"
      ? (em["Education Match Score"] as number)
      : null;
  const cvReadability =
    typeof em?.["CV Readability Score"] === "number"
      ? (em["CV Readability Score"] as number)
      : null;
  const keywordDensity =
    em?.["Keyword Density"] && typeof em["Keyword Density"] === "object"
      ? (em["Keyword Density"] as Record<string, number>)
      : null;
  const redFlags = Array.isArray(em?.["Potential Red Flags"])
    ? (em["Potential Red Flags"] as string[])
    : null;

  const hasMetrics =
    overallMatch !== null ||
    skillsMatch !== null ||
    experienceMatch !== null ||
    educationMatch !== null ||
    cvReadability !== null;

  return (
    <div className="space-y-4">
      {score !== undefined && score !== null && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-base font-bold text-[#0047AB]">{score}</span>
            <span className="text-sm text-slate-400">/100</span>
          </div>
        </div>
      )}

      {feedback?.generalComment && (
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
          <p className="text-sm text-slate-700 dark:text-slate-300">{feedback.generalComment}</p>
        </div>
      )}

      {hasMetrics && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {overallMatch !== null && (
            <div className="flex flex-col items-center rounded-lg border bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
              <span className="text-2xl font-bold text-[#0047AB]">{overallMatch}</span>
              <span className="mt-0.5 text-xs text-slate-500">Overall</span>
            </div>
          )}
          {skillsMatch !== null && (
            <div className="flex flex-col items-center rounded-lg border bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {skillsMatch}
              </span>
              <span className="mt-0.5 text-xs text-slate-500">Skills</span>
            </div>
          )}
          {experienceMatch !== null && (
            <div className="flex flex-col items-center rounded-lg border bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {experienceMatch}
              </span>
              <span className="mt-0.5 text-xs text-slate-500">Experience</span>
            </div>
          )}
          {educationMatch !== null && (
            <div className="flex flex-col items-center rounded-lg border bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {educationMatch}
              </span>
              <span className="mt-0.5 text-xs text-slate-500">Education</span>
            </div>
          )}
          {cvReadability !== null && (
            <div className="flex flex-col items-center rounded-lg border bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
              <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {cvReadability}
              </span>
              <span className="mt-0.5 text-xs text-slate-500">Readability</span>
            </div>
          )}
        </div>
      )}

      {feedback?.strengths && feedback.strengths.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-green-700 dark:text-green-400">
            {t("common.strengths")}
          </p>
          <ul className="space-y-1.5">
            {feedback.strengths.slice(0, 4).map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <ThumbsUp className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback?.weaknesses && feedback.weaknesses.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-red-700 dark:text-red-400">
            {t("common.pointsForImprovement")}
          </p>
          <ul className="space-y-1.5">
            {feedback.weaknesses.slice(0, 4).map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {keywordDensity && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">{t("cv.keywords")}</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(keywordDensity)
              .filter(([, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([keyword, count]) => (
                <span
                  key={keyword}
                  className="inline-flex items-center rounded-full bg-[#0047AB]/10 px-2.5 py-1 text-xs font-medium text-[#0047AB] dark:bg-[#0047AB]/20">
                  {keyword}: {count}
                </span>
              ))}
          </div>
        </div>
      )}

      {redFlags && redFlags.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-red-500">{t("general.warning")}</p>
          <ul className="space-y-1">
            {redFlags.slice(0, 3).map((flag, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
                <span className="mt-0.5 text-red-500">⚠</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Application Grading List Page
// ============================================================

export function ApplicationGradingPage({
  onOpenGradingDetail,
  basePath,
}: {
  onOpenGradingDetail?: (_appId: number) => void;
  basePath?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardBase = basePath ?? (location.pathname.startsWith("/staff") ? "/staff" : "/admin");
  const { user } = useAuthStore();
  const isStaff = user?.role === "STAFF";

  // Staff: dùng endpoint /reviewer (lấy bài được gán)
  // Admin: dùng useApplications (lấy tất cả)
  const { data: rawApps } = useApplications();
  const { data: reviewerDetails = [] } = useApplicationDetailsForReviewer(isStaff);

  const applications = useMemo(() => (Array.isArray(rawApps) ? rawApps : []), [rawApps]);
  const [searchQuery, setSearchQuery] = useState("");

  // Staff: transform reviewerDetails (ApplicationDetail[]) to display format
  // Admin: use filtered Applications
  const staffItems = useMemo((): GradingListItem[] => {
    if (!isStaff) return [];
    return reviewerDetails.map((detail) => ({
      id: detail.applicationId!,
      status: detail.status ?? "PENDING",
      currentRoundOrder: 0,
      overallScore: detail.finalScore ?? undefined,
      detailId: detail.id,
      detailStatus: detail.status,
      detail,
    }));
  }, [isStaff, reviewerDetails]);

  const filteredApplications = useMemo((): GradingListItem[] => {
    if (isStaff) {
      return staffItems.filter((item) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!String(item.id).includes(q) && !String(item.detailId).includes(q)) return false;
        }
        return true;
      });
    }
    return applications
      .filter((app) => app.status === "IN_PROGRESS")
      .filter((app) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!String(app.id).includes(q) && !String(app.jdId ?? "").includes(q)) return false;
        }
        return true;
      })
      .map((app) => ({
        id: app.id!,
        jdId: app.jdId,
        status: app.status ?? "IN_PROGRESS",
        currentRoundOrder: app.currentRoundOrder,
        overallScore: app.overallScore,
      }));
  }, [isStaff, staffItems, applications, searchQuery]);

  const { sortedData } = useSortable(filteredApplications);

  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize: 10,
    maxVisiblePages: 5,
  });

  const paginatedData = useMemo(
    () => sortedData.slice(pagination.startIndex, pagination.endIndex + 1),
    [sortedData, pagination.startIndex, pagination.endIndex]
  );

  const inProgressCount = isStaff
    ? reviewerDetails.filter((d) => d.status !== "COMPLETED").length
    : applications.filter((a) => a.status === "IN_PROGRESS").length;

  const handleOpenGrading = useCallback(
    (_appId: number, detailId?: number) => {
      if (onOpenGradingDetail) {
        onOpenGradingDetail(detailId ?? _appId);
      } else {
        const params = new URLSearchParams({ tab: "grading-detail" });
        if (detailId !== undefined) {
          params.set("detailId", String(detailId));
        } else {
          params.set("appId", String(_appId));
        }
        navigate(`${dashboardBase}?${params.toString()}`);
      }
    },
    [navigate, onOpenGradingDetail, dashboardBase]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="border-border shrink-0 border-b bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t("adminApplicationGrading.pageTitle")}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("adminApplicationGrading.pageDescription")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500">
                {isStaff ? t("grading.submissionsToGrade") : t("userApplicationhistory.totalOrder")}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isStaff ? reviewerDetails.length : applications.length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-100 dark:border-amber-900">
            <CardContent className="pt-4">
              <p className="flex items-center gap-1 text-xs text-amber-600">
                <XCircle className="h-3.5 w-3.5" />
                {t("common.processing1")}
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{inProgressCount}</p>
            </CardContent>
          </Card>
          <Card className="border-purple-100 dark:border-purple-900">
            <CardContent className="pt-4">
              <p className="flex items-center gap-1 text-xs text-purple-600">
                <ClipboardCheck className="h-3.5 w-3.5" />
                {t("common.completed1")}
              </p>
              <p className="mt-1 text-2xl font-bold text-purple-600">
                {isStaff
                  ? reviewerDetails.filter((d) => d.status === "COMPLETED").length
                  : applications.filter((a) => a.status === "PASSED" || a.status === "FAILED")
                      .length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-green-100 dark:border-green-900">
            <CardContent className="pt-4">
              <p className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("userApplicationhistory.passed")}
              </p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {isStaff
                  ? reviewerDetails.filter((d) => d.finalResult === "PASSED").length
                  : applications.filter((a) => a.status === "PASSED").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="relative max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={t("application.searchById")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  pagination.setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {paginatedData.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={ClipboardCheck}
                  title={t("common.noDataAvailable")}
                  description={t("grading.noApplicationsToGrade")}
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        {isStaff ? (
                          <>
                            <TableHead>ID Detail</TableHead>
                            <TableHead>{t("common.status")}</TableHead>
                            <TableHead>{t("userApplicationhistory.round")}</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>ID JD</TableHead>
                            <TableHead>{t("common.status")}</TableHead>
                            <TableHead>
                              {t("userApplicationhistory.round")} {t("round.currentRound")}
                            </TableHead>
                          </>
                        )}
                        <TableHead>{t("userApplicationhistory.totalScore")}</TableHead>
                        <TableHead className="text-right">{t("common.operation")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item) => {
                        const detailId = item.detailId;
                        const status = item.detailStatus ?? item.status;
                        const score = item.overallScore;
                        const roundId = item.detail?.roundId ?? item.currentRoundOrder;
                        const jdId = item.jdId;

                        return (
                          <TableRow key={item.detailId ?? item.id}>
                            <TableCell className="font-medium">#{item.id}</TableCell>
                            {isStaff ? (
                              <>
                                <TableCell>Detail #{detailId}</TableCell>
                                <TableCell>
                                  <Badge className={STATUS_CONFIG[status ?? ""]?.className ?? ""}>
                                    {STATUS_CONFIG[status ?? ""]?.label ?? status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    {t("userApplicationhistory.round")} #{roundId ?? "-"}
                                  </span>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>{jdId ?? "-"}</TableCell>
                                <TableCell>
                                  <Badge className={STATUS_CONFIG[status ?? ""]?.className ?? ""}>
                                    {STATUS_CONFIG[status ?? ""]?.label ?? status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">
                                    {t("userApplicationhistory.round")} {roundId ?? 1}
                                  </span>
                                </TableCell>
                              </>
                            )}
                            <TableCell>
                              {score !== undefined ? (
                                <span className="font-bold text-[#0047AB]">{score}</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="default"
                                size="sm"
                                className="gap-1.5 bg-[#0047AB] text-xs hover:bg-[#003d91]"
                                onClick={() => handleOpenGrading(item.id, item.detailId)}>
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                {t("grading.grade")} {t("general.score")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                  <PaginationControl pagination={pagination} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Application Grading Detail Page (standalone — no sidebar)
// ============================================================

export function ApplicationGradingDetailPage({
  appId: appIdProp,
  detailId: detailIdProp,
  basePath,
}: {
  appId?: string;
  detailId?: string;
  basePath?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect base path from current location if not provided
  const dashboardBase = basePath ?? (location.pathname.startsWith("/staff") ? "/staff" : "/admin");
  const isStaff = dashboardBase === "/staff";

  // Staff: numericId is a detail ID  → single detail
  // Admin: numericId is an application ID → all details for that application
  const numericId = Number(appIdProp ?? detailIdProp ?? "0");
  const isValidId = Number.isFinite(numericId) && numericId > 0;

  // Staff: fetch single detail by ID
  const {
    data: singleDetail,
    isLoading: isLoadingSingle,
    refetch: refetchSingle,
  } = useApplicationDetail(numericId, isValidId && isStaff);

  // Admin: fetch all details by applicationId
  const {
    data: details = [],
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
  } = useApplicationDetails(numericId, isValidId && !isStaff);

  const isLoading = isLoadingSingle || isLoadingDetails;
  const refetch = refetchSingle || refetchDetails;

  // Email preview dialog state
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailPreviewId, setEmailPreviewId] = useState<number | null>(null);

  // Track which round to start grading (for "Chấm" button)
  const [startGradingRoundId, setStartGradingRoundId] = useState<number | null>(null);

  // Unified details array: single detail for Staff, all details for Admin
  const displayDetails = useMemo((): ApplicationDetail[] => {
    if (isStaff && singleDetail) {
      return [singleDetail];
    }
    return details;
  }, [isStaff, singleDetail, details]);

  // Expanded rounds state - track which round cards are expanded
  const [expandedRoundIds, setExpandedRoundIds] = useState<Set<number>>(() => {
    if (displayDetails.length === 0) return new Set<number>();
    const firstNeedsHr = displayDetails.find(
      (d) => d.status === "AI_EVALUATED" && (d.hrScore === undefined || d.hrScore === null)
    );
    const firstId = firstNeedsHr?.id ?? displayDetails[0]?.id;
    return firstId !== undefined ? new Set([firstId]) : new Set<number>();
  });

  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const handleViewEmailSubmission = useCallback((emailSubmissionId: number) => {
    setEmailPreviewId(emailSubmissionId);
    setEmailPreviewOpen(true);
  }, []);

  const toggleExpanded = useCallback((detailId: number) => {
    setExpandedRoundIds((prev) => {
      const next = new Set(prev);
      if (next.has(detailId)) {
        next.delete(detailId);
      } else {
        next.add(detailId);
      }
      return next;
    });
    setStartGradingRoundId(null);
  }, []);

  const handleStartGrading = useCallback((detailId: number) => {
    setStartGradingRoundId(detailId);
    setExpandedRoundIds(new Set([detailId]));
  }, []);

  const expandAll = useCallback(() => {
    setExpandedRoundIds(
      new Set(displayDetails.map((d: ApplicationDetail) => d.id!).filter(Boolean))
    );
  }, [displayDetails]);

  const collapseAll = useCallback(() => {
    setExpandedRoundIds(new Set());
  }, []);

  // Filter displayDetails based on showPendingOnly
  const filteredDetails = useMemo(() => {
    if (!showPendingOnly) return displayDetails;
    return displayDetails.filter(
      (d: ApplicationDetail) =>
        d.status === "AI_EVALUATED" && (d.hrScore === undefined || d.hrScore === null)
    );
  }, [displayDetails, showPendingOnly]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = displayDetails.length;
    const pending = displayDetails.filter(
      (d: ApplicationDetail) =>
        d.status === "AI_EVALUATED" && (d.hrScore === undefined || d.hrScore === null)
    ).length;
    const completed = displayDetails.filter((d: ApplicationDetail) => d.finalResult).length;
    const passed = displayDetails.filter(
      (d: ApplicationDetail) => d.finalResult === "PASSED"
    ).length;
    const avgScore =
      displayDetails.reduce((sum: number, d: ApplicationDetail) => sum + (d.hrScore ?? 0), 0) /
      (completed || 1);
    return { total, pending, completed, passed, avgScore: Math.round(avgScore) };
  }, [displayDetails]);

  if (!isValidId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <EmptyState
          icon={ClipboardCheck}
          title={t("error.invalidId")}
          description={t("application.selectValid")}
          action={
            <Button onClick={() => navigate(`${dashboardBase}?tab=applicationGrading`)}>
              <ChevronLeft className="h-4 w-4" />
              {t("common.backToTheList")}
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-slate-500">{t("general.loadingData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Compact header — no sidebar, just back button */}
      <div className="border-border flex h-14 shrink-0 items-center gap-3 border-b bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-slate-600 dark:text-slate-400"
          onClick={() => navigate(`${dashboardBase}?tab=applicationGrading`)}>
          <ChevronLeft className="h-4 w-4" />
          {t("common.goBack")}
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("application.detailsId")}
            {singleDetail?.applicationId ?? appIdProp}
          </h1>
          <p className="text-xs text-slate-500">
            {singleDetail ? t("round.roundDetails") : `${details.length} vòng thi`}
          </p>
        </div>

        {/* Reload button */}
        <button
          onClick={() => {
            void refetch();
          }}
          disabled={isLoading}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-slate-300/85 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          title={t("common.reload")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}>
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
      </div>

      {/* NEW LAYOUT: Single page with all rounds as expandable cards */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Summary Stats Bar */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {t("round.totalRounds")} {t("userApplicationhistory.rounds")}:
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {summaryStats.total}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("grading.needsGrading")}:
              </span>
              <span className="font-semibold text-amber-600">{summaryStats.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("grading.gradedCount")}
              </span>
              <span className="font-semibold text-green-600">{summaryStats.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-[#0047AB]">
                <Star className="h-3.5 w-3.5 fill-[#0047AB] text-[#0047AB]" />
                {t("grading.hrAverageScore")}
              </span>
              <span className="font-semibold text-[#0047AB]">{summaryStats.avgScore}</span>
            </div>
          </div>
        </div>

        {/* Filter & Actions Bar */}
        {!singleDetail && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Button
                variant={showPendingOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPendingOnly(!showPendingOnly)}
                className={cn(
                  "gap-1.5 text-xs",
                  showPendingOnly && "bg-amber-600 hover:bg-amber-700"
                )}>
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("grading.needsGrading")} ({summaryStats.pending})
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5 text-xs">
                {t("userPractice.openAll")}
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5 text-xs">
                {t("common.collapse")}
              </Button>
            </div>
          </div>
        )}

        {/* Expandable Round Cards */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredDetails.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <ClipboardCheck className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm text-slate-400">{t("application.noRounds")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDetails.map((detail: ApplicationDetail) => (
                <RoundCard
                  key={detail.id}
                  detail={detail}
                  isExpanded={expandedRoundIds.has(detail.id!)}
                  isStartGrading={startGradingRoundId === detail.id}
                  onToggle={() => toggleExpanded(detail.id!)}
                  onStartGrading={() => handleStartGrading(detail.id!)}
                  onViewEmailSubmission={handleViewEmailSubmission}
                  onHrScoreSuccess={() => {
                    setStartGradingRoundId(null);
                    void refetch();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Preview Dialog */}
      <EmailPreviewDialog
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        emailSubmissionId={emailPreviewId}
      />
    </div>
  );
}
