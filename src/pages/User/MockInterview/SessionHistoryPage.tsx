import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
const t = i18n.t.bind(i18n);
/**
 * Session History Page
 * Displays user's interview sessions with option to join or write reviews
 */

import { PaginationControl } from "@/components/shared/PaginationControl";
import { ReloadButton } from "@/components/shared/ReloadButton";
import { SortButton } from "@/components/shared/SortButton";
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
import { useSortable } from "@/hooks/useSortable";
import type { Session } from "@/interfaces";
import {
  addPaymentSupportLog,
  canRetryPendingSessionPaidStatusSync,
  clearPendingSessionPaidStatusSync,
  extractCheckoutTokenFromUrl,
  extractOrderCodeFromUrl,
  extractTransactionCodeFromUrl,
  getPendingSessionPaidStatusSync,
  markPendingSessionPaidStatusSyncRetried,
  savePendingSessionPaymentContext,
  upsertPaymentRecoveryContext,
} from "@/lib";
import {
  formatCurrency,
  formatDateTime,
  formatTime,
  treatZuluAsVietnamLocal,
} from "@/lib/formatting";
import { sessionManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { ArrowRight, Calendar, Clock, Search, Star, User, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Status badge mapping
const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
  }
> = {
  DRAFT: {
    label: t("common.waitingForApproval"),
    variant: "secondary",
    color: "bg-amber-100 text-amber-700",
  },
  SCHEDULED: {
    label: t("common.comingSoon"),
    variant: "secondary",
    color: "bg-blue-100 text-blue-700",
  },
  PAID: {
    label: t("common.paid"),
    variant: "secondary",
    color: "bg-emerald-100 text-emerald-700",
  },
  ONGOING: {
    label: t("common.ongoing"),
    variant: "default",
    color: "bg-green-100 text-green-700",
  },
  COMPLETED: {
    label: t("general.completed"),
    variant: "outline",
    color: "bg-slate-100 text-slate-600",
  },
  REJECTED: {
    label: t("common.rejected"),
    variant: "destructive",
    color: "bg-red-100 text-red-600",
  },
  CANCELED: {
    label: t("common.canceled"),
    variant: "destructive",
    color: "bg-red-100 text-red-600",
  },
};
type SessionStatusFilter =
  | "all"
  | "DRAFT"
  | "SCHEDULED"
  | "PAID"
  | "ONGOING"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELED";
interface SessionCardProps {
  session: Session;
  hasFeedback: boolean;
  isPaying: boolean;
  onViewDetails: () => void;
  onWriteFeedback: () => void;
  onPaySession: () => void;
}
function SessionCard({
  session,
  hasFeedback,
  isPaying,
  onViewDetails,
  onWriteFeedback,
  onPaySession,
}: SessionCardProps) {
  const navigate = useNavigate();
  const status = statusMap[session.status || "SCHEDULED"] || statusMap.SCHEDULED;
  const isCompleted = session.status === "COMPLETED";
  const isScheduled = session.status === "SCHEDULED";
  const isPaid = session.status === "PAID";
  const isDraft = session.status === "DRAFT";
  const isRejected = session.status === "REJECTED";
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0047AB]/10">
              <Video className="h-5 w-5 text-[#0047AB]" />
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
        {/* DRAFT banner */}
        {isDraft && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <Clock className="mr-1 inline h-3.5 w-3.5" />
            {t("common.theRequestIsAwaitingReviewByTheMe")}
          </div>
        )}
        {/* REJECTED banner */}
        {isRejected && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {t("common.theRequestWasDeniedYouCanReschedu")}
          </div>
        )}

        <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
          {session.joinTime && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("common.appointmentTime")} {formatDateTime(session.joinTime)}
            </span>
          )}
          {session.startTime1 && (
            <>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t("common.begin")} {formatTime(treatZuluAsVietnamLocal(session.startTime1))}
              </span>
            </>
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

        <div className="flex gap-2">
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
              onClick={() => navigate("/user/mock-interview/schedule")}
              className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50">
              <ArrowRight className="h-4 w-4" />
              {t("common.reschedule")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
export function SessionHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>("all");
  const [payingSessionId, setPayingSessionId] = useState<number | null>(null);
  const payosPaymentInFlightRef = useRef(false);
  const paidStatusSyncInFlightRef = useRef(false);
  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    isRefetching: sessionsRefetching,
    refetch: refetchSessions,
  } = useUserSessions();
  const { mutateAsync: makeSessionPayment } = useMakeSessionPayment();
  const {
    data: feedbacks = [],
    isLoading: feedbacksLoading,
    isRefetching: feedbacksRefetching,
    refetch: refetchFeedbacks,
  } = useMentorFeedbacksByUser(user?.id || 0);
  const isLoading = sessionsLoading || feedbacksLoading;
  const syncSessionPaidStatus = useCallback(
    async (
      session: Session,
      transactionCode?: string,
      options?: {
        silent?: boolean;
      }
    ): Promise<boolean> => {
      if (!session.id || !user?.id || paidStatusSyncInFlightRef.current) {
        return false;
      }
      paidStatusSyncInFlightRef.current = true;
      try {
        markPendingSessionPaidStatusSyncRetried(session.id, Number(user.id));
        const syncResult = await sessionManager.markSessionAsPaidWithRetry(
          session.id,
          transactionCode,
          3
        );
        if (!syncResult.success) {
          return false;
        }
        clearPendingSessionPaidStatusSync(session.id, Number(user.id));
        await refetchSessions();
        if (!options?.silent) {
          toast.success(t("userMockinterview.sessionStatusSyncedToPaid"));
        }
        return true;
      } finally {
        paidStatusSyncInFlightRef.current = false;
      }
    },

    [refetchSessions, user?.id, t]
  );

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
  const filteredSessions = useMemo(
    () =>
      [...sessions]
        .filter((session) => {
          const normalizedSearch = searchQuery.trim().toLowerCase();
          const matchesSearch =
            normalizedSearch.length === 0 ||
            session.id?.toString().includes(normalizedSearch) ||
            session.userId2?.toString().includes(normalizedSearch) ||
            session.roomName?.toLowerCase().includes(normalizedSearch) ||
            statusMap[session.status || "SCHEDULED"]?.label
              ?.toLowerCase()
              .includes(normalizedSearch);
          if (!matchesSearch) {
            return false;
          }
          if (statusFilter !== "all" && session.status !== statusFilter) {
            return false;
          }
          return true;
        })
        .sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
    [searchQuery, sessions, statusFilter]
  );

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(filteredSessions);

  // Apply pagination
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_user_mockinterview_sessionhistorypage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);
  const handleViewDetails = (session: Session) => {
    navigate(`/user/mock-interview/history/${session.id}`);
  };
  const handleWriteFeedback = (session: Session) => {
    navigate(`/user/mock-interview/history/${session.id}/feedback`);
  };
  const handlePaySessionWithPayOS = async (session: Session) => {
    if (!session.id || !user?.id) {
      return;
    }
    if (payosPaymentInFlightRef.current) {
      toast.info(t("common.theSystemIsGeneratingAPaymentLink"));
      return;
    }
    payosPaymentInFlightRef.current = true;
    setPayingSessionId(session.id);
    try {
      const checkoutUrl = await makeSessionPayment(session.id);
      const normalizedCheckoutUrl = new URL(checkoutUrl, window.location.origin).toString();
      const orderCode = extractOrderCodeFromUrl(normalizedCheckoutUrl) || undefined;
      const transactionCode = extractTransactionCodeFromUrl(normalizedCheckoutUrl) || undefined;
      const checkoutToken = extractCheckoutTokenFromUrl(normalizedCheckoutUrl) || undefined;
      const paymentAmount =
        typeof session.totalPrice === "number" && session.totalPrice > 0
          ? session.totalPrice
          : undefined;
      const createdRecovery = upsertPaymentRecoveryContext({
        orderCode,
        transactionCode,
        checkoutToken,
        userId: Number(user.id),
        amount: paymentAmount,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        checkoutUrl: normalizedCheckoutUrl,
        status: "CREATED",
        note: t("userMockinterview.createdInterviewSessionPaymentCheckouturl"),
      });
      addPaymentSupportLog({
        supportCode: createdRecovery.supportCode,
        orderCode,
        transactionCode,
        checkoutToken,
        userId: createdRecovery.userId,
        amount: createdRecovery.amount,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        status: "CREATED",
        message: t("userMockinterview.successfullyCreatedCheckouturlForInterview"),
      });
      const redirectedRecovery = upsertPaymentRecoveryContext({
        supportCode: createdRecovery.supportCode,
        orderCode,
        transactionCode,
        checkoutToken,
        userId: createdRecovery.userId,
        amount: createdRecovery.amount,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        checkoutUrl: normalizedCheckoutUrl,
        status: "REDIRECTED",
        note: t("userMockinterview.redirectedToInterviewSessionPayment"),
      });
      if (!transactionCode) {
        addPaymentSupportLog({
          supportCode: redirectedRecovery.supportCode,
          orderCode,
          checkoutToken,
          userId: redirectedRecovery.userId,
          amount: redirectedRecovery.amount,
          paymentPurpose: "MENTOR_INTERVIEW",
          sessionId: session.id,
          status: "UNMAPPED_ORDER",
          message: t("userMockinterview.checkoutTheInterviewSessionUrl"),
          payload: {
            orderCode: orderCode || null,
            checkoutToken: checkoutToken || null,
            recoveryStrategy: "orderCode-fallback-guarded",
          },
        });
      }
      savePendingSessionPaymentContext({
        sessionId: session.id,
        userId: Number(user.id),
        checkoutUrl: normalizedCheckoutUrl,
      });
      window.location.assign(normalizedCheckoutUrl);
    } catch (error) {
      addPaymentSupportLog({
        userId: Number(user.id),
        amount:
          typeof session.totalPrice === "number" && session.totalPrice > 0
            ? session.totalPrice
            : undefined,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        status: "CREATE_FAILED",
        message: t("userMockinterview.createALinkToPay"),
        payload: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });
      // Error toast is handled inside useMakeSessionPayment hook.
    } finally {
      payosPaymentInFlightRef.current = false;
      setPayingSessionId(null);
    }
  };
  useEffect(() => {
    if (!user?.id || sessions.length === 0) {
      return;
    }
    for (const currentSession of sessions) {
      if (!currentSession.id) {
        continue;
      }
      if (currentSession.status === "PAID") {
        clearPendingSessionPaidStatusSync(currentSession.id, Number(user.id));
      }
    }
    const scheduledWithPending = sessions.find((currentSession) => {
      if (!currentSession.id || currentSession.status !== "SCHEDULED") {
        return false;
      }
      const pendingSync = getPendingSessionPaidStatusSync(currentSession.id, Number(user.id));
      return !!pendingSync && canRetryPendingSessionPaidStatusSync(pendingSync);
    });
    if (!scheduledWithPending) {
      return;
    }
    const pendingSync = getPendingSessionPaidStatusSync(
      scheduledWithPending.id as number,
      Number(user.id)
    );
    if (!pendingSync) {
      return;
    }
    void syncSessionPaidStatus(scheduledWithPending, pendingSync.transactionCode, {
      silent: true,
    });
  }, [sessions, syncSessionPaidStatus, user?.id]);

  // Stats — DRAFT is counted separately
  const draftCount = sessions.filter((s) => s.status === "DRAFT").length;
  const scheduledCount = sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "PAID" || s.status === "ONGOING"
  ).length;
  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== "all";
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("userMockinterview.interviewHistory")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("userMockinterview.reviewTheInterviewSessionsAnd")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={async () => {
              await Promise.all([refetchSessions(), refetchFeedbacks()]);
            }}
            isLoading={sessionsRefetching || feedbacksRefetching}
            tooltip={t("userMockinterview.reloadSessionHistory")}
          />
          <Button
            onClick={() => navigate("/user/mock-interview/schedule")}
            className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
            <Video className="h-4 w-4" />
            {t("userMockinterview.scheduleANewInterview")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.totalSession")}</CardDescription>
            <CardTitle className="text-2xl">{sessions.length}</CardTitle>
          </CardHeader>
        </Card>
        {draftCount > 0 && (
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-2">
              <CardDescription>{t("common.waitingForApproval")}</CardDescription>
              <CardTitle className="text-2xl text-amber-600">{draftCount}</CardTitle>
            </CardHeader>
          </Card>
        )}
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardDescription>{t("common.comingSoon")}</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{scheduledCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("general.completed")}</CardDescription>
            <CardTitle className="text-2xl text-green-600">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.waitingForReview")}</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {
                sessions.filter(
                  (s) =>
                    s.status === "COMPLETED" &&
                    typeof s.id === "number" &&
                    !feedbackSessionIds.has(s.id)
                ).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Session List */}
      {isLoading ? (
        <LoadingCardList count={4} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Video}
          title={t("common.noInterviewSessionYet")}
          description={t("userMockinterview.youHavenTHadAny1")}
          action={
            <Button onClick={() => navigate("/user/mock-interview/schedule")}>
              {t("userMockinterview.scheduleAnInterview")}
            </Button>
          }
        />
      ) : (
        <>
          {/* Controls */}
          <Card className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    pagination.goToFirstPage();
                  }}
                  className="pl-9"
                  placeholder={t("userMockinterview.searchBySessionIdMentor")}
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as SessionStatusFilter);
                  pagination.goToFirstPage();
                }}>
                <SelectTrigger className="w-full min-w-[200px]">
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

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    pagination.goToFirstPage();
                  }}>
                  {t("common.clearFilter")}
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("common.sortBy")}
              </span>
              <SortButton {...getSortProps("id")}>ID</SortButton>
              <SortButton {...getSortProps("status")}>{t("common.status")}</SortButton>
            </div>
          </Card>

          {sortedData.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t("userMockinterview.noMatchingSessionFound")}
              description={t("userMockinterview.tryADifferentKeywordOr")}
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {pageData.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    hasFeedback={
                      typeof session.id === "number" && feedbackSessionIds.has(session.id)
                    }
                    isPaying={payingSessionId === session.id}
                    onViewDetails={() => handleViewDetails(session)}
                    onWriteFeedback={() => handleWriteFeedback(session)}
                    onPaySession={() => void handlePaySessionWithPayOS(session)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  pagination.goToFirstPage();
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
