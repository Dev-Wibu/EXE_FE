import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
const t = i18n.t.bind(i18n);
/**
 * Session Detail Page
 * Shows session details with review and feedback
 */

import { FeedbackCard } from "@/components/feedback";
import { ReviewCard } from "@/components/review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMentorById } from "@/hooks/useMentor";
import { useMentorFeedbackBySession } from "@/hooks/useMentorFeedback";
import { useMentorReviewBySession } from "@/hooks/useMentorReview";
import { useMakeSessionPayment, useSessionById } from "@/hooks/useSession";
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
import { formatCurrency, formatDateTime } from "@/lib/formatting";
import { sessionManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  MessageSquare,
  Star,
  User,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// Status badge mapping
const statusMap: Record<
  string,
  {
    label: string;
    badgeClass: string;
  }
> = {
  DRAFT: {
    label: t("common.waitingForApproval"),
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  SCHEDULED: {
    label: t("common.scheduled"),
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  PAID: {
    label: t("common.paid"),
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  ACTIVE: {
    label: t("common.ongoing"),
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  ONGOING: {
    label: t("common.ongoing"),
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  COMPLETED: {
    label: t("general.completed"),
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  REJECTED: {
    label: t("common.rejected"),
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  CANCELED: {
    label: t("common.canceled"),
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};
export function SessionDetailPage() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isPollingPayment, setIsPollingPayment] = useState(false);
  const [isRecoveringPaidStatus, setIsRecoveringPaidStatus] = useState(false);
  const pollingAttemptsRef = useRef(0);
  const payosPaymentInFlightRef = useRef(false);
  const paidStatusSyncInFlightRef = useRef(false);
  const hasHandledCancelledParamRef = useRef(false);
  const paymentQuery = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const paymentState = paymentQuery.get("payment")?.trim();
  const {
    data: session,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useSessionById(Number(sessionId));
  const mentorId = session?.userId2 || 0;
  const { data: mentorInfo } = useMentorById(mentorId);
  const { mutateAsync: makeSessionPayment } = useMakeSessionPayment();
  const { data: myFeedback, isLoading: feedbackLoading } = useMentorFeedbackBySession(
    Number(sessionId)
  );
  const { data: mentorReview, isLoading: reviewLoading } = useMentorReviewBySession(
    Number(sessionId)
  );
  const isLoading = sessionLoading;
  const isCompleted = session?.status === "COMPLETED";
  const syncSessionPaidStatus = useCallback(
    async (
      targetSessionId: number,
      transactionCode?: string,
      options?: {
        silent?: boolean;
      }
    ): Promise<boolean> => {
      if (!user?.id || paidStatusSyncInFlightRef.current) {
        return false;
      }
      paidStatusSyncInFlightRef.current = true;
      setIsRecoveringPaidStatus(true);
      try {
        markPendingSessionPaidStatusSyncRetried(targetSessionId, Number(user.id));
        const syncResult = await sessionManager.markSessionAsPaidWithRetry(
          targetSessionId,
          transactionCode,
          3
        );
        if (!syncResult.success) {
          return false;
        }
        clearPendingSessionPaidStatusSync(targetSessionId, Number(user.id));
        await refetchSession();
        if (!options?.silent) {
          toast.success(t("userMockinterview.sessionStatusSyncedToPaid"));
        }
        return true;
      } finally {
        paidStatusSyncInFlightRef.current = false;
        setIsRecoveringPaidStatus(false);
      }
    },
    [refetchSession, user?.id, t]
  );
  const handlePaySessionWithPayOS = async () => {
    if (!session?.id || !user?.id) {
      return;
    }
    if (payosPaymentInFlightRef.current) {
      toast.info(t("common.theSystemIsGeneratingAPaymentLink"));
      return;
    }
    payosPaymentInFlightRef.current = true;
    setIsCreatingPayment(true);
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
        note: t("userMockinterview.createdSessionPaymentCheckouturlFrom"),
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
        message: t("general.checkouturlCreatedSuccessfullyForSession"),
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
        note: t("userMockinterview.redirectedToSessionPaymentPage"),
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
          typeof session?.totalPrice === "number" && session.totalPrice > 0
            ? session.totalPrice
            : undefined,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session?.id,
        status: "CREATE_FAILED",
        message: t("userMockinterview.createAFailedSessionPayment"),
        payload: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });
      // Error toast is handled inside useMakeSessionPayment hook.
    } finally {
      payosPaymentInFlightRef.current = false;
      setIsCreatingPayment(false);
    }
  };
  useEffect(() => {
    if (!session?.id || !user?.id) {
      return;
    }
    const currentSessionId = session.id;
    if (!currentSessionId) {
      return;
    }
    if (session.status === "PAID") {
      clearPendingSessionPaidStatusSync(currentSessionId, Number(user.id));
      return;
    }
    if (session.status !== "SCHEDULED") {
      return;
    }
    const pendingSync = getPendingSessionPaidStatusSync(currentSessionId, Number(user.id));
    if (!pendingSync || !canRetryPendingSessionPaidStatusSync(pendingSync)) {
      return;
    }
    void syncSessionPaidStatus(currentSessionId, pendingSync.transactionCode, {
      silent: true,
    });
  }, [session?.id, session?.status, syncSessionPaidStatus, user?.id]);
  useEffect(() => {
    if (!session?.id || !paymentState || !user?.id) {
      return;
    }
    const currentSessionId = session.id;
    if (!currentSessionId) {
      return;
    }
    if (paymentState === "cancelled") {
      if (!hasHandledCancelledParamRef.current) {
        hasHandledCancelledParamRef.current = true;
        toast.info(t("userMockinterview.youHaveCanceledYourPayment"));
      }
      return;
    }
    if (paymentState !== "success") {
      return;
    }
    if (session.status === "PAID") {
      toast.success(t("userMockinterview.paymentForTheInterviewSession"));
      navigate(`/user/mock-interview/history/${currentSessionId}`, {
        replace: true,
      });
      return;
    }
    let cancelled = false;
    pollingAttemptsRef.current = 0;
    setIsPollingPayment(true);
    const pollStatus = async () => {
      pollingAttemptsRef.current += 1;
      const pendingSync = getPendingSessionPaidStatusSync(currentSessionId, Number(user.id));
      if (pendingSync && canRetryPendingSessionPaidStatusSync(pendingSync)) {
        const synced = await syncSessionPaidStatus(currentSessionId, pendingSync.transactionCode, {
          silent: true,
        });
        if (cancelled) {
          return;
        }
        if (synced) {
          setIsPollingPayment(false);
          toast.success(t("userMockinterview.paymentForTheInterviewSession"));
          navigate(`/user/mock-interview/history/${currentSessionId}`, {
            replace: true,
          });
          return;
        }
      }
      const result = await refetchSession();
      if (cancelled) {
        return;
      }
      if (result.data?.status === "PAID") {
        setIsPollingPayment(false);
        toast.success(t("userMockinterview.paymentForTheInterviewSession"));
        navigate(`/user/mock-interview/history/${currentSessionId}`, {
          replace: true,
        });
        return;
      }
      if (pollingAttemptsRef.current >= 12) {
        setIsPollingPayment(false);
        toast.info(t("userMockinterview.theSystemIsUpdatingThe"));
        navigate(`/user/mock-interview/history/${currentSessionId}`, {
          replace: true,
        });
      }
    };
    void pollStatus();
    const intervalId = window.setInterval(() => {
      void pollStatus();
    }, 5000);
    return () => {
      cancelled = true;
      setIsPollingPayment(false);
      window.clearInterval(intervalId);
    };
  }, [
    navigate,
    paymentState,
    refetchSession,
    session?.id,
    session?.status,
    syncSessionPaidStatus,
    user?.id,
    t,
  ]);
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }
  if (!session) {
    return (
      <div className="space-y-6">
        <Button variant="outline" className="w-fit" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("general.back")}
        </Button>
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <Video className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">{t("common.noInterviewSessionsFound")}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("common.thisInterviewSessionDoesNotExistOr")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (session.userId !== user?.id) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => navigate("/user?tab=mockInterview")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("userMockinterview.backToHistory")}
        </Button>
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">{t("common.noAccess")}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("userMockinterview.youCannotViewAnInterview")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  const status = statusMap[session.status || "SCHEDULED"] || statusMap.SCHEDULED;
  const canJoinRoom =
    !!session.roomUrl && (session.status === "PAID" || session.status === "ONGOING");
  const canWriteFeedback = isCompleted && !myFeedback;
  const canPaySession = session.status === "SCHEDULED";
  const isPaidSession = session.status === "PAID";
  return (
    <div className="space-y-5">
      <Button
        variant="outline"
        className="w-fit"
        onClick={() => navigate("/user?tab=mockInterview")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("userMockinterview.backToHistory")}
      </Button>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Video className="h-6 w-6 text-[#0047AB]" />
              </div>
              <div>
                <CardTitle>
                  {session.roomName ||
                    t("common.sessionVar0", {
                      var_0: session.id,
                    })}
                </CardTitle>
                <CardDescription>{t("common.interviewSessionDetails")}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {t("common.code")}
                {session.id || "-"}
              </Badge>
              <Badge className={status.badgeClass}>{status.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                {t("userMockinterview.instructor")}
              </span>
              <span className="font-medium">
                {mentorInfo?.name ||
                  (session.userId2
                    ? `Mentor #${session.userId2}`
                    : t("userMockinterview.notDetermined"))}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">{t("common.sessionCode")}</span>
              <span className="font-medium">{session.id}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                {t("common.appointmentTime")}
              </span>
              <span className="font-medium">
                {session.joinTime ? formatDateTime(session.joinTime) : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">{t("common.status1")}</span>
              <span className="font-medium">{session.status}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                {t("userMockinterview.estimatedDuration")}
              </span>
              <span className="font-medium">
                {typeof session.duration === "number" && session.duration > 0
                  ? t("general.minutes", {
                      var_0: session.duration,
                    })
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">{t("common.totalPrice")}</span>
              <span className="font-medium">
                {typeof session.totalPrice === "number" && session.totalPrice > 0
                  ? formatCurrency(session.totalPrice)
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:col-span-2 lg:col-span-3 dark:bg-slate-900/50">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                {t("common.transactionCode1")}
              </span>
              <span className="font-medium">{session.transactionCode || "-"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/30">
            <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t("common.actFast")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/user?tab=interviewHistory")}>
                {t("common.viewHistory")}
              </Button>

              {canJoinRoom && (
                <Button
                  onClick={() => navigate(`/user/mock-interview/room/${session.id}`)}
                  className="gap-2">
                  <Video className="h-4 w-4" />
                  {t("common.enterTheInterviewRoom")}
                </Button>
              )}

              {canWriteFeedback && (
                <Button
                  onClick={() => navigate(`/user/mock-interview/history/${session.id}/feedback`)}
                  className="gap-2">
                  <Star className="h-4 w-4" />
                  {t("userMockinterview.writeFeedbackToMentor")}
                </Button>
              )}

              {canPaySession && (
                <Button
                  onClick={handlePaySessionWithPayOS}
                  disabled={isCreatingPayment || isPollingPayment || isRecoveringPaidStatus}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <CreditCard className="h-4 w-4" />
                  {isRecoveringPaidStatus
                    ? t("userMockinterview.synchronizingPaymentStatus")
                    : isCreatingPayment
                      ? t("userMockinterview.paymentProcessing")
                      : t("userMockinterview.paymentForInterviewSession")}
                </Button>
              )}

              {isPaidSession && (
                <Button variant="secondary" disabled className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t("userMockinterview.paidSession")}
                </Button>
              )}

              {!canJoinRoom && !canWriteFeedback && !canPaySession && !isPaidSession && (
                <p className="text-sm text-slate-500">
                  {t("userMockinterview.theSessionIsCurrentlyIn")}
                </p>
              )}
            </div>

            {canPaySession && (
              <p className="mt-2 text-xs text-slate-500">
                {t("userMockinterview.afterPaymentIsCompletedThe")}
              </p>
            )}

            {isPollingPayment && (
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                {t("userMockinterview.theSystemIsCheckingPayments")}
              </div>
            )}

            {isRecoveringPaidStatus && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {t("userMockinterview.synchronizingPaymentStatus")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">{t("userMockinterview.yourFeedback")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {feedbackLoading ? (
            <Skeleton className="h-32" />
          ) : myFeedback ? (
            <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/30">
              <FeedbackCard
                feedback={myFeedback}
                showMentor
                showSession={false}
                onClick={() => navigate(`/user/mock-interview/history/${session.id}/feedback`)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/user/mock-interview/history/${session.id}/feedback`)}>
                {t("common.editResponse")}
              </Button>
            </div>
          ) : isCompleted ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">
                {t("userMockinterview.youHaveNotSubmittedFeedback")}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/user/mock-interview/history/${session.id}/feedback`)}>
                {t("common.writeFeedback")}
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">{t("userMockinterview.feedbackCanOnlyBeSent")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle className="text-lg">{t("common.reviewsFromMentors")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {reviewLoading ? (
            <Skeleton className="h-32" />
          ) : mentorReview ? (
            <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/30">
              <ReviewCard
                review={mentorReview}
                showMentor
                onClick={() => {
                  if (mentorReview.id) {
                    navigate(`/user/feedback/${mentorReview.id}`);
                  }
                }}
              />
              {mentorReview.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/user/feedback/${mentorReview.id}`)}>
                  {t("common.seeReviewDetails")}
                </Button>
              )}
            </div>
          ) : isCompleted ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
              <Star className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">{t("userMockinterview.mentorHasNotSubmittedA")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
              <Star className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">
                {t("userMockinterview.evaluationWillBeAvailableAfter")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
