import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Info,
  Layers,
  Lightbulb,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { $api } from "@/lib/api";
import { formatDateTime } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { practiceSetManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { SelectRoadmapModal } from "./components/SelectRoadmapModal";

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

const MODE_LABELS: Record<string, string> = {
  STANDARD_MOCK: "Phỏng vấn thử",
  THEORY_CHECK: "Kiểm tra lý thuyết",
  PROJECT_DEFENSE: "Bảo vệ dự án",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  FRESHER_BASIC: "Fresher cơ bản",
  FRESHER_ADVANCED: "Fresher nâng cao",
};

const LANGUAGE_LABELS: Record<string, string> = {
  VI: "Tiếng Việt",
  EN: "English",
};

const DOMAIN_LABELS: Record<string, string> = {
  IT: "Công nghệ thông tin (IT)",
  NON_IT: "Ngoài IT",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  CREATED: { label: "Đã tạo", className: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Đang diễn ra", className: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
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
  followUps,
}: {
  qa: {
    questionType?: string;
    questionOrder?: number;
    questionText?: string;
    answerText?: string;
    feedback?: string;
    score?: number;
    suggestion?: string;
    behavioralWarnings?: string[];
  };
  index: number;
  followUps?: (typeof qa)[];
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
            {qa.questionType && (
              <div className="mb-1">
                {qa.questionType === "BLUEPRINT" ? (
                  <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Câu chính
                  </span>
                ) : qa.questionType === "FOLLOW_UP" ? (
                  <span className="inline-flex items-center rounded-full border border-violet-300 bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:border-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    Câu tiếp theo
                  </span>
                ) : null}
              </div>
            )}
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
      {/* Follow-up questions grouped under this blueprint */}
      {followUps && followUps.length > 0 && (
        <div className="border-t px-5 pt-3 pb-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            Câu hỏi tiếp theo ({followUps.length})
          </p>
          <div className="space-y-2 border-l-2 border-violet-200 pl-4 dark:border-violet-800">
            {followUps.map((fu, fuIdx) => (
              <QACard key={fu.questionOrder ?? fuIdx} qa={fu} index={fuIdx} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function AIInterviewResultPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const {
    data: session,
    isLoading,
    isError,
  } = $api.useQuery(
    "get",
    "/api/interview-sessions/{sessionId}",
    { params: { path: { sessionId: Number(id) } } },
    { enabled: !!id }
  );

  // Kiểm tra số lượng lộ trình lợn tập đã tạo cho session này
  const { data: existingPracticeSets = [], refetch: refetchPracticeSets } = $api.useQuery(
    "get",
    "/api/practice-sets/interview-session/{interviewSessionId}",
    { params: { path: { interviewSessionId: Number(id) } } },
    { enabled: !!id }
  );

  const handleCreateRoadmap = async (dateNumber: number) => {
    setRoadmapLoading(true);
    try {
      const result = await practiceSetManager.createByAI({
        userId: user?.id,
        aiInterviewId: Number(id),
        dateNumber,
      });
      if (result.success) {
        setRoadmapOpen(false);
        toast.success("Đã tạo lộ trình luyện tập thành công!");
        void refetchPracticeSets();
        // Điều hướng theo interviewSessionId để tải toàn bộ lộ trình của session
        navigate(`/user/practice/session/${id}`);
      } else {
        toast.error(result.error ?? "Không thể tạo lộ trình luyện tập");
      }
    } catch {
      toast.error("Không thể tạo lộ trình luyện tập");
    } finally {
      setRoadmapLoading(false);
    }
  };

  const detail = session?.resultDetail;
  const history = detail?.history ?? [];
  const resultConfig = RESULT_MAP[session?.result ?? ""] ?? null;

  type QAItem = (typeof history)[number];

  // Nhóm các câu FOLLOW_UP vào sau câu BLUEPRINT tương ứng
  const groupedHistory = (() => {
    const groups: { blueprint: QAItem; followUps: QAItem[] }[] = [];
    for (const qa of history) {
      if (qa.questionType === "FOLLOW_UP" && groups.length > 0) {
        groups[groups.length - 1].followUps.push(qa);
      } else {
        groups.push({ blueprint: qa, followUps: [] });
      }
    }
    return groups;
  })();

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
        <Button variant="outline" onClick={() => navigate("/user?tab=aiInterview")}>
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
        <Button variant="outline" onClick={() => navigate("/user?tab=aiInterview")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // CANCELLED session — hiển thị card riêng vì không có điểm/kết quả
  if (session.status === "CANCELLED") {
    const cfg = session.sessionConfig;
    return (
      <div className="bg-background min-h-screen p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/user?tab=aiInterview")}
              className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-foreground text-2xl font-bold">Kết quả Phỏng vấn AI</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {MODE_LABELS[session.mode ?? ""] ?? session.mode ?? "Phỏng vấn AI"}
              </p>
            </div>
          </div>
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-foreground text-xl font-bold">Phiên phỏng vấn đã bị hủy</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Phiên này đã bị hủy và không có kết quả đánh giá.
                </p>
              </div>
              <div className="w-full max-w-xs space-y-2 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chế độ</span>
                  <span className="font-medium">
                    {MODE_LABELS[session.mode ?? ""] ?? session.mode ?? "—"}
                  </span>
                </div>
                {cfg?.difficulty && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Độ khó</span>
                    <span>{DIFFICULTY_LABELS[cfg.difficulty] ?? cfg.difficulty}</span>
                  </div>
                )}
                {cfg?.language && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngôn ngữ</span>
                    <span>{LANGUAGE_LABELS[cfg.language] ?? cfg.language}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạo lúc</span>
                  <span>{formatDateTime(session.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => navigate("/user?tab=aiInterview")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại danh sách
                </Button>
                <Button
                  onClick={() => navigate("/user/ai-interview/setup")}
                  className="bg-[#0047AB] text-white hover:bg-[#005B9A]">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phỏng vấn mới
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const overallScore = session.overallScore ?? 0;
  const cfg = session.sessionConfig;
  const profile = session.candidateProfile;
  const blueprint = session.blueprint;
  const statusConfig = STATUS_LABELS[session.status ?? ""] ?? {
    label: session.status ?? "",
    className: "bg-gray-100 text-gray-700",
  };
  const jobTitle = (session.jobRequirement?.basic_info as Record<string, string> | undefined)
    ?.job_title;

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/user?tab=aiInterview")}
            className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-foreground text-2xl font-bold">Kết quả Đánh giá Phỏng vấn AI</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {MODE_LABELS[session.mode ?? ""] ?? session.mode ?? "Phỏng vấn AI"}
              {session.domain ? ` • ${DOMAIN_LABELS[session.domain] ?? session.domain}` : ""}
              {cfg?.difficulty ? ` • ${DIFFICULTY_LABELS[cfg.difficulty] ?? cfg.difficulty}` : ""}
              {cfg?.language ? ` • ${LANGUAGE_LABELS[cfg.language] ?? cfg.language}` : ""}
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

        {/* ────────────────────────────────────────────────────────────────
            Session info + Candidate profile grid
        ──────────────────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Session config card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-foreground text-base">Thông tin phiên</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
                {/* Status */}
                <span className="text-muted-foreground">Ấnh hưởng</span>
                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                {/* Mode */}
                <span className="text-muted-foreground">Chế độ</span>
                <span className="text-foreground font-medium">
                  {MODE_LABELS[session.mode ?? ""] ?? session.mode ?? "—"}
                </span>
                {/* Domain */}
                {session.domain && (
                  <>
                    <span className="text-muted-foreground">Lĩnh vực</span>
                    <span className="text-foreground">
                      {DOMAIN_LABELS[session.domain] ?? session.domain}
                    </span>
                  </>
                )}
                {/* Difficulty */}
                {cfg?.difficulty && (
                  <>
                    <span className="text-muted-foreground">Độ khó</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      {DIFFICULTY_LABELS[cfg.difficulty] ?? cfg.difficulty}
                    </span>
                  </>
                )}
                {/* Language */}
                {cfg?.language && (
                  <>
                    <span className="text-muted-foreground">Ngôn ngữ</span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {LANGUAGE_LABELS[cfg.language] ?? cfg.language}
                    </span>
                  </>
                )}
                {/* Duration */}
                {cfg?.duration_minutes && (
                  <>
                    <span className="text-muted-foreground">Thời lượng</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {cfg.duration_minutes} phút
                    </span>
                  </>
                )}
                {/* createdAt */}
                <span className="text-muted-foreground">Tạo lúc</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateTime(session.createdAt)}
                </span>
                {/* updatedAt */}
                {session.updatedAt && (
                  <>
                    <span className="text-muted-foreground">Cập nhật</span>
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3.5 w-3.5" />
                      {formatDateTime(session.updatedAt)}
                    </span>
                  </>
                )}
                {/* completedAt */}
                {session.completedAt && (
                  <>
                    <span className="text-muted-foreground">Hoàn thành</span>
                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {formatDateTime(session.completedAt)}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Candidate / Job info card */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-foreground text-base">Ứng viên &amp; Vị trí</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(profile?.targetRole || profile?.targetLevel) && (
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
                  {profile.targetRole && (
                    <>
                      <span className="text-muted-foreground">Vị trí</span>
                      <span className="text-foreground font-semibold">{profile.targetRole}</span>
                    </>
                  )}
                  {profile.targetLevel && (
                    <>
                      <span className="text-muted-foreground">Cấp độ</span>
                      <span className="text-foreground">{profile.targetLevel}</span>
                    </>
                  )}
                </div>
              )}
              {jobTitle && (
                <div className="flex items-center gap-2">
                  <Briefcase className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="text-foreground font-medium">{jobTitle}</span>
                </div>
              )}
              {profile?.technicalSkills && profile.technicalSkills.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
                    Kỹ năng kỹ thuật
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.technicalSkills.slice(0, 10).map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                    {profile.technicalSkills.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.technicalSkills.length - 10}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {profile?.softSkills && profile.softSkills.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
                    Kỹ năng mềm
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.softSkills.slice(0, 8).map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile?.tools && profile.tools.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
                    Công cụ & Công nghệ
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.tools.slice(0, 8).map((t, i) => (
                      <Badge
                        key={i}
                        className="bg-blue-50 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {!profile?.targetRole &&
                !profile?.targetLevel &&
                !jobTitle &&
                !profile?.technicalSkills?.length && (
                  <p className="text-muted-foreground text-xs italic">Không có thông tin hồ sơ</p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Blueprint strategy analysis */}
        {blueprint?.strategy_analysis && (
          <Card className="mb-6 border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <CardTitle className="text-foreground text-base">
                  Chiến lược phỏng vấn (AI Blueprint)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {blueprint.strategy_analysis}
              </p>
            </CardContent>
          </Card>
        )}

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
              ) : existingPracticeSets.length === 0 ? (
                <p className="text-muted-foreground text-sm italic">Chưa có kế hoạch</p>
              ) : null}
              {session?.status === "COMPLETED" && !!detail && (
                <div className="mt-4">
                  {existingPracticeSets.length > 0 ? (
                    // 1 session = 1 practice set: redirect khi đã tạo
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                      onClick={() => navigate(`/user/practice/session/${id}`)}>
                      <BookOpen className="h-3.5 w-3.5" />
                      Xem lộ trình luyện tập
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                      onClick={() => setRoadmapOpen(true)}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Tạo lộ trình luyện tập
                    </Button>
                  )}
                </div>
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
                Chi tiết câu hỏi &amp; trả lời ({history.length})
              </h2>
            </div>
            {groupedHistory.map(({ blueprint, followUps }, index) => (
              <QACard
                key={blueprint.questionOrder ?? index}
                qa={blueprint}
                index={index}
                followUps={followUps}
              />
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
          <Button variant="outline" onClick={() => navigate("/user?tab=aiInterview")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
          <Button
            onClick={() => navigate("/user/ai-interview/setup")}
            className="bg-[#0047AB] text-white hover:bg-[#005B9A]">
            <Plus className="mr-2 h-4 w-4" />
            Bắt đầu Buổi Phỏng vấn Mới
          </Button>
        </div>
      </div>

      <SelectRoadmapModal
        key={`roadmap-${String(roadmapOpen)}`}
        open={roadmapOpen}
        onClose={() => setRoadmapOpen(false)}
        onConfirm={handleCreateRoadmap}
        loading={roadmapLoading}
      />
    </div>
  );
}
