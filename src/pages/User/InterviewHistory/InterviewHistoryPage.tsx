import { PaginationControl, ReloadButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingCardList } from "@/components/ui/loading-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMentorFeedbacksByUser } from "@/hooks/useMentorFeedback";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useMakeSessionPayment, useUserSessions } from "@/hooks/useSession";
import type { Session } from "@/interfaces";
import {
  canRetryPendingSessionPaidStatusSync,
  clearPendingSessionPaidStatusSync,
  getPendingSessionPaidStatusSync,
} from "@/lib";
import { $api } from "@/lib/api";
import {
  formatCurrency,
  formatDateTime,
  formatTime,
  treatZuluAsVietnamLocal,
} from "@/lib/formatting";
import i18n from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { sessionManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import {
  AlertTriangle,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  History,
  Search,
  Sparkles,
  Star,
  User,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
const t = i18n.t.bind(i18n);

// ============================================================
// Constants & Config
// ============================================================

type InterviewType = "all" | "ai" | "mock";
const INTERVIEW_TYPE_TABS: Array<{
  value: InterviewType;
  label: string;
}> = [
  {
    value: "all",
    label: t("general.all"),
  },
  {
    value: "ai",
    label: t("common.aiInterview"),
  },
  {
    value: "mock",
    label: t("common.mentorInterview"),
  },
];

// AI Interview configs
const AI_MODE_LABELS: Record<string, string> = {
  STANDARD_MOCK: t("common.trialInterview"),
  THEORY_CHECK: t("common.testTheTheory"),
  PROJECT_DEFENSE: t("common.projectProtection"),
};
const AI_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  CREATED: {
    label: t("common.created"),
    className: "bg-blue-100 text-blue-700",
  },
  IN_PROGRESS: {
    label: t("common.ongoing"),
    className: "bg-amber-100 text-amber-700",
  },
  COMPLETED: {
    label: t("general.completed"),
    className: "bg-emerald-100 text-emerald-700",
  },
  CANCELLED: {
    label: t("common.canceled"),
    className: "bg-red-100 text-red-700",
  },
};
const AI_RESULT_LABELS: Record<string, string> = {
  STRONG_HIRE: t("common.excellent"),
  HIRE: t("common.obtain"),
  CONSIDER: t("common.needToConsider"),
  REJECT: t("common.failed"),
};

// Mock Interview status configs
const MOCK_STATUS_MAP: Record<
  string,
  {
    label: string;
    color: string;
  }
> = {
  DRAFT: {
    label: t("common.waitingForApproval"),
    color: "bg-amber-100 text-amber-700",
  },
  SCHEDULED: {
    label: t("common.comingSoon"),
    color: "bg-blue-100 text-blue-700",
  },
  PAID: {
    label: t("common.paid"),
    color: "bg-emerald-100 text-emerald-700",
  },
  ONGOING: {
    label: t("common.ongoing"),
    color: "bg-green-100 text-green-700",
  },
  COMPLETED: {
    label: t("general.completed"),
    color: "bg-slate-100 text-slate-600",
  },
  REJECTED: {
    label: t("common.rejected"),
    color: "bg-red-100 text-red-600",
  },
  CANCELED: {
    label: t("common.canceled"),
    color: "bg-red-100 text-red-600",
  },
};

// ============================================================
// Types
// ============================================================

interface BaseHistoryItem {
  id: number;
  type: "ai" | "mock";
  createdAt?: string;
  completedAt?: string;
  status: string;
}
interface AIHistoryItem extends BaseHistoryItem {
  type: "ai";
  mode?: string;
  domain?: string;
  overallScore?: number;
  result?: string;
  candidateProfile?: {
    targetRole?: string;
    targetLevel?: string;
  };
  sessionConfig?: {
    difficulty?: string;
    language?: string;
    duration_minutes?: number;
  };
  jobRequirement?: {
    basic_info?: Record<string, string>;
  };
}
interface MockHistoryItem extends BaseHistoryItem {
  type: "mock";
  roomName?: string;
  joinTime?: string;
  startTime1?: string;
  totalPrice?: number;
  userId2?: number;
}
type HistoryItem = AIHistoryItem | MockHistoryItem;
type SessionStatusFilter =
  | "all"
  | "DRAFT"
  | "SCHEDULED"
  | "PAID"
  | "ONGOING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELED";
type AIStatusFilter = "all" | "CREATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

// ============================================================
// Progress Ring Component
// ============================================================

function ProgressRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(score / 10) * circumference} ${circumference}`;
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
      }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="fill-none stroke-[3px]"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          style={{
            color: "rgb(220, 233, 255)",
          }}
        />
        <circle
          className="fill-none stroke-[3px] transition-all duration-500"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0047AB"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-[#0047AB]">{Math.round(score)}</span>
      </div>
    </div>
  );
}

// ============================================================
// AI Interview Card
// ============================================================

function AIInterviewCard({
  session,
  onViewDetails,
}: {
  session: AIHistoryItem;
  onViewDetails: () => void;
}) {
  const statusConfig = AI_STATUS_CONFIG[session.status ?? ""] ?? {
    label: session.status ?? "",
    className: "bg-gray-100 text-gray-700",
  };
  const modeLabel = AI_MODE_LABELS[session.mode ?? ""] ?? session.mode ?? t("common.aiInterview");
  const hasScore = session.overallScore !== undefined && session.overallScore !== null;
  const targetRole = session.candidateProfile?.targetRole;
  const targetLevel = session.candidateProfile?.targetLevel;
  const jobTitle = session.jobRequirement?.basic_info?.job_title;
  return (
    <Card className="group transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0047AB]/10">
              <Bot className="h-6 w-6 text-[#0047AB]" />
            </div>
            <div>
              <CardTitle className="text-base">{modeLabel}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                {t("common.aiInterview")}
              </CardDescription>
            </div>
          </div>
          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {(targetRole || targetLevel || jobTitle) && (
            <div className="flex flex-wrap items-center gap-2">
              {targetRole || targetLevel ? (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {[targetRole, targetLevel].filter(Boolean).join(" · ")}
                </span>
              ) : null}
              {jobTitle && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {jobTitle}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {session.createdAt ? new Date(session.createdAt).toLocaleDateString("vi-VN") : "—"}
            </span>
            {session.sessionConfig?.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {session.sessionConfig.duration_minutes} {t("common.minute")}
              </span>
            )}
            {session.sessionConfig?.language && (
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {session.sessionConfig.language === "VI" ? t("common.vietnamese") : "English"}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {session.domain && (
              <Badge variant="secondary">
                {session.domain === "IT" ? "IT" : t("common.outsideOfIt")}
              </Badge>
            )}
            {session.result && (
              <Badge variant="outline">{AI_RESULT_LABELS[session.result] ?? session.result}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasScore && <ProgressRing score={session.overallScore as number} />}
            {session.status === "COMPLETED" && (
              <Button size="sm" onClick={onViewDetails} className="gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {t("common.seeDetails")}
              </Button>
            )}
            {session.status !== "COMPLETED" && session.status !== "CANCELLED" && (
              <Button size="sm" variant="outline" onClick={onViewDetails}>
                {t("common.seeDetails")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Mock Interview Card
// ============================================================

function MockInterviewCard({
  session,
  hasFeedback,
  onViewDetails,
  onWriteFeedback,
  onPaySession,
  isPaying,
  navigateToSchedule,
}: {
  session: MockHistoryItem;
  hasFeedback: boolean;
  onViewDetails: () => void;
  onWriteFeedback: () => void;
  onPaySession: () => void;
  isPaying: boolean;
  navigateToSchedule: () => void;
}) {
  const status = MOCK_STATUS_MAP[session.status || "SCHEDULED"] || MOCK_STATUS_MAP.SCHEDULED;
  const isCompleted = session.status === "COMPLETED";
  const isScheduled = session.status === "SCHEDULED";
  const isPaid = session.status === "PAID";
  const isDraft = session.status === "DRAFT";
  const isRejected = session.status === "REJECTED";
  return (
    <Card className={cn("transition-all hover:shadow-md", isDraft && "opacity-90")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <Video className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">
                {session.roomName ||
                  t("common.sessionVar0", {
                    var_0: session.id,
                  })}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="h-3 w-3" />
                Mentor #{session.userId2}
              </CardDescription>
            </div>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isDraft && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <Clock className="mr-1 inline h-3.5 w-3.5" />
            {t("common.theRequestIsAwaitingReviewByTheMe")}
          </div>
        )}
        {isRejected && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {t("common.theRequestWasDeniedYouCanReschedu")}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
          {session.joinTime && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("common.appointmentTime")} {formatDateTime(session.joinTime)}
            </span>
          )}
          {session.startTime1 && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {t("common.begin")} {formatTime(treatZuluAsVietnamLocal(session.startTime1))}
            </span>
          )}
          {!session.joinTime && !session.startTime1 && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("common.session2")}
              {session.id}
            </span>
          )}
          {typeof session.totalPrice === "number" && session.totalPrice > 0 && (
            <span className="font-medium text-emerald-700">
              {formatCurrency(session.totalPrice)}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isScheduled && (
            <Button
              size="sm"
              onClick={onPaySession}
              disabled={isPaying}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              {isPaying ? t("common.processing") : t("common.pay")}
            </Button>
          )}
          {isPaid && (
            <Button variant="secondary" size="sm" disabled className="gap-1">
              {t("common.paid")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            {t("common.seeDetails")}
          </Button>
          {isCompleted && !hasFeedback && (
            <Button size="sm" onClick={onWriteFeedback} className="gap-1">
              <Star className="h-4 w-4" />
              {t("common.writeFeedback")}
            </Button>
          )}
          {isCompleted && hasFeedback && (
            <Button variant="secondary" size="sm" onClick={onWriteFeedback} className="gap-1">
              <Star className="h-4 w-4 text-[#FFD700]" />
              {t("common.editResponse")}
            </Button>
          )}
          {isRejected && (
            <Button
              size="sm"
              variant="outline"
              onClick={navigateToSchedule}
              className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50">
              {t("common.reschedule")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Empty State Component
// ============================================================

function EmptyHistoryState({ type, onAction }: { type: InterviewType; onAction?: () => void }) {
  const config = {
    all: {
      icon: History,
      title: t("common.noInterviewHistoryYet"),
      description: t("userInterviewhistory.youHaveNotParticipatedIn"),
      actionLabel: t("common.interviewWithAi"),
    },
    ai: {
      icon: Bot,
      title: t("userInterviewhistory.thereIsNoAiInterview"),
      description: t("userInterviewhistory.startInterviewingWithAiTo"),
      actionLabel: t("common.startInterviewingAi"),
    },
    mock: {
      icon: Video,
      title: t("userInterviewhistory.thereIsNoMentorInterview"),
      description: t("userInterviewhistory.scheduleAnInterviewWithA"),
      actionLabel: t("common.scheduleAMentoringAppointment"),
    },
  };
  const { icon: Icon, title, description, actionLabel } = config[type];
  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={description}
      action={
        onAction && (
          <Button onClick={onAction} className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
            {type === "ai" ? (
              <Bot className="h-4 w-4" />
            ) : type === "mock" ? (
              <Video className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {actionLabel}
          </Button>
        )
      }
    />
  );
}

// ============================================================
// Main Page Component
// ============================================================

export function InterviewHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const [interviewType, setInterviewType] = useState<InterviewType>("all");
  const [aiStatusFilter, setAiStatusFilter] = useState<AIStatusFilter>("all");
  const [mockStatusFilter, setMockStatusFilter] = useState<SessionStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [payingSessionId, setPayingSessionId] = useState<number | null>(null);
  const payosPaymentInFlightRef = useRef(false);

  // Fetch AI Interview sessions
  const {
    data: aiSessions = [],
    isLoading: aiLoading,
    isError: aiError,
    isRefetching: aiRefetching,
    refetch: refetchAISessions,
  } = $api.useQuery(
    "get",
    "/api/interview-sessions/user/{userId}",
    {
      params: {
        path: {
          userId: userId ?? 0,
        },
      },
    },
    {
      enabled: !!userId,
    }
  );

  // Fetch Mock Interview sessions
  const {
    data: mockSessions = [],
    isLoading: mockLoading,
    isRefetching: mockRefetching,
    refetch: refetchMockSessions,
  } = useUserSessions();

  // Fetch mentor feedbacks for completed mock sessions
  const {
    data: feedbacks = [],
    isRefetching: feedbacksRefetching,
    refetch: refetchFeedbacks,
  } = useMentorFeedbacksByUser(userId ?? 0);
  const { mutateAsync: makeSessionPayment } = useMakeSessionPayment();
  const isLoading = aiLoading || mockLoading;
  const isRefetching = aiRefetching || mockRefetching || feedbacksRefetching;

  // Get session IDs where user already submitted mentor feedback
  const feedbackSessionIds = useMemo(
    () =>
      new Set(
        feedbacks
          .map(
            (f: {
              session?: {
                id?: number;
              };
            }) => f.session?.id
          )
          .filter((id): id is number => typeof id === "number")
      ),
    [feedbacks]
  );

  // Transform AI sessions to history items
  const aiHistoryItems = useMemo<AIHistoryItem[]>(() => {
    const sessions = Array.isArray(aiSessions) ? aiSessions : [];
    return sessions.map((s) => ({
      id: s.id as number,
      type: "ai" as const,
      createdAt: s.createdAt,
      completedAt: s.completedAt,
      status: s.status ?? "",
      mode: s.mode,
      domain: s.domain,
      overallScore: s.overallScore,
      result: s.result,
      candidateProfile: s.candidateProfile,
      sessionConfig: s.sessionConfig,
      jobRequirement: s.jobRequirement,
    }));
  }, [aiSessions]);

  // Transform Mock sessions to history items
  const mockHistoryItems = useMemo<MockHistoryItem[]>(() => {
    return mockSessions.map((s) => ({
      id: s.id as number,
      type: "mock" as const,
      createdAt: s.joinTime,
      completedAt: s.startTime1,
      status: s.status ?? "",
      roomName: s.roomName,
      joinTime: s.joinTime,
      startTime1: s.startTime1,
      totalPrice: s.totalPrice,
      userId2: s.userId2,
    }));
  }, [mockSessions]);

  // Combine and filter history
  const filteredHistory = useMemo(() => {
    let items: HistoryItem[] = [];
    if (interviewType === "all" || interviewType === "ai") {
      let filtered = [...aiHistoryItems];
      if (aiStatusFilter !== "all") {
        filtered = filtered.filter((s) => s.status === aiStatusFilter);
      }
      items = [...items, ...filtered];
    }
    if (interviewType === "all" || interviewType === "mock") {
      let filtered = [...mockHistoryItems];
      if (mockStatusFilter !== "all") {
        filtered = filtered.filter((s) => s.status === mockStatusFilter);
      }
      items = [...items, ...filtered];
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => {
        if (item.type === "ai") {
          const modeLabel = AI_MODE_LABELS[item.mode ?? ""] ?? item.mode ?? "";
          const role = item.candidateProfile?.targetRole ?? "";
          const jobTitle = item.jobRequirement?.basic_info?.job_title ?? "";
          return (
            modeLabel.toLowerCase().includes(q) ||
            role.toLowerCase().includes(q) ||
            jobTitle.toLowerCase().includes(q)
          );
        } else {
          const roomName = item.roomName ?? "";
          const statusLabel = MOCK_STATUS_MAP[item.status]?.label ?? "";
          return (
            roomName.toLowerCase().includes(q) ||
            statusLabel.toLowerCase().includes(q) ||
            item.userId2?.toString().includes(q)
          );
        }
      });
    }

    // Sort by created date
    items.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
    return items;
  }, [
    interviewType,
    aiStatusFilter,
    mockStatusFilter,
    searchQuery,
    sortBy,
    aiHistoryItems,
    mockHistoryItems,
  ]);

  // Pagination
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_user_interviewhistory_interviewhistorypage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: filteredHistory.length,
    pageSize,
  });
  const pageData = useMemo(
    () => filteredHistory.slice(pagination.startIndex, pagination.endIndex + 1),
    [filteredHistory, pagination.startIndex, pagination.endIndex]
  );

  // Handlers
  const handleViewDetails = useCallback(
    (item: HistoryItem) => {
      if (item.type === "ai") {
        navigate(`/user/ai-interview/result/${item.id}`);
      } else {
        navigate(`/user/mock-interview/history/${item.id}`);
      }
    },
    [navigate]
  );
  const handleWriteFeedback = useCallback(
    (item: MockHistoryItem) => {
      navigate(`/user/mock-interview/history/${item.id}/feedback`);
    },
    [navigate]
  );
  const handlePaySessionWithPayOS = useCallback(
    async (session: Session) => {
      if (!session.id || !user?.id) return;
      if (payosPaymentInFlightRef.current) {
        toast.info(t("common.theSystemIsGeneratingAPaymentLink"));
        return;
      }
      payosPaymentInFlightRef.current = true;
      setPayingSessionId(session.id);
      try {
        const checkoutUrl = await makeSessionPayment(session.id);
        window.location.assign(checkoutUrl);
      } catch {
        // Error toast handled in hook
      } finally {
        payosPaymentInFlightRef.current = false;
        setPayingSessionId(null);
      }
    },

    [makeSessionPayment, user?.id, t]
  );

  // Sync paid status on mount
  useEffect(() => {
    if (!user?.id || mockSessions.length === 0) return;
    for (const session of mockSessions) {
      if (session.status === "PAID") {
        clearPendingSessionPaidStatusSync(session.id as number, Number(user.id));
      }
    }
    const scheduledWithPending = mockSessions.find((s) => {
      if (s.status !== "SCHEDULED" || !s.id) return false;
      const pendingSync = getPendingSessionPaidStatusSync(s.id as number, Number(user.id));
      return !!pendingSync && canRetryPendingSessionPaidStatusSync(pendingSync);
    });
    if (scheduledWithPending?.id) {
      const pendingSync = getPendingSessionPaidStatusSync(
        scheduledWithPending.id as number,
        Number(user.id)
      );
      if (pendingSync?.transactionCode) {
        void sessionManager
          .markSessionAsPaidWithRetry(
            scheduledWithPending.id as number,
            pendingSync.transactionCode,
            3
          )
          .then(() => void refetchMockSessions());
      }
    }
  }, [mockSessions, user?.id, refetchMockSessions]);

  // Stats
  const totalCount = filteredHistory.length;
  const aiCount = aiHistoryItems.length;
  const mockCount = mockHistoryItems.length;
  const completedAiCount = aiHistoryItems.filter((s) => s.status === "COMPLETED").length;
  const completedMockCount = mockHistoryItems.filter((s) => s.status === "COMPLETED").length;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("userInterviewhistory.interviewHistory")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("userInterviewhistory.trackYourProgressAndReview")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={async () => {
              await Promise.all([refetchAISessions(), refetchMockSessions(), refetchFeedbacks()]);
            }}
            isLoading={isRefetching}
            tooltip={t("userInterviewhistory.reloadHistory")}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.totalSession")}</CardDescription>
            <CardTitle className="text-2xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardDescription>{t("common.aiInterview")}</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{aiCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-900">
          <CardHeader className="pb-2">
            <CardDescription>{t("common.mentorInterview")}</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{mockCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-purple-200 dark:border-purple-900">
          <CardHeader className="pb-2">
            <CardDescription>{t("common.completed1")}</CardDescription>
            <CardTitle className="text-2xl text-purple-600">
              {completedAiCount + completedMockCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Interview Type Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {INTERVIEW_TYPE_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={interviewType === tab.value ? "default" : "outline"}
            onClick={() => {
              setInterviewType(tab.value);
              pagination.goToFirstPage();
            }}
            className={cn(interviewType === tab.value && "bg-[#0047AB] hover:bg-[#003d91]")}>
            {tab.value === "ai" && <Bot className="mr-2 h-4 w-4" />}
            {tab.value === "mock" && <Video className="mr-2 h-4 w-4" />}
            {tab.value === "all" && <History className="mr-2 h-4 w-4" />}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
              className="pl-9"
              placeholder={t("userInterviewhistory.searchByRegimeLocationMentor")}
            />
          </div>

          {/* Type-specific filter */}
          {interviewType === "ai" ? (
            <Select
              value={aiStatusFilter}
              onValueChange={(value) => {
                setAiStatusFilter(value as AIStatusFilter);
                pagination.goToFirstPage();
              }}>
              <SelectTrigger className="w-full min-w-[180px]">
                <SelectValue placeholder={t("common.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatus")}</SelectItem>
                <SelectItem value="CREATED">{t("common.created")}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t("common.ongoing")}</SelectItem>
                <SelectItem value="COMPLETED">{t("general.completed")}</SelectItem>
                <SelectItem value="CANCELLED">{t("common.canceled")}</SelectItem>
              </SelectContent>
            </Select>
          ) : interviewType === "mock" ? (
            <Select
              value={mockStatusFilter}
              onValueChange={(value) => {
                setMockStatusFilter(value as SessionStatusFilter);
                pagination.goToFirstPage();
              }}>
              <SelectTrigger className="w-full min-w-[180px]">
                <SelectValue placeholder={t("common.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatus")}</SelectItem>
                <SelectItem value="DRAFT">{t("common.waitingForApproval")}</SelectItem>
                <SelectItem value="SCHEDULED">{t("common.comingSoon")}</SelectItem>
                <SelectItem value="PAID">{t("common.paid")}</SelectItem>
                <SelectItem value="ONGOING">{t("common.ongoing")}</SelectItem>
                <SelectItem value="COMPLETED">{t("general.completed")}</SelectItem>
                <SelectItem value="REJECTED">{t("common.rejected")}</SelectItem>
                <SelectItem value="CANCELED">{t("common.canceled")}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div />
          )}

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as "newest" | "oldest")}>
            <SelectTrigger className="w-full min-w-[140px]">
              <SelectValue placeholder={t("userInterviewhistory.arrange")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("common.latest")}</SelectItem>
              <SelectItem value="oldest">{t("common.oldest")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active filters indicator */}
        {(searchQuery || aiStatusFilter !== "all" || mockStatusFilter !== "all") && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{t("userInterviewhistory.filtersInUse")}</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                {t("userInterviewhistory.find")} {searchQuery}
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-red-500">
                  ×
                </button>
              </Badge>
            )}
            {interviewType === "ai" && aiStatusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {AI_STATUS_CONFIG[aiStatusFilter]?.label ?? aiStatusFilter}
                <button
                  onClick={() => setAiStatusFilter("all")}
                  className="ml-1 hover:text-red-500">
                  ×
                </button>
              </Badge>
            )}
            {interviewType === "mock" && mockStatusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {MOCK_STATUS_MAP[mockStatusFilter]?.label ?? mockStatusFilter}
                <button
                  onClick={() => setMockStatusFilter("all")}
                  className="ml-1 hover:text-red-500">
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setAiStatusFilter("all");
                setMockStatusFilter("all");
                pagination.goToFirstPage();
              }}>
              {t("common.deleteAll")}
            </Button>
          </div>
        )}
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingCardList count={4} />
      ) : aiError ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-destructive font-medium">
            {t("common.unableToDownloadInterviewHistory")}
          </p>
          <Button variant="outline" onClick={() => void refetchAISessions()}>
            {t("common.retry")}
          </Button>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <EmptyHistoryState
          type={interviewType}
          onAction={
            interviewType === "ai"
              ? () => navigate("/user/ai-interview/setup")
              : interviewType === "mock"
                ? () => navigate("/user/mock-interview/schedule")
                : () => navigate("/user/ai-interview/setup")
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {pageData.map((item) =>
              item.type === "ai" ? (
                <AIInterviewCard
                  key={`ai-${item.id}`}
                  session={item}
                  onViewDetails={() => handleViewDetails(item)}
                />
              ) : (
                <MockInterviewCard
                  key={`mock-${item.id}`}
                  session={item}
                  hasFeedback={typeof item.id === "number" && feedbackSessionIds.has(item.id)}
                  isPaying={payingSessionId === item.id}
                  onViewDetails={() => handleViewDetails(item)}
                  onWriteFeedback={() => handleWriteFeedback(item)}
                  onPaySession={() => {
                    const session = mockSessions.find((s) => s.id === item.id) as
                      | Session
                      | undefined;
                    if (session) void handlePaySessionWithPayOS(session);
                  }}
                  navigateToSchedule={() => navigate("/user/mock-interview/schedule")}
                />
              )
            )}
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <PaginationControl
              pagination={pagination}
              onPageSizeChange={(size) => {
                setPageSize(size);
                pagination.goToFirstPage();
              }}
              pageSizeOptions={[5, 10, 20, 30]}
            />
          )}
        </>
      )}
    </div>
  );
}
