import qr from "@/assets/qr.png";
import {
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Crown,
  Diamond,
  Loader2,
  QrCode,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { UserSubscriptionResponse } from "@/interfaces";
import {
  addPaymentSupportLog,
  buildSupportPayload,
  extractOrderCodeFromUrl,
  formatSupportPayload,
  getLatestRecoveryForUser,
  getSupportLogsBySupportCode,
  type PaymentRecoveryContext,
  type PaymentSupportLog,
  upsertPaymentRecoveryContext,
} from "@/lib";
import { formatCurrency } from "@/lib/formatting";
import { memberShipPlanManager, userManager } from "@/services";
import { paymentManager } from "@/services/payment.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface MembershipPlan {
  id: string;
  displayName: string;
  price: number;
  durationDays: number;
  features: PlanFeature[];
  colorClass: string;
  bgClass: string;
  borderClass: string;
  buttonClass: string;
  iconBgClass: string;
  icon: React.ReactNode;
  badge?: string;
  badgeClass?: string;
  isCurrent?: boolean;
}

const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "FREE",
    displayName: "INBLUE FREE",
    price: 0,
    durationDays: 30,
    colorClass: "text-[#0047AB] dark:text-[#66B2FF]",
    bgClass: "bg-white dark:bg-slate-900",
    borderClass: "border-[#0047AB]/30 dark:border-[#66B2FF]/30",
    buttonClass: "",
    iconBgClass: "bg-[#DCEEFF] dark:bg-[#0047AB]/20",
    icon: <Star className="h-6 w-6 text-[#0047AB] dark:text-[#66B2FF]" />,
    features: [
      { text: "1 lượt phỏng vấn AI / tháng", included: true },
      { text: "2 bộ luyện tập / tháng", included: true },
      { text: "2 bộ quiz / tháng", included: true },
      { text: "Truy cập câu hỏi cơ bản", included: true },
      { text: "Hỗ trợ ưu tiên", included: false },
      { text: "Không giới hạn lượt dùng", included: false },
    ],
  },
  {
    id: "NEW",
    displayName: "INBLUE NEW",
    price: 4000,
    durationDays: 30,
    colorClass: "text-cyan-500 dark:text-cyan-400",
    bgClass: "bg-white dark:bg-slate-900",
    borderClass: "border-cyan-400/40 dark:border-cyan-500/40",
    buttonClass: "bg-cyan-500 hover:bg-cyan-600 text-white",
    iconBgClass: "bg-cyan-50 dark:bg-cyan-900/20",
    icon: <Zap className="h-6 w-6 text-cyan-500 dark:text-cyan-400" />,
    features: [
      { text: "5 lượt phỏng vấn AI / tháng", included: true },
      { text: "10 bộ luyện tập / tháng", included: true },
      { text: "10 bộ quiz / tháng", included: true },
      { text: "Truy cập câu hỏi đa dạng", included: true },
      { text: "Hỗ trợ ưu tiên", included: false },
      { text: "Không giới hạn lượt dùng", included: false },
    ],
  },
  {
    id: "BASIC",
    displayName: "INBLUE BASIC",
    price: 99000,
    durationDays: 30,
    colorClass: "text-violet-500 dark:text-violet-400",
    bgClass: "bg-white dark:bg-slate-900",
    borderClass: "border-violet-400/60 dark:border-violet-500/60",
    buttonClass: "bg-violet-600 hover:bg-violet-700 text-white",
    iconBgClass: "bg-violet-50 dark:bg-violet-900/20",
    icon: <Crown className="h-6 w-6 text-violet-500 dark:text-violet-400" />,
    badge: "PHỔ BIẾN",
    badgeClass: "bg-violet-500 text-white",
    features: [
      { text: "15 lượt phỏng vấn AI / tháng", included: true },
      { text: "30 bộ luyện tập / tháng", included: true },
      { text: "30 bộ quiz / tháng", included: true },
      { text: "Toàn bộ ngân hàng câu hỏi", included: true },
      { text: "Hỗ trợ ưu tiên", included: true },
      { text: "Không giới hạn lượt dùng", included: false },
    ],
  },
  {
    id: "PREMIUM",
    displayName: "INBLUE PREMIUM",
    price: 199000,
    durationDays: 30,
    colorClass: "text-pink-500 dark:text-pink-400",
    bgClass: "bg-white dark:bg-slate-900",
    borderClass: "border-pink-400/50 dark:border-pink-500/50",
    buttonClass:
      "bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white",
    iconBgClass: "bg-pink-50 dark:bg-pink-900/20",
    icon: <Diamond className="h-6 w-6 text-pink-500 dark:text-pink-400" />,
    features: [
      { text: "Không giới hạn phỏng vấn AI", included: true },
      { text: "Không giới hạn bộ luyện tập", included: true },
      { text: "Không giới hạn bộ quiz", included: true },
      { text: "Toàn bộ ngân hàng câu hỏi", included: true },
      { text: "Hỗ trợ ưu tiên 24/7", included: true },
      { text: "Trải nghiệm không giới hạn", included: true },
    ],
  },
];

