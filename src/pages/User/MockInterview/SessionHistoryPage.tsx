/**
 * Session History Page
 * Displays user's interview sessions with option to join or write reviews
 */

import { ArrowRight, Calendar, Clock, Star, User, Video } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PaymentMethodDialog } from "@/components/shared";
import { PaginationControl } from "@/components/shared/PaginationControl";
import { ReloadButton } from "@/components/shared/ReloadButton";
import { SortButton } from "@/components/shared/SortButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardList } from "@/components/ui/loading-card";
import { useMentorFeedbacksByUser } from "@/hooks/useMentorFeedback";
import { usePagination } from "@/hooks/usePagination";
import { useMakeSessionPayment, useUserSessions } from "@/hooks/useSession";
import { useSortable } from "@/hooks/useSortable";
import type { Session } from "@/interfaces";
import {
  addPaymentSupportLog,
  extractCheckoutTokenFromUrl,
  extractOrderCodeFromUrl,
  extractTransactionCodeFromUrl,
  savePendingSessionPaymentContext,
  upsertPaymentRecoveryContext,
} from "@/lib";
import { formatCurrency } from "@/lib/formatting";
import { transactionManager, usersAdminManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// Status badge mapping
const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  DRAFT: { label: "Chờ duyệt", variant: "secondary", color: "bg-amber-100 text-amber-700" },
  SCHEDULED: { label: "Sắp diễn ra", variant: "secondary", color: "bg-blue-100 text-blue-700" },
  PAID: { label: "Đã thanh toán", variant: "secondary", color: "bg-emerald-100 text-emerald-700" },
  ONGOING: { label: "Đang diễn ra", variant: "default", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Hoàn thành", variant: "outline", color: "bg-slate-100 text-slate-600" },
  REJECTED: { label: "Bị từ chối", variant: "destructive", color: "bg-red-100 text-red-600" },
  CANCELED: { label: "Đã hủy", variant: "destructive", color: "bg-red-100 text-red-600" },
};

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
                {session.roomName || `Phiên #${session.id}`}
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
            Yêu cầu đang chờ mentor hoặc Staff/Admin xét duyệt
          </div>
        )}
        {/* REJECTED banner */}
        {isRejected && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Yêu cầu đã bị từ chối. Bạn có thể đặt lịch lại.
          </div>
        )}

        <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
          {session.joinTime && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Giờ hẹn:{" "}
              {new Date(session.joinTime).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {session.startTime1 && (
            <>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Bắt đầu:{" "}
                {new Date(session.startTime1).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </>
          )}
          {!session.joinTime && !session.startTime1 && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Phiên #{session.id}
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
              {isPaying ? "Đang xử lý..." : "Thanh toán"}
            </Button>
          )}
          {isPaid && (
            <Button variant="secondary" size="sm" disabled className="gap-1">
              Đã thanh toán
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            Xem chi tiết
          </Button>
          {isCompleted && !hasFeedback && (
            <Button size="sm" onClick={onWriteFeedback} className="gap-1">
              <Star className="h-4 w-4" />
              Viết phản hồi
            </Button>
          )}
          {isCompleted && hasFeedback && (
            <Button variant="secondary" size="sm" onClick={onWriteFeedback} className="gap-1">
              <Star className="h-4 w-4 text-[#FFD700]" />
              Sửa phản hồi
            </Button>
          )}
          {isRejected && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/user/mock-interview/schedule")}
              className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50">
              <ArrowRight className="h-4 w-4" />
              Đặt lịch lại
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SessionHistoryPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [pageSize, setPageSize] = useState(10);
  const [payingSessionId, setPayingSessionId] = useState<number | null>(null);
  const [targetSessionForPayment, setTargetSessionForPayment] = useState<Session | null>(null);
  const walletPaymentInFlightRef = useRef(false);
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

  // Get session IDs where user already submitted mentor feedback
  const feedbackSessionIds = new Set(
    feedbacks
      .map((f: { session?: { id?: number } }) => f.session?.id)
      .filter((id): id is number => typeof id === "number")
  );

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(sessions);

  // Apply pagination
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
        note: "Đã tạo checkoutUrl thanh toán phiên phỏng vấn.",
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
        message: "Đã tạo checkoutUrl thành công cho thanh toán phiên phỏng vấn.",
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
        note: "Đã redirect sang trang thanh toán phiên phỏng vấn.",
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
          typeof session.totalPrice === "number" && session.totalPrice > 0
            ? session.totalPrice
            : undefined,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        status: "CREATE_FAILED",
        message: "Tạo link thanh toán phiên phỏng vấn thất bại.",
        payload: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });
      // Error toast is handled inside useMakeSessionPayment hook.
    } finally {
      setPayingSessionId(null);
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

  const handlePaySessionWithWallet = async (session: Session) => {
    if (!session.id || !user?.id) {
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
    setPayingSessionId(session.id);

    try {
      const freshWalletBalance = await refreshWalletBalance();
      if (typeof freshWalletBalance === "number" && freshWalletBalance < paymentAmount) {
        addPaymentSupportLog({
          userId: Number(user.id),
          amount: paymentAmount,
          paymentPurpose: "MENTOR_INTERVIEW",
          sessionId: session.id,
          status: "CREATE_FAILED",
          message: "Thanh toán ví thất bại do số dư không đủ từ trang lịch sử phiên.",
          payload: {
            walletBalance: freshWalletBalance,
          },
        });
        toast.error("Số dư ví không đủ. Vui lòng nạp thêm tiền hoặc chọn PayOS.");
        return;
      }

      addPaymentSupportLog({
        userId: Number(user.id),
        amount: paymentAmount,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        status: "CREATED",
        message: "Bắt đầu thanh toán bằng ví cho phiên phỏng vấn từ trang lịch sử.",
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
          message: "Thanh toán ví thất bại từ trang lịch sử phiên.",
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
          note: "Transfer-out tra ve checkoutUrl, fallback sang flow redirect o trang lich su.",
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

      setTargetSessionForPayment(null);
      toast.success("Thanh toán bằng ví thành công. Đang cập nhật trạng thái phiên.");
      navigate(`/user/mock-interview/history/${session.id}?payment=success`);
    } catch (error) {
      addPaymentSupportLog({
        userId: Number(user.id),
        amount: paymentAmount,
        paymentPurpose: "MENTOR_INTERVIEW",
        sessionId: session.id,
        status: "CREATE_FAILED",
        message: "Exception khi thanh toán bằng ví từ trang lịch sử phiên.",
        payload: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });
      toast.error("Không thể thanh toán bằng ví lúc này. Vui lòng thử lại.");
    } finally {
      walletPaymentInFlightRef.current = false;
      setPayingSessionId(null);
    }
  };

  const handleConfirmPaymentMethod = async (method: "payos" | "wallet") => {
    if (!targetSessionForPayment) {
      return;
    }

    if (method === "wallet") {
      await handlePaySessionWithWallet(targetSessionForPayment);
      return;
    }

    setTargetSessionForPayment(null);
    await handlePaySessionWithPayOS(targetSessionForPayment);
  };

  // Stats — DRAFT is counted separately
  const draftCount = sessions.filter((s) => s.status === "DRAFT").length;
  const scheduledCount = sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "PAID" || s.status === "ONGOING"
  ).length;
  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Lịch Sử Phỏng Vấn
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Xem lại các phiên phỏng vấn và gửi phản hồi cho mentor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={async () => {
              await Promise.all([refetchSessions(), refetchFeedbacks()]);
            }}
            isLoading={sessionsRefetching || feedbacksRefetching}
            tooltip="Tải lại lịch sử phiên"
          />
          <Button
            onClick={() => navigate("/user/mock-interview/schedule")}
            className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
            <Video className="h-4 w-4" />
            Đặt lịch phỏng vấn mới
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng phiên</CardDescription>
            <CardTitle className="text-2xl">{sessions.length}</CardTitle>
          </CardHeader>
        </Card>
        {draftCount > 0 && (
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-2">
              <CardDescription>Chờ duyệt</CardDescription>
              <CardTitle className="text-2xl text-amber-600">{draftCount}</CardTitle>
            </CardHeader>
          </Card>
        )}
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardDescription>Sắp diễn ra</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{scheduledCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoàn thành</CardDescription>
            <CardTitle className="text-2xl text-green-600">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chờ đánh giá</CardDescription>
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
          title="Chưa có phiên phỏng vấn"
          description="Bạn chưa có phiên phỏng vấn nào. Hãy đặt lịch phỏng vấn với mentor!"
          action={
            <Button onClick={() => navigate("/user/mock-interview/schedule")}>
              Đặt lịch phỏng vấn
            </Button>
          }
        />
      ) : (
        <>
          {/* Sort Controls */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sắp xếp theo:
              </span>
              <SortButton {...getSortProps("id")}>ID</SortButton>
              <SortButton {...getSortProps("status")}>Trạng thái</SortButton>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {pageData.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                hasFeedback={typeof session.id === "number" && feedbackSessionIds.has(session.id)}
                isPaying={payingSessionId === session.id}
                onViewDetails={() => handleViewDetails(session)}
                onWriteFeedback={() => handleWriteFeedback(session)}
                onPaySession={() => setTargetSessionForPayment(session)}
              />
            ))}
          </div>

          {/* Pagination */}
          <PaginationControl
            pagination={pagination}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
          />

          <PaymentMethodDialog
            open={targetSessionForPayment !== null}
            onOpenChange={(open) => {
              if (!open) {
                setTargetSessionForPayment(null);
              }
            }}
            title="Chọn phương thức thanh toán phiên"
            description="Bạn có thể thanh toán qua PayOS hoặc sử dụng số dư ví hiện tại."
            amount={
              typeof targetSessionForPayment?.totalPrice === "number" &&
              targetSessionForPayment.totalPrice > 0
                ? targetSessionForPayment.totalPrice
                : 0
            }
            walletBalance={typeof user?.walletBalance === "number" ? user.walletBalance : undefined}
            isSubmitting={
              targetSessionForPayment?.id != null && payingSessionId === targetSessionForPayment.id
            }
            onConfirm={handleConfirmPaymentMethod}
          />
        </>
      )}
    </div>
  );
}
