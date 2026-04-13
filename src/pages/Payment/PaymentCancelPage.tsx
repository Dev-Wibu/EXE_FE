import { AlertCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { PaymentPurpose } from "@/interfaces";
import {
  addPaymentSupportLog,
  clearPendingSessionPaymentContext,
  getLatestRecoveryForSessionPayment,
  getLatestRecoveryForUser,
  getLatestRecoveryForUserByPurpose,
  getPendingSessionPaymentContext,
  getRecoveryByCheckoutToken,
  getRecoveryByOrderCode,
  getRecoveryByTransactionCode,
  type PaymentRecoveryContext,
  upsertPaymentRecoveryContext,
} from "@/lib";
import { paymentManager } from "@/services/payment.manager";
import { transactionManager } from "@/services/transaction.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

type CancelChainResult = "idle" | "success" | "failed" | "missing";

const isNotFoundError = (error?: string): boolean => {
  if (!error) {
    return false;
  }

  const normalized = error.toLowerCase();
  return normalized.includes("not found") || normalized.includes("404");
};

const getCancelPrimaryRedirect = (purpose?: PaymentPurpose): { to: string; label: string } => {
  switch (purpose) {
    case "MENTOR_INTERVIEW":
      return { to: "/user?tab=interviewHistory", label: "Xem lịch sử phỏng vấn" };
    case "TOP_UP_WALLET":
    case "WITHDRAW_FROM_WALLET":
      return { to: "/user?tab=account&subtab=wallet", label: "Đến ví của tôi" };
    case "BUY_MEMBERSHIP":
    default:
      return { to: "/user?tab=account", label: "Quay lại tài khoản" };
  }
};

export function PaymentCancelPage() {
  const { user } = useAuthStore();
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const orderCode = query.get("orderCode")?.trim() || "";
  const queryTransactionCode =
    query.get("transactionCode")?.trim() || query.get("transaction_code")?.trim() || "";
  const callbackCheckoutToken =
    query.get("id")?.trim() ||
    query.get("checkoutId")?.trim() ||
    query.get("checkout_id")?.trim() ||
    "";
  const status = query.get("status")?.trim() || "CANCELLED";
  const currentUserId = Number(user?.id || 0);
  const pendingSessionPayment = useMemo(
    () => getPendingSessionPaymentContext(currentUserId || undefined),
    [currentUserId]
  );

  const [processing, setProcessing] = useState(false);
  const [chainResult, setChainResult] = useState<CancelChainResult>("idle");
  const [resultMessage, setResultMessage] = useState("Đang xử lý yêu cầu của bạn...");
  const [recoveryContext, setRecoveryContext] = useState<PaymentRecoveryContext | null>(null);

  const redirectToSessionIfNeeded = useCallback(
    (purpose?: PaymentPurpose, sessionId?: number, resolvedOrderCode?: string) => {
      if (purpose !== "MENTOR_INTERVIEW" || !sessionId) {
        return false;
      }

      const params = new URLSearchParams();
      params.set("payment", "cancelled");
      if (resolvedOrderCode) {
        params.set("orderCode", resolvedOrderCode);
      }

      clearPendingSessionPaymentContext();
      window.location.replace(`/user/mock-interview/history/${sessionId}?${params.toString()}`);
      return true;
    },
    []
  );

  const runCancelChain = useCallback(async () => {
    const userIdFilter = currentUserId > 0 ? currentUserId : undefined;
    let context: PaymentRecoveryContext | null = recoveryContext;

    if (!context && orderCode) {
      context = getRecoveryByOrderCode(orderCode, userIdFilter);
      if (!context && !userIdFilter) {
        context = getRecoveryByOrderCode(orderCode);
      }
    }

    if (!context && queryTransactionCode) {
      context = getRecoveryByTransactionCode(queryTransactionCode, userIdFilter);
      if (!context && !userIdFilter) {
        context = getRecoveryByTransactionCode(queryTransactionCode);
      }
    }

    if (!context && callbackCheckoutToken) {
      context = getRecoveryByCheckoutToken(callbackCheckoutToken, userIdFilter);
      if (!context && !userIdFilter) {
        context = getRecoveryByCheckoutToken(callbackCheckoutToken);
      }
    }

    if (!context && pendingSessionPayment?.checkoutToken) {
      context = getRecoveryByCheckoutToken(pendingSessionPayment.checkoutToken, userIdFilter);
    }

    if (!context && pendingSessionPayment?.transactionCode) {
      context = getRecoveryByTransactionCode(pendingSessionPayment.transactionCode, userIdFilter);
    }

    if (!context && pendingSessionPayment?.sessionId) {
      context = getLatestRecoveryForSessionPayment(pendingSessionPayment.sessionId, userIdFilter);
    }

    if (
      !context &&
      currentUserId > 0 &&
      pendingSessionPayment?.paymentPurpose === "MENTOR_INTERVIEW"
    ) {
      context = getLatestRecoveryForUserByPurpose(currentUserId, "MENTOR_INTERVIEW");
    }

    if (!context && currentUserId > 0) {
      context = getLatestRecoveryForUser(currentUserId);
    }

    const resolvedOrderCode = orderCode || context?.orderCode || "";
    const resolvedTransactionCode =
      queryTransactionCode ||
      context?.transactionCode ||
      pendingSessionPayment?.transactionCode ||
      resolvedOrderCode;
    const resolvedCheckoutToken =
      callbackCheckoutToken ||
      context?.checkoutToken ||
      pendingSessionPayment?.checkoutToken ||
      undefined;
    const resolvedPurpose =
      context?.paymentPurpose ||
      (pendingSessionPayment?.paymentPurpose as PaymentPurpose | undefined);
    const resolvedSessionId = context?.sessionId || pendingSessionPayment?.sessionId;

    if (context) {
      const callbackContext = upsertPaymentRecoveryContext({
        supportCode: context.supportCode,
        orderCode: resolvedOrderCode || context.orderCode,
        transactionCode: resolvedTransactionCode || context.transactionCode,
        checkoutToken: resolvedCheckoutToken || context.checkoutToken,
        userId: context.userId,
        planId: context.planId,
        planName: context.planName,
        amount: context.amount,
        paymentPurpose: resolvedPurpose,
        sessionId: resolvedSessionId,
        checkoutUrl: context.checkoutUrl,
        status: "CALLBACK_CANCEL",
        note: "Người dùng đã quay về trang hủy thanh toán.",
      });
      setRecoveryContext(callbackContext);

      addPaymentSupportLog({
        supportCode: callbackContext.supportCode,
        orderCode: callbackContext.orderCode,
        transactionCode: callbackContext.transactionCode,
        checkoutToken: callbackContext.checkoutToken,
        userId: callbackContext.userId,
        planId: callbackContext.planId,
        planName: callbackContext.planName,
        amount: callbackContext.amount,
        paymentPurpose: callbackContext.paymentPurpose,
        sessionId: callbackContext.sessionId,
        status: "CALLBACK_CANCEL",
        message: "Người dùng quay về trang hủy thanh toán.",
        payload: {
          callbackStatus: status,
        },
      });
    }

    if (!resolvedTransactionCode) {
      addPaymentSupportLog({
        supportCode: context?.supportCode || undefined,
        orderCode: resolvedOrderCode || undefined,
        checkoutToken: resolvedCheckoutToken,
        userId: context?.userId || currentUserId || undefined,
        paymentPurpose: resolvedPurpose,
        sessionId: resolvedSessionId,
        status: "UNMAPPED_ORDER",
        message: "Thiếu mã giao dịch để thực hiện hủy thanh toán.",
        payload: {
          status,
        },
      });

      if (context) {
        const failedContext = upsertPaymentRecoveryContext({
          supportCode: context.supportCode,
          orderCode: resolvedOrderCode || context.orderCode,
          transactionCode: context.transactionCode,
          checkoutToken: resolvedCheckoutToken || context.checkoutToken,
          userId: context.userId,
          planId: context.planId,
          planName: context.planName,
          amount: context.amount,
          paymentPurpose: resolvedPurpose,
          sessionId: resolvedSessionId,
          checkoutUrl: context.checkoutUrl,
          status: "CANCEL_CHAIN_FAILED",
          note: "Thiếu mã giao dịch để hủy thanh toán.",
        });
        setRecoveryContext(failedContext);
      }

      setChainResult("missing");
      setResultMessage(
        "Không tìm thấy thông tin giao dịch để hủy. Vui lòng thực hiện lại thao tác thanh toán."
      );
      toast.error("Không tìm thấy giao dịch cần hủy.");

      if (redirectToSessionIfNeeded(resolvedPurpose, resolvedSessionId, resolvedOrderCode)) {
        return;
      }

      if (pendingSessionPayment?.sessionId && resolvedPurpose !== "MENTOR_INTERVIEW") {
        clearPendingSessionPaymentContext();
      }
      return;
    }

    setProcessing(true);
    setChainResult("idle");

    const cancelResult = await paymentManager.cancel(resolvedTransactionCode);
    if (!cancelResult.success) {
      const log = addPaymentSupportLog({
        supportCode: context?.supportCode || undefined,
        orderCode: resolvedOrderCode || undefined,
        transactionCode: resolvedTransactionCode,
        checkoutToken: resolvedCheckoutToken,
        userId: context?.userId || currentUserId || undefined,
        planId: context?.planId,
        planName: context?.planName,
        amount: context?.amount,
        paymentPurpose: resolvedPurpose,
        sessionId: resolvedSessionId,
        status: "CANCEL_CHAIN_FAILED",
        message: "Hủy thanh toán thất bại.",
        payload: {
          error: cancelResult.error || null,
        },
      });

      if (context) {
        const failedContext = upsertPaymentRecoveryContext({
          supportCode: log.supportCode || context.supportCode,
          orderCode: resolvedOrderCode || context.orderCode,
          transactionCode: resolvedTransactionCode,
          checkoutToken: resolvedCheckoutToken || context.checkoutToken,
          userId: context.userId,
          planId: context.planId,
          planName: context.planName,
          amount: context.amount,
          paymentPurpose: resolvedPurpose,
          sessionId: resolvedSessionId,
          checkoutUrl: context.checkoutUrl,
          status: "CANCEL_CHAIN_FAILED",
          note: cancelResult.error || "Hủy thanh toán thất bại.",
        });
        setRecoveryContext(failedContext);
      }

      setChainResult("failed");
      setResultMessage(
        isNotFoundError(cancelResult.error)
          ? "Không tìm thấy giao dịch cần hủy hoặc giao dịch đã được xử lý trước đó."
          : "Không thể hủy thanh toán lúc này. Vui lòng thử lại sau ít phút."
      );
      setProcessing(false);
      toast.error("Không thể hủy thanh toán.");

      if (redirectToSessionIfNeeded(resolvedPurpose, resolvedSessionId, resolvedOrderCode)) {
        return;
      }

      if (pendingSessionPayment?.sessionId && resolvedPurpose !== "MENTOR_INTERVIEW") {
        clearPendingSessionPaymentContext();
      }
      return;
    }

    const deleteResult = await transactionManager.delete(resolvedTransactionCode);
    if (!deleteResult.success) {
      const log = addPaymentSupportLog({
        supportCode: context?.supportCode || undefined,
        orderCode: resolvedOrderCode || undefined,
        transactionCode: resolvedTransactionCode,
        checkoutToken: resolvedCheckoutToken,
        userId: context?.userId || currentUserId || undefined,
        planId: context?.planId,
        planName: context?.planName,
        amount: context?.amount,
        paymentPurpose: resolvedPurpose,
        sessionId: resolvedSessionId,
        status: "CANCEL_CHAIN_FAILED",
        message: "Xóa giao dịch thất bại sau khi hủy thanh toán.",
        payload: {
          error: deleteResult.error || null,
        },
      });

      if (context) {
        const failedContext = upsertPaymentRecoveryContext({
          supportCode: log.supportCode || context.supportCode,
          orderCode: resolvedOrderCode || context.orderCode,
          transactionCode: resolvedTransactionCode,
          checkoutToken: resolvedCheckoutToken || context.checkoutToken,
          userId: context.userId,
          planId: context.planId,
          planName: context.planName,
          amount: context.amount,
          paymentPurpose: resolvedPurpose,
          sessionId: resolvedSessionId,
          checkoutUrl: context.checkoutUrl,
          status: "CANCEL_CHAIN_FAILED",
          note: deleteResult.error || "Xóa giao dịch thất bại.",
        });
        setRecoveryContext(failedContext);
      }

      setChainResult("failed");
      setResultMessage(
        "Thanh toán đã được hủy nhưng hệ thống đang hoàn tất bước cập nhật cuối cùng. Vui lòng thử lại sau."
      );
      setProcessing(false);
      toast.error("Không thể hoàn tất yêu cầu hủy.");

      if (redirectToSessionIfNeeded(resolvedPurpose, resolvedSessionId, resolvedOrderCode)) {
        return;
      }

      if (pendingSessionPayment?.sessionId && resolvedPurpose !== "MENTOR_INTERVIEW") {
        clearPendingSessionPaymentContext();
      }
      return;
    }

    addPaymentSupportLog({
      supportCode: context?.supportCode || undefined,
      orderCode: resolvedOrderCode || undefined,
      transactionCode: resolvedTransactionCode,
      checkoutToken: resolvedCheckoutToken,
      userId: context?.userId || currentUserId || undefined,
      planId: context?.planId,
      planName: context?.planName,
      amount: context?.amount,
      paymentPurpose: resolvedPurpose,
      sessionId: resolvedSessionId,
      status: "CANCEL_CHAIN_SUCCESS",
      message: "Đã hủy thanh toán thành công.",
    });

    if (context) {
      const successContext = upsertPaymentRecoveryContext({
        supportCode: context.supportCode,
        orderCode: resolvedOrderCode || context.orderCode,
        transactionCode: resolvedTransactionCode,
        checkoutToken: resolvedCheckoutToken || context.checkoutToken,
        userId: context.userId,
        planId: context.planId,
        planName: context.planName,
        amount: context.amount,
        paymentPurpose: resolvedPurpose,
        sessionId: resolvedSessionId,
        checkoutUrl: context.checkoutUrl,
        status: "CANCEL_CHAIN_SUCCESS",
        note: "Đã hủy thanh toán thành công.",
      });
      setRecoveryContext(successContext);
    }

    setChainResult("success");
    setResultMessage("Yêu cầu hủy thanh toán đã được xử lý thành công.");
    setProcessing(false);
    toast.success("Đã hủy thanh toán thành công.");

    if (redirectToSessionIfNeeded(resolvedPurpose, resolvedSessionId, resolvedOrderCode)) {
      return;
    }

    if (pendingSessionPayment?.sessionId && resolvedPurpose !== "MENTOR_INTERVIEW") {
      clearPendingSessionPaymentContext();
    }
  }, [
    callbackCheckoutToken,
    currentUserId,
    orderCode,
    pendingSessionPayment,
    queryTransactionCode,
    recoveryContext,
    redirectToSessionIfNeeded,
    status,
  ]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void runCancelChain();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [runCancelChain]);

  const canRetry = !processing && (chainResult === "failed" || chainResult === "missing");
  const resolvedPurpose =
    recoveryContext?.paymentPurpose ||
    (pendingSessionPayment?.paymentPurpose as PaymentPurpose | undefined);
  const primaryRedirect = getCancelPrimaryRedirect(resolvedPurpose);

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-rose-50 px-4 py-10 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-amber-200 bg-white p-8 shadow-sm dark:border-amber-900/40 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-['Poppins'] text-2xl font-bold text-amber-700 dark:text-amber-300">
              Thanh toán đã bị hủy
            </h1>
            <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
              Chúng tôi đang cập nhật trạng thái thanh toán của bạn.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {processing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xử lý yêu cầu hủy thanh toán...
            </div>
          ) : (
            resultMessage
          )}
        </div>

        {canRetry && (
          <button
            onClick={() => void runCancelChain()}
            disabled={processing}
            className="w-fit rounded-xl bg-amber-600 px-4 py-2 font-['Inter'] text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">
            Thử lại
          </button>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            to={primaryRedirect.to}
            className="rounded-xl bg-[#0047AB] px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white hover:bg-[#003b8d]">
            {primaryRedirect.label}
          </Link>
          {resolvedPurpose === "BUY_MEMBERSHIP" && (
            <Link
              to="/user?tab=account"
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Chọn gói thành viên khác
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
