import { ReloadButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { $api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/formatting";
import i18n from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  AlertTriangle,
  Bot,
  Calendar,
  Clock,
  History,
  Search,
  Star,
  User,
  Video,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
const t = i18n.t.bind(i18n);

// ============================================================
// Constants
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
    label: "AI",
  },
  {
    value: "mock",
    label: "Mentor",
  },
];
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
type HistoryItem = {
  id: number;
  type: "ai" | "mock";
  createdAt?: string;
  status: string;
  mode?: string;
  overallScore?: number;
  candidateProfile?: {
    targetRole?: string;
    targetLevel?: string;
  };
  sessionConfig?: {
    duration_minutes?: number;
    language?: string;
  };
  jobRequirement?: {
    basic_info?: Record<string, string>;
  };
  roomName?: string;
  joinTime?: string;
  startTime1?: string;
  totalPrice?: number;
  userId2?: number;
};
type AIStatusFilter = "all" | "CREATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type MockStatusFilter =
  | "all"
  | "DRAFT"
  | "SCHEDULED"
  | "PAID"
  | "ONGOING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELED";

// ============================================================
// Progress Ring
// ============================================================

function ProgressRing({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
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
          className="fill-none stroke-[2.5px]"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          style={{
            color: "rgb(220, 233, 255)",
          }}
        />
        <circle
          className="fill-none stroke-[2.5px] transition-all duration-500"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#0047AB"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[#0047AB]">{Math.round(score)}</span>
      </div>
    </div>
  );
}

// ============================================================
// Interview History Tab Component
// ============================================================

