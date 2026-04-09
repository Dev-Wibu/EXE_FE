import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { UserSubscriptionResponse } from "@/interfaces";
import {
  addPaymentSupportLog,
  buildSupportPayload,
  clearPendingSessionPaymentContext,
  formatSupportPayload,
  getLatestRecoveryForUser,
  getPendingSessionPaymentContext,
  getRecoveryByOrderCode,
  type PaymentRecoveryContext,
  upsertPaymentRecoveryContext,
} from "@/lib";
import { userManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

type ResolveState = "checking" | "ready" | "unmapped" | "subscribing" | "subscribed";
const ACTIVATED_ORDERS_STORAGE_KEY = "inblue.payment.activated-orders";

const isPaidStatus = (status: string): boolean => {
  const normalized = status.trim().toUpperCase();
  return normalized === "PAID" || normalized === "SUCCESS" || normalized === "COMPLETED";
};

const getActivatedOrderCodes = (): Set<string> => {
  try {
    const raw = localStorage.getItem(ACTIVATED_ORDERS_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(
      parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
    );
  } catch {
    return new Set();
  }
};

const markOrderAsActivated = (orderCode: string): void => {
  const normalized = orderCode.trim();
  if (!normalized) {
    return;
  }

  const next = getActivatedOrderCodes();
  next.add(normalized);
  localStorage.setItem(ACTIVATED_ORDERS_STORAGE_KEY, JSON.stringify([...next]));
};

export function PaymentSuccessPage() {
  const { user } = useAuthStore();
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const orderCode = query.get("orderCode")?.trim() || "";
  const status = query.get("status")?.trim() || "PAID";
  const source = query.get("source")?.trim() || "callback";
  const paid = isPaidStatus(status);
  const currentUserId = Number(user?.id || 0);
  const pendingSessionPayment = useMemo(
    () => getPendingSessionPaymentContext(currentUserId || undefined),
    [currentUserId]
  );
  const pendingSessionOrderCode = pendingSessionPayment?.orderCode?.trim() || "";
  const shouldRedirectToPendingSession = Boolean(
    pendingSessionPayment?.sessionId &&
    orderCode &&
    pendingSessionOrderCode &&
    pendingSessionOrderCode === orderCode
  );

  const [resolveState, setResolveState] = useState<ResolveState>("checking");
  const [resolveError, setResolveError] = useState<string>("");
  const [subscribeError, setSubscribeError] = useState<string>("");
  const [recoveryContext, setRecoveryContext] = useState<PaymentRecoveryContext | null>(null);
  const [supportCode, setSupportCode] = useState<string>("");
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [isKnownActivatedOrder, setIsKnownActivatedOrder] = useState(false);
  const [autoSubscribeOrderCode, setAutoSubscribeOrderCode] = useState<string>("");
  const [isCopyingPayload, setIsCopyingPayload] = useState(false);

  const loadActiveSubscription = useCallback(
    async (userId: number): Promise<UserSubscriptionResponse | null> => {
      const subscriptionResult = await userManager.getActiveSubscription(userId);
      if (subscriptionResult.success && subscriptionResult.data) {
        setSubscription(subscriptionResult.data);
        setSubscribeError("");
        return subscriptionResult.data;
      }

      setSubscribeError(
        subscriptionResult.error ||
          "Da kich hoat goi, nhung khong tai duoc thong tin subscription moi."
      );
      return null;
    },
    []
  );

  const handleCopySupportPayload = useCallback(async () => {
    if (isCopyingPayload) {
      return;
    }

    setIsCopyingPayload(true);
    try {
      const payload = buildSupportPayload({
        orderCode,
        supportCode: supportCode || undefined,
        context: recoveryContext,
        extra: {
          callbackStatus: status,
          paid,
          source,
          pathname: window.location.pathname,
        },
      });

      await navigator.clipboard.writeText(formatSupportPayload(payload));
      toast.success("Da sao chep payload ho tro.");
    } catch {
      toast.error("Khong the sao chep payload ho tro.");
    } finally {
      setIsCopyingPayload(false);
    }
  }, [isCopyingPayload, orderCode, paid, recoveryContext, source, status, supportCode]);

  useEffect(() => {
    if (!pendingSessionPayment?.sessionId || !orderCode || !pendingSessionOrderCode) {
      return;
    }

    if (pendingSessionOrderCode === orderCode) {
      return;
    }

    addPaymentSupportLog({
      orderCode,
      userId: currentUserId || undefined,
      status: "UNMAPPED_ORDER",
      message: "Bo qua pending session payment do orderCode khong khop callback.",
      payload: {
        pendingSessionOrderCode,
        callbackOrderCode: orderCode,
      },
    });
    clearPendingSessionPaymentContext();
  }, [currentUserId, orderCode, pendingSessionOrderCode, pendingSessionPayment]);

  useEffect(() => {
    if (!shouldRedirectToPendingSession || !pendingSessionPayment?.sessionId) {
      return;
    }

    const params = new URLSearchParams();
    params.set("payment", paid ? "success" : "failed");
    if (orderCode) {
      params.set("orderCode", orderCode);
    }

    clearPendingSessionPaymentContext();
    window.location.replace(
      `/user/mock-interview/history/${pendingSessionPayment.sessionId}?${params.toString()}`
    );
  }, [orderCode, paid, pendingSessionPayment, shouldRedirectToPendingSession]);

  const handleResolveOrder = useCallback(async () => {
    setSubscribeError("");
    setSubscription(null);
    setResolveError("");
    setRecoveryContext(null);

    if (!orderCode) {
      const log = addPaymentSupportLog({
        status: "UNMAPPED_ORDER",
        message: "Callback success thieu orderCode.",
        payload: {
          source,
          status,
          paid,
        },
      });
      setSupportCode(log.supportCode);
      setResolveState("unmapped");
      setResolveError(
        "Callback thieu orderCode. He thong chan subscribe va yeu cau thanh toan lai."
      );
      return;
    }

    setResolveState("checking");

    if (!currentUserId) {
      const log = addPaymentSupportLog({
        orderCode,
        status: "UNMAPPED_ORDER",
        message: "Khong tim thay user session khi vao callback success.",
        payload: {
          source,
          status,
          paid,
        },
      });
      setSupportCode(log.supportCode);
      setResolveState("unmapped");
      setResolveError("Khong tim thay phien dang nhap. Vui long dang nhap lai de kich hoat goi.");
      return;
    }

    let nextContext = getRecoveryByOrderCode(orderCode, currentUserId);
    if (!nextContext) {
      const fallback = getLatestRecoveryForUser(currentUserId);
      if (fallback && !fallback.orderCode) {
        nextContext = upsertPaymentRecoveryContext({
          supportCode: fallback.supportCode,
          orderCode,
          userId: fallback.userId,
          planId: fallback.planId,
          planName: fallback.planName,
          amount: fallback.amount,
          checkoutUrl: fallback.checkoutUrl,
          status: paid ? "CALLBACK_SUCCESS" : "UNMAPPED_ORDER",
          note: paid
            ? "Auto-map orderCode tu callback vao giao dich gan nhat cua user."
            : "Callback tra ve status khong hop le.",
        });

        addPaymentSupportLog({
          supportCode: nextContext.supportCode,
          orderCode,
          userId: nextContext.userId,
          planId: nextContext.planId,
          planName: nextContext.planName,
          amount: nextContext.amount,
          status: paid ? "CALLBACK_SUCCESS" : "UNMAPPED_ORDER",
          message: paid
            ? "Map orderCode vao giao dich cho user thanh cong."
            : "Callback co orderCode nhung status khong hop le.",
          payload: {
            source,
            status,
            paid,
          },
        });
      }
    }

    if (!nextContext) {
      const log = addPaymentSupportLog({
        orderCode,
        userId: currentUserId,
        status: "UNMAPPED_ORDER",
        message: "Khong tim thay recovery context cho orderCode.",
        payload: {
          source,
          status,
          paid,
        },
      });
      setSupportCode(log.supportCode);
      setResolveState("unmapped");
      setResolveError(
        "Khong map duoc orderCode voi du lieu thanh toan da tao. He thong chan subscribe va yeu cau thanh toan lai."
      );
      return;
    }

    if (nextContext.userId !== currentUserId) {
      addPaymentSupportLog({
        supportCode: nextContext.supportCode,
        orderCode,
        userId: currentUserId,
        status: "UNMAPPED_ORDER",
        message: "OrderCode map sang user khac voi phien hien tai.",
        payload: {
          expectedUserId: nextContext.userId,
          actualUserId: currentUserId,
          source,
          status,
        },
      });
      setResolveState("unmapped");
      setSupportCode(nextContext.supportCode);
      setResolveError(
        `OrderCode dang map toi userId ${nextContext.userId}, khong khop tai khoan hien tai (${currentUserId}).`
      );
      return;
    }

    const updatedContext = upsertPaymentRecoveryContext({
      supportCode: nextContext.supportCode,
      orderCode,
      userId: nextContext.userId,
      planId: nextContext.planId,
      planName: nextContext.planName,
      amount: nextContext.amount,
      checkoutUrl: nextContext.checkoutUrl,
      status: paid ? "CALLBACK_SUCCESS" : "UNMAPPED_ORDER",
      note: paid
        ? "Callback success hop le, san sang tu dong kich hoat goi."
        : "Callback tra ve status khong hop le.",
    });

    addPaymentSupportLog({
      supportCode: updatedContext.supportCode,
      orderCode,
      userId: updatedContext.userId,
      planId: updatedContext.planId,
      planName: updatedContext.planName,
      amount: updatedContext.amount,
      status: paid ? "CALLBACK_SUCCESS" : "UNMAPPED_ORDER",
      message: paid
        ? "Da xac nhan callback thanh cong, he thong se tu dong kich hoat goi."
        : "Callback co orderCode nhung status thanh toan khong hop le.",
      payload: {
        source,
        status,
        paid,
      },
    });

    setRecoveryContext(updatedContext);
    setSupportCode(updatedContext.supportCode);
    setIsKnownActivatedOrder(getActivatedOrderCodes().has(orderCode));
    if (!paid) {
      setResolveState("unmapped");
      setResolveError(
        "Status callback chua xac nhan thanh toan thanh cong. He thong khong cho phep subscribe."
      );
      return;
    }

    setResolveState("ready");
  }, [currentUserId, orderCode, paid, source, status]);

  useEffect(() => {
    if (shouldRedirectToPendingSession) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void handleResolveOrder();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [handleResolveOrder, shouldRedirectToPendingSession]);

  const handleConfirmSubscribe = useCallback(async () => {
    if (!recoveryContext) {
      return;
    }

    if (resolveState === "subscribing" || !orderCode) {
      return;
    }

    if (!currentUserId) {
      setSubscribeError("Ban can dang nhap lai truoc khi kich hoat goi.");
      return;
    }

    if (recoveryContext.userId !== currentUserId) {
      setSubscribeError("OrderCode khong thuoc tai khoan hien tai. Vui long kiem tra lai.");
      return;
    }

    if (!paid) {
      setSubscribeError("Trang thai callback chua xac nhan thanh toan thanh cong.");
      return;
    }

    if (resolveState === "subscribed" || isKnownActivatedOrder) {
      setResolveState("subscribed");
      setSubscribeError("");
      toast.info("Order nay da duoc kich hoat truoc do.");
      await loadActiveSubscription(recoveryContext.userId);
      return;
    }

    setResolveState("subscribing");
    setSubscribeError("");

    const subscribeResult = await userManager.subscribePlan(
      recoveryContext.userId,
      recoveryContext.planId
    );
    if (!subscribeResult.success) {
      const updatedContext = upsertPaymentRecoveryContext({
        supportCode: recoveryContext.supportCode,
        orderCode,
        userId: recoveryContext.userId,
        planId: recoveryContext.planId,
        planName: recoveryContext.planName,
        amount: recoveryContext.amount,
        checkoutUrl: recoveryContext.checkoutUrl,
        status: "SUBSCRIBE_FAILED",
        note: subscribeResult.error || "Subscribe that bai.",
      });

      addPaymentSupportLog({
        supportCode: updatedContext.supportCode,
        orderCode,
        userId: updatedContext.userId,
        planId: updatedContext.planId,
        planName: updatedContext.planName,
        amount: updatedContext.amount,
        status: "SUBSCRIBE_FAILED",
        message: "He thong kich hoat goi tu dong that bai do backend tra ve loi.",
        payload: {
          error: subscribeResult.error || null,
        },
      });

      setRecoveryContext(updatedContext);
      setSupportCode(updatedContext.supportCode);
      setResolveState("ready");
      setSubscribeError(subscribeResult.error || "Kich hoat goi that bai. Vui long thu lai.");
      toast.error(subscribeResult.error || "Kich hoat goi that bai.");
      return;
    }

    const latestSubscription = await loadActiveSubscription(recoveryContext.userId);

    const updatedContext = upsertPaymentRecoveryContext({
      supportCode: recoveryContext.supportCode,
      orderCode,
      userId: recoveryContext.userId,
      planId: recoveryContext.planId,
      planName: recoveryContext.planName,
      amount: recoveryContext.amount,
      checkoutUrl: recoveryContext.checkoutUrl,
      status: "SUBSCRIBE_SUCCESS",
      note: "Subscribe thanh cong tu callback success page.",
    });

    addPaymentSupportLog({
      supportCode: updatedContext.supportCode,
      orderCode,
      userId: updatedContext.userId,
      planId: updatedContext.planId,
      planName: updatedContext.planName,
      amount: updatedContext.amount,
      status: "SUBSCRIBE_SUCCESS",
      message: "He thong da kich hoat goi thanh cong sau callback.",
      payload: {
        subscriptionSnapshot: latestSubscription,
      },
    });

    setRecoveryContext(updatedContext);
    setSupportCode(updatedContext.supportCode);
    markOrderAsActivated(orderCode);
    setIsKnownActivatedOrder(true);
    setResolveState("subscribed");
    toast.success("Da kich hoat goi thanh cong.");
  }, [
    currentUserId,
    isKnownActivatedOrder,
    loadActiveSubscription,
    orderCode,
    paid,
    recoveryContext,
    resolveState,
  ]);

  useEffect(() => {
    if (shouldRedirectToPendingSession || resolveState !== "ready" || !recoveryContext || !paid) {
      return;
    }

    const resolvedOrderCode = (recoveryContext.orderCode || orderCode).trim();
    if (!resolvedOrderCode || autoSubscribeOrderCode === resolvedOrderCode) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setAutoSubscribeOrderCode(resolvedOrderCode);
      void handleConfirmSubscribe();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    autoSubscribeOrderCode,
    handleConfirmSubscribe,
    orderCode,
    paid,
    shouldRedirectToPendingSession,
    recoveryContext,
    resolveState,
  ]);

  const resolvedOrderCode = (recoveryContext?.orderCode || orderCode).trim();
  const canRetrySubscribe =
    resolveState === "ready" &&
    !!recoveryContext &&
    resolvedOrderCode.length > 0 &&
    autoSubscribeOrderCode === resolvedOrderCode;

  if (shouldRedirectToPendingSession) {
    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 to-blue-50 px-4 py-10 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900/40 dark:bg-slate-900">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-300" />
          <p className="font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
            Đang chuyển hướng về trang chi tiết phiên phỏng vấn...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-blue-50 px-4 py-10 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm dark:border-emerald-900/40 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-['Poppins'] text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              Thanh toan thanh cong
            </h1>
            <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
              He thong dang doi chieu callback va tu dong kich hoat goi thanh vien.
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <p className="font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
            OrderCode: <span className="font-semibold">{orderCode || "Khong co"}</span>
          </p>
          <p className="font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
            Status: <span className="font-semibold">{status}</span>
          </p>
          <p className="font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
            Source: <span className="font-semibold">{source}</span>
          </p>
          <p className="font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
            SupportCode: <span className="font-semibold">{supportCode || "Chua tao"}</span>
          </p>
        </div>

        {!paid && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 font-['Inter'] text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300">
            Callback status chua o trang thai PAID/SUCCESS/COMPLETED. Ban co the retry resolve,
            nhung khong nen kich hoat goi khi status nay chua hop le.
          </div>
        )}

        {resolveState === "checking" && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-['Inter'] text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Dang doi chieu orderCode voi recovery state local...
          </div>
        )}

        {resolveState === "unmapped" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="mb-2 flex items-center gap-2 font-['Inter'] text-sm font-semibold text-rose-700 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4" />
              Khong map duoc orderCode de subscribe an toan
            </div>
            <p className="font-['Inter'] text-sm text-rose-700/90 dark:text-rose-300/90">
              {resolveError || "Khong the map orderCode sang userId/planId trong bo nho recovery."}
            </p>
          </div>
        )}

        {recoveryContext && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-900/10">
            <p className="mb-2 font-['Inter'] text-sm font-semibold text-blue-700 dark:text-blue-300">
              Recovery context
            </p>
            <div className="grid gap-1 font-['Inter'] text-xs text-blue-700/90 dark:text-blue-300/90">
              <p>UserId: {recoveryContext.userId}</p>
              <p>PlanId: {recoveryContext.planId}</p>
              <p>PlanName: {recoveryContext.planName || "-"}</p>
              <p>OrderCode: {recoveryContext.orderCode || "-"}</p>
              <p>Amount: {recoveryContext.amount ?? "-"}</p>
              <p>Status: {recoveryContext.status}</p>
              <p>Cap nhat luc: {new Date(recoveryContext.updatedAt).toLocaleString("vi-VN")}</p>
            </div>
          </div>
        )}

        {subscribeError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
            <p className="font-['Inter'] text-sm text-amber-700 dark:text-amber-300">
              {subscribeError}
            </p>
          </div>
        )}

        {isKnownActivatedOrder && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800/40 dark:bg-violet-900/10">
            <p className="font-['Inter'] text-sm text-violet-700 dark:text-violet-300">
              OrderCode nay da tung kich hoat goi. He thong se bo qua kich hoat lai de tranh trung
              lap.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            to="/user?tab=account"
            className="rounded-xl bg-[#0047AB] px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white hover:bg-[#003b8d]">
            Ve trang tai khoan
          </Link>
          <Link
            to={
              orderCode
                ? `/payment/cancel?orderCode=${encodeURIComponent(orderCode)}&status=CANCELLED`
                : "/payment/cancel?status=CANCELLED"
            }
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Mo callback huy
          </Link>
          <button
            onClick={() => void handleResolveOrder()}
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Tai lai recovery
          </button>
          <button
            onClick={() => void handleCopySupportPayload()}
            disabled={isCopyingPayload}
            className="rounded-xl border border-blue-300 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20">
            {isCopyingPayload ? "Dang sao chep..." : "Sao chep payload ho tro"}
          </button>
          {canRetrySubscribe && (
            <button
              onClick={handleConfirmSubscribe}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white hover:bg-emerald-700">
              Thu kich hoat lai
            </button>
          )}
          {resolveState === "subscribing" && (
            <button
              disabled
              className="flex items-center gap-2 rounded-xl bg-emerald-500/80 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white">
              <Loader2 className="h-4 w-4 animate-spin" />
              Dang kich hoat goi...
            </button>
          )}
        </div>

        {resolveState === "subscribed" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/40 dark:bg-emerald-900/10">
            <p className="mb-2 font-['Inter'] text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Da kich hoat goi thanh cong
            </p>
            {subscription ? (
              <div className="grid grid-cols-1 gap-2 font-['Inter'] text-xs text-emerald-700/90 md:grid-cols-2 dark:text-emerald-300/90">
                <p>Plan: {subscription.planName || "-"}</p>
                <p>AI Interview con lai: {subscription.aiInterviewRemaining ?? "-"}</p>
                <p>Practice Set con lai: {subscription.practiceSetRemaining ?? "-"}</p>
                <p>Quiz Set con lai: {subscription.quizSetRemaining ?? "-"}</p>
              </div>
            ) : (
              <p className="font-['Inter'] text-xs text-emerald-700/90 dark:text-emerald-300/90">
                Da subscribe, nhung chua tai duoc thong tin quota hien tai.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
