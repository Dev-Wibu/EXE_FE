import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { UserSubscriptionResponse } from "@/interfaces";
import type { PaymentOrderResolution } from "@/services";
import { paymentManager, userManager } from "@/services";
import { toast } from "sonner";

type ResolveState = "resolving" | "ready" | "resolve-failed" | "subscribing" | "subscribed";

const isPaidStatus = (status: string): boolean => {
  const normalized = status.trim().toUpperCase();
  return normalized === "PAID" || normalized === "SUCCESS" || normalized === "COMPLETED";
};

export function PaymentSuccessPage() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const orderCode = query.get("orderCode")?.trim() || "";
  const status = query.get("status")?.trim() || "PAID";
  const source = query.get("source")?.trim() || "callback";
  const paid = isPaidStatus(status);

  const [resolveState, setResolveState] = useState<ResolveState>("resolving");
  const [resolveError, setResolveError] = useState<string>("");
  const [subscribeError, setSubscribeError] = useState<string>("");
  const [resolution, setResolution] = useState<PaymentOrderResolution | null>(null);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);

  const handleResolveOrder = useCallback(async () => {
    setSubscribeError("");
    setSubscription(null);

    if (!orderCode) {
      setResolveState("resolve-failed");
      setResolveError("Callback thieu orderCode, khong the map sang userId/planId.");
      setResolution(null);
      return;
    }

    setResolveState("resolving");
    setResolveError("");
    setResolution(null);

    const result = await paymentManager.resolveOrder(orderCode);
    if (!result.success || !result.data) {
      setResolveState("resolve-failed");
      setResolveError(result.error || "Khong the resolve orderCode tu backend.");
      return;
    }

    setResolution(result.data);
    setResolveState("ready");
  }, [orderCode]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void handleResolveOrder();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [handleResolveOrder]);

  const handleConfirmSubscribe = async () => {
    if (!resolution) {
      return;
    }

    if (!paid) {
      setSubscribeError("Trang thai callback chua xac nhan thanh toan thanh cong.");
      return;
    }

    setResolveState("subscribing");
    setSubscribeError("");

    const subscribeResult = await userManager.subscribePlan(resolution.userId, resolution.planId);
    if (!subscribeResult.success) {
      setResolveState("ready");
      setSubscribeError(subscribeResult.error || "Kich hoat goi that bai. Vui long thu lai.");
      toast.error(subscribeResult.error || "Kich hoat goi that bai.");
      return;
    }

    const subscriptionResult = await userManager.getActiveSubscription(resolution.userId);
    if (subscriptionResult.success && subscriptionResult.data) {
      setSubscription(subscriptionResult.data);
    } else {
      setSubscribeError(
        subscriptionResult.error ||
          "Da kich hoat goi, nhung khong tai duoc thong tin subscription moi."
      );
    }

    setResolveState("subscribed");
    toast.success("Da kich hoat goi thanh cong.");
  };

  const canConfirm = resolveState === "ready" && !!resolution;

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
              Xac nhan goi thanh vien thu cong sau khi callback payment tra ve.
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
        </div>

        {!paid && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 font-['Inter'] text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-300">
            Callback status chua o trang thai PAID/SUCCESS/COMPLETED. Ban co the retry resolve,
            nhung khong nen kich hoat goi khi status nay chua hop le.
          </div>
        )}

        {resolveState === "resolving" && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-['Inter'] text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Dang resolve orderCode tu backend...
          </div>
        )}

        {resolveState === "resolve-failed" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
            <div className="mb-2 flex items-center gap-2 font-['Inter'] text-sm font-semibold text-rose-700 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4" />
              Resolve orderCode that bai
            </div>
            <p className="font-['Inter'] text-sm text-rose-700/90 dark:text-rose-300/90">
              {resolveError || "Khong the map orderCode sang userId/planId."}
            </p>
            <button
              onClick={() => void handleResolveOrder()}
              className="mt-3 rounded-lg bg-rose-600 px-4 py-2 font-['Inter'] text-sm font-semibold text-white hover:bg-rose-700">
              Thu resolve lai
            </button>
          </div>
        )}

        {resolution && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/40 dark:bg-blue-900/10">
            <p className="mb-2 font-['Inter'] text-sm font-semibold text-blue-700 dark:text-blue-300">
              Mapping tu backend
            </p>
            <div className="grid gap-1 font-['Inter'] text-xs text-blue-700/90 dark:text-blue-300/90">
              <p>UserId: {resolution.userId}</p>
              <p>PlanId: {resolution.planId}</p>
              <p>PlanName: {resolution.planName || "-"}</p>
              <p>TransactionCode: {resolution.transactionCode}</p>
              <p>Amount: {resolution.amount ?? "-"}</p>
              <p>Status: {resolution.status || "-"}</p>
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
          {canConfirm && (
            <button
              onClick={handleConfirmSubscribe}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white hover:bg-emerald-700">
              Xac nhan kich hoat goi
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
          {resolveState === "subscribed" && (
            <button
              onClick={handleConfirmSubscribe}
              className="rounded-xl border border-emerald-300 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20">
              Kich hoat lai (neu can)
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
