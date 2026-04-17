import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Spinner } from "@/components/ui/spinner";
import type { PaymentPurpose } from "@/interfaces";
import {
  addPaymentSupportLog,
  clearPendingSessionPaymentContext,
  getCallbackIdentifierMismatch,
  getLatestRecoveryForSessionPayment,
  getLatestRecoveryForUser,
  getLatestRecoveryForUserByPurpose,
  getPendingSessionPaymentContext,
  getRecoveryByCheckoutToken,
  getRecoveryByOrderCode,
  getRecoveryByTransactionCode,
  isLowConfidenceRecoverySource,
  resolveCancelTransactionCode,
  upsertPaymentRecoveryContext,
  type PaymentRecoveryContext,
  type PaymentRecoveryLookupSource,
} from "@/lib";
import { paymentManager } from "@/services/payment.manager";
import { transactionManager } from "@/services/transaction.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

type CancelChainResult = "idle" | "success" | "failed" | "missing";

interface RunCancelChainOptions {
  forceCallbackFirst?: boolean;
  triggeredByRetry?: boolean;
}

const isIdempotentHandledError = (error?: string): boolean => {
  if (!error) {
    return false;
  }

  const normalized = error.toLowerCase();
  return (
    normalized.includes("not found") ||
    normalized.includes("404") ||
    normalized.includes("already") ||
    normalized.includes("đã được xử lý") ||
    normalized.includes("da duoc xu ly") ||
    normalized.includes("đã hủy") ||
    normalized.includes("da huy") ||
    normalized.includes("processed")
  );
};