export function InterviewHistoryTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const [interviewType, setInterviewType] = useState<InterviewType>("all");
  const [aiStatusFilter, setAiStatusFilter] = useState<AIStatusFilter>("all");
  const [mockStatusFilter, setMockStatusFilter] = useState<MockStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  // Fetch mentor feedbacks
  const {
    data: feedbacks = [],
    isRefetching: feedbacksRefetching,
    refetch: refetchFeedbacks,
  } = useMentorFeedbacksByUser(userId ?? 0);
  const { mutateAsync: makeSessionPayment } = useMakeSessionPayment();
  const isLoading = aiLoading || mockLoading;
  const isRefetching = aiRefetching || mockRefetching || feedbacksRefetching;

  // Feedback session IDs
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

  // Transform sessions to history items
  const aiHistoryItems = useMemo<HistoryItem[]>(() => {
    return (Array.isArray(aiSessions) ? aiSessions : []).map((s) => ({
      id: s.id as number,
      type: "ai" as const,
      createdAt: s.createdAt,
      status: s.status ?? "",
      mode: s.mode,
      overallScore: s.overallScore,
      candidateProfile: s.candidateProfile,
      sessionConfig: s.sessionConfig,
      jobRequirement: s.jobRequirement,
    }));
  }, [aiSessions]);
  const mockHistoryItems = useMemo<HistoryItem[]>(() => {
    return mockSessions.map((s) => ({
      id: s.id as number,
      type: "mock" as const,
      createdAt: s.joinTime,
      status: s.status ?? "",
      roomName: s.roomName,
      joinTime: s.joinTime,
      startTime1: s.startTime1,
      totalPrice: s.totalPrice,
      userId2: s.userId2,
    }));
  }, [mockSessions]);

  // Combine and filter
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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => {
        if (item.type === "ai") {
          const modeLabel = AI_MODE_LABELS[item.mode ?? ""] ?? item.mode ?? "";
          const role = item.candidateProfile?.targetRole ?? "";
          return modeLabel.toLowerCase().includes(q) || role.toLowerCase().includes(q);
        } else {
          const roomName = item.roomName ?? "";
          return roomName.toLowerCase().includes(q);
        }
      });
    }
    items.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    return items;
  }, [
    interviewType,
    aiStatusFilter,
    mockStatusFilter,
    searchQuery,
    aiHistoryItems,
    mockHistoryItems,
  ]);
  const [pageSize] = useHybridPageSize({
    key: "src_pages_user_account_interviewhistorytab_tsx_pagesize",
    defaultPageSize: 5,
  });
  const pagination = usePagination({
    totalCount: filteredHistory.length,
    pageSize,
  });
  const pageData = useMemo(
    () => filteredHistory.slice(pagination.startIndex, pagination.endIndex + 1),
    [filteredHistory, pagination.startIndex, pagination.endIndex]
  );

  // Payment handlers
  const handlePaySessionWithPayOS = useCallback(
    async (session: Session) => {
      if (!session.id || payosPaymentInFlightRef.current) return;
      payosPaymentInFlightRef.current = true;
      setPayingSessionId(session.id);
      try {
        const checkoutUrl = await makeSessionPayment(session.id);
        window.location.assign(checkoutUrl);
      } catch {
        // Error toast in hook
      } finally {
        payosPaymentInFlightRef.current = false;
        setPayingSessionId(null);
      }
    },
    [makeSessionPayment]
  );
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
    (item: HistoryItem) => {
      navigate(`/user/mock-interview/history/${item.id}/feedback`);
    },
    [navigate]
  );
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#0047AB]" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("common.interviewHistory")}
          </h2>
        </div>
        <ReloadButton
          onReload={async () => {
            await Promise.all([refetchAISessions(), refetchMockSessions(), refetchFeedbacks()]);
          }}
          isLoading={isRefetching}
          tooltip={t("common.reload")}
        />
      </div>

      {/* Type Tabs */}
      <div className="flex items-center gap-1">
        {INTERVIEW_TYPE_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={interviewType === tab.value ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setInterviewType(tab.value);
              pagination.goToFirstPage();
            }}
            className={cn(interviewType === tab.value && "bg-[#0047AB] hover:bg-[#003d91]")}>
            {tab.value === "ai" && <Bot className="mr-1 h-3.5 w-3.5" />}
            {tab.value === "mock" && <Video className="mr-1 h-3.5 w-3.5" />}
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              pagination.goToFirstPage();
            }}
            className="h-9 pl-8 text-sm"
            placeholder={t("userAccount.search")}
          />
        </div>
        {interviewType === "ai" ? (
          <Select
            value={aiStatusFilter}
            onValueChange={(value) => {
              setAiStatusFilter(value as AIStatusFilter);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder={t("common.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("general.all")}</SelectItem>
              <SelectItem value="COMPLETED">{t("general.completed")}</SelectItem>
              <SelectItem value="IN_PROGRESS">{t("common.ongoing")}</SelectItem>
              <SelectItem value="CREATED">{t("common.created")}</SelectItem>
              <SelectItem value="CANCELLED">{t("common.canceled")}</SelectItem>
            </SelectContent>
          </Select>
        ) : interviewType === "mock" ? (
          <Select
            value={mockStatusFilter}
            onValueChange={(value) => {
              setMockStatusFilter(value as MockStatusFilter);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder={t("common.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("general.all")}</SelectItem>
              <SelectItem value="COMPLETED">{t("general.completed")}</SelectItem>
              <SelectItem value="SCHEDULED">{t("common.comingSoon")}</SelectItem>
              <SelectItem value="PAID">{t("common.paid")}</SelectItem>
              <SelectItem value="DRAFT">{t("common.waitingForApproval")}</SelectItem>
              <SelectItem value="CANCELED">{t("common.canceled")}</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingCardList count={3} />
      ) : aiError ? (
        <Card className="flex h-32 flex-col items-center justify-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <p className="text-destructive text-sm">{t("userAccount.unableToLoadHistory")}</p>
          <Button size="sm" variant="outline" onClick={() => void refetchAISessions()}>
            {t("common.retry")}
          </Button>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          icon={History}
          title={t("common.noInterviewHistoryYet")}
          description={t("userAccount.youHaveNotParticipatedIn")}
          action={
            <Button
              size="sm"
              onClick={() => navigate("/user/ai-interview/setup")}
              className="gap-1.5 bg-[#0047AB] hover:bg-[#003d91]">
              <Bot className="h-3.5 w-3.5" />
              {t("common.aiInterview")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {pageData.map((item) => {
              const isAi = item.type === "ai";
              const hasFeedback =
                !isAi && typeof item.id === "number" && feedbackSessionIds.has(item.id);
              const isPaying = payingSessionId === item.id;
              const isCompleted = item.status === "COMPLETED";
              const isScheduled = item.status === "SCHEDULED";
              const isPaid = item.status === "PAID";
              return (
                <Card key={`${item.type}-${item.id}`} className="transition-all hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 p-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        isAi ? "bg-[#0047AB]/10" : "bg-emerald-500/10"
                      )}>
                      {isAi ? (
                        <Bot
                          className={cn("h-5 w-5", isAi ? "text-[#0047AB]" : "text-emerald-600")}
                        />
                      ) : (
                        <Video className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {isAi
                            ? (AI_MODE_LABELS[item.mode ?? ""] ?? t("common.aiInterview"))
                            : item.roomName ||
                              t("common.sessionVar0", {
                                var_0: item.id,
                              })}
                        </p>
                        {isAi ? (
                          <Badge
                            className={AI_STATUS_CONFIG[item.status]?.className ?? ""}
                            variant="secondary">
                            {AI_STATUS_CONFIG[item.status]?.label ?? item.status}
                          </Badge>
                        ) : (
                          <Badge
                            className={MOCK_STATUS_MAP[item.status]?.color ?? ""}
                            variant="secondary">
                            {MOCK_STATUS_MAP[item.status]?.label ?? item.status}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        {isAi ? (
                          <>
                            {item.candidateProfile?.targetRole && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.candidateProfile.targetRole}
                              </span>
                            )}
                            {item.sessionConfig?.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.sessionConfig.duration_minutes} {t("common.minute")}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {item.joinTime && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateTime(item.joinTime)}
                              </span>
                            )}
                            {typeof item.totalPrice === "number" && item.totalPrice > 0 && (
                              <span className="font-medium text-emerald-600">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score / Action */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isAi && item.overallScore != null && (
                        <ProgressRing score={item.overallScore as number} />
                      )}
                      {isCompleted && !isAi && !hasFeedback && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWriteFeedback(item)}>
                          <Star className="mr-1 h-3 w-3" />
                          {t("common.feedback1")}
                        </Button>
                      )}
                      {!isAi && isScheduled && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={isPaying}
                          onClick={() => {
                            const session = mockSessions.find((s) => s.id === item.id) as
                              | Session
                              | undefined;
                            if (session) void handlePaySessionWithPayOS(session);
                          }}>
                          {isPaying ? "..." : t("common.pay")}
                        </Button>
                      )}
                      {!isAi && isPaid && (
                        <Button size="sm" variant="secondary" disabled>
                          {t("userAccount.alreadyTt")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetails(item)}>
                        {t("common.detail")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {filteredHistory.length > pageSize && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.prevPage()}
                disabled={pagination.currentPage <= 1}>
                {t("common.before")}
              </Button>
              <span className="px-2 text-xs text-slate-500">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.nextPage()}
                disabled={pagination.currentPage >= pagination.totalPages}>
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
