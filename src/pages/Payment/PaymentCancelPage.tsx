import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  addPaymentSupportLog,
  buildSupportPayload,
  formatSupportPayload,
  getRecoveryByOrderCode,
  type PaymentRecoveryContext,
  upsertPaymentRecoveryContext,
} from "@/lib";
import { paymentManager } from "@/services/payment.manager";
import { transactionManager } from "@/services/transaction.manager";
import { toast } from "sonner";

type CancelChainResult = "idle" | "success" | "cancel-failed" | "delete-failed" | "missing-order";

export function PaymentCancelPage() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const orderCode = query.get("orderCode")?.trim() || "";
  const status = query.get("status")?.trim() || "CANCELLED";
  const [processing, setProcessing] = useState(false);
  const [chainResult, setChainResult] = useState<CancelChainResult>("idle");
  const [resultMessage, setResultMessage] = useState("Chua bat dau xu ly cancel chain.");
  const [recoveryContext, setRecoveryContext] = useState<PaymentRecoveryContext | null>(null);
  const [supportCode, setSupportCode] = useState("");
  const [isCopyingPayload, setIsCopyingPayload] = useState(false);

  const runCancelChain = useCallback(async () => {
    if (!orderCode) {
      const log = addPaymentSupportLog({
        status: "UNMAPPED_ORDER",
        message: "Callback cancel thieu orderCode.",
        payload: {
          status,
        },
      });
      setSupportCode(log.supportCode);
      setChainResult("missing-order");
      setResultMessage("Khong co orderCode, bo qua cancel chain.");
      return;
    }

    const context = recoveryContext || getRecoveryByOrderCode(orderCode);
    if (context) {
      const callbackContext = upsertPaymentRecoveryContext({
        supportCode: context.supportCode,
        orderCode,
        userId: context.userId,
        planId: context.planId,
        planName: context.planName,
        amount: context.amount,
        checkoutUrl: context.checkoutUrl,
        status: "CALLBACK_CANCEL",
        note: "Da vao callback cancel page.",
      });
      setRecoveryContext(callbackContext);
      setSupportCode(callbackContext.supportCode);
      addPaymentSupportLog({
        supportCode: callbackContext.supportCode,
        orderCode,
        userId: callbackContext.userId,
        planId: callbackContext.planId,
        planName: callbackContext.planName,
        amount: callbackContext.amount,
        status: "CALLBACK_CANCEL",
        message: "Nguoi dung vao callback cancel.",
      });
    }

    setProcessing(true);
    setChainResult("idle");

    const cancelResult = await paymentManager.cancel(orderCode);
    if (!cancelResult.success) {
      const log = addPaymentSupportLog({
        supportCode: context?.supportCode || supportCode || undefined,
        orderCode,
        userId: context?.userId,
        planId: context?.planId,
        planName: context?.planName,
        amount: context?.amount,
        status: "CANCEL_CHAIN_FAILED",
        message: "cancelPayment that bai.",
        payload: {
          error: cancelResult.error || null,
          phase: "cancel",
        },
      });

      if (!supportCode) {
        setSupportCode(log.supportCode);
      }

      if (context) {
        const failedContext = upsertPaymentRecoveryContext({
          supportCode: context.supportCode,
          orderCode,
          userId: context.userId,
          planId: context.planId,
          planName: context.planName,
          amount: context.amount,
          checkoutUrl: context.checkoutUrl,
          status: "CANCEL_CHAIN_FAILED",
          note: cancelResult.error || "cancelPayment that bai.",
        });
        setRecoveryContext(failedContext);
        setSupportCode(failedContext.supportCode);
      }

      setChainResult("cancel-failed");
      setResultMessage(
        cancelResult.error || "Khong the cap nhat trang thai huy thanh toan tren payment."
      );
      setProcessing(false);
      toast.error("Cancel payment that bai.");
      return;
    }

    const deleteResult = await transactionManager.delete(orderCode);
    if (!deleteResult.success) {
      const log = addPaymentSupportLog({
        supportCode: context?.supportCode || supportCode || undefined,
        orderCode,
        userId: context?.userId,
        planId: context?.planId,
        planName: context?.planName,
        amount: context?.amount,
        status: "CANCEL_CHAIN_FAILED",
        message: "deleteTransaction that bai sau khi cancelPayment thanh cong.",
        payload: {
          error: deleteResult.error || null,
          phase: "delete",
        },
      });

      if (!supportCode) {
        setSupportCode(log.supportCode);
      }

      if (context) {
        const failedContext = upsertPaymentRecoveryContext({
          supportCode: context.supportCode,
          orderCode,
          userId: context.userId,
          planId: context.planId,
          planName: context.planName,
          amount: context.amount,
          checkoutUrl: context.checkoutUrl,
          status: "CANCEL_CHAIN_FAILED",
          note: deleteResult.error || "deleteTransaction that bai.",
        });
        setRecoveryContext(failedContext);
        setSupportCode(failedContext.supportCode);
      }

      setChainResult("delete-failed");
      setResultMessage(
        deleteResult.error ||
          "cancelPayment thanh cong nhung deleteTransaction that bai. Ban co the thu lai."
      );
      setProcessing(false);
      toast.error("Delete transaction that bai.");
      return;
    }

    addPaymentSupportLog({
      supportCode: context?.supportCode || supportCode || undefined,
      orderCode,
      userId: context?.userId,
      planId: context?.planId,
      planName: context?.planName,
      amount: context?.amount,
      status: "CANCEL_CHAIN_SUCCESS",
      message: "Da thuc thi thanh cong chain cancelPayment -> deleteTransaction.",
    });

    if (context) {
      const successContext = upsertPaymentRecoveryContext({
        supportCode: context.supportCode,
        orderCode,
        userId: context.userId,
        planId: context.planId,
        planName: context.planName,
        amount: context.amount,
        checkoutUrl: context.checkoutUrl,
        status: "CANCEL_CHAIN_SUCCESS",
        note: "Da huy payment va xoa transaction thanh cong.",
      });
      setRecoveryContext(successContext);
      setSupportCode(successContext.supportCode);
    }

    setChainResult("success");
    setResultMessage("Da thuc thi chain: cancelPayment -> deleteTransaction thanh cong.");
    setProcessing(false);
    toast.success("Da xu ly huy thanh toan.");
  }, [orderCode, recoveryContext, status, supportCode]);

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
          chainResult,
          processing,
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
  }, [chainResult, isCopyingPayload, orderCode, processing, recoveryContext, status, supportCode]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void runCancelChain();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [runCancelChain]);

  const canRetry =
    !processing && (chainResult === "cancel-failed" || chainResult === "delete-failed");

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-rose-50 px-4 py-10 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-amber-200 bg-white p-8 shadow-sm dark:border-amber-900/40 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-['Poppins'] text-2xl font-bold text-amber-700 dark:text-amber-300">
              Thanh toan da bi huy
            </h1>
            <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
              Callback cancel + cancel policy chain.
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
            SupportCode: <span className="font-semibold">{supportCode || "Chua tao"}</span>
          </p>
          <p className="font-['Inter'] text-sm text-slate-700 dark:text-slate-200">
            Trang thai xu ly:{" "}
            <span className="font-semibold">{processing ? "Dang xu ly" : "Hoan tat"}</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-['Inter'] text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {resultMessage}
        </div>

        {canRetry && (
          <button
            onClick={() => void runCancelChain()}
            disabled={processing}
            className="w-fit rounded-xl bg-amber-600 px-4 py-2 font-['Inter'] text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">
            Thu xu ly lai cancel chain
          </button>
        )}

        <button
          onClick={() => void handleCopySupportPayload()}
          disabled={isCopyingPayload}
          className="w-fit rounded-xl border border-blue-300 px-4 py-2 font-['Inter'] text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20">
          {isCopyingPayload ? "Dang sao chep..." : "Sao chep payload ho tro"}
        </button>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/user?tab=account"
            className="rounded-xl bg-[#0047AB] px-5 py-2.5 font-['Inter'] text-sm font-semibold text-white hover:bg-[#003b8d]">
            Quay lai tai khoan
          </Link>
          <Link
            to="/user?tab=account"
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-['Inter'] text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Thanh toan lai
          </Link>
        </div>
      </div>
    </div>
  );
}
