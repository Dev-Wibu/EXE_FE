/**
 * Session Detail Page
 * Shows session details with review and feedback
 */

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
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { FeedbackCard } from "@/components/feedback";
import { ReviewCard } from "@/components/review";
import { PaymentMethodDialog } from "@/components/shared";
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
  extractCheckoutTokenFromUrl,
  extractOrderCodeFromUrl,
  extractTransactionCodeFromUrl,
  savePendingSessionPaymentContext,
  upsertPaymentRecoveryContext,
} from "@/lib";
import { formatCurrency, formatDateTime } from "@/lib/formatting";
import { transactionManager, usersAdminManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// Status badge mapping
const statusMap: Record<string, { label: string; badgeClass: string }> = {
  DRAFT: {
    label: "Chờ duyệt",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  SCHEDULED: {
    label: "Đã lên lịch",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  PAID: {
    label: "Đã thanh toán",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  ACTIVE: {
    label: "Đang diễn ra",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  ONGOING: {
    label: "Đang diễn ra",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  COMPLETED: {
    label: "Hoàn thành",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  REJECTED: {
    label: "Bị từ chối",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  CANCELED: {
    label: "Đã hủy",
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const [isPollingPayment, setIsPollingPayment] = useState(false);
  const pollingAttemptsRef = useRef(0);
  const walletPaymentInFlightRef = useRef(false);
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

  const handlePaySessionWithPayOS = async () => {
    if (!session?.id || !user?.id) {
      return;
    }

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
        note: "Đã tạo checkoutUrl thanh toán phiên từ trang chi tiết.",
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
        message: "Đã tạo checkoutUrl thành công cho thanh toán phiên.",
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
        note: "Đã redirect sang trang thanh toán phiên từ trang chi tiết.",
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
          message:
            "Checkout URL phiên phỏng vấn chưa có transactionCode, sẽ fallback orderCode có guard khi callback hủy.",
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
        message: "Tạo link thanh toán phiên thất bại tại trang chi tiết.",
        payload: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });
      // Error toast is handled inside useMakeSessionPayment hook.
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const refreshWalletBalance = async (): Promise<number | undefined> => {
    if (!user?.id) {
      return undefined;
    }

    const response = await usersAdminManager.getById(Number(user.id));
    if (!response.success || !response.data) {
      return typeof user.walletBalance === "number" ? user.walletBalance : undefined;
    }

    setUser({
      ...user,
      ...response.data,
    });

    return typeof response.data.walletBalance === "number"
      ? response.data.walletBalance
      : typeof user.walletBalance === "number"
        ? user.walletBalance
        : undefined;
  };

  const handlePaySessionWithWallet = async () => {
    if (!session?.id || !user?.id) {
      return;
    }

    const paymentAmount =
      typeof session.totalPrice === "number" && session.totalPrice > 0 ? session.totalPrice : 0;
    if (paymentAmount <= 0) {
      toast.error("Phiên phỏng vấn chưa có tổng tiền hợp lệ để thanh toán bằng ví.");
      return;
    }

    if (walletPaymentInFlightRef.current) {
      toast.info("Hệ thống đang xử lý giao dịch ví. Vui lòng chờ trong giây lát.");
      return;
    }

    walletPaymentInFlightRef.current = true;
    setIsCreatingPayment(true);
    try {
      const freshWalletBalance = await refreshWalletBalance();
      if (typeof freshWalletBalance === "number" && freshWalletBalance < paymentAmount) {
        toast.error("Số dư ví không đủ. Vui lòng nạp thêm tiền hoặc chọn PayOS.");
        addPaymentSupportLog({
          userId: Number(user.id),
          amount: paymentAmount,
          paymentPurpose: "MENTOR_INTERVIEW",
          sessionId: session.id,
          status: "CREATE_FAILED",
          message: "Thanh toán ví thất bại do số dư không đủ ở trang chi tiết phiên.",
          payload: {
            walletBalance: freshWalletBalance,
          },
        });
        return;
      }

      addPaymentSupportLog({
        userId: Number(user.id),
        amount: paymentAmount,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        status: "CREATED",
        message: "Bắt đầu thanh toán bằng ví cho phiên phỏng vấn từ trang chi tiết.",
      });

      const transferOutResult = await transactionManager.transferOut(
        paymentAmount,
        Number(user.id),
        "MENTOR_INTERVIEW"
      );

      if (!transferOutResult.success || !transferOutResult.data) {
        addPaymentSupportLog({
          userId: Number(user.id),
          amount: paymentAmount,
          paymentPurpose: "MENTOR_INTERVIEW",
          sessionId: session.id,
          status: "CREATE_FAILED",
          message: "Thanh toán ví thất bại ở trang chi tiết phiên.",
          payload: {
            error: transferOutResult.error || null,
          },
        });
        toast.error(transferOutResult.error || "Không thể thanh toán bằng ví lúc này.");
        return;
      }

      const transferData = transferOutResult.data;

      if (typeof transferData.currentBalance === "number") {
        setUser({
          ...user,
          walletBalance: transferData.currentBalance,
        });
      }

      if (transferData.redirectUrl) {
        const normalizedCheckoutUrl = new URL(
          transferData.redirectUrl,
          window.location.origin
        ).toString();
        const orderCode = extractOrderCodeFromUrl(normalizedCheckoutUrl) || undefined;
        const transactionCode =
          transferData.transactionCode ||
          extractTransactionCodeFromUrl(normalizedCheckoutUrl) ||
          undefined;
        const checkoutToken = extractCheckoutTokenFromUrl(normalizedCheckoutUrl) || undefined;

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
          note: "Transfer-out tra ve checkoutUrl, fallback sang flow redirect.",
        });

        upsertPaymentRecoveryContext({
          supportCode: createdRecovery.supportCode,
          orderCode,
          transactionCode,
          checkoutToken,
          userId: Number(user.id),
          amount: paymentAmount,
          paymentPurpose: "MENTOR_INTERVIEW",
          sessionId: session.id,
          checkoutUrl: normalizedCheckoutUrl,
          status: "REDIRECTED",
          note: "Đã redirect sang checkoutUrl được trả về từ transfer-out.",
        });

        savePendingSessionPaymentContext({
          sessionId: session.id,
          userId: Number(user.id),
          checkoutUrl: normalizedCheckoutUrl,
        });
        toast.success("Đã tạo phiên thanh toán. Đang chuyển hướng...");
        window.location.assign(normalizedCheckoutUrl);
        return;
      }

      const recoveryContext = upsertPaymentRecoveryContext({
        transactionCode: transferData.transactionCode,
        userId: Number(user.id),
        amount: paymentAmount,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        status: "CALLBACK_SUCCESS",
        note: transferData.message || "Thanh toán bằng ví thành công.",
      });

      addPaymentSupportLog({
        supportCode: recoveryContext.supportCode,
        transactionCode: transferData.transactionCode,
        userId: Number(user.id),
        amount: paymentAmount,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        status: "CALLBACK_SUCCESS",
        message: transferData.message || "Thanh toán bằng ví thành công.",
        payload: {
          currentBalance: transferData.currentBalance,
          status: transferData.status,
        },
      });

      setIsPaymentMethodDialogOpen(false);
      toast.success("Thanh toán bằng ví thành công. Đang cập nhật trạng thái phiên.");
      navigate(`/user/mock-interview/history/${session.id}?payment=success`, { replace: true });
    } catch (error) {
      addPaymentSupportLog({
        userId: Number(user.id),
        amount: paymentAmount,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        status: "CREATE_FAILED",
        message: "Exception khi thanh toán bằng ví ở trang chi tiết phiên.",
        payload: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });
      toast.error("Không thể thanh toán bằng ví lúc này. Vui lòng thử lại.");
    } finally {
      walletPaymentInFlightRef.current = false;
      setIsCreatingPayment(false);
    }
  };

  const handleConfirmPaymentMethod = async (method: "payos" | "wallet") => {
    if (method === "wallet") {
      await handlePaySessionWithWallet();
      return;
    }

    setIsPaymentMethodDialogOpen(false);
    await handlePaySessionWithPayOS();
  };

  useEffect(() => {
    if (!session?.id || !paymentState) {
      return;
    }

    if (paymentState === "cancelled") {
      if (!hasHandledCancelledParamRef.current) {
        hasHandledCancelledParamRef.current = true;
        toast.info("Bạn đã hủy thanh toán cho phiên phỏng vấn này.");
      }
      return;
    }

    if (paymentState !== "success") {
      return;
    }

    if (session.status === "PAID") {
      toast.success("Phiên phỏng vấn đã được xác nhận thanh toán.");
      navigate(`/user/mock-interview/history/${session.id}`, { replace: true });
      return;
    }

    let cancelled = false;
    pollingAttemptsRef.current = 0;
    setIsPollingPayment(true);

    const pollStatus = async () => {
      pollingAttemptsRef.current += 1;
      const result = await refetchSession();
      if (cancelled) {
        return;
      }

      if (result.data?.status === "PAID") {
        setIsPollingPayment(false);
        toast.success("Phiên phỏng vấn đã được xác nhận thanh toán.");
        navigate(`/user/mock-interview/history/${session.id}`, { replace: true });
        return;
      }

      if (pollingAttemptsRef.current >= 12) {
        setIsPollingPayment(false);
        toast.info("Hệ thống đang cập nhật thanh toán. Vui lòng tải lại sau ít phút.");
        navigate(`/user/mock-interview/history/${session.id}`, { replace: true });
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
  }, [navigate, paymentState, refetchSession, session?.id, session?.status]);

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
          Quay lại
        </Button>
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <Video className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không tìm thấy phiên phỏng vấn</h3>
            <p className="mt-1 text-sm text-slate-500">
              Phiên phỏng vấn này không tồn tại hoặc đã bị xóa
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
          onClick={() => navigate("/user?tab=interviewHistory")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại lịch sử
        </Button>
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không có quyền truy cập</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bạn không thể xem phiên phỏng vấn không thuộc về mình.
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
        onClick={() => navigate("/user?tab=interviewHistory")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại lịch sử
      </Button>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Video className="h-6 w-6 text-[#0047AB]" />
              </div>
              <div>
                <CardTitle>{session.roomName || `Phiên #${session.id}`}</CardTitle>
                <CardDescription>Chi tiết phiên phỏng vấn</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Mã #{session.id || "-"}</Badge>
              <Badge className={status.badgeClass}>{status.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Người hướng dẫn:</span>
              <span className="font-medium">
                {mentorInfo?.name ||
                  (session.userId2 ? `Mentor #${session.userId2}` : "Chưa xác định")}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Mã phiên:</span>
              <span className="font-medium">{session.id}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Giờ hẹn:</span>
              <span className="font-medium">
                {session.joinTime ? formatDateTime(session.joinTime) : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Trạng thái:</span>
              <span className="font-medium">{session.status}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Thời lượng dự kiến:</span>
              <span className="font-medium">
                {typeof session.duration === "number" && session.duration > 0
                  ? `${session.duration} phút`
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Tổng giá:</span>
              <span className="font-medium">
                {typeof session.totalPrice === "number" && session.totalPrice > 0
                  ? formatCurrency(session.totalPrice)
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:col-span-2 lg:col-span-3 dark:bg-slate-900/50">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Mã giao dịch:</span>
              <span className="font-medium">{session.transactionCode || "-"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/30">
            <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Hành động nhanh
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/user?tab=interviewHistory")}>
                Xem lịch sử
              </Button>

              {canJoinRoom && (
                <Button
                  onClick={() => navigate(`/user/mock-interview/room/${session.id}`)}
                  className="gap-2">
                  <Video className="h-4 w-4" />
                  Vào phòng phỏng vấn
                </Button>
              )}

              {canWriteFeedback && (
                <Button
                  onClick={() => navigate(`/user/mock-interview/history/${session.id}/feedback`)}
                  className="gap-2">
                  <Star className="h-4 w-4" />
                  Viết phản hồi cho Mentor
                </Button>
              )}

              {canPaySession && (
                <Button
                  onClick={() => setIsPaymentMethodDialogOpen(true)}
                  disabled={isCreatingPayment || isPollingPayment}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <CreditCard className="h-4 w-4" />
                  {isCreatingPayment ? "Đang xử lý thanh toán..." : "Thanh toán phiên phỏng vấn"}
                </Button>
              )}

              {isPaidSession && (
                <Button variant="secondary" disabled className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Phiên đã thanh toán
                </Button>
              )}

              {!canJoinRoom && !canWriteFeedback && !canPaySession && !isPaidSession && (
                <p className="text-sm text-slate-500">
                  Phiên hiện ở chế độ theo dõi, chưa có thao tác bổ sung.
                </p>
              )}
            </div>

            {canPaySession && (
              <p className="mt-2 text-xs text-slate-500">
                Sau khi thanh toán xong, hệ thống sẽ cập nhật trạng thái sang PAID.
              </p>
            )}

            {isPollingPayment && (
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Hệ thống đang đối soát thanh toán. Trạng thái sẽ được cập nhật tự động.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Phản Hồi Của Bạn</CardTitle>
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
                Sửa phản hồi
              </Button>
            </div>
          ) : isCompleted ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">Bạn chưa gửi phản hồi cho phiên này</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/user/mock-interview/history/${session.id}/feedback`)}>
                Viết phản hồi
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">
                Phản hồi chỉ có thể gửi sau khi phiên phỏng vấn hoàn thành
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle className="text-lg">Đánh Giá Từ Mentor</CardTitle>
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
                  Xem chi tiết đánh giá
                </Button>
              )}
            </div>
          ) : isCompleted ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
              <Star className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">Mentor chưa gửi đánh giá cho phiên này</p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center dark:border-slate-700">
              <Star className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">
                Đánh giá sẽ có sau khi phiên phỏng vấn hoàn thành
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentMethodDialog
        open={isPaymentMethodDialogOpen}
        onOpenChange={setIsPaymentMethodDialogOpen}
        title="Chọn phương thức thanh toán phiên"
        description="Bạn có thể thanh toán qua PayOS hoặc thanh toán trực tiếp bằng số dư ví."
        amount={
          typeof session.totalPrice === "number" && session.totalPrice > 0 ? session.totalPrice : 0
        }
        walletBalance={typeof user?.walletBalance === "number" ? user.walletBalance : undefined}
        isSubmitting={isCreatingPayment}
        onConfirm={handleConfirmPaymentMethod}
      />
    </div>
  );
}
