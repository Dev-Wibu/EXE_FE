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
import { useNavigate } from "react-router-dom";

import { PaymentMethodDialog, ReloadButton } from "@/components/shared";
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
import { useWalletBalanceReconciliation } from "@/hooks/useWalletBalanceReconciliation";
import type { Session } from "@/interfaces";
import { upsertPendingSessionPaidStatusSync } from "@/lib";
import { $api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { sessionManager, transactionManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// ============================================================
// Constants
// ============================================================

type InterviewType = "all" | "ai" | "mock";

const INTERVIEW_TYPE_TABS: Array<{ value: InterviewType; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "ai", label: "AI" },
  { value: "mock", label: "Mentor" },
];

const AI_MODE_LABELS: Record<string, string> = {
  STANDARD_MOCK: "Phỏng vấn thử",
  THEORY_CHECK: "Kiểm tra lý thuyết",
  PROJECT_DEFENSE: "Bảo vệ dự án",
};

const AI_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  CREATED: { label: "Đã tạo", className: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Đang diễn ra", className: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
};

const MOCK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700" },
  SCHEDULED: { label: "Sắp diễn ra", color: "bg-blue-100 text-blue-700" },
  PAID: { label: "Đã thanh toán", color: "bg-emerald-100 text-emerald-700" },
  ONGOING: { label: "Đang diễn ra", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-slate-100 text-slate-600" },
  REJECTED: { label: "Bị từ chối", color: "bg-red-100 text-red-600" },
  CANCELED: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
};

type HistoryItem = {
  id: number;
  type: "ai" | "mock";
  createdAt?: string;
  status: string;
  mode?: string;
  overallScore?: number;
  candidateProfile?: { targetRole?: string; targetLevel?: string };
  sessionConfig?: { duration_minutes?: number; language?: string };
  jobRequirement?: { basic_info?: Record<string, string> };
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
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="fill-none stroke-[2.5px]"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          style={{ color: "rgb(220, 233, 255)" }}
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
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

  const [interviewType, setInterviewType] = useState<InterviewType>("all");
  const [aiStatusFilter, setAiStatusFilter] = useState<AIStatusFilter>("all");
  const [mockStatusFilter, setMockStatusFilter] = useState<MockStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [payingSessionId, setPayingSessionId] = useState<number | null>(null);
  const [isPreparingPaymentDialog, setIsPreparingPaymentDialog] = useState(false);
  const [targetSessionForPayment, setTargetSessionForPayment] = useState<Session | null>(null);
  const walletPaymentInFlightRef = useRef(false);
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
    { params: { path: { userId: userId ?? 0 } } },
    { enabled: !!userId }
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
  const { refreshWalletBalance } = useWalletBalanceReconciliation();

  const isLoading = aiLoading || mockLoading;
  const isRefetching = aiRefetching || mockRefetching || feedbacksRefetching;

  // Feedback session IDs
  const feedbackSessionIds = useMemo(
    () =>
      new Set(
        feedbacks
          .map((f: { session?: { id?: number } }) => f.session?.id)
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
  const pagination = usePagination({ totalCount: filteredHistory.length, pageSize });
  const pageData = useMemo(
    () => filteredHistory.slice(pagination.startIndex, pagination.endIndex + 1),
    [filteredHistory, pagination.startIndex, pagination.endIndex]
  );

  // Payment handlers
  const handleOpenPaymentMethodDialog = useCallback(
    async (session: Session) => {
      if (!user?.id) return;
      setIsPreparingPaymentDialog(true);
      try {
        await refreshWalletBalance(Number(user.id));
      } catch {
        toast.info("Không thể đồng bộ số dư ví. Bạn vẫn có thể chọn PayOS để thanh toán.");
      } finally {
        setIsPreparingPaymentDialog(false);
      }
      setTargetSessionForPayment(session);
    },
    [refreshWalletBalance, user?.id]
  );

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

  const handlePaySessionWithWallet = useCallback(
    async (session: Session) => {
      if (!session.id || !user?.id) return;
      const paymentAmount = session.totalPrice ?? 0;
      if (paymentAmount <= 0) {
        toast.error("Phiên phỏng vấn chưa có tổng tiền hợp lệ.");
        return;
      }
      if (walletPaymentInFlightRef.current) return;
      walletPaymentInFlightRef.current = true;
      setPayingSessionId(session.id);
      try {
        const walletRefresh = await refreshWalletBalance(Number(user.id));
        if ((walletRefresh.walletBalance as number) < paymentAmount) {
          toast.error("Số dư ví không đủ.");
          return;
        }
        const result = await transactionManager.transferOut(
          paymentAmount,
          Number(user.id),
          "MENTOR_INTERVIEW"
        );
        if (!result.success || !result.data) {
          toast.error(result.error || "Không thể thanh toán bằng ví.");
          return;
        }
        if (result.data.redirectUrl) {
          window.location.assign(result.data.redirectUrl);
          return;
        }
        if (result.data.transactionCode) {
          upsertPendingSessionPaidStatusSync({
            sessionId: session.id,
            userId: Number(user.id),
            transactionCode: result.data.transactionCode,
          });
          const syncResult = await sessionManager.markSessionAsPaidWithRetry(
            session.id,
            result.data.transactionCode,
            3
          );
          if (syncResult.success) {
            toast.success("Thanh toán bằng ví thành công.");
            void refetchMockSessions();
          } else {
            toast.info("Đã trừ ví. Hệ thống đang đồng bộ trạng thái.");
          }
          navigate(`/user/mock-interview/history/${session.id}?payment=success`);
        }
      } catch {
        toast.error("Không thể thanh toán bằng ví lúc này.");
      } finally {
        walletPaymentInFlightRef.current = false;
        setPayingSessionId(null);
        setTargetSessionForPayment(null);
      }
    },
    [refreshWalletBalance, user?.id, refetchMockSessions, navigate]
  );

  const handleConfirmPaymentMethod = useCallback(
    async (method: "payos" | "wallet") => {
      if (!targetSessionForPayment) return;
      if (method === "wallet") {
        await handlePaySessionWithWallet(targetSessionForPayment);
      } else {
        setTargetSessionForPayment(null);
        await handlePaySessionWithPayOS(targetSessionForPayment);
      }
    },
    [targetSessionForPayment, handlePaySessionWithWallet, handlePaySessionWithPayOS]
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
            Lịch sử phỏng vấn
          </h2>
        </div>
        <ReloadButton
          onReload={async () => {
            await Promise.all([refetchAISessions(), refetchMockSessions(), refetchFeedbacks()]);
          }}
          isLoading={isRefetching}
          tooltip="Tải lại"
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
            placeholder="Tìm kiếm..."
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
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="IN_PROGRESS">Đang diễn ra</SelectItem>
              <SelectItem value="CREATED">Đã tạo</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
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
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="SCHEDULED">Sắp diễn ra</SelectItem>
              <SelectItem value="PAID">Đã thanh toán</SelectItem>
              <SelectItem value="DRAFT">Chờ duyệt</SelectItem>
              <SelectItem value="CANCELED">Đã hủy</SelectItem>
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
          <p className="text-destructive text-sm">Không thể tải lịch sử</p>
          <Button size="sm" variant="outline" onClick={() => void refetchAISessions()}>
            Thử lại
          </Button>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          icon={History}
          title="Chưa có lịch sử phỏng vấn"
          description="Bạn chưa tham gia buổi phỏng vấn nào."
          action={
            <Button
              size="sm"
              onClick={() => navigate("/user/ai-interview/setup")}
              className="gap-1.5 bg-[#0047AB] hover:bg-[#003d91]">
              <Bot className="h-3.5 w-3.5" />
              Phỏng vấn AI
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
                            ? (AI_MODE_LABELS[item.mode ?? ""] ?? "Phỏng vấn AI")
                            : item.roomName || `Phiên #${item.id}`}
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
                                {item.sessionConfig.duration_minutes} phút
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
                          Phản hồi
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
                            if (session) void handleOpenPaymentMethodDialog(session);
                          }}>
                          {isPaying ? "..." : "Thanh toán"}
                        </Button>
                      )}
                      {!isAi && isPaid && (
                        <Button size="sm" variant="secondary" disabled>
                          Đã TT
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleViewDetails(item)}>
                        Chi tiết
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
                Trước
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

      {/* Payment Dialog */}
      <PaymentMethodDialog
        open={targetSessionForPayment !== null}
        onOpenChange={(open) => {
          if (!open) setTargetSessionForPayment(null);
        }}
        title="Chọn phương thức thanh toán"
        description="Bạn có thể thanh toán qua PayOS hoặc sử dụng số dư ví."
        amount={
          typeof targetSessionForPayment?.totalPrice === "number" &&
          targetSessionForPayment.totalPrice > 0
            ? targetSessionForPayment.totalPrice
            : 0
        }
        walletBalance={typeof user?.walletBalance === "number" ? user.walletBalance : undefined}
        isSubmitting={
          isPreparingPaymentDialog ||
          (targetSessionForPayment?.id != null && payingSessionId === targetSessionForPayment.id)
        }
        onConfirm={handleConfirmPaymentMethod}
      />
    </div>
  );
}