const BANK_INFO = {
  owner: "NGUYỄN PHẠM THU HÀ",
  account: "Inbluebank",
  bank: "BIDV",
};

function buildTransferContent(planId: string, userId: string | number): string {
  return `INBLUE${planId}${userId}`;
}

function getRingClass(planId: string): string {
  if (planId === "NEW") return "ring-cyan-400";
  if (planId === "BASIC") return "ring-violet-500";
  if (planId === "PREMIUM") return "ring-pink-500";
  return "ring-[#0047AB]";
}

function PlanCard({
  plan,
  isSelected,
  isCurrent,
  onSelect,
}: {
  plan: MembershipPlan;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: (_id: string) => void;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 p-6 shadow-sm transition-all duration-200 ${plan.bgClass} ${plan.borderClass} ${
        isSelected
          ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ${getRingClass(plan.id)}`
          : ""
      }`}>
      {plan.badge && (
        <span
          className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 font-['Inter'] text-xs font-bold tracking-wide ${plan.badgeClass}`}>
          ✦ {plan.badge}
        </span>
      )}

      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${plan.iconBgClass}`}>
        {plan.icon}
      </div>

      <h3 className={`mb-3 font-['Inter'] text-base font-bold tracking-wide ${plan.colorClass}`}>
        {plan.displayName}
      </h3>

      <div
        className={`mb-1 rounded-lg px-3 py-2 text-center font-['Poppins'] text-lg font-bold ${plan.iconBgClass} ${plan.colorClass}`}>
        {plan.price === 0 ? "Miễn phí" : formatCurrency(plan.price)}
        {plan.price > 0 && (
          <span className="ml-1 font-['Inter'] text-sm font-normal">
            {" "}
            / {plan.durationDays} ngày
          </span>
        )}
      </div>
      {plan.price === 0 && (
        <p className={`mb-3 text-center font-['Inter'] text-xs opacity-70 ${plan.colorClass}`}>
          {plan.durationDays} ngày
        </p>
      )}

      <div className="mt-3 mb-4 border-t border-gray-100 dark:border-slate-700/50" />

      <ul className="mb-6 flex flex-col gap-2">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            {f.included ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-gray-300 dark:border-slate-600" />
            )}
            <span
              className={`font-['Inter'] text-sm ${
                f.included
                  ? "text-gray-700 dark:text-slate-300"
                  : "text-gray-400 line-through dark:text-slate-500"
              }`}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {isCurrent ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#DCEEFF] py-3 font-['Inter'] text-sm font-semibold text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]">
            <Check className="h-4 w-4" />
            Đang sử dụng
          </div>
        ) : (
          <button
            onClick={() => onSelect(plan.id)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-['Inter'] text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${plan.buttonClass}`}>
            <Sparkles className="h-4 w-4" />
            Nâng cấp ngay
          </button>
        )}
      </div>
    </div>
  );
}

export function MembershipTab() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [planIdByName, setPlanIdByName] = useState<Record<string, number>>({});
  const [currentPlanName, setCurrentPlanName] = useState<string>("FREE");
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [copied, setCopied] = useState<"account" | "content" | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [latestRecovery, setLatestRecovery] = useState<PaymentRecoveryContext | null>(null);
  const [supportLogs, setSupportLogs] = useState<PaymentSupportLog[]>([]);
  const [isCopyingSupportPayload, setIsCopyingSupportPayload] = useState(false);
  const paymentRef = useRef<HTMLDivElement>(null);

  const refreshRecoveryState = useCallback(() => {
    if (!user?.id) {
      setLatestRecovery(null);
      setSupportLogs([]);
      return;
    }

    const nextRecovery = getLatestRecoveryForUser(Number(user.id));
    setLatestRecovery(nextRecovery);
    setSupportLogs(
      nextRecovery?.supportCode ? getSupportLogsBySupportCode(nextRecovery.supportCode) : []
    );
  }, [user?.id]);

  useEffect(() => {
    if (user?.id == null) {
      return;
    }
    const userId = user.id;

    const loadSubscriptionData = async () => {
      setIsLoadingSubscription(true);
      try {
        const [plansResult, subscriptionResult] = await Promise.all([
          memberShipPlanManager.getAll(),
          userManager.getActiveSubscription(userId),
        ]);

        if (plansResult.success && plansResult.data) {
          const plans = Array.isArray(plansResult.data) ? plansResult.data : [];
          const nextPlanMap: Record<string, number> = {};

          for (const plan of plans) {
            if (plan.name && typeof plan.id === "number") {
              nextPlanMap[plan.name] = plan.id;
            }
          }

          setPlanIdByName(nextPlanMap);
        }

        if (subscriptionResult.success && subscriptionResult.data) {
          setSubscription(subscriptionResult.data);
          if (subscriptionResult.data.planName) {
            setCurrentPlanName(subscriptionResult.data.planName);
          }
        }
      } catch (error) {
        console.error("Failed to load subscription data:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    void loadSubscriptionData();
  }, [user?.id]);

  useEffect(() => {
    refreshRecoveryState();
  }, [refreshRecoveryState]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setTimeout(() => {
      paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleCopy = (text: string, field: "account" | "content") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleCopySupportPayload = async () => {
    if (isCopyingSupportPayload || !latestRecovery) {
      return;
    }

    setIsCopyingSupportPayload(true);
    try {
      const payload = buildSupportPayload({
        orderCode: latestRecovery.orderCode,
        supportCode: latestRecovery.supportCode,
        context: latestRecovery,
        extra: {
          scope: "membership-tab",
          logCount: supportLogs.length,
        },
      });

      await navigator.clipboard.writeText(formatSupportPayload(payload));
      toast.success("Đã sao chép payload hỗ trợ.");
    } catch {
      toast.error("Không thể sao chép payload hỗ trợ.");
    } finally {
      setIsCopyingSupportPayload(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan || !user?.id) {
      return;
    }

    const selectedPlanId = planIdByName[selectedPlan];
    if (!selectedPlanId) {
      toast.error("Không tìm thấy ID gói thành viên. Vui lòng tải lại trang.");
      return;
    }

    const selectedPlanInfo = MEMBERSHIP_PLANS.find((plan) => plan.id === selectedPlan);
    const paymentAmount = selectedPlanInfo?.price ?? 0;

    if (paymentAmount <= 0) {
      toast.info("Gói FREE không cần thanh toán. Vui lòng chọn gói trả phí.");
      return;
    }

    setIsConfirming(true);

    try {
      const paymentResult = await paymentManager.create(paymentAmount, Number(user.id), {
        planId: Number(selectedPlanId),
        planName: selectedPlan,
      });
      if (!paymentResult.success || !paymentResult.data) {
        addPaymentSupportLog({
          userId: Number(user.id),
          planId: Number(selectedPlanId),
          planName: selectedPlan,
          amount: paymentAmount,
          status: "CREATE_FAILED",
          message: "Tao link thanh toan that bai tai MembershipTab.",
          payload: {
            error: paymentResult.error || null,
          },
        });
        toast.error(paymentResult.error || "Không thể tạo link thanh toán.");
        return;
      }

      const redirectUrl = new URL(paymentResult.data, window.location.origin).toString();
      const orderCode = extractOrderCodeFromUrl(redirectUrl) || undefined;

      const createdRecovery = upsertPaymentRecoveryContext({
        orderCode,
        userId: Number(user.id),
        planId: Number(selectedPlanId),
        planName: selectedPlan,
        amount: paymentAmount,
        checkoutUrl: redirectUrl,
        status: "CREATED",
        note: "Da tao checkoutUrl tu payment API.",
      });

      addPaymentSupportLog({
        supportCode: createdRecovery.supportCode,
        orderCode,
        userId: createdRecovery.userId,
        planId: createdRecovery.planId,
        planName: createdRecovery.planName,
        amount: createdRecovery.amount,
        status: "CREATED",
        message: "Da tao checkoutUrl thanh cong.",
        payload: {
          checkoutUrl: redirectUrl,
        },
      });

      const redirectedRecovery = upsertPaymentRecoveryContext({
        supportCode: createdRecovery.supportCode,
        orderCode,
        userId: createdRecovery.userId,
        planId: createdRecovery.planId,
        planName: createdRecovery.planName,
        amount: createdRecovery.amount,
        checkoutUrl: redirectUrl,
        status: "REDIRECTED",
        note: "Da redirect sang trang thanh toan.",
      });

      addPaymentSupportLog({
        supportCode: redirectedRecovery.supportCode,
        orderCode,
        userId: redirectedRecovery.userId,
        planId: redirectedRecovery.planId,
        planName: redirectedRecovery.planName,
        amount: redirectedRecovery.amount,
        status: "REDIRECTED",
        message: "Frontend chuan bi redirect den checkoutUrl.",
      });

      if (!orderCode) {
        addPaymentSupportLog({
          supportCode: redirectedRecovery.supportCode,
          userId: redirectedRecovery.userId,
          planId: redirectedRecovery.planId,
          planName: redirectedRecovery.planName,
          amount: redirectedRecovery.amount,
          status: "UNMAPPED_ORDER",
          message: "Khong trich xuat duoc orderCode tu checkoutUrl, se can callback map fallback.",
          payload: {
            checkoutUrl: redirectUrl,
          },
        });
      }

      setLatestRecovery(redirectedRecovery);
      setSupportLogs(getSupportLogsBySupportCode(redirectedRecovery.supportCode));

      toast.success("Đã tạo link thanh toán. Đang chuyển hướng...");
      window.location.assign(redirectUrl);
    } catch {
      addPaymentSupportLog({
        userId: Number(user.id),
        planId: Number(selectedPlanId),
        planName: selectedPlan,
        amount: paymentAmount,
        status: "CREATE_FAILED",
        message: "Exception khi tao link thanh toan o MembershipTab.",
      });
      toast.error("Không thể tạo link thanh toán.");
    } finally {
      setIsConfirming(false);
      refreshRecoveryState();
    }
  };

  const userId = user?.id ?? "00000";
  const transferContent = selectedPlan
    ? buildTransferContent(selectedPlan, userId)
    : "— Chọn gói bên trên —";
  const selectedPlanInfo = MEMBERSHIP_PLANS.find((p) => p.id === selectedPlan);

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#0047AB] via-[#0066CC] to-[#007BFF] p-8 text-white">
        <div className="-8op -ririghg-8 absolute h-40 w-40 rounded-full bg-white/5" />
        <div className="-h-24 absolute right-16 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <div className="mb-2 flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Star className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Crown className="h-5 w-5 text-violet-300" />
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Diamond className="h-5 w-5 text-pink-300" />
            </div>
          </div>
          <h2 className="font-['Poppins'] text-3xl font-bold">Nâng cấp tài khoản</h2>
          <p className="font-['Inter'] text-base opacity-80">
            Chọn gói phù hợp • Nâng tầm trải nghiệm phỏng vấn
          </p>
        </div>
      </div>

      {isLoadingSubscription ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Đang tải thông tin gói thành viên...
        </div>
      ) : subscription ? (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gói hiện tại</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {subscription.planName || currentPlanName}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI Interview còn lại</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {subscription.aiInterviewRemaining ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Practice Set còn lại</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {subscription.practiceSetRemaining ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Quiz Set còn lại</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {subscription.quizSetRemaining ?? "-"}
            </p>
          </div>
        </div>
      ) : null}

      {latestRecovery && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-900/10">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="font-['Inter'] text-sm font-semibold text-blue-700 dark:text-blue-300">
              Trang thai giao dich gan nhat
            </p>
            <button
              onClick={handleCopySupportPayload}
              disabled={isCopyingSupportPayload}
              className="rounded-lg border border-blue-300 px-3 py-1.5 font-['Inter'] text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20">
              {isCopyingSupportPayload ? "Dang sao chep..." : "Sao chep payload ho tro"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 font-['Inter'] text-xs text-blue-700/90 md:grid-cols-2 dark:text-blue-300/90">
            <p>SupportCode: {latestRecovery.supportCode}</p>
            <p>OrderCode: {latestRecovery.orderCode || "Chua map"}</p>
            <p>
              Goi: {latestRecovery.planName || "-"} (planId: {latestRecovery.planId})
            </p>
            <p>Status: {latestRecovery.status}</p>
            <p>So tien: {formatCurrency(latestRecovery.amount)}</p>
            <p>Cap nhat: {new Date(latestRecovery.updatedAt).toLocaleString("vi-VN")}</p>
          </div>

          {(latestRecovery.status === "UNMAPPED_ORDER" ||
            latestRecovery.status === "SUBSCRIBE_FAILED") && (
            <p className="mt-3 font-['Inter'] text-xs text-rose-600 dark:text-rose-300">
              Giao dich hien tai chua hoan tat. He thong se chan kich hoat va khuyen nghi thanh toan
              lai.
            </p>
          )}

          {supportLogs.length > 0 && (
            <p className="mt-2 font-['Inter'] text-xs text-blue-600/90 dark:text-blue-300/80">
              Da ghi nhan {supportLogs.length} log ho tro trong 24h gan nhat.
            </p>
          )}
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {MEMBERSHIP_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            isCurrent={currentPlanName === plan.id}
            onSelect={handleSelectPlan}
          />
        ))}
      </div>

      {/* Payment Section */}
      <div ref={paymentRef} className="scroll-mt-6">
        <div
          className={`rounded-2xl border-2 bg-white p-6 transition-all duration-300 dark:bg-slate-900 ${
            selectedPlan
              ? "border-[#0047AB]/40 dark:border-[#66B2FF]/40"
              : "border-gray-200 dark:border-slate-700"
          }`}>
          {/* Title */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCEEFF] dark:bg-[#0047AB]/20">
              <BookOpen className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
            </div>
            <div>
              <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
                Thông tin thanh toán
              </h3>
              {selectedPlanInfo ? (
                <p className="font-['Inter'] text-sm text-gray-500 dark:text-slate-400">
                  Bạn đang chọn:{" "}
                  <span className={`font-semibold ${selectedPlanInfo.colorClass}`}>
                    {selectedPlanInfo.displayName}
                  </span>{" "}
                  —{" "}
                  <span className="font-semibold text-zinc-700 dark:text-slate-200">
                    {formatCurrency(selectedPlanInfo.price)}
                  </span>
                </p>
              ) : (
                <p className="font-['Inter'] text-sm text-gray-400 dark:text-slate-500">
                  Chọn gói bên trên để xem nội dung chuyển khoản
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left: Bank transfer info */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0047AB] text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-['Inter'] text-sm font-semibold text-zinc-800 dark:text-white">
                    Thông tin tài khoản
                  </p>
                  <p className="font-['Inter'] text-xs text-gray-500 dark:text-slate-400">
                    Chuyển khoản ngân hàng
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="ider mb-0.5 font-['Inter'] text-xs font-medium text-gray-400 uppercase dark:text-slate-500">
                    Chủ tài khoản
                  </p>
                  <p className="font-['Inter'] text-sm font-semibold text-cyan-500 dark:text-cyan-400">
                    {BANK_INFO.owner}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mediumwider mb-0.5 font-['Inter'] text-xs text-gray-400 uppercase dark:text-slate-500">
                      Số tài khoản
                    </p>
                    <p className="font-['Inter'] text-sm font-semibold text-cyan-500 dark:text-cyan-400">
                      {BANK_INFO.account}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(BANK_INFO.account, "account")}
                    className="flex items-center gap-1 rounded-lg bg-gray-200 px-2 py-1 font-['Inter'] text-xs text-gray-600 transition-colors hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">
                    <ClipboardCopy className="h-3 w-3" />
                    {copied === "account" ? "Đã sao chép!" : "Sao chép"}
                  </button>
                </div>

                <div>
                  <p className="ider mb-0.5 font-['Inter'] text-xs font-medium text-gray-400 uppercase dark:text-slate-500">
                    Ngân hàng
                  </p>
                  <p className="font-['Inter'] text-sm font-semibold text-zinc-800 dark:text-white">
                    {BANK_INFO.bank}
                  </p>
                </div>

                {/* Transfer content — amber highlight when plan is selected */}
                <div
                  className={`rounded-lg border-2 p-3 ${
                    selectedPlan
                      ? "border-amber-400/60 bg-amber-50 dark:bg-amber-900/10"
                      : "border-gray-200 bg-white dark:border-slate-600 dark:bg-slate-700"
                  }`}>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="ider font-['Inter'] text-xs font-medium text-gray-400 uppercase dark:text-slate-500">
                      Nội dung chuyển
                    </p>
                    {selectedPlan && (
                      <button
                        onClick={() => handleCopy(transferContent, "content")}
                        className="flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 font-['Inter'] text-xs text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                        <ClipboardCopy className="h-3 w-3" />
                        {copied === "content" ? "Đã sao chép!" : "Sao chép"}
                      </button>
                    )}
                  </div>
                  <p
                    className={`font-['Poppins'] text-base font-bold tracking-wide ${
                      selectedPlan
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-gray-400 dark:text-slate-500"
                    }`}>
                    {transferContent}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-['Inter'] text-xs text-emerald-600 dark:text-emerald-400">
                    Hệ thống đang hoạt động
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="flex-end font-['Inter'] text-2xl text-amber-500 dark:text-slate-300">
                    Tổng tiền:{" "}
                    {selectedPlanInfo
                      ? formatCurrency(selectedPlanInfo.price)
                      : "— Chọn gói bên trên —"}
                  </span>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={!selectedPlan || isConfirming}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0047AB] px-4 py-3 font-['Inter'] text-sm font-semibold text-white transition-all duration-150 hover:bg-[#003d99] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                  {isConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Dang tao link thanh toan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Thanh toan voi PayOS
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: QR placeholder */}
            <div className="flex flex-col items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center gap-2 self-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-['Inter'] text-sm font-semibold text-zinc-800 dark:text-white">
                    Quét mã QR
                  </p>
                  <p className="font-['Inter'] text-xs text-gray-500 dark:text-slate-400">
                    Nạp tiền tự động
                  </p>
                </div>
              </div>

              <div className="flex h-44 w-44 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700">
                <QrCode className="mb-2 h-10 w-10 text-gray-300 dark:text-slate-500" />
                <p className="px-3 text-center font-['Inter'] text-xs text-gray-400 dark:text-slate-500">
                  <img src={qr} alt="QR Code" />
                </p>
              </div>

              <div className="mt-4 flex gap-6">
                {["Mở app banking", "Quét mã QR", "Xác nhận"].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0047AB] font-['Inter'] text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    <span className="max-w-16 text-center font-['Inter'] text-xs text-gray-500 dark:text-slate-400">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom info rows */}
          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
              <Crown className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-['Inter'] text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Mua gói thành viên
                </p>
                <p className="font-['Inter'] text-xs text-amber-600 dark:text-amber-500">
                  Flow thanh toan: Tao link PayOS, thanh toan, quay lai trang xac nhan nang cap.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-900/10">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 font-['Inter'] text-xs font-bold text-blue-500">
                i
              </span>
              <div>
                <p className="mb-1 font-['Inter'] text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Lưu ý quan trọng
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="font-['Inter'] text-xs text-blue-600 dark:text-blue-400">
                    ✓ Nhập đúng nội dung chuyển
                  </span>
                  <span className="font-['Inter'] text-xs text-blue-600 dark:text-blue-400">
                    ⏱ Chờ 1–5 phút để xử lý
                  </span>
                  <span className="font-['Inter'] text-xs text-blue-600 dark:text-blue-400">
                    ⚠ Tránh chuyển lúc 23h59
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
