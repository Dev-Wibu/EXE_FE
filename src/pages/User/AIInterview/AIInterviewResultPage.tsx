import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Plus,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { $api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const RESULT_MAP: Record<string, { label: string; color: string; bg: string }> = {
  STRONG_HIRE: {
    label: "Xuất sắc",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  HIRE: {
    label: "Đạt",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-900/40",
  },
  CONSIDER: {
    label: "Cần cân nhắc",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-900/40",
  },
  REJECT: {
    label: "Không đạt",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/40",
  },
};

function ResultSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

function QACard({
  qa,
  index,
}: {
  qa: {
    questionOrder?: number;
    questionText?: string;
    answerText?: string;
    feedback?: string;
    score?: number;
    suggestion?: string;
    behavioralWarnings?: string[];
  };
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = qa.score ?? 0;
  const scoreColor =
    score >= 8
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 5
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <Card>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left"
        aria-expanded={expanded}>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <span className="text-primary text-sm font-bold">{qa.questionOrder ?? index + 1}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm leading-relaxed font-medium">
              {qa.questionText ?? "Câu hỏi không có nội dung"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("text-lg font-bold", scoreColor)}>{score.toFixed(1)}</span>
            <span className="text-muted-foreground text-xs">/10</span>
            {expanded ? (
              <ChevronUp className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            )}
          </div>
        </CardContent>
      </button>
      {expanded && (
        <div className="space-y-4 border-t px-5 pt-4 pb-5">
          {qa.answerText && (
            <div className="space-y-1">
              <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
                Câu trả lời của bạn
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {qa.answerText}
              </p>
            </div>
          )}
          {qa.feedback && (
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">
                Nhận xét
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {qa.feedback}
              </p>
            </div>
          )}
          {qa.suggestion && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="mb-1 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Gợi ý cải thiện
                </span>
              </div>
              <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                {qa.suggestion}
              </p>
            </div>
          )}
          {qa.behavioralWarnings && qa.behavioralWarnings.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
              <p className="mb-1 text-xs font-semibold text-red-700 dark:text-red-300">
                Cảnh báo hành vi
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-red-600 dark:text-red-400">
                {qa.behavioralWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Progress value={score * 10} className="h-2 flex-1" />
            <span className={cn("text-sm font-bold", scoreColor)}>{score.toFixed(1)}/10</span>
          </div>
        </div>
      )}
    </Card>
  );
}

export function AIInterviewResultPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id);

  const {
    data: sessions,
    isLoading,
    isError,
  } = $api.useQuery(
    "get",
    "/api/interview-sessions/user/{userId}",
    { params: { path: { userId: userId ?? 0 } } },
    { enabled: !!userId }
  );

  const sessionList = Array.isArray(sessions) ? sessions : [];
  const session = sessionList.find((s) => String(s.id) === id);
  const detail = session?.resultDetail;
  const history = detail?.history ?? [];
  const resultConfig = RESULT_MAP[session?.result ?? ""] ?? null;

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen p-6">
        <ResultSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-foreground font-semibold">Không thể tải kết quả phỏng vấn</p>
        <p className="text-muted-foreground text-sm">Vui lòng thử lại sau</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/ai-interview")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="text-muted-foreground h-10 w-10" />
        <p className="text-foreground font-semibold">Không tìm thấy phiên phỏng vấn</p>
        <p className="text-muted-foreground text-sm">
          Phiên phỏng vấn không tồn tại hoặc đã bị xóa
        </p>
        <Button variant="outline" onClick={() => navigate("/dashboard/ai-interview")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const overallScore = session.overallScore ?? 0;

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/ai-interview")}
            className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-foreground text-2xl font-bold">Kết quả Đánh giá Phỏng vấn AI</h1>
            <p className="text-muted-foreground text-sm">
              {session.mode === "STANDARD_MOCK"
                ? "Phỏng vấn thử"
                : session.mode === "THEORY_CHECK"
                  ? "Kiểm tra lý thuyết"
                  : session.mode === "PROJECT_DEFENSE"
                    ? "Bảo vệ dự án"
                    : "Phỏng vấn AI"}{" "}
              • {session.domain ?? ""}
            </p>
          </div>
        </div>

        {/* Score Card */}
        <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] via-[#005B9A] to-[#007BFF]">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-lg text-white/80">Điểm Tổng thể</p>
            <div className="flex items-center gap-2">
              <Star className="h-10 w-10 fill-yellow-400 text-yellow-400" />
              <span className="text-6xl font-bold text-white">{overallScore.toFixed(1)}</span>
              <span className="mt-4 text-2xl text-white/70">/10</span>
            </div>
            {resultConfig && (
              <Badge className={cn("text-sm", resultConfig.bg, resultConfig.color)}>
                Kết luận: {resultConfig.label}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* AI Overview Feedback & Improvement Plan */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Overview Feedback */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-foreground text-lg">Nhận xét tổng quan</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {detail?.aiOverviewFeedback ? (
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {detail.aiOverviewFeedback}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm italic">Chưa có nhận xét</p>
              )}
            </CardContent>
          </Card>

          {/* Improvement Plan */}
          <Card className="border-l-4 border-l-amber-400">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-foreground text-lg">Kế hoạch cải thiện</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {detail?.improvementPlan ? (
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {detail.improvementPlan}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm italic">Chưa có kế hoạch</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Q&A History */}
        {history.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-primary h-5 w-5" />
              <h2 className="text-foreground text-xl font-bold">
                Chi tiết câu hỏi & trả lời ({history.length})
              </h2>
            </div>
            {history.map((qa, index) => (
              <QACard key={qa.questionOrder ?? index} qa={qa} index={index} />
            ))}
          </div>
        )}

        {/* Session metadata when no detailed result */}
        {!detail && session.status !== "COMPLETED" && (
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <MessageSquare className="text-muted-foreground h-10 w-10" />
              <p className="text-foreground font-semibold">Chưa có kết quả chi tiết</p>
              <p className="text-muted-foreground text-sm">
                Phiên phỏng vấn này chưa hoàn thành hoặc chưa được đánh giá
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard/ai-interview")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
          <Button
            onClick={() => navigate("/dashboard/ai-interview/payment")}
            className="bg-[#0047AB] text-white hover:bg-[#005B9A]">
            <Plus className="mr-2 h-4 w-4" />
            Bắt đầu Buổi Phỏng vấn Mới
          </Button>
        </div>
      </div>
    </div>
  );
}
