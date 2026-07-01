import { ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeSubmissionViewer } from "@/components/ui/code-submission-viewer";
import { EmailPreviewDialog } from "@/components/ui/email-preview-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingCardList } from "@/components/ui/loading-card";
import { RoundSubmissionDialog } from "@/components/ui/round-submission-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentRound } from "@/hooks/useRound";
import { fetchClient } from "@/lib/api";
import { formatDateTime } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { applicationService } from "@/services/application.manager";
import {
  Briefcase,
  Check,
  ChevronRight,
  FileText,
  Lock,
  Mail,
  Star,
  TrendingUp,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { components } from "../../../../schema-from-be";

// ============================================================
// Types
// ============================================================

type Application = components["schemas"]["Application"];
type ApplicationDetail = components["schemas"]["ApplicationDetail"];
type AiFeedback = components["schemas"]["AiFeedback"];
type JobDescription = components["schemas"]["JobDescription"];
type RoundType =
  | "CV_SCREENING"
  | "EMAIL_SIMULATOR"
  | "QUIZ"
  | "CODING"
  | "CODE_REVIEW"
  | "MENTOR_REVIEW"
  | "AI_INTERVIEW";

type ApplicationStatus = "IN_PROGRESS" | "PASSED" | "FAILED" | "SOFT_FAILED";
type RoundDetailStatus = "PENDING" | "SUBMITTED" | "AI_EVALUATED" | "COMPLETED" | "ERROR";

interface JdRound {
  id?: number;
  name?: string;
  roundOrder?: number;
  roundType?: RoundType | string;
  passThreshold?: number;
  configData?: {
    instruction?: string;
    timeLimitMinutes?: number;
    submissionFormat?: string;
    codingProblemsId?: number[];
    codingProblems?: components["schemas"]["CodingProblemSnapshot"][];
    quizQuestions?: components["schemas"]["QuizQuestion"][];
    codeReviewProblems?: components["schemas"]["CodeReviewProblemSnapshot"][];
    mentorInterview?: components["schemas"]["MentorInterviewDto"];
  };
}

// Map roundType -> submissionFormat (if not set in configData)
const ROUND_TYPE_FORMAT_MAP: Record<string, "file" | "text"> = {
  CV_SCREENING: "file",
  EMAIL_SIMULATOR: "text",
  QUIZ: "text",
  CODING: "text",
  CODE_REVIEW: "text",
  MENTOR_REVIEW: "text",
  AI_INTERVIEW: "text",
};

function getSubmissionFormat(round?: JdRound): "file" | "text" | "any" {
  if (!round) return "any";
  const configFormat = round.configData?.submissionFormat;
  if (configFormat === "FILE" || configFormat === "file") return "file";
  if (configFormat === "TEXT" || configFormat === "text" || configFormat === "CODE") return "text";
  return ROUND_TYPE_FORMAT_MAP[round.roundType ?? ""] ?? "any";
}

interface EnrichedApplication extends Application {
  jobTitle?: string;
  companyName?: string;
  rounds?: JdRound[];
}

// ============================================================
// Round Type Display
// ============================================================

const ROUND_TYPE_LABELS: Record<string, string> = {
  CV_SCREENING: "CV Screening",
  EMAIL_SIMULATOR: "Email Simulator",
  QUIZ: "Quiz",
  CODING: "Coding",
  CODE_REVIEW: "Code Review",
  MENTOR_REVIEW: "Mentor Interview",
  AI_INTERVIEW: "AI Interview",
};

function getRoundTypeLabel(type?: string) {
  if (!type) return "Round";
  return ROUND_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

// ============================================================
// Status Badge (Application level)
// ============================================================

function ApplicationStatusBadge({
  status,
  className: extraClassName,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const { t } = useTranslation();
  const config: Record<ApplicationStatus, { label: string; className: string }> = {
    IN_PROGRESS: {
      label: t("userApplicationhistory.statusInterviewing"),
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    PASSED: {
      label: t("userApplicationhistory.statusCompleted"),
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    FAILED: {
      label: t("userApplicationhistory.statusRejected"),
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    },
    SOFT_FAILED: {
      label: t("userApplicationhistory.needsImprovement"),
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
  };
  const { label, className } = config[status] ?? { label: status, className: "" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
        extraClassName
      )}>
      {label}
    </span>
  );
}

// ============================================================
// Round Detail Status Badge
// ============================================================

function RoundStatusBadge({ status }: { status: RoundDetailStatus }) {
  const { t } = useTranslation();
  const config: Record<RoundDetailStatus, { label: string; className: string }> = {
    PENDING: {
      label: t("userApplicationhistory.roundPending"),
      className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
    SUBMITTED: {
      label: t("userApplicationhistory.roundSubmitting"),
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    AI_EVALUATED: {
      label: t("userApplicationhistory.roundAiEvaluated"),
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
    COMPLETED: {
      label: t("userApplicationhistory.roundCompleted"),
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    ERROR: {
      label: t("userApplicationhistory.roundError"),
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    },
  };
  const { label, className } = config[status] ?? { label: status, className: "" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}>
      {label}
    </span>
  );
}

// Badge for rounds being evaluated by AI (after submission, before result)
function AIEvaluatingBadge({ roundName }: { roundName: string }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
      {roundName ? `${roundName} đang chấm...` : t("userApplicationhistory.aiEvaluating")}
    </span>
  );
}

// ============================================================
// Submission Preview
// ============================================================

function SubmissionPreview({
  detail,
  onViewEmailSubmission,
}: {
  detail: ApplicationDetail;
  onViewEmailSubmission?: (_emailSubmissionId: number) => void;
}) {
  const { t } = useTranslation();
  const sd = detail.submissionData;
  if (!sd) return null;

  const emailSubmissionId = sd.emailSubmissionId;

  return (
    <div className="mt-3 space-y-2">
      {sd.textContent && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <FileText className="h-3.5 w-3.5" />
            {t("userApplicationhistory.submittedContent")}
          </p>
          <p className="line-clamp-3 text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-300">
            {sd.textContent}
          </p>
        </div>
      )}
      {sd.fileUrl && (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <Upload className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <a
            href={sd.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#0047AB] underline hover:text-[#003d91] dark:text-[#66B2FF]">
            {t("userApplicationhistory.viewUploadedFile")}
          </a>
        </div>
      )}
      {sd.quizAnswers && sd.quizAnswers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("userApplicationhistory.quizAnswers")} ({sd.quizAnswers.length}{" "}
            {t("userApplicationhistory.questions")})
          </p>
          {sd.quizAnswers.slice(0, 3).map((qa, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                qa.isCorrect
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
              )}>
              <span className="font-mono text-slate-400">
                Q{i + 1}: {qa.selectedAnswer}
              </span>
              {qa.questionText && (
                <span className="line-clamp-1 flex-1 text-slate-500">{qa.questionText}</span>
              )}
              {qa.isCorrect ? (
                <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
              )}
            </div>
          ))}
          {sd.quizAnswers.length > 3 && (
            <p className="text-xs text-slate-400">
              +{sd.quizAnswers.length - 3} {t("userApplicationhistory.moreAnswers")}
            </p>
          )}
        </div>
      )}
      {emailSubmissionId && emailSubmissionId > 0 && (
        <button
          type="button"
          onClick={() => onViewEmailSubmission?.(emailSubmissionId)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5",
            "text-xs font-medium text-blue-700",
            "hover:border-blue-300 hover:bg-blue-100",
            "dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
            "dark:hover:border-blue-700 dark:hover:bg-blue-900/30",
            "transition-colors"
          )}>
          <Mail className="h-3.5 w-3.5" />
          {t("emailPreview.viewSubmittedEmail")}
        </button>
      )}
      {sd.codeSubmissions && sd.codeSubmissions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {sd.codeSubmissions.length > 1
              ? `${sd.codeSubmissions.length} bài nộp code`
              : t("submission.codeSubmission")}
          </p>
          {sd.codeSubmissions.map((submission, idx) => (
            <CodeSubmissionViewer
              key={idx}
              codeSubmission={submission}
              title={`Bài ${idx + 1}`}
              defaultExpanded={sd.codeSubmissions!.length === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// AI Feedback Card
// ============================================================

function AIFeedbackCard({
  feedback,
  score,
  finalResult,
  roundType,
  hrScore,
  hrNote,
}: {
  feedback?: AiFeedback;
  score?: number;
  finalResult?: string;
  roundType?: string;
  hrScore?: number;
  hrNote?: string;
}) {
  const { t } = useTranslation();
  const showAIFeedback = feedback || score !== undefined;
  const hasHRFeedback = hrScore !== undefined || hrNote;
  if (!showAIFeedback && !hasHRFeedback) return null;

  // Detect feedback type from extraMetrics shape
  const em = feedback?.extraMetrics as Record<string, unknown> | undefined;
  const hasNestedMetrics = em
    ? Object.values(em).some((v) => v !== null && typeof v === "object" && "score" in (v as object))
    : false;
  const isEmailFeedback = roundType === "EMAIL_SIMULATOR" || hasNestedMetrics;

  return (
    <div className="mt-3 space-y-2">
      {score !== undefined && score !== null && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold text-[#0047AB]">{score}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
          {finalResult && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium",
                finalResult === "PASSED"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              )}>
              {finalResult === "PASSED"
                ? t("userApplicationhistory.passed")
                : t("userApplicationhistory.failed")}
            </span>
          )}
        </div>
      )}
      {feedback?.generalComment && (
        <p className="text-xs text-slate-600 italic dark:text-slate-400">
          {feedback.generalComment}
        </p>
      )}
      {feedback?.strengths && feedback.strengths.length > 0 && (
        <div className="space-y-0.5">
          {feedback.strengths.slice(0, 2).map((s, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
              <span className="text-green-700 dark:text-green-400">{s}</span>
            </div>
          ))}
        </div>
      )}
      {feedback?.weaknesses && feedback.weaknesses.length > 0 && (
        <div className="space-y-0.5">
          {feedback.weaknesses.slice(0, 2).map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-400" />
              <span className="text-red-600 dark:text-red-400">{w}</span>
            </div>
          ))}
        </div>
      )}
      {/* extraMetrics - auto-detect format */}
      {em && Object.keys(em).length > 0 && isEmailFeedback && hasNestedMetrics
        ? (() => {
            const criteria = Object.entries(em)
              .filter(([, v]) => v !== null && typeof v === "object" && "score" in (v as object))
              .map(([key, val]) => {
                const obj = val as { score: number; maxScore: number; comment?: string };
                return {
                  name: key,
                  score: obj.score,
                  maxScore: obj.maxScore,
                  comment: obj.comment,
                };
              })
              .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore);

            return criteria.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                <div className="mb-1 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#0047AB]" />
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    {t("grading.detailedScoreByCriteria")}
                  </span>
                </div>
                {criteria.map((c) => {
                  const pct = c.maxScore > 0 ? (c.score / c.maxScore) * 100 : 0;
                  const isGood = pct >= 80;
                  const isMedium = pct >= 50 && pct < 80;
                  return (
                    <div key={c.name} className="group relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">
                          {c.name}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold",
                            isGood
                              ? "text-green-600 dark:text-green-400"
                              : isMedium
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-500 dark:text-red-400"
                          )}>
                          {c.score}/{c.maxScore}
                        </span>
                      </div>
                      <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isGood ? "bg-green-500" : isMedium ? "bg-amber-400" : "bg-red-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {c.comment && (
                        <p className="mt-0.5 hidden text-[9px] text-slate-500 italic group-hover:block">
                          {c.comment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null;
          })()
        : em && Object.keys(em).length > 0
          ? (() => {
              const overallMatch =
                typeof em["Overall CV Match"] === "number"
                  ? (em["Overall CV Match"] as number)
                  : null;
              const skillsMatch =
                typeof em["Skills Match Score"] === "number"
                  ? (em["Skills Match Score"] as number)
                  : null;
              const educationMatch =
                typeof em["Education Match Score"] === "number"
                  ? (em["Education Match Score"] as number)
                  : null;
              const keywordDensity =
                em["Keyword Density"] && typeof em["Keyword Density"] === "object"
                  ? (em["Keyword Density"] as Record<string, number>)
                  : null;
              const redFlags = Array.isArray(em["Potential Red Flags"])
                ? (em["Potential Red Flags"] as string[])
                : null;
              const experienceMatch =
                typeof em["Experience Match Score"] === "number"
                  ? (em["Experience Match Score"] as number)
                  : null;
              const cvReadability =
                typeof em["CV Readability Score"] === "number"
                  ? (em["CV Readability Score"] as number)
                  : null;
              return (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-[#0047AB]" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {t("grading.detailedAnalysisScore")}
                    </span>
                  </div>
                  {/* Match scores */}
                  <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                    {overallMatch !== null && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#0047AB]">{overallMatch}</div>
                        <div className="text-[10px] text-slate-500">Overall Match</div>
                      </div>
                    )}
                    {skillsMatch !== null && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {skillsMatch}
                        </div>
                        <div className="text-[10px] text-slate-500">Skills Match</div>
                      </div>
                    )}
                    {experienceMatch !== null && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          {experienceMatch}
                        </div>
                        <div className="text-[10px] text-slate-500">Experience</div>
                      </div>
                    )}
                    {educationMatch !== null && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {educationMatch}
                        </div>
                        <div className="text-[10px] text-slate-500">Education</div>
                      </div>
                    )}
                    {cvReadability !== null && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                          {cvReadability}
                        </div>
                        <div className="text-[10px] text-slate-500">Readability</div>
                      </div>
                    )}
                  </div>
                  {/* Keyword density for CV screening */}
                  {keywordDensity && (
                    <div className="mb-2">
                      <div className="mb-1 text-[10px] font-medium text-slate-500">
                        {t("cv.keywords")}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(keywordDensity)
                          .filter(([, count]) => count > 0)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 6)
                          .map(([keyword, count]) => (
                            <span
                              key={keyword}
                              className="inline-flex items-center rounded-full bg-[#0047AB]/10 px-2 py-0.5 text-[10px] font-medium text-[#0047AB] dark:bg-[#0047AB]/20">
                              {keyword}: {count}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  {/* Potential red flags */}
                  {redFlags && redFlags.length > 0 && (
                    <div>
                      <div className="mb-1 text-[10px] font-medium text-red-500">
                        {t("general.warning")}
                      </div>
                      <ul className="space-y-0.5">
                        {redFlags.slice(0, 2).map((flag, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1 text-[10px] text-red-600 dark:text-red-400">
                            <span className="mt-0.5 text-red-500">⚠</span>
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()
          : null}
      {/* HR Feedback */}
      {hasHRFeedback && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              {t("grading.hrReview")}
            </span>
          </div>
          {hrScore !== undefined && hrScore !== null && (
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-[#0047AB]">{hrScore}</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
          )}
          {hrNote && <p className="text-xs text-slate-600 italic dark:text-slate-400">{hrNote}</p>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Timeline Item (Round)
// ============================================================

function RoundTimelineItem({
  detail,
  round,
  index,
  totalRounds,
  isCompleted,
  isCurrent,
  isLocked,
  onEnterRoom,
  onViewEmailSubmission,
  isPolling,
  optimistic,
}: {
  detail?: ApplicationDetail;
  round?: JdRound;
  index: number;
  totalRounds: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  onEnterRoom?: () => void;
  onViewEmailSubmission?: (_emailSubmissionId: number) => void;
  isPolling?: boolean;
  optimistic?: { isOptimistic: true; roundId: number; status: "SUBMITTED"; submittedAt: string };
}) {
  const { t } = useTranslation();
  const status = detail?.status as RoundDetailStatus | undefined;
  const roundName = round?.name ?? getRoundTypeLabel(round?.roundType);
  const score = detail?.finalScore;
  const aiScore = detail?.aiScore;
  const aiFeedback = detail?.aiFeedback;
  const submissionData = detail?.submissionData;

  if (isLocked) {
    return (
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white dark:bg-slate-800">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
          </div>
          {index < totalRounds - 1 && (
            <div className="mt-2 w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
          )}
        </div>
        <div className="flex-1 pb-8">
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <h4 className="text-sm font-medium text-slate-400">
              {t("userApplicationhistory.nextRound")}
            </h4>
            <p className="mt-1 text-xs text-slate-300 dark:text-slate-600">
              {t("userApplicationhistory.roundInfoLocked")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Status: use real detail status, or optimistic "SUBMITTED"
  const effectiveStatus: RoundDetailStatus | "SUBMITTED" | undefined =
    status ?? (optimistic ? "SUBMITTED" : undefined);

  const displayScore = detail?.hrScore ?? score ?? aiScore;

  // Rounds that are submitted but AI hasn't finished evaluating yet
  const isPendingAI = effectiveStatus === "SUBMITTED" || effectiveStatus === "PENDING";
  const isEvaluating = isPendingAI && isPolling;

  return (
    <div className="flex gap-4">
      {/* Connector */}
      <div className="flex flex-col items-center">
        {isCompleted ? (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0047AB] ring-4 ring-[#0047AB]/20">
              <Check className="h-4 w-4 text-white" />
            </div>
            {index < totalRounds - 1 && (
              <div className="mt-2 w-0.5 flex-1 bg-[#0047AB]/30 dark:bg-[#0047AB]/40" />
            )}
          </>
        ) : isEvaluating ? (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-purple-400 bg-white shadow-sm dark:bg-slate-800">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-purple-500" />
            </div>
            {index < totalRounds - 1 && (
              <div className="mt-2 w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
            )}
          </>
        ) : isCurrent ? (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#0047AB] bg-white shadow-sm dark:bg-slate-800">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#0047AB]" />
            </div>
            {index < totalRounds - 1 && (
              <div className="mt-2 w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
            )}
          </>
        ) : (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-xs font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
              {index + 1}
            </div>
            {index < totalRounds - 1 && (
              <div className="mt-2 w-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
            )}
          </>
        )}
      </div>

      {/* Content Card */}
      <div className="flex-1 pb-8">
        <div
          className={cn(
            "rounded-lg border p-4 transition-all",
            isCompleted &&
              "border-[#0047AB]/20 bg-[#0047AB]/5 dark:border-[#0047AB]/40 dark:bg-[#0047AB]/10",
            isEvaluating &&
              "border-purple-300 bg-purple-50/50 dark:border-purple-700/40 dark:bg-purple-900/10",
            isCurrent &&
              "border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800",
            !isCompleted &&
              !isCurrent &&
              !isEvaluating &&
              "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          )}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* Left */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {roundName}
                </h4>
                {isEvaluating ? (
                  <AIEvaluatingBadge roundName="" />
                ) : effectiveStatus ? (
                  <RoundStatusBadge status={effectiveStatus} />
                ) : null}
                {isCurrent && !isEvaluating && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {t("userApplicationhistory.current")}
                  </span>
                )}
              </div>

              {isEvaluating && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
                  {t("userApplicationhistory.aiEvaluatingDetail")}
                </p>
              )}

              {submissionData && (
                <SubmissionPreview detail={detail!} onViewEmailSubmission={onViewEmailSubmission} />
              )}

              {(aiScore !== undefined ||
                aiFeedback ||
                detail?.hrScore !== undefined ||
                detail?.hrNote) && (
                <AIFeedbackCard
                  feedback={aiFeedback}
                  score={aiScore}
                  finalResult={detail?.finalResult}
                  roundType={round?.roundType}
                  hrScore={detail?.hrScore}
                  hrNote={detail?.hrNote}
                />
              )}
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-3">
              {displayScore !== undefined && displayScore !== null && (
                <div className="text-right">
                  <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    {t("userApplicationhistory.result")}
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-[#0047AB]">
                    {displayScore}
                    <span className="text-sm font-normal text-slate-400">/100</span>
                  </p>
                </div>
              )}
              {isCurrent && !isEvaluating && (
                <Button
                  onClick={onEnterRoom}
                  size="sm"
                  className="shrink-0 bg-[#0047AB] text-white hover:bg-[#003d91]">
                  {t("userApplicationhistory.enterRoom")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Application Detail Panel
// ============================================================

function ApplicationDetailPanel({
  application,
  onSubmissionSuccess,
}: {
  application: EnrichedApplication;
  onSubmissionSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id, status } = application;
  const rounds = useMemo(() => application.rounds ?? [], [application.rounds]);
  const totalRounds = rounds.length;

  // Fetch current round from API as source of truth
  const { data: apiCurrentRound, refetch: refetchCurrentRound } = useCurrentRound(id ?? 0, !!id);
  const apiCurrentRoundOrder = apiCurrentRound?.roundOrder ?? -1;

  // DEBUG: Log current round changes
  console.log(
    "[DEBUG][ApplicationDetailPanel] applicationId:",
    id,
    "apiCurrentRound:",
    apiCurrentRound,
    "apiCurrentRoundOrder:",
    apiCurrentRoundOrder
  );

  const [detailsData, setDetailsData] = useState<ApplicationDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // DEBUG: Log rounds and details after state init
  console.log(
    "[DEBUG][ApplicationDetailPanel] JD rounds:",
    JSON.stringify(rounds),
    "detailsData:",
    JSON.stringify(detailsData)
  );

  // Submission dialog state
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [submissionRound, setSubmissionRound] = useState<JdRound | undefined>();
  const [submissionDetail, setSubmissionDetail] = useState<ApplicationDetail | undefined>();

  // Email preview dialog state
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailPreviewId, setEmailPreviewId] = useState<number>(0);

  // Optimistic placeholder for rounds submitted but AI not yet evaluated.
  // Used when BE hasn't created the ApplicationDetail record yet (PENDING state).
  interface OptimisticDetail {
    isOptimistic: true;
    roundId: number;
    status: "SUBMITTED";
    submittedAt: string;
  }
  const [optimisticDetails, setOptimisticDetails] = useState<OptimisticDetail[]>([]);

  // Polling state for AI evaluation results
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDetails = async (silent = false) => {
    console.log("[DEBUG][fetchDetails] called for applicationId:", id, "silent:", silent);
    if (!id) return;
    if (!silent) setDetailsLoading(true);
    try {
      const result = await fetchClient.GET("/api/application-details/application/{applicationId}", {
        params: { path: { applicationId: id } },
      });
      console.log(
        "[DEBUG][fetchDetails] response:",
        result.response?.ok,
        "data count:",
        Array.isArray(result.data) ? result.data.length : "n/a"
      );
      if (result.response?.ok) {
        const data = result.data;
        setDetailsData(Array.isArray(data) ? (data as ApplicationDetail[]) : []);
        return Array.isArray(data) ? data : [];
      }
    } catch (err) {
      console.log("[DEBUG][fetchDetails] error:", err);
    } finally {
      if (!silent) setDetailsLoading(false);
    }
    return [];
  };

  // Auto-poll for AI evaluation results after submission
  const startPolling = () => {
    if (pollingRef.current) return; // already polling
    setIsPolling(true);
    let elapsed = 0;
    const maxPollingMs = 120_000; // 2 minutes max

    pollingRef.current = setInterval(async () => {
      elapsed += 5_000;
      const details = await fetchDetails(true);
      if (!Array.isArray(details)) {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setIsPolling(false);
        return;
      }

      // Check if any pending detail has been evaluated (has aiScore or finalScore)
      const hasPendingDetails = details.some(
        (d: ApplicationDetail) => d.status === "SUBMITTED" || d.status === "PENDING"
      );
      const hasResults = details.some(
        (d: ApplicationDetail) =>
          d.status === "AI_EVALUATED" || d.status === "COMPLETED" || d.status === "ERROR"
      );

      if (hasResults || !hasPendingDetails) {
        // AI done or no pending rounds → stop polling
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setIsPolling(false);
        if (hasResults) {
          toast.success(t("userApplicationhistory.aiEvaluationComplete"));
          // Refetch current round to get updated currentRoundOrder from API
          refetchCurrentRound();
        }
        return;
      }

      if (elapsed >= maxPollingMs) {
        // Timeout
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setIsPolling(false);
        toast.warning(t("userApplicationhistory.aiEvaluationTimeout"));
      }
    }, 5_000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  // Stop polling when application changes
  useEffect(() => {
    stopPolling();
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Build timeline: use JD rounds as source of truth, enriched with detailsData + optimistic details
  // IMPORTANT: Only BE's currentRoundOrder controls which round is "current" / unlocked.
  // AI evaluation status (AI_EVALUATED) does NOT advance the user to the next round.
  // HR must manually advance currentRoundOrder after reviewing AI results.
  const timelineRounds = useMemo(() => {
    if (rounds.length === 0) return [];
    const sortedRounds = [...rounds].sort((a, b) => (a.roundOrder ?? 0) - (b.roundOrder ?? 0));
    const currentRoundIds = new Set(rounds.map((r) => r.id));
    const orphanedDetails = detailsData.filter((d) => !currentRoundIds.has(d.roundId));
    let orphanIdx = 0;

    return sortedRounds.map((round) => {
      let detail = detailsData.find((d) => d.roundId === round.id);
      const optimistic = optimisticDetails.find((o) => o.roundId === round.id);

      if (!detail && orphanIdx < orphanedDetails.length) {
        detail = orphanedDetails[orphanIdx++];
      }
      const hasSubmission = !!detail || !!optimistic;

      // This round is completed if:
      // 1. Overall application is PASSED/FAILED/SOFT_FAILED, OR
      // 2. BE says this round is before current round (roundOrder < currentRoundOrder)
      // Note: AI_EVALUATED status alone does NOT mark a round as completed for user-facing UI
      // because HR review may still be pending. A round only "completes" when:
      //   - Application is overall PASSED, OR
      //   - Application is overall FAILED/SOFT_FAILED, OR
      //   - This round's roundOrder is strictly before currentRoundOrder (BE has officially advanced)
      //
      // SAFEGUARD: If currentRoundOrder exceeds total rounds + 1 (BE may have auto-advanced
      // after AI eval and skipped ahead), only mark completed if there's a real submission.
      // This prevents CODING rounds from being auto-marked completed when BE advanced
      // past them after AI scored the previous QUIZ round.
      const isSafeguardedByMissingSubmission =
        apiCurrentRoundOrder > totalRounds && status === "IN_PROGRESS" && !detail && !optimistic;
      const isCompleted = isSafeguardedByMissingSubmission
        ? false
        : status === "PASSED" || status === "FAILED" || status === "SOFT_FAILED"
          ? true
          : (round.roundOrder ?? 0) < apiCurrentRoundOrder;

      // This round is current if:
      // 1. Application is still IN_PROGRESS
      // 2. No submission yet
      // 3. BE says this is the current round (roundOrder === currentRoundOrder)
      // SAFEGUARD: If currentRoundOrder > totalRounds (BE auto-advanced after AI eval),
      // treat the first uncompleted round as current so user can enter and do it.
      const roundsBeforeCurrent = sortedRounds.slice(
        0,
        sortedRounds.findIndex((r) => r.id === round.id)
      );
      const hasSubmissionBefore = roundsBeforeCurrent.some((r) => {
        const d = detailsData.find((detail) => detail.roundId === r.id);
        const o = optimisticDetails.find((opt) => opt.roundId === r.id);
        return !!d || !!o;
      });
      const isCurrent =
        status === "PASSED" || status === "FAILED" || status === "SOFT_FAILED"
          ? false
          : hasSubmission
            ? false
            : round.roundOrder === apiCurrentRoundOrder ||
              (apiCurrentRoundOrder > totalRounds &&
                status === "IN_PROGRESS" &&
                !hasSubmission &&
                !hasSubmissionBefore);

      // This round is locked if:
      // 1. Application still active
      // 2. This round's roundOrder is after the BE's current round
      // SAFEGUARD: If currentRoundOrder exceeds total rounds + 1 (BE auto-advanced after AI eval
      // and skipped ahead), treat all remaining rounds as NOT locked so user can still do them.
      const isLocked =
        !(status === "PASSED" || status === "FAILED" || status === "SOFT_FAILED") &&
        (apiCurrentRoundOrder > totalRounds
          ? false
          : (round.roundOrder ?? 0) > apiCurrentRoundOrder);

      return { round, detail, optimistic, isCompleted, isCurrent, isLocked };
    });
  }, [rounds, detailsData, optimisticDetails, apiCurrentRoundOrder, status, totalRounds]);

  const handleEnterRoom = (round: JdRound, detail?: ApplicationDetail) => {
    // If this is a QUIZ round, navigate to the quiz page
    if (round.roundType === "QUIZ") {
      // Get JD ID from the application (passed via context)
      const jdId = (application as unknown as { jdId?: number }).jdId ?? 0;
      navigate(`/user/quiz/${application.id}/round/${round.id}?jdId=${jdId}`);
      return;
    }

    setSubmissionRound(round);
    setSubmissionDetail(detail);
    setSubmissionOpen(true);
  };

  const handleViewEmailSubmission = (emailSubmissionId: number) => {
    setEmailPreviewId(emailSubmissionId);
    setEmailPreviewOpen(true);
  };

  const handleSubmissionSuccess = (result?: {
    status?: string;
    message?: string;
    detail?: ApplicationDetail;
  }) => {
    setSubmissionOpen(false);
    // Always show the BE message (e.g. "Bài đang được chấm, vui lòng chờ")
    if (result?.message) {
      toast.success(result.message);
    } else {
      toast.success(t("common.applicationSubmittedSuccessfully"));
    }

    // If BE returned a real detail immediately (e.g. QUIZ sync), use it
    if (result?.detail) {
      setDetailsData((prev) => {
        const exists = prev.find((d) => d.id === result.detail!.id);
        if (exists) {
          return prev.map((d) => (d.id === result.detail!.id ? result.detail! : d));
        }
        return [...prev, result.detail!];
      });
      // Remove any optimistic entry for this round
      setOptimisticDetails((prev) => prev.filter((o) => o.roundId !== result.detail!.roundId));
    } else {
      // BE returned PENDING — create optimistic placeholder for the submitted round
      const submittedRoundId = submissionRound?.id;
      if (submittedRoundId) {
        setOptimisticDetails((prev) => {
          // Replace if exists (user re-submitted same round), else add
          const filtered = prev.filter((o) => o.roundId !== submittedRoundId);
          return [
            ...filtered,
            {
              isOptimistic: true as const,
              roundId: submittedRoundId,
              status: "SUBMITTED" as const,
              submittedAt: new Date().toISOString(),
            },
          ];
        });
      }
    }

    // Start polling to detect when AI finishes evaluation
    startPolling();
    // Also refetch current round in case BE updated it immediately (e.g. sync rounds)
    refetchCurrentRound();
    onSubmissionSuccess?.();
  };

  if (detailsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Header Card */}
      <Card className="mb-4 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] via-[#005B9A] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-200">
              <Briefcase className="h-7 w-7 text-[#0047AB]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-white">
                {application.jobTitle ?? t("userApplicationhistory.noTitle")}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-white/80">
                {application.companyName ?? t("userApplicationhistory.company")}
              </p>
            </div>
          </div>
          {totalRounds > 0 && (
            <div className="hidden text-right text-white sm:block">
              <p className="text-xs font-medium tracking-wide text-white/70 uppercase">
                {t("userApplicationhistory.overallProgress")}
              </p>
              <div className="mt-1 flex items-center justify-end gap-2">
                <div className="h-2 w-24 rounded-full bg-white/30">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width: `${
                        totalRounds > 0
                          ? (Math.min(apiCurrentRoundOrder, totalRounds) / totalRounds) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold">
                  {apiCurrentRoundOrder}/{totalRounds}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t("userApplicationhistory.interviewPipeline")}
          </CardTitle>
          <CardDescription>{t("userApplicationhistory.pageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {totalRounds === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Briefcase className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("userApplicationhistory.noRoundsAvailable")}
              </p>
            </div>
          ) : (
            timelineRounds.map((item, idx) => (
              <RoundTimelineItem
                key={item.round?.id ?? idx}
                detail={item.detail}
                round={item.round}
                index={idx}
                totalRounds={totalRounds}
                isCompleted={item.isCompleted}
                isCurrent={item.isCurrent}
                isLocked={item.isLocked}
                isPolling={isPolling}
                optimistic={item.optimistic}
                onEnterRoom={
                  item.isCurrent ? () => handleEnterRoom(item.round, item.detail) : undefined
                }
                onViewEmailSubmission={handleViewEmailSubmission}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Submission Dialog */}
      <RoundSubmissionDialog
        open={submissionOpen}
        onOpenChange={(open) => {
          if (!open) setSubmissionOpen(false);
        }}
        applicationId={id ?? 0}
        roundId={submissionRound?.id}
        roundName={submissionRound?.name ?? getRoundTypeLabel(submissionRound?.roundType)}
        roundType={submissionRound?.roundType}
        instruction={submissionRound?.configData?.instruction}
        submissionFormat={getSubmissionFormat(submissionRound)}
        currentFileUrl={submissionDetail?.submissionData?.fileUrl}
        currentTextContent={submissionDetail?.submissionData?.textContent}
        emailSubmissionId={submissionDetail?.submissionData?.emailSubmissionId}
        codingProblems={submissionRound?.configData?.codingProblems}
        codingProblemsId={submissionRound?.configData?.codingProblemsId}
        timeLimitMinutes={submissionRound?.configData?.timeLimitMinutes}
        onSuccess={handleSubmissionSuccess}
      />

      {/* Email Preview Dialog */}
      <EmailPreviewDialog
        open={emailPreviewOpen}
        onOpenChange={(open) => {
          if (!open) setEmailPreviewOpen(false);
        }}
        emailSubmissionId={emailPreviewId}
      />
    </>
  );
}

// ============================================================
// Application Card
// ============================================================

function ApplicationCard({
  application,
  isSelected,
  onClick,
}: {
  application: EnrichedApplication;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer overflow-hidden transition-all hover:shadow-md",
        isSelected && "border-[#0047AB] bg-[#0047AB]/5 ring-2 ring-[#0047AB]/20"
      )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <Briefcase className="h-5 w-5 text-[#0047AB]" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <CardTitle className="truncate text-sm">
              {application.jobTitle ?? t("userApplicationhistory.noTitle")}
            </CardTitle>
            <CardDescription className="truncate">
              {application.companyName ?? t("userApplicationhistory.company")}
            </CardDescription>
          </div>
          <ApplicationStatusBadge
            status={application.status as ApplicationStatus}
            className="shrink-0"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-500">
            {application.createdAt ? formatDateTime(application.createdAt) : ""}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Page
// ============================================================

export function ApplicationHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

  // Fetch applications
  const [apps, setApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState(false);
  const [refetching, setRefetching] = useState(false);

  const loadApplications = async (showRefetching = false) => {
    if (showRefetching) setRefetching(true);
    else setAppsLoading(true);
    try {
      const result = await applicationService.getMyApplications();
      if (result.success) {
        setApps(result.data ?? []);
        setAppsError(false);
      } else {
        setAppsError(true);
      }
    } catch {
      setAppsError(true);
    } finally {
      setAppsLoading(false);
      setRefetching(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Batch fetch JD data for all applications
  const [jdMap, setJdMap] = useState<
    Map<number, { title?: string; companyName?: string; rounds?: JdRound[]; companyId?: number }>
  >(new Map());

  useEffect(() => {
    const jdIds = [...new Set(apps.map((a) => a.jdId).filter(Boolean))] as number[];
    if (jdIds.length === 0) return;

    const fetchJDs = async () => {
      const results = await Promise.allSettled(
        jdIds.map(async (id) => {
          const result = await fetchClient.GET("/api/job-descriptions/{id}", {
            params: { path: { id } },
          });
          if (!result.response?.ok) return null;
          const jd = result.data as JobDescription;
          // Backend may return extra fields like companyName not in schema
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const extra = result.data as any;
          return {
            title: jd.title,
            companyName: extra.companyName,
            rounds: extra.rounds as JdRound[],
            companyId: extra.companyId,
          };
        })
      );

      const map = new Map<
        number,
        { title?: string; companyName?: string; rounds?: JdRound[]; companyId?: number }
      >();
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) {
          map.set(jdIds[i], {
            title: r.value.title,
            companyName: r.value.companyName,
            rounds: r.value.rounds,
            companyId: r.value.companyId,
          });
        }
      });
      setJdMap(map);
    };
    fetchJDs();
  }, [apps]);

  // Enrich applications with JD data
  const enrichedApplications = useMemo<EnrichedApplication[]>(() => {
    return apps.map((app) => {
      const jd = jdMap.get(app.jdId ?? 0);
      return {
        ...app,
        jobTitle: jd?.title,
        companyName: jd?.companyName,
        rounds: jd?.rounds,
        companyId: jd?.companyId,
      };
    });
  }, [apps, jdMap]);

  // Filter
  const filteredApplications = useMemo(() => {
    let items = enrichedApplications;
    if (statusFilter !== "all") {
      items = items.filter((app) => app.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (app) =>
          app.jobTitle?.toLowerCase().includes(q) || app.companyName?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [enrichedApplications, statusFilter, searchQuery]);

  // Auto-select first
  const selectedApplication = useMemo(() => {
    if (selectedAppId) {
      return (
        filteredApplications.find((app) => app.id === selectedAppId) ??
        filteredApplications[0] ??
        null
      );
    }
    return filteredApplications[0] ?? null;
  }, [filteredApplications, selectedAppId]);

  // Pagination
  const [pageSize] = useState(10);
  const [page, setPage] = useState(1);
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, page, pageSize]);
  const totalPages = Math.ceil(filteredApplications.length / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("userApplicationhistory.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("userApplicationhistory.pageDescription")}
          </p>
        </div>
        <ReloadButton
          onReload={() => loadApplications(true)}
          isLoading={refetching}
          tooltip={t("userApplicationhistory.reload")}
        />
      </div>

      {/* Controls Card */}
      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <div className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              placeholder={t("userApplicationhistory.searchPlaceholder")}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as ApplicationStatus | "all");
              setPage(1);
            }}>
            <SelectTrigger className="w-full min-w-[200px]">
              <SelectValue placeholder={t("userApplicationhistory.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("userApplicationhistory.allStatus")}</SelectItem>
              <SelectItem value="IN_PROGRESS">
                {t("userApplicationhistory.statusInterviewing")}
              </SelectItem>
              <SelectItem value="PASSED">{t("userApplicationhistory.statusCompleted")}</SelectItem>
              <SelectItem value="FAILED">{t("userApplicationhistory.statusRejected")}</SelectItem>
              <SelectItem value="SOFT_FAILED">
                {t("userApplicationhistory.needsImprovement")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left: Application List */}
        <div className="relative flex max-h-[calc(100vh-14rem)] min-w-0 flex-col overflow-hidden lg:col-span-4">
          <span className="mb-2 shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("userApplicationhistory.applications")} ({filteredApplications.length})
          </span>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {appsLoading ? (
              <LoadingCardList count={4} />
            ) : appsError ? (
              <Card className="flex h-48 flex-col items-center justify-center gap-4 p-6">
                <XCircle className="h-8 w-8 text-red-500" />
                <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">
                  {t("userApplicationhistory.unableToDownload")}
                </p>
                <Button variant="outline" size="sm" onClick={() => loadApplications()}>
                  {t("userApplicationhistory.retry")}
                </Button>
              </Card>
            ) : pageData.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title={t("userApplicationhistory.noApplicationsYet")}
                description={t("userApplicationhistory.findJobsDescription")}
                action={
                  <Button
                    onClick={() => navigate("/enterprise/companies")}
                    className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
                    <Briefcase className="h-4 w-4" />
                    {t("userApplicationhistory.findAJobNow")}
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-3">
                {pageData.map((app) => (
                  <ApplicationCard
                    key={`app-${app.id}`}
                    application={app}
                    isSelected={selectedApplication?.id === app.id}
                    onClick={() => setSelectedAppId(app.id ?? null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t("userApplicationhistory.page")}</span>
                <Select value={String(page)} onValueChange={(v) => setPage(Number(v))}>
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-slate-500">/ {totalPages}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}>
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}>
                  →
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Detail Panel */}
        <div className="min-w-0 overflow-hidden lg:col-span-8">
          {selectedApplication ? (
            <ApplicationDetailPanel
              application={selectedApplication}
              onSubmissionSuccess={() => loadApplications(true)}
            />
          ) : (
            <Card className="flex h-96 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Briefcase className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("userApplicationhistory.selectApplication")}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
