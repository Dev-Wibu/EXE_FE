import { PaginationControl } from "@/components/shared/PaginationControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingCardList } from "@/components/ui/loading-card";
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
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { components } from "../../../../schema-from-be";

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
    label: "Chờ nộp",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  SUBMITTED: {
    label: "Đã nộp",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  AI_EVALUATED: {
    label: "AI đã chấm",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  COMPLETED: {
    label: "Hoàn thành",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  ERROR: {
    label: "Lỗi",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

const RESULT_CONFIG: Record<string, { label: string; className: string }> = {
  PASSED: {
    label: "Đậu",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  FAILED: {
    label: "Tạch",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

// ============================================================
// Submission Preview
// ============================================================

function SubmissionPreview({ detail }: { detail: ApplicationDetail }) {
  const data = detail.submissionData as SubmissionData | undefined;
  if (!data) return null;

  if (data.textContent) {
    const isEmail = data.textContent.includes("To:") || data.textContent.includes("Subject:");
    if (isEmail) {
      const lines = data.textContent.split("\n");
      return (
        <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-800/50">
          {lines.slice(0, 12).map((line, i) => (
            <p key={i} className="text-xs text-slate-600 dark:text-slate-400">
              {line}
            </p>
          ))}
          {lines.length > 12 && (
            <p className="mt-1 text-xs text-slate-400">... +{lines.length - 12} dòng</p>
          )}
        </div>
      );
    }
    return (
      <p className="line-clamp-6 text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-400">
        {data.textContent.slice(0, 800)}
        {data.textContent.length > 800 && "..."}
      </p>
    );
  }

  if (data.fileUrl) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
        <FileText className="h-4 w-4" />
        <a href={data.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
          Xem file đã nộp
        </a>
      </div>
    );
  }

  if (data.quizAnswers && data.quizAnswers.length > 0) {
    const correct = data.quizAnswers.filter((a) => a.isCorrect).length;
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span>
          {correct}/{data.quizAnswers.length} câu đúng
        </span>
      </div>
    );
  }

  if (data.codeSubmissions && data.codeSubmissions.length > 0) {
    const passed = data.codeSubmissions.reduce(
      (sum, sub) => sum + (sub.testCases?.passedTestCases ?? 0),
      0
    );
    const total = data.codeSubmissions.reduce(
      (sum, sub) => sum + (sub.testCases?.totalTestCases ?? 0),
      0
    );
    return (
      <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
        <Star className="h-4 w-4" />
        <span>
          {passed}/{total} test case passed
        </span>
      </div>
    );
  }

  if (data.codeReviewSubmissions && data.codeReviewSubmissions.length > 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400">
        <ClipboardCheck className="h-4 w-4" />
        <span>{data.codeReviewSubmissions.length} issues đã review</span>
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
          <p className="mb-2 text-xs font-semibold text-green-700 dark:text-green-400">Điểm mạnh</p>
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
            Điểm cần cải thiện
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
          <p className="mb-2 text-xs font-medium text-slate-500">Từ khóa trong CV</p>
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
          <p className="mb-2 text-xs font-medium text-red-500">Cảnh báo</p>
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
// HR Grading Panel
// ============================================================

function HrGradingPanel({
  detail,
  onSuccess,
}: {
  detail: ApplicationDetail | null;
  onSuccess?: () => void;
}) {
  const { mutate: submitScore, isPending: isSubmitting } = useHrScore({ onSuccess });

  const aiScore = detail?.aiScore;
  const existingHrScore = detail?.hrScore;

  const needsHrScore = detail?.status === "AI_EVALUATED" && existingHrScore === undefined;
  const hasExistingGrade = existingHrScore !== undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [isPass, setIsPass] = useState(true);
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");

  const prevDetailIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (detail?.id === prevDetailIdRef.current) return;
    prevDetailIdRef.current = detail?.id ?? null;
    setIsEditing(false);
    setScore(
      existingHrScore !== undefined
        ? String(existingHrScore)
        : aiScore !== undefined
          ? String(Math.round(aiScore))
          : ""
    );
    setNote(detail?.hrNote ?? "");
    setIsPass(detail?.finalResult === "PASSED");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id]);

  if (!detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <ClipboardCheck className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-400">Chọn một vòng thi để bắt đầu chấm điểm</p>
      </div>
    );
  }

  const handleSubmit = () => {
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || score.trim() === "") {
      toast.error("Vui lòng nhập điểm hợp lệ (0 - 100)");
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
    <div className="flex h-full flex-col">
      <div className="border-border shrink-0 border-b p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {hasExistingGrade ? "Kết quả HR" : needsHrScore ? "Chấm điểm" : "Kết quả HR"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">Vòng #{detail.roundId}</p>
          </div>
          {hasExistingGrade && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5 text-xs">
              Sửa
            </Button>
          )}
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setScore(String(existingHrScore ?? aiScore ?? ""));
                setNote(detail.hrNote ?? "");
              }}
              className="gap-1.5 text-xs">
              Hủy
            </Button>
          )}
        </div>

        {hasExistingGrade && !isEditing && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border bg-slate-50 p-4 dark:bg-slate-800/50">
            <div className="flex items-center gap-1.5">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              <span className="text-3xl font-bold text-[#0047AB]">{existingHrScore}</span>
              <span className="text-base text-slate-400">/100</span>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex flex-col gap-1">
              <Badge
                className={
                  detail.finalResult === "PASSED"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                }>
                {detail.finalResult === "PASSED" ? "Đậu" : "Tạch"}
              </Badge>
              {detail.startedAt && (
                <span className="text-xs text-slate-400">{formatDateTime(detail.startedAt)}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {isEditing || needsHrScore ? (
          <div className="space-y-5">
            {aiScore !== undefined && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Star className="h-3.5 w-3.5 fill-purple-400 text-purple-400" />
                  Điểm AI tham khảo:{" "}
                  <span className="font-bold text-purple-600 dark:text-purple-400">{aiScore}</span>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Quyết định
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
                  Đậu
                </Button>
                <Button
                  type="button"
                  variant={!isPass ? "destructive" : "outline"}
                  size="sm"
                  className="flex-1 gap-1.5 text-sm"
                  onClick={() => setIsPass(false)}>
                  <ThumbsDown className="h-4 w-4" />
                  Tạch
                </Button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Điểm <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                placeholder="0 - 100"
                value={score}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setScore("");
                    return;
                  }
                  const num = parseFloat(val);
                  if (num > 100) setScore("100");
                  else if (num < 0) setScore("0");
                  else setScore(val);
                }}
                className="text-center text-2xl font-bold"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Ghi chú
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhận xét về bài làm của ứng viên..."
                rows={5}
                className="resize-none text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {detail.hrNote ? (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Ghi chú HR</p>
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="text-sm whitespace-pre-wrap text-blue-700 dark:text-blue-300">
                    {detail.hrNote}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Chưa có ghi chú từ HR.</p>
            )}
          </div>
        )}
      </div>

      {(isEditing || needsHrScore) && (
        <div className="border-border shrink-0 border-t p-5">
          <Button
            onClick={handleSubmit}
            disabled={!score.trim() || isSubmitting}
            className={cn(
              "w-full gap-2 text-sm",
              isPass ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            )}>
            {isSubmitting ? (
              <>
                <Spinner className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Lưu kết quả
              </>
            )}
          </Button>
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
  onOpenGradingDetail?: (appId: number) => void;
  basePath?: string;
}) {
  const { t } = useTranslation();
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
              <p className="text-xs text-slate-500">{isStaff ? "Bài cần chấm" : "Tổng đơn"}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isStaff ? reviewerDetails.length : applications.length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-100 dark:border-amber-900">
            <CardContent className="pt-4">
              <p className="flex items-center gap-1 text-xs text-amber-600">
                <XCircle className="h-3.5 w-3.5" />
                Đang xử lý
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{inProgressCount}</p>
            </CardContent>
          </Card>
          <Card className="border-purple-100 dark:border-purple-900">
            <CardContent className="pt-4">
              <p className="flex items-center gap-1 text-xs text-purple-600">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Đã hoàn thành
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
                Đậu
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
                placeholder="Tìm theo ID đơn..."
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
                  description="Không có đơn ứng tuyển nào cần chấm."
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
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Vòng</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>ID JD</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Vòng hiện tại</TableHead>
                          </>
                        )}
                        <TableHead>Điểm tổng</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
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
                          <TableRow key={item.id}>
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
                                    Vòng #{roundId ?? "-"}
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
                                  <span className="text-sm font-medium">Vòng {roundId ?? 1}</span>
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
                                Chấm điểm
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
  basePath,
}: {
  appId?: string;
  basePath?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect base path from current location if not provided
  const dashboardBase = basePath ?? (location.pathname.startsWith("/staff") ? "/staff" : "/admin");

  // Check if this is a valid ID
  const numericId = Number(appIdProp);
  const isValidId = Number.isFinite(numericId) && numericId > 0;

  // For Staff: fetch single detail by ID
  const {
    data: singleDetail,
    isLoading: isLoadingSingle,
    refetch: refetchSingle,
  } = useApplicationDetail(numericId, isValidId);

  // For Admin: fetch all details by applicationId
  const {
    data: details = [],
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
  } = useApplicationDetails(numericId, isValidId);

  // Use singleDetail when provided (Staff flow), otherwise use details (Admin flow)
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);

  // Staff with detailId: auto-select the detail
  // Admin with appId: auto-select pending detail or first detail
  const autoSelectedDetailId = useMemo(() => {
    if (selectedDetailId !== null) return selectedDetailId;

    // Staff flow: singleDetail is provided
    if (singleDetail) {
      return singleDetail.id ?? null;
    }

    // Admin flow: select from details list
    if (details.length === 0) return null;
    const pending = details.find(
      (d: ApplicationDetail) => d.status === "AI_EVALUATED" && d.hrScore === undefined
    );
    return pending?.id ?? details[0]?.id ?? null;
  }, [singleDetail, details, selectedDetailId]);

  const selectedDetail = useMemo(() => {
    if (singleDetail) return singleDetail;
    return details.find((d: ApplicationDetail) => d.id === autoSelectedDetailId) ?? null;
  }, [singleDetail, details, autoSelectedDetailId]);

  const isLoading = isLoadingSingle || isLoadingDetails;
  const refetch = refetchSingle || refetchDetails;

  const handleSelectDetail = useCallback((detail: ApplicationDetail) => {
    setSelectedDetailId(detail.id ?? null);
  }, []);

  if (!isValidId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <EmptyState
          icon={ClipboardCheck}
          title="ID không hợp lệ"
          description="Vui lòng chọn một đơn ứng tuyển hợp lệ."
          action={
            <Button onClick={() => navigate(`${dashboardBase}?tab=applicationGrading`)}>
              <ChevronLeft className="h-4 w-4" />
              Quay lại danh sách
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
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
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
          Quay lại
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Chi tiết đơn #{singleDetail?.applicationId ?? appIdProp}
          </h1>
          <p className="text-xs text-slate-500">
            {singleDetail ? "Vòng chi tiết" : `${details.length} vòng thi`}
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

      {/* 2-column content — fills remaining space */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Submission + AI Feedback */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          {/* Round tabs (only show for Admin with multiple details) */}
          {!singleDetail && (
            <div className="border-border shrink-0 border-b bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="mb-2 px-1 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                Các vòng thi
              </p>
              <div className="flex flex-wrap gap-2">
                {isLoading ? (
                  <LoadingCardList count={3} />
                ) : details.length === 0 ? (
                  <p className="text-xs text-slate-400">Chưa có vòng thi nào.</p>
                ) : (
                  details.map((detail: ApplicationDetail) => {
                    const statusCfg = STATUS_CONFIG[detail.status ?? ""] ?? {
                      label: detail.status,
                      className: "",
                    };
                    const resultCfg = detail.finalResult ? RESULT_CONFIG[detail.finalResult] : null;
                    const needsHrScore =
                      detail.status === "AI_EVALUATED" && detail.hrScore === undefined;
                    const isActive = detail.id === autoSelectedDetailId;

                    return (
                      <button
                        key={detail.id}
                        onClick={() => handleSelectDetail(detail)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left transition-all",
                          isActive
                            ? "border-[#0047AB] bg-[#0047AB]/5 dark:border-[#0047AB] dark:bg-[#0047AB]/10"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        )}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Vòng #{detail.roundId}
                          </span>
                          {needsHrScore && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge className={cn("px-1 py-0 text-[9px]", statusCfg.className)}>
                            {statusCfg.label}
                          </Badge>
                          {resultCfg && (
                            <Badge className={cn("px-1 py-0 text-[9px]", resultCfg.className)}>
                              {resultCfg.label}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                          {detail.hrScore !== undefined && (
                            <span className="font-bold text-[#0047AB]">{detail.hrScore}</span>
                          )}
                          {detail.aiScore !== undefined && (
                            <span className="text-purple-500">AI: {detail.aiScore}</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedDetail ? (
              <div className="space-y-6">
                {/* Round meta */}
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Vòng #{selectedDetail.roundId}
                  </h2>
                  <Badge className={STATUS_CONFIG[selectedDetail.status ?? ""]?.className}>
                    {STATUS_CONFIG[selectedDetail.status ?? ""]?.label}
                  </Badge>
                  {selectedDetail.finalResult && (
                    <Badge className={RESULT_CONFIG[selectedDetail.finalResult]?.className}>
                      {RESULT_CONFIG[selectedDetail.finalResult]?.label}
                    </Badge>
                  )}
                  {selectedDetail.status === "AI_EVALUATED" &&
                    selectedDetail.hrScore === undefined && (
                      <Badge variant="outline" className="border-amber-400 text-amber-600">
                        Cần HR chấm
                      </Badge>
                    )}
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
                  {selectedDetail.aiScore !== undefined && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-purple-400 text-purple-400" />
                      AI: {selectedDetail.aiScore}
                    </span>
                  )}
                  {selectedDetail.hrScore !== undefined && (
                    <span className="flex items-center gap-1 font-bold text-[#0047AB]">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      HR: {selectedDetail.hrScore}
                    </span>
                  )}
                  {selectedDetail.finalScore !== undefined && (
                    <span className="text-[#0047AB]">Final: {selectedDetail.finalScore}</span>
                  )}
                  {selectedDetail.startedAt && (
                    <span>{formatDateTime(selectedDetail.startedAt)}</span>
                  )}
                </div>

                <Separator />

                {selectedDetail.submissionData && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nội dung bài nộp
                    </h3>
                    <SubmissionPreview detail={selectedDetail} />
                  </div>
                )}

                <Separator />

                {(selectedDetail.aiScore !== undefined || selectedDetail.aiFeedback) && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Phản hồi từ AI
                    </h3>
                    <AIFeedbackPanel
                      feedback={selectedDetail.aiFeedback}
                      score={selectedDetail.aiScore}
                    />
                  </div>
                )}

                {selectedDetail.hrNote && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Ghi chú HR
                    </h3>
                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                      <p className="text-sm whitespace-pre-wrap text-blue-700 dark:text-blue-300">
                        {selectedDetail.hrNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ClipboardCheck className="mb-4 h-12 w-12 text-slate-300" />
                <p className="text-sm text-slate-400">Chọn một vòng thi để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: HR Grading Panel */}
        <div className="w-96 shrink-0 bg-white dark:border-slate-800 dark:bg-slate-900">
          <HrGradingPanel
            detail={selectedDetail}
            onSuccess={() => {
              void refetch();
            }}
          />
        </div>
      </div>
    </div>
  );
}
