import { Spinner } from "@/components/ui/spinner";
import type { PaymentPurpose, UserSubscriptionResponse } from "@/interfaces";
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
  type PaymentRecoveryContext,
  type PaymentRecoveryLookupSource,
  upsertPaymentRecoveryContext,
} from "@/lib";
import i18n from "@/lib/i18n";
import { userManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
const t = i18n.t.bind(i18n);
type ResolveState = "checking" | "ready" | "unmapped" | "subscribing" | "subscribed";
const ACTIVATED_ORDERS_STORAGE_KEY = "inblue.payment.activated-orders";
const isPaidStatus = (status: string): boolean => {
  const normalized = status.trim().toUpperCase();
  return normalized === "PAID" || normalized === "SUCCESS" || normalized === "COMPLETED";
};
const isAlreadySubscribedError = (error?: string): boolean => {
  if (!error) {
    return false;
  }
  const normalized = error.toLowerCase();
  return (
    normalized.includes("409") ||
    normalized.includes("conflict") ||
    normalized.includes("already") ||
    normalized.includes(t("paymentPaymentsuccesspage.activated")) ||
    normalized.includes("da kich hoat") ||
    normalized.includes("already active") ||
    normalized.includes("already subscribed")
  );
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
const getSuccessSubtitle = (purpose?: PaymentPurpose): string => {
  switch (purpose) {
    case "BUY_MEMBERSHIP":
      return t("adminDashboardoverview.system");
    case "MENTOR_INTERVIEW":
      return t("adminDashboardoverview.system");
    case "TOP_UP_WALLET":
      return t("adminDashboardoverview.system");
    case "WITHDRAW_FROM_WALLET":
      return t("adminCompanymanagement.request");
    default:
      return t("adminDashboardoverview.system");
  }
};
const getPrimaryRedirect = (
  purpose?: PaymentPurpose
): {
  to: string;
  label: string;
} => {
  switch (purpose) {
    case "MENTOR_INTERVIEW":
      return {
        to: "/user?tab=interviewHistory",
        label: t("common.viewInterviewHistory"),
      };
    case "TOP_UP_WALLET":
    case "WITHDRAW_FROM_WALLET":
      return {
        to: "/user?tab=account&subtab=wallet",
        label: t("paymentPaymentsuccesspage.goToMyWallet"),
      };
    case "BUY_MEMBERSHIP":
    default:
      return {
        to: "/user?tab=account",
        label: t("common.returnToAccount"),
      };
  }
};
export function PaymentSuccessPage() {
  const { t } = useTranslation();
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
  const status = query.get("status")?.trim() || "PAID";
  const source = query.get("source")?.trim() || "callback";
  const paid = isPaidStatus(status);
  const currentUserId = Number(user?.id || 0);
  const pendingSessionPayment = useMemo(
    () => getPendingSessionPaymentContext(currentUserId || undefined),
    [currentUserId]
  );
  const [resolveState, setResolveState] = useState<ResolveState>("checking");
  const [resolveError, setResolveError] = useState<string>("");
  const [subscribeError, setSubscribeError] = useState<string>("");
  const [recoveryContext, setRecoveryContext] = useState<PaymentRecoveryContext | null>(null);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [isKnownActivatedOrder, setIsKnownActivatedOrder] = useState(false);
  const [autoSubscribeKey, setAutoSubscribeKey] = useState<string>("");
  const autoResolveKeyRef = useRef("");
  const resolveInFlightRef = useRef(false);
  const resolveExecutionKey = useMemo(
    () =>
      [
        String(currentUserId || 0),
        orderCode,
        queryTransactionCode,
        callbackCheckoutToken,
        status,
        source,
        String(pendingSessionPayment?.sessionId || ""),
        pendingSessionPayment?.transactionCode || "",
        pendingSessionPayment?.checkoutToken || "",
      ].join("|"),
    [
      callbackCheckoutToken,
      currentUserId,
      orderCode,
      pendingSessionPayment?.checkoutToken,
      pendingSessionPayment?.sessionId,
      pendingSessionPayment?.transactionCode,
      queryTransactionCode,
      source,
      status,
    ]
  );
  const loadActiveSubscription = useCallback(
    async (userId: number): Promise<UserSubscriptionResponse | null> => {
      const subscriptionResult = await userManager.getActiveSubscription(userId);
      if (subscriptionResult.success && subscriptionResult.data) {
        setSubscription(subscriptionResult.data);
        setSubscribeError("");
        return subscriptionResult.data;
      }
      setSubscribeError(
        subscriptionResult.error || t("paymentPaymentsuccesspage.packageActivatedButCannotLoad")
      );
      return null;
    },

    [t]
  );
  const handleResolveOrder = useCallback(async () => {
    if (resolveInFlightRef.current) {
      return;
    }
    resolveInFlightRef.current = true;
    try {
      setSubscribeError("");
      setSubscription(null);
      setResolveError("");
      setRecoveryContext(null);
      if (!currentUserId) {
        addPaymentSupportLog({
          orderCode,
          transactionCode: queryTransactionCode || undefined,
          checkoutToken: callbackCheckoutToken || undefined,
          status: "UNMAPPED_ORDER",
          message: t("paymentPaymentsuccesspage.userSessionNotFoundWhen"),
          payload: {
            source,
            status,
            paid,
          },
        });
        setResolveState("unmapped");
        setResolveError(t("sharedSpeechplaygroundpage.areNot"));
        return;
      }
      const hasAnyIdentifier = Boolean(
        orderCode ||
        queryTransactionCode ||
        callbackCheckoutToken ||
        pendingSessionPayment?.checkoutToken ||
        pendingSessionPayment?.transactionCode ||
        pendingSessionPayment?.sessionId
      );
      if (!hasAnyIdentifier) {
        addPaymentSupportLog({
          userId: currentUserId,
          status: "UNMAPPED_ORDER",
          message: t("paymentPaymentsuccesspage.callbackSuccessNoIdentity"),
          payload: {
            source,
            status,
            paid,
          },
        });
        setResolveState("unmapped");
        setResolveError(t("sharedSpeechplaygroundpage.areNot"));
        return;
      }
      setResolveState("checking");
      let nextContext: PaymentRecoveryContext | null = null;
      let recoverySource: PaymentRecoveryLookupSource = "none";
      if (orderCode) {
        nextContext = getRecoveryByOrderCode(orderCode, currentUserId);
        if (nextContext) {
          recoverySource = "order-code";
        }
      }
      if (!nextContext && queryTransactionCode) {
        nextContext = getRecoveryByTransactionCode(queryTransactionCode, currentUserId);
        if (nextContext) {
          recoverySource = "query-transaction-code";
        }
      }
      if (!nextContext && callbackCheckoutToken) {
        nextContext = getRecoveryByCheckoutToken(callbackCheckoutToken, currentUserId);
        if (nextContext) {
          recoverySource = "callback-checkout-token";
        }
      }
      if (!nextContext && pendingSessionPayment?.checkoutToken) {
        nextContext = getRecoveryByCheckoutToken(
          pendingSessionPayment.checkoutToken,
          currentUserId
        );
        if (nextContext) {
          recoverySource = "pending-checkout-token";
        }
      }
      if (!nextContext && pendingSessionPayment?.transactionCode) {
        nextContext = getRecoveryByTransactionCode(
          pendingSessionPayment.transactionCode,
          currentUserId
        );
        if (nextContext) {
          recoverySource = "pending-transaction-code";
        }
      }
      if (!nextContext && pendingSessionPayment?.sessionId) {
        nextContext = getLatestRecoveryForSessionPayment(
          pendingSessionPayment.sessionId,
          currentUserId
        );
        if (nextContext) {
          recoverySource = "session-recovery";
        }
      }
      if (!nextContext && pendingSessionPayment?.paymentPurpose === "MENTOR_INTERVIEW") {
        nextContext = getLatestRecoveryForUserByPurpose(currentUserId, "MENTOR_INTERVIEW");
        if (nextContext) {
          recoverySource = "purpose-recovery";
        }
      }
      if (!nextContext) {
        nextContext = getLatestRecoveryForUser(currentUserId);
        if (nextContext) {
          recoverySource = "latest-user-recovery";
        }
      }
      if (!nextContext) {
        addPaymentSupportLog({
          orderCode,
          transactionCode: queryTransactionCode || undefined,
          checkoutToken: callbackCheckoutToken || undefined,
          userId: currentUserId,
          status: "UNMAPPED_ORDER",
          message: t("paymentPaymentsuccesspage.noRecoveryContextFoundFor"),
          payload: {
            source,
            status,
            paid,
            pendingSessionPayment,
          },
        });
        setResolveState("unmapped");
        setResolveError(t("paymentPaymentsuccesspage.noMatchingTransactionInformationFound"));
        return;
      }
      const identifierMismatch = getCallbackIdentifierMismatch(
        {
          orderCode,
          transactionCode: queryTransactionCode,
          checkoutToken: callbackCheckoutToken,
        },
        nextContext
      );
      if (identifierMismatch.hasMismatch) {
        addPaymentSupportLog({
          supportCode: nextContext.supportCode,
          orderCode: orderCode || nextContext.orderCode,
          transactionCode: queryTransactionCode || nextContext.transactionCode,
          checkoutToken: callbackCheckoutToken || nextContext.checkoutToken,
          userId: currentUserId,
          paymentPurpose: nextContext.paymentPurpose,
          sessionId: nextContext.sessionId,
          status: "UNMAPPED_ORDER",
          message: t("paymentPaymentsuccesspage.identityCallbackSuccessMismatch"),
          payload: {
            recoverySource,
            mismatchedKeys: identifierMismatch.mismatchedKeys,
            source,
            status,
          },
        });
        setResolveState("unmapped");
        setResolveError(t("sharedSpeechplaygroundpage.areNot"));
        return;
      }
      const hasStrongCallbackIdentifier = Boolean(
        orderCode || queryTransactionCode || callbackCheckoutToken
      );
      if (hasStrongCallbackIdentifier && isLowConfidenceRecoverySource(recoverySource)) {
        addPaymentSupportLog({
          supportCode: nextContext.supportCode,
          orderCode: orderCode || nextContext.orderCode,
          transactionCode: queryTransactionCode || nextContext.transactionCode,
          checkoutToken: callbackCheckoutToken || nextContext.checkoutToken,
          userId: currentUserId,
          paymentPurpose: nextContext.paymentPurpose,
          sessionId: nextContext.sessionId,
          status: "UNMAPPED_ORDER",
          message: t("paymentPaymentsuccesspage.callbackSuccessOnlyMappedLatest"),
          payload: {
            recoverySource,
            source,
            status,
          },
        });
        setResolveState("unmapped");
        setResolveError(t("sharedSpeechplaygroundpage.areNot"));
        return;
      }
      if (nextContext.userId !== currentUserId) {
        addPaymentSupportLog({
          supportCode: nextContext.supportCode,
          orderCode,
          transactionCode: queryTransactionCode || undefined,
          checkoutToken: callbackCheckoutToken || undefined,
          userId: currentUserId,
          paymentPurpose: nextContext.paymentPurpose,
          sessionId: nextContext.sessionId,
          status: "UNMAPPED_ORDER",
          message: t("adminTransactionpaymentmanagement.transaction"),
          payload: {
            expectedUserId: nextContext.userId,
            actualUserId: currentUserId,
            source,
            status,
            recoverySource,
          },
        });
        setResolveState("unmapped");
        setResolveError(t("adminSessionmanagement.paymentInformation"));
        return;
      }
      const resolvedOrderCode = orderCode || nextContext.orderCode;
      const resolvedTransactionCode =
        queryTransactionCode ||
        nextContext.transactionCode ||
        pendingSessionPayment?.transactionCode;
      const resolvedCheckoutToken =
        callbackCheckoutToken || nextContext.checkoutToken || pendingSessionPayment?.checkoutToken;
      const resolvedPurpose =
        nextContext.paymentPurpose ||
        (pendingSessionPayment?.paymentPurpose as PaymentPurpose | undefined);
      const resolvedSessionId = nextContext.sessionId || pendingSessionPayment?.sessionId;
      const callbackStatus =
        paid && nextContext.status === "SUBSCRIBE_SUCCESS"
          ? "SUBSCRIBE_SUCCESS"
          : paid
            ? "CALLBACK_SUCCESS"
            : "UNMAPPED_ORDER";
      const updatedContext = upsertPaymentRecoveryContext({
        supportCode: nextContext.supportCode,
        orderCode: resolvedOrderCode,
        transactionCode: resolvedTransactionCode,
        checkoutToken: resolvedCheckoutToken,
        userId: nextContext.userId,
        planId: nextContext.planId,
        planName: nextContext.planName,
        amount: nextContext.amount,
        paymentPurpose: resolvedPurpose,
        sessionId: resolvedSessionId,
        checkoutUrl: nextContext.checkoutUrl,
        status: callbackStatus,
        note: paid
          ? t("paymentPaymentsuccesspage.theSuccessCallbackIsValid")
          : t("paymentPaymentsuccesspage.callbackReturnsInvalidPaymentStatus"),
      });
      addPaymentSupportLog({
        supportCode: updatedContext.supportCode,
        orderCode: updatedContext.orderCode,
        transactionCode: updatedContext.transactionCode,
        checkoutToken: updatedContext.checkoutToken,
        userId: updatedContext.userId,
        planId: updatedContext.planId,
        planName: updatedContext.planName,
        amount: updatedContext.amount,
        paymentPurpose: updatedContext.paymentPurpose,
        sessionId: updatedContext.sessionId,
        status: callbackStatus,
        message: paid
          ? t("paymentPaymentsuccesspage.callbackConfirmedSuccessfully")
          : t("paymentPaymentsuccesspage.theCallbackHasTransactionData"),
        payload: {
          source,
          status,
          paid,
          recoverySource,
        },
      });
      setRecoveryContext(updatedContext);
      const normalizedOrderCode = (updatedContext.orderCode || "").trim();
      setIsKnownActivatedOrder(
        updatedContext.status === "SUBSCRIBE_SUCCESS" ||
          (normalizedOrderCode.length > 0 && getActivatedOrderCodes().has(normalizedOrderCode))
      );
      if (!paid) {
        setResolveState("unmapped");
        setResolveError(t("general.paymentHasnTBeenConfirmed"));
        return;
      }
      if (updatedContext.paymentPurpose === "MENTOR_INTERVIEW") {
        const targetSessionId = updatedContext.sessionId || pendingSessionPayment?.sessionId;
        if (targetSessionId) {
          const params = new URLSearchParams();
          params.set("payment", "success");
          if (updatedContext.orderCode) {
            params.set("orderCode", updatedContext.orderCode);
          }
          clearPendingSessionPaymentContext();
          window.location.replace(
            `/user/mock-interview/history/${targetSessionId}?${params.toString()}`
          );
          return;
        }
        setResolveError(t("paymentPaymentsuccesspage.paymentConfirmedNotFound"));
      }
      if (
        pendingSessionPayment?.sessionId &&
        updatedContext.paymentPurpose !== "MENTOR_INTERVIEW"
      ) {
        clearPendingSessionPaymentContext();
      }
      setResolveState("ready");
    } finally {
      resolveInFlightRef.current = false;
    }
  }, [
    callbackCheckoutToken,
    currentUserId,
    orderCode,
    paid,
    pendingSessionPayment,
    queryTransactionCode,
    source,
    status,
    t,
  ]);
  useEffect(() => {
    if (autoResolveKeyRef.current === resolveExecutionKey) {
      return;
    }
    autoResolveKeyRef.current = resolveExecutionKey;
    const timerId = window.setTimeout(() => {
      void handleResolveOrder();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [handleResolveOrder, resolveExecutionKey]);
  const handleConfirmSubscribe = useCallback(async () => {
    if (!recoveryContext || resolveState === "subscribing") {
      return;
    }
    if (!currentUserId) {
      setSubscribeError(t("common.friend"));
      return;
    }
    if (recoveryContext.userId !== currentUserId) {
      setSubscribeError(t("paymentPaymentsuccesspage.unableToActivatePackageFor"));
      return;
    }
    if (recoveryContext.paymentPurpose !== "BUY_MEMBERSHIP") {
      setSubscribeError(t("adminTransactionpaymentmanagement.transaction"));
      return;
    }
    if (!recoveryContext.planId) {
      setSubscribeError(t("paymentPaymentsuccesspage.noMembershipPackageToActivate"));
      return;
    }
    if (!paid) {
      setSubscribeError(t("common.pay"));
      return;
    }
    const activationOrderCode = (recoveryContext.orderCode || "").trim();
    if (resolveState === "subscribed" || (activationOrderCode && isKnownActivatedOrder)) {
      setResolveState("subscribed");
      setSubscribeError("");
      toast.info(t("paymentPaymentsuccesspage.packageActivatedPreviously"));
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
      if (isAlreadySubscribedError(subscribeResult.error)) {
        const latestSubscription = await loadActiveSubscription(recoveryContext.userId);
        const updatedContext = upsertPaymentRecoveryContext({
          supportCode: recoveryContext.supportCode,
          orderCode: recoveryContext.orderCode,
          transactionCode: recoveryContext.transactionCode,
          checkoutToken: recoveryContext.checkoutToken,
          userId: recoveryContext.userId,
          planId: recoveryContext.planId,
          planName: recoveryContext.planName,
          amount: recoveryContext.amount,
          paymentPurpose: recoveryContext.paymentPurpose,
          sessionId: recoveryContext.sessionId,
          checkoutUrl: recoveryContext.checkoutUrl,
          status: "SUBSCRIBE_SUCCESS",
          note: t("paymentPaymentsuccesspage.packageActivatedPreviously2"),
        });
        addPaymentSupportLog({
          supportCode: updatedContext.supportCode,
          orderCode: updatedContext.orderCode,
          transactionCode: updatedContext.transactionCode,
          checkoutToken: updatedContext.checkoutToken,
          userId: updatedContext.userId,
          planId: updatedContext.planId,
          planName: updatedContext.planName,
          amount: updatedContext.amount,
          paymentPurpose: updatedContext.paymentPurpose,
          sessionId: updatedContext.sessionId,
          status: "SUBSCRIBE_SUCCESS",
          message: t("paymentPaymentsuccesspage.backendReportedPackageActivatedPreviously"),
          payload: {
            duplicateSubscribe: true,
            error: subscribeResult.error || null,
            subscriptionSnapshot: latestSubscription,
          },
        });
        setRecoveryContext(updatedContext);
        if (activationOrderCode) {
          markOrderAsActivated(activationOrderCode);
          setIsKnownActivatedOrder(true);
        }
        setResolveState("subscribed");
        setSubscribeError("");
        toast.info(t("paymentPaymentsuccesspage.packageActivatedPreviously"));
        return;
      }
      const updatedContext = upsertPaymentRecoveryContext({
        supportCode: recoveryContext.supportCode,
        orderCode: recoveryContext.orderCode,
        transactionCode: recoveryContext.transactionCode,
        checkoutToken: recoveryContext.checkoutToken,
        userId: recoveryContext.userId,
        planId: recoveryContext.planId,
        planName: recoveryContext.planName,
        amount: recoveryContext.amount,
        paymentPurpose: recoveryContext.paymentPurpose,
        sessionId: recoveryContext.sessionId,
        checkoutUrl: recoveryContext.checkoutUrl,
        status: "SUBSCRIBE_FAILED",
        note: subscribeResult.error || t("paymentPaymentsuccesspage.subscribeFailed"),
      });
      addPaymentSupportLog({
        supportCode: updatedContext.supportCode,
        orderCode: updatedContext.orderCode,
        transactionCode: updatedContext.transactionCode,
        checkoutToken: updatedContext.checkoutToken,
        userId: updatedContext.userId,
        planId: updatedContext.planId,
        planName: updatedContext.planName,
        amount: updatedContext.amount,
        paymentPurpose: updatedContext.paymentPurpose,
        sessionId: updatedContext.sessionId,
        status: "SUBSCRIBE_FAILED",
        message: t("adminDashboardoverview.system"),
        payload: {
          error: subscribeResult.error || null,
        },
      });
      setRecoveryContext(updatedContext);
      setResolveState("ready");
      setSubscribeError(
        subscribeResult.error || t("paymentPaymentsuccesspage.packageActivationFailedPleaseTry")
      );
      toast.error(subscribeResult.error || t("paymentPaymentsuccesspage.packageActivationFailed"));
      return;
    }
    const latestSubscription = await loadActiveSubscription(recoveryContext.userId);
    const updatedContext = upsertPaymentRecoveryContext({
      supportCode: recoveryContext.supportCode,
      orderCode: recoveryContext.orderCode,
      transactionCode: recoveryContext.transactionCode,
      checkoutToken: recoveryContext.checkoutToken,
      userId: recoveryContext.userId,
      planId: recoveryContext.planId,
      planName: recoveryContext.planName,
      amount: recoveryContext.amount,
      paymentPurpose: recoveryContext.paymentPurpose,
      sessionId: recoveryContext.sessionId,
      checkoutUrl: recoveryContext.checkoutUrl,
      status: "SUBSCRIBE_SUCCESS",
      note: "Subscribe thanh cong tu callback success page.",
    });
    addPaymentSupportLog({
      supportCode: updatedContext.supportCode,
      orderCode: updatedContext.orderCode,
      transactionCode: updatedContext.transactionCode,
      checkoutToken: updatedContext.checkoutToken,
      userId: updatedContext.userId,
      planId: updatedContext.planId,
      planName: updatedContext.planName,
      amount: updatedContext.amount,
      paymentPurpose: updatedContext.paymentPurpose,
      sessionId: updatedContext.sessionId,
      status: "SUBSCRIBE_SUCCESS",
      message: t("adminDashboardoverview.system"),
      payload: {
        subscriptionSnapshot: latestSubscription,
      },
    });
    setRecoveryContext(updatedContext);
    if (activationOrderCode) {
      markOrderAsActivated(activationOrderCode);
      setIsKnownActivatedOrder(true);
    }
    setResolveState("subscribed");
    toast.success(t("general.successfullyActivatedPlan"));
  }, [
    currentUserId,
    isKnownActivatedOrder,
    loadActiveSubscription,
    paid,
    recoveryContext,
    resolveState,
    t,
  ]);
  useEffect(() => {
    if (
      resolveState !== "ready" ||
      !recoveryContext ||
      !paid ||
      recoveryContext.paymentPurpose !== "BUY_MEMBERSHIP"
    ) {
      return;
    }
    if (recoveryContext.status === "SUBSCRIBE_SUCCESS") {
      setResolveState("subscribed");
      return;
    }
    const key = (recoveryContext.orderCode || recoveryContext.supportCode || "").trim();
    if (!key || autoSubscribeKey === key) {
      return;
    }
    const timerId = window.setTimeout(() => {
      setAutoSubscribeKey(key);
      void handleConfirmSubscribe();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [autoSubscribeKey, handleConfirmSubscribe, paid, recoveryContext, resolveState]);
  const resolvedPurpose = recoveryContext?.paymentPurpose;
  const successSubtitle = getSuccessSubtitle(resolvedPurpose);
  const primaryRedirect = getPrimaryRedirect(resolvedPurpose);
  const subscribeKey = (recoveryContext?.orderCode || recoveryContext?.supportCode || "").trim();
  const canRetrySubscribe =
    resolvedPurpose === "BUY_MEMBERSHIP" &&
    resolveState === "ready" &&
    !!recoveryContext &&
    subscribeKey.length > 0 &&
    autoSubscribeKey === subscribeKey;
  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-blue-50 px-4 py-10 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm dark:border-emerald-900/40 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-['Poppins'] text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {t("paymentPaymentsuccesspage.paymentSuccessful")}
            </h1>
            <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
              {successSubtitle}
            </p>
          </div>
        </div>

        {!paid && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 font-['Inter'] text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300">
            {t("common.pay")}
          </div>
        )}

        {resolveState === "checking" && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-['Inter'] text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Spinner size="sm" tone="muted" />
            {t("adminUsermanagement.hide")}
          </div>
        )}

        {resolveState === "unmapped" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="mb-2 flex items-center gap-2 font-['Inter'] text-sm font-semibold text-rose-700 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4" />
              {t("paymentPaymentsuccesspage.paymentCouldNotBeConfirmed")}
            </div>
            <p className="font-['Inter'] text-sm text-rose-700/90 dark:text-rose-300/90">
              {resolveError || t("paymentPaymentsuccesspage.noValidPaymentInformationFound")}
            </p>
          </div>
        )}

        {resolveState === "ready" && !!resolveError && paid && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
            <p className="font-['Inter'] text-sm text-amber-700 dark:text-amber-300">
              {resolveError}
            </p>
          </div>
        )}

        {resolvedPurpose === "BUY_MEMBERSHIP" && !!subscribeError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
            <p className="font-['Inter'] text-sm text-amber-700 dark:text-amber-300">
              {subscribeError}
            </p>
          </div>
        )}

        {resolvedPurpose === "BUY_MEMBERSHIP" && isKnownActivatedOrder && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800/40 dark:bg-violet-900/10">
            <p className="font-['Inter'] text-sm text-violet-700 dark:text-violet-300">
              {t("paymentPaymentsuccesspage.packageActivatedPreviously")}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            to={primaryRedirect.to}
            className="rounded-xl bg-[#0047AB] px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white hover:bg-[#003b8d]">
            {primaryRedirect.label}
          </Link>

          {(resolveState === "unmapped" || !paid) && (
            <button
              onClick={() => void handleResolveOrder()}
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              {t("paymentPaymentsuccesspage.tryConfirmingAgain")}
            </button>
          )}

          {resolvedPurpose === "BUY_MEMBERSHIP" && canRetrySubscribe && (
            <button
              onClick={() => void handleConfirmSubscribe()}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white hover:bg-emerald-700">
              {t("paymentPaymentsuccesspage.tryActivatingAgain")}
            </button>
          )}

          {resolvedPurpose === "BUY_MEMBERSHIP" && resolveState === "subscribing" && (
            <button
              disabled
              className="flex items-center gap-2 rounded-xl bg-emerald-500/80 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white">
              <Spinner size="sm" tone="white" />
              {t("adminUsermanagement.hide")}
            </button>
          )}

          {resolvedPurpose === "BUY_MEMBERSHIP" && (
            <Link
              to="/user?tab=account"
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              {t("common.chooseAnotherMembershipPackage")}
            </Link>
          )}
        </div>

        {resolvedPurpose === "BUY_MEMBERSHIP" && resolveState === "subscribed" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/40 dark:bg-emerald-900/10">
            <p className="mb-2 font-['Inter'] text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {t("paymentPaymentsuccesspage.activatedGoiThanhCong")}
            </p>
            {subscription ? (
              <div className="grid grid-cols-1 gap-2 font-['Inter'] text-xs text-emerald-700/90 md:grid-cols-2 dark:text-emerald-300/90">
                <p>Plan: {subscription.planName || "-"}</p>
                <p>
                  {t("paymentPaymentsuccesspage.aiInterviewRemaining")}{" "}
                  {subscription.aiInterviewRemaining ?? "-"}
                </p>
                <p>
                  {t("paymentPaymentsuccesspage.remainingPracticeSet")}{" "}
                  {subscription.practiceSetRemaining ?? "-"}
                </p>
                <p>
                  {t("paymentPaymentsuccesspage.remainingQuizSet")}{" "}
                  {subscription.quizSetRemaining ?? "-"}
                </p>
              </div>
            ) : (
              <p className="font-['Inter'] text-xs text-emerald-700/90 dark:text-emerald-300/90">
                {t("paymentPaymentsuccesspage.packageActivatedButNotLoaded")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