const getCancelPrimaryRedirect = (
  purpose?: PaymentPurpose,
  sessionId?: number
): { to: string; label: string } => {
  switch (purpose) {
    case "MENTOR_INTERVIEW":
      if (sessionId) {
        return { to: `/user/mock-interview/history/${sessionId}`, label: "Xem chi tiết phiên" };
      }
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
  const cancelQueryFlag = query.get("cancel")?.trim() || "";
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
  const recoveryContextRef = useRef<PaymentRecoveryContext | null>(null);
  const inFlightTransactionCodeRef = useRef<string | null>(null);
  const handledTransactionCodesRef = useRef<Set<string>>(new Set());
  const autoRunKeyRef = useRef("");

  useEffect(() => {
    recoveryContextRef.current = recoveryContext;
  }, [recoveryContext]);

  const autoRunKey = useMemo(
    () =>
      [
        String(currentUserId || 0),
        orderCode,
        queryTransactionCode,
        callbackCheckoutToken,
        cancelQueryFlag,
        status,
        String(pendingSessionPayment?.sessionId || ""),
        pendingSessionPayment?.transactionCode || "",
      ].join("|"),
    [
      callbackCheckoutToken,
      cancelQueryFlag,
      currentUserId,
      orderCode,
      pendingSessionPayment?.sessionId,
      pendingSessionPayment?.transactionCode,
      queryTransactionCode,
      status,
    ]
  );

  const runCancelChain = useCallback(
    async (options?: RunCancelChainOptions) => {
      const userIdFilter = currentUserId > 0 ? currentUserId : undefined;
      let context: PaymentRecoveryContext | null = recoveryContextRef.current;
      let recoverySource: PaymentRecoveryLookupSource = context ? "existing-state" : "none";

      if (!context && orderCode) {
        context = getRecoveryByOrderCode(orderCode, userIdFilter);
        if (!context && !userIdFilter) {
          context = getRecoveryByOrderCode(orderCode);
        }
        if (context) {
          recoverySource = "order-code";
        }
      }

      if (!context && queryTransactionCode) {
        context = getRecoveryByTransactionCode(queryTransactionCode, userIdFilter);
        if (!context && !userIdFilter) {
          context = getRecoveryByTransactionCode(queryTransactionCode);
        }
        if (context) {
          recoverySource = "query-transaction-code";
        }
      }

      if (!context && callbackCheckoutToken) {
        context = getRecoveryByCheckoutToken(callbackCheckoutToken, userIdFilter);
        if (!context && !userIdFilter) {
          context = getRecoveryByCheckoutToken(callbackCheckoutToken);
        }
        if (context) {
          recoverySource = "callback-checkout-token";
        }
      }

      if (!context && pendingSessionPayment?.checkoutToken) {
        context = getRecoveryByCheckoutToken(pendingSessionPayment.checkoutToken, userIdFilter);
        if (context) {
          recoverySource = "pending-checkout-token";
        }
      }

      if (!context && pendingSessionPayment?.transactionCode) {
        context = getRecoveryByTransactionCode(pendingSessionPayment.transactionCode, userIdFilter);
        if (context) {
          recoverySource = "pending-transaction-code";
        }
      }

      if (!context && pendingSessionPayment?.sessionId) {
        context = getLatestRecoveryForSessionPayment(pendingSessionPayment.sessionId, userIdFilter);
        if (context) {
          recoverySource = "session-recovery";
        }
      }

      if (
        !context &&
        currentUserId > 0 &&
        pendingSessionPayment?.paymentPurpose === "MENTOR_INTERVIEW"
      ) {
        context = getLatestRecoveryForUserByPurpose(currentUserId, "MENTOR_INTERVIEW");
        if (context) {
          recoverySource = "purpose-recovery";
        }
      }

      if (!context && currentUserId > 0) {
        context = getLatestRecoveryForUser(currentUserId);
        if (context) {
          recoverySource = "latest-user-recovery";
        }
      }

      const hasStrongCallbackIdentifier = Boolean(
        orderCode || queryTransactionCode || callbackCheckoutToken
      );

      if (options?.forceCallbackFirst && hasStrongCallbackIdentifier && context) {
        addPaymentSupportLog({
          supportCode: context.supportCode,
          orderCode: orderCode || context.orderCode,
          transactionCode: queryTransactionCode || context.transactionCode,
          checkoutToken: callbackCheckoutToken || context.checkoutToken,
          userId: context.userId,
          paymentPurpose: context.paymentPurpose,
          sessionId: context.sessionId,
          status: "UNMAPPED_ORDER",
          message: "Retry callback-first: bỏ qua context cũ và ưu tiên định danh callback.",
          payload: {
            recoverySource,
            retry: true,
          },
        });

        context = null;
        recoverySource = "none";
      }

      if (context && hasStrongCallbackIdentifier && isLowConfidenceRecoverySource(recoverySource)) {
        addPaymentSupportLog({
          supportCode: context.supportCode,
          orderCode: orderCode || context.orderCode,
          transactionCode: queryTransactionCode || context.transactionCode,
          checkoutToken: callbackCheckoutToken || context.checkoutToken,
          userId: context.userId,
          paymentPurpose: context.paymentPurpose,
          sessionId: context.sessionId,
          status: "UNMAPPED_ORDER",
          message:
            "Bỏ qua recovery context có độ tin cậy thấp để tránh map sai giao dịch callback.",
          payload: {
            recoverySource,
          },
        });

        context = null;
        recoverySource = "none";
      }

      const identifierMismatch = getCallbackIdentifierMismatch(
        {
          orderCode,
          transactionCode: queryTransactionCode,
          checkoutToken: callbackCheckoutToken,
        },
        context
      );

      if (identifierMismatch.hasMismatch) {
        if (hasStrongCallbackIdentifier) {
          addPaymentSupportLog({
            supportCode: context?.supportCode || undefined,
            orderCode: orderCode || context?.orderCode || undefined,
            transactionCode: queryTransactionCode || context?.transactionCode || undefined,
            checkoutToken: callbackCheckoutToken || context?.checkoutToken || undefined,
            userId: context?.userId || currentUserId || undefined,
            paymentPurpose: context?.paymentPurpose,
            sessionId: context?.sessionId,
            status: "UNMAPPED_ORDER",
            message:
              "Callback có định danh hợp lệ nhưng context local lệch, tiếp tục xử lý theo callback-first.",
            payload: {
              recoverySource,
              mismatchedKeys: identifierMismatch.mismatchedKeys,
              retry: options?.triggeredByRetry || false,
            },
          });

          context = null;
          recoverySource = "none";
        } else {
          addPaymentSupportLog({
            supportCode: context?.supportCode || undefined,
            orderCode: orderCode || context?.orderCode || undefined,
            transactionCode: queryTransactionCode || context?.transactionCode || undefined,
            checkoutToken: callbackCheckoutToken || context?.checkoutToken || undefined,
            userId: context?.userId || currentUserId || undefined,
            paymentPurpose: context?.paymentPurpose,
            sessionId: context?.sessionId,
            status: "UNMAPPED_ORDER",
            message: "Định danh callback không khớp với recovery context, dừng chain hủy.",
            payload: {
              recoverySource,
              mismatchedKeys: identifierMismatch.mismatchedKeys,
            },
          });

          setChainResult("missing");
          setResultMessage(
            "Không thể đối chiếu giao dịch cần hủy. Vui lòng thử lại hoặc thực hiện lại thao tác thanh toán."
          );
          toast.error("Không thể đối chiếu giao dịch cần hủy.");

          if (pendingSessionPayment?.sessionId && context?.paymentPurpose !== "MENTOR_INTERVIEW") {
            clearPendingSessionPaymentContext();
          }
          return;
        }
      }

      const resolvedOrderCode = orderCode || context?.orderCode || "";
      const shouldIgnorePendingTransactionCode =
        hasStrongCallbackIdentifier && Boolean(orderCode) && !context;
      const transactionCodeResolution = resolveCancelTransactionCode({
        queryTransactionCode,
        contextTransactionCode: context?.transactionCode,
        pendingTransactionCode: shouldIgnorePendingTransactionCode
          ? undefined
          : pendingSessionPayment?.transactionCode,
        orderCode,
        callbackCheckoutToken,
        status,
        cancelFlag: cancelQueryFlag,
      });
      const resolvedTransactionCode = transactionCodeResolution.value;
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
            recoverySource,
            transactionCodeSource: transactionCodeResolution.source,
            usedOrderCodeFallback: transactionCodeResolution.usedOrderCodeFallback,
            retry: options?.triggeredByRetry || false,
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
            recoverySource,
            transactionCodeSource: transactionCodeResolution.source,
            usedOrderCodeFallback: transactionCodeResolution.usedOrderCodeFallback,
            retry: options?.triggeredByRetry || false,
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

        if (pendingSessionPayment?.sessionId && resolvedPurpose !== "MENTOR_INTERVIEW") {
          clearPendingSessionPaymentContext();
        }
        return;
      }

      if (inFlightTransactionCodeRef.current === resolvedTransactionCode) {
        return;
      }

      if (handledTransactionCodesRef.current.has(resolvedTransactionCode)) {
        setChainResult("success");
        setResultMessage("Giao dịch này đã được hủy trước đó.");
        return;
      }

      inFlightTransactionCodeRef.current = resolvedTransactionCode;
      setProcessing(true);
      setChainResult("idle");

      try {
        const cancelResult = await paymentManager.cancel(resolvedTransactionCode);
        const cancelHandled = cancelResult.success || isIdempotentHandledError(cancelResult.error);

        if (!cancelHandled) {
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
              recoverySource,
              transactionCodeSource: transactionCodeResolution.source,
              usedOrderCodeFallback: transactionCodeResolution.usedOrderCodeFallback,
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
          setResultMessage("Không thể hủy thanh toán lúc này. Vui lòng thử lại sau ít phút.");
          toast.error("Không thể hủy thanh toán.");

          if (pendingSessionPayment?.sessionId && resolvedPurpose !== "MENTOR_INTERVIEW") {
            clearPendingSessionPaymentContext();
          }
          return;
        }

        const deleteResult = await transactionManager.delete(resolvedTransactionCode);
        const deleteHandled = deleteResult.success || isIdempotentHandledError(deleteResult.error);

        if (!deleteHandled) {
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
              recoverySource,
              transactionCodeSource: transactionCodeResolution.source,
              usedOrderCodeFallback: transactionCodeResolution.usedOrderCodeFallback,
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
          toast.error("Không thể hoàn tất yêu cầu hủy.");

          if (pendingSessionPayment?.sessionId && resolvedPurpose !== "MENTOR_INTERVIEW") {
            clearPendingSessionPaymentContext();
          }
          return;
        }

        handledTransactionCodesRef.current.add(resolvedTransactionCode);

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
          message:
            cancelResult.success && deleteResult.success
              ? "Đã hủy thanh toán thành công."
              : "Giao dịch đã được xử lý trước đó.",
          payload:
            cancelResult.success && deleteResult.success
              ? undefined
              : {
                  cancelError: cancelResult.error || null,
                  deleteError: deleteResult.error || null,
                  idempotentHandled: true,
                  recoverySource,
                  transactionCodeSource: transactionCodeResolution.source,
                  usedOrderCodeFallback: transactionCodeResolution.usedOrderCodeFallback,
                },
        });

        const successUserId =
          context?.userId || Number(cancelResult.data?.user?.id) || currentUserId;
        if (successUserId > 0) {
          const successContext = upsertPaymentRecoveryContext({
            supportCode: context?.supportCode,
            orderCode: resolvedOrderCode || context?.orderCode || resolvedTransactionCode,
            transactionCode: resolvedTransactionCode,
            checkoutToken: resolvedCheckoutToken || context?.checkoutToken,
            userId: successUserId,
            planId: context?.planId,
            planName: context?.planName,
            amount: context?.amount,
            paymentPurpose: resolvedPurpose || cancelResult.data?.paymentPurpose,
            sessionId: resolvedSessionId,
            checkoutUrl: context?.checkoutUrl,
            status: "CANCEL_CHAIN_SUCCESS",
            note: "Đã hủy thanh toán thành công.",
          });
          setRecoveryContext(successContext);
        }

        setChainResult("success");
        setResultMessage("Yêu cầu hủy thanh toán đã được xử lý thành công.");
        toast.success("Đã hủy thanh toán thành công.");

        if (pendingSessionPayment?.sessionId) {
          clearPendingSessionPaymentContext();
        }
      } finally {
        inFlightTransactionCodeRef.current = null;
        setProcessing(false);
      }
    },
    [
      callbackCheckoutToken,
      cancelQueryFlag,
      currentUserId,
      orderCode,
      pendingSessionPayment,
      queryTransactionCode,
      status,
    ]
  );

  useEffect(() => {
    if (autoRunKeyRef.current === autoRunKey) {
      return;
    }

    autoRunKeyRef.current = autoRunKey;
    const timerId = window.setTimeout(() => {
      void runCancelChain();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [autoRunKey, runCancelChain]);

  const canRetry = !processing && (chainResult === "failed" || chainResult === "missing");
  const resolvedPurpose =
    recoveryContext?.paymentPurpose ||
    (pendingSessionPayment?.paymentPurpose as PaymentPurpose | undefined);
  const resolvedSessionId = recoveryContext?.sessionId || pendingSessionPayment?.sessionId;
  const primaryRedirect = getCancelPrimaryRedirect(resolvedPurpose, resolvedSessionId);

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
              <Spinner size="sm" tone="muted" />
              Đang xử lý yêu cầu hủy thanh toán...
            </div>
          ) : (
            resultMessage
          )}
        </div>

        {canRetry && (
          <button
            onClick={() =>
              void runCancelChain({
                forceCallbackFirst: true,
                triggeredByRetry: true,
              })
            }
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
