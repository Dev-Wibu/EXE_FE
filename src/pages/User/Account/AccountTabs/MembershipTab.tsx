import {
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Crown,
  Diamond,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PaymentMethodDialog } from "@/components/shared";
import { Spinner } from "@/components/ui/spinner";
import { useWalletBalanceReconciliation } from "@/hooks";
import type { UserSubscriptionResponse } from "@/interfaces";
import {
  addPaymentSupportLog,
  extractCheckoutTokenFromUrl,
  extractOrderCodeFromUrl,
  extractTransactionCodeFromUrl,
  upsertPaymentRecoveryContext,
} from "@/lib";
import { formatCurrency } from "@/lib/formatting";
import { memberShipPlanManager, transactionManager, userManager } from "@/services";
import type { MemberShipPlan } from "@/services/membership-plan.manager";
import { paymentManager } from "@/services/payment.manager";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

interface PlanFeature {
  text: string;
  included: boolean;
}

type PlanName = "FREE" | "NEW" | "BASIC" | "PREMIUM";

interface MembershipPlan {
  id: PlanName;
  backendId: number;
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

type PlanVisualConfig = Omit<MembershipPlan, "backendId" | "price" | "durationDays" | "features">;

const PLAN_DISPLAY_ORDER: PlanName[] = ["FREE", "NEW", "BASIC", "PREMIUM"];

const PLAN_VISUALS: Record<PlanName, PlanVisualConfig> = {
  FREE: {
    id: "FREE",
    displayName: "INBLUE FREE",
    colorClass: "text-[#0047AB] dark:text-[#66B2FF]",
    bgClass: "bg-white dark:bg-slate-900",
    borderClass: "border-[#0047AB]/30 dark:border-[#66B2FF]/30",
    buttonClass: "",
    iconBgClass: "bg-[#DCEEFF] dark:bg-[#0047AB]/20",
    icon: <Star className="h-6 w-6 text-[#0047AB] dark:text-[#66B2FF]" />,
  },
  NEW: {
    id: "NEW",
    displayName: "INBLUE NEW",
    colorClass: "text-cyan-500 dark:text-cyan-400",
    bgClass: "bg-white dark:bg-slate-900",
    borderClass: "border-cyan-400/40 dark:border-cyan-500/40",
    buttonClass: "bg-cyan-500 text-white hover:bg-cyan-600",
    iconBgClass: "bg-cyan-50 dark:bg-cyan-900/20",
    icon: <Zap className="h-6 w-6 text-cyan-500 dark:text-cyan-400" />,
  },
  BASIC: {
    id: "BASIC",
    displayName: "INBLUE BASIC",
    colorClass: "text-violet-500 dark:text-violet-400",
    bgClass: "bg-white dark:bg-slate-900",
    borderClass: "border-violet-400/60 dark:border-violet-500/60",
    buttonClass: "bg-violet-600 text-white hover:bg-violet-700",
    iconBgClass: "bg-violet-50 dark:bg-violet-900/20",
    icon: <Crown className="h-6 w-6 text-violet-500 dark:text-violet-400" />,
    badge: "PHỔ BIẾN",
    badgeClass: "bg-violet-500 text-white",
  },
  PREMIUM: {
    id: "PREMIUM",
    displayName: "INBLUE PREMIUM",
    colorClass: "text-pink-500 dark:text-pink-400",
    bgClass: "bg-white dark:bg-slate-900",
    borderClass: "border-pink-400/50 dark:border-pink-500/50",
    buttonClass:
      "bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white hover:from-pink-600 hover:to-fuchsia-700",
    iconBgClass: "bg-pink-50 dark:bg-pink-900/20",
    icon: <Diamond className="h-6 w-6 text-pink-500 dark:text-pink-400" />,
  },
};

const isPlanName = (value?: string): value is PlanName => {
  if (!value) {
    return false;
  }

  return PLAN_DISPLAY_ORDER.includes(value as PlanName);
};

const isUnlimitedValue = (value?: number): boolean => {
  if (typeof value !== "number") {
    return false;
  }

  return value < 0 || value >= 999;
};

const formatQuotaText = (value: number | undefined, label: string): string => {
  if (isUnlimitedValue(value)) {
    return `Không giới hạn ${label}`;
  }

  const safeValue = Math.max(value ?? 0, 0);
  return `${safeValue} ${label}`;
};

const formatDurationText = (durationDays: number | undefined): string => {
  const safeDays = Math.max(durationDays ?? 0, 0);
  if (safeDays >= 2147483647) {
    return "Không giới hạn thời hạn sử dụng";
  }

  return `Sử dụng trong ${safeDays} ngày`;
};

const buildPlanFeatures = (plan: MemberShipPlan): PlanFeature[] => {
  return [
    {
      text: formatQuotaText(plan.max_ai_interview, "lượt phỏng vấn AI"),
      included: true,
    },
    {
      text: formatQuotaText(plan.max_practice_sets, "bộ luyện tập"),
      included: true,
    },
    {
      text: formatQuotaText(plan.max_quiz_sets, "bộ quiz"),
      included: true,
    },
    {
      text: formatDurationText(plan.durationDays),
      included: true,
    },
    {
      text: "Ưu tiên hỗ trợ",
      included: plan.name === "BASIC" || plan.name === "PREMIUM",
    },
    {
      text: "Không giới hạn lượt sử dụng",
      included:
        isUnlimitedValue(plan.max_ai_interview) &&
        isUnlimitedValue(plan.max_practice_sets) &&
        isUnlimitedValue(plan.max_quiz_sets),
    },
  ];
};

const toMembershipPlan = (plan: MemberShipPlan): MembershipPlan | null => {
  if (!isPlanName(plan.name)) {
    return null;
  }

  const visual = PLAN_VISUALS[plan.name];
  return {
    ...visual,
    backendId: Number(plan.id || 0),
    price: Math.max(plan.price ?? 0, 0),
    durationDays: Math.max(plan.durationDays ?? 0, 0),
    features: buildPlanFeatures(plan),
  };
};

const BANK_INFO = {
  owner: "NGUYỄN PHẠM THU HÀ",
  account: "Inbluebank",
  bank: "BIDV",
};

function buildTransferContent(planId: string, userId: string | number): string {
  return `INBLUE${planId}${userId}`;
}

function getRingClass(planId: PlanName): string {
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
  onSelect: (_id: PlanName) => void;
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
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null);
  const [planIdByName, setPlanIdByName] = useState<Partial<Record<PlanName, number>>>({});
  const [currentPlanName, setCurrentPlanName] = useState<string>("FREE");
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanName | null>(null);
  const [copied, setCopied] = useState<"account" | "content" | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSyncingWalletBalance, setIsSyncingWalletBalance] = useState(false);
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const paymentRef = useRef<HTMLDivElement>(null);
  const walletPaymentInFlightRef = useRef(false);
  const payosPaymentInFlightRef = useRef(false);
  const { refreshWalletBalance } = useWalletBalanceReconciliation();

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
          const rawPlans = Array.isArray(plansResult.data) ? plansResult.data : [];
          const dbPlans = rawPlans
            .filter((plan): plan is MemberShipPlan => !!plan)
            .filter((plan) => isPlanName(plan.name))
            .map(toMembershipPlan)
            .filter((plan): plan is MembershipPlan => !!plan)
            .sort((a, b) => {
              if (a.price !== b.price) {
                return a.price - b.price;
              }

              return PLAN_DISPLAY_ORDER.indexOf(a.id) - PLAN_DISPLAY_ORDER.indexOf(b.id);
            });

          const nextPlanMap: Partial<Record<PlanName, number>> = {};
          for (const plan of dbPlans) {
            nextPlanMap[plan.id] = plan.backendId;
          }

          setMembershipPlans(dbPlans);
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

  const handleSelectPlan = (planId: PlanName) => {
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

  const resolvePaymentTarget = () => {
    if (!selectedPlan || !user?.id) {
      return null;
    }

    const selectedPlanId = planIdByName[selectedPlan];
    if (!selectedPlanId) {
      toast.error("Không tìm thấy ID gói thành viên. Vui lòng tải lại trang.");
      return null;
    }

    const selectedPlanInfo = membershipPlans.find((plan) => plan.id === selectedPlan);
    const paymentAmount = selectedPlanInfo?.price ?? 0;

    if (paymentAmount <= 0) {
      toast.info("Gói này không cần thanh toán. Vui lòng chọn gói trả phí.");
      return null;
    }

    return {
      userId: Number(user.id),
      selectedPlanId: Number(selectedPlanId),
      selectedPlanName: selectedPlan,
      paymentAmount,
    };
  };

  const handleOpenPaymentMethodDialog = async () => {
    if (!selectedPlan || isConfirming || isSyncingWalletBalance || isPaymentMethodDialogOpen) {
      return;
    }

    setIsSyncingWalletBalance(true);
    try {
      const walletRefresh = await refreshWalletBalance(Number(user?.id));
      if (walletRefresh.source === "unavailable") {
        toast.info("Chưa đồng bộ được số dư ví. Bạn vẫn có thể thanh toán qua PayOS.");
      }
    } catch (error) {
      console.warn("Không thể đồng bộ số dư ví trước khi mở phương thức thanh toán", error);
      toast.info("Không thể đồng bộ số dư ví. Bạn vẫn có thể thanh toán qua PayOS.");
    } finally {
      setIsSyncingWalletBalance(false);
    }

    setIsPaymentMethodDialogOpen(true);
  };

  const handlePayWithPayOS = async () => {
    const paymentTarget = resolvePaymentTarget();
    if (!paymentTarget) {
      return;
    }

    if (payosPaymentInFlightRef.current) {
      toast.info("Hệ thống đang tạo liên kết thanh toán. Vui lòng chờ trong giây lát.");
      return;
    }

    const { userId, selectedPlanId, selectedPlanName, paymentAmount } = paymentTarget;

    payosPaymentInFlightRef.current = true;
    setIsConfirming(true);

    try {
      const paymentResult = await paymentManager.create(paymentAmount, userId, {
        planId: selectedPlanId,
        planName: selectedPlanName,
      });
      if (!paymentResult.success || !paymentResult.data) {
        addPaymentSupportLog({
          userId,
          planId: selectedPlanId,
          planName: selectedPlanName,
          amount: paymentAmount,
          paymentPurpose: "BUY_MEMBERSHIP",
          status: "CREATE_FAILED",
          message: "Tạo link thanh toán thất bại tại MembershipTab.",
          payload: {
            error: paymentResult.error || null,
          },
        });
        toast.error(paymentResult.error || "Không thể tạo link thanh toán.");
        return;
      }

      const redirectUrl = new URL(paymentResult.data, window.location.origin).toString();
      const orderCode = extractOrderCodeFromUrl(redirectUrl) || undefined;
      const transactionCode = extractTransactionCodeFromUrl(redirectUrl) || undefined;
      const checkoutToken = extractCheckoutTokenFromUrl(redirectUrl) || undefined;

      const createdRecovery = upsertPaymentRecoveryContext({
        orderCode,
        transactionCode,
        checkoutToken,
        userId,
        planId: selectedPlanId,
        planName: selectedPlanName,
        amount: paymentAmount,
        paymentPurpose: "BUY_MEMBERSHIP",
        checkoutUrl: redirectUrl,
        status: "CREATED",
        note: "Đã tạo checkoutUrl từ payment API.",
      });

      addPaymentSupportLog({
        supportCode: createdRecovery.supportCode,
        orderCode,
        transactionCode,
        checkoutToken,
        userId: createdRecovery.userId,
        planId: createdRecovery.planId,
        planName: createdRecovery.planName,
        amount: createdRecovery.amount,
        paymentPurpose: "BUY_MEMBERSHIP",
        status: "CREATED",
        message: "Đã tạo checkoutUrl thành công.",
        payload: {
          checkoutUrl: redirectUrl,
          transactionCode: transactionCode || null,
        },
      });

      const redirectedRecovery = upsertPaymentRecoveryContext({
        supportCode: createdRecovery.supportCode,
        orderCode,
        transactionCode,
        checkoutToken,
        userId: createdRecovery.userId,
        planId: createdRecovery.planId,
        planName: createdRecovery.planName,
        amount: createdRecovery.amount,
        paymentPurpose: "BUY_MEMBERSHIP",
        checkoutUrl: redirectUrl,
        status: "REDIRECTED",
        note: "Đã redirect sang trang thanh toán.",
      });

      addPaymentSupportLog({
        supportCode: redirectedRecovery.supportCode,
        orderCode,
        transactionCode,
        checkoutToken,
        userId: redirectedRecovery.userId,
        planId: redirectedRecovery.planId,
        planName: redirectedRecovery.planName,
        amount: redirectedRecovery.amount,
        paymentPurpose: "BUY_MEMBERSHIP",
        status: "REDIRECTED",
        message: "Frontend chuẩn bị redirect đến checkoutUrl.",
        payload: {
          transactionCode: transactionCode || null,
        },
      });

      if (!transactionCode) {
        addPaymentSupportLog({
          supportCode: redirectedRecovery.supportCode,
          orderCode,
          checkoutToken,
          userId: redirectedRecovery.userId,
          planId: redirectedRecovery.planId,
          planName: redirectedRecovery.planName,
          amount: redirectedRecovery.amount,
          paymentPurpose: "BUY_MEMBERSHIP",
          status: "UNMAPPED_ORDER",
          message:
            "Checkout URL membership chưa có transactionCode, sẽ fallback orderCode có guard khi callback hủy.",
          payload: {
            orderCode: orderCode || null,
            checkoutToken: checkoutToken || null,
            recoveryStrategy: "orderCode-fallback-guarded",
          },
        });
      }

      if (!orderCode) {
        addPaymentSupportLog({
          supportCode: redirectedRecovery.supportCode,
          checkoutToken,
          userId: redirectedRecovery.userId,
          planId: redirectedRecovery.planId,
          planName: redirectedRecovery.planName,
          amount: redirectedRecovery.amount,
          paymentPurpose: "BUY_MEMBERSHIP",
          status: "UNMAPPED_ORDER",
          message: "Không trích xuất được orderCode từ checkoutUrl, sẽ cần callback map fallback.",
          payload: {
            checkoutUrl: redirectUrl,
            transactionCode: transactionCode || null,
          },
        });
      }

      toast.success("Đã tạo link thanh toán. Đang chuyển hướng...");
      window.location.assign(redirectUrl);
    } catch {
      addPaymentSupportLog({
        userId,
        planId: selectedPlanId,
        planName: selectedPlanName,
        amount: paymentAmount,
        paymentPurpose: "BUY_MEMBERSHIP",
        status: "CREATE_FAILED",
        message: "Exception khi tạo link thanh toán ở MembershipTab.",
      });
      toast.error("Không thể tạo link thanh toán.");
    } finally {
      payosPaymentInFlightRef.current = false;
      setIsConfirming(false);
    }
  };

  const handlePayWithWallet = async () => {
    const paymentTarget = resolvePaymentTarget();
    if (!paymentTarget) {
      return;
    }

    const { userId, selectedPlanId, selectedPlanName, paymentAmount } = paymentTarget;

    if (walletPaymentInFlightRef.current) {
      toast.info("Hệ thống đang xử lý giao dịch ví. Vui lòng chờ trong giây lát.");
      return;
    }

    walletPaymentInFlightRef.current = true;
    setIsConfirming(true);

    try {
      const walletRefresh = await refreshWalletBalance(userId);
      const freshWalletBalance = walletRefresh.walletBalance;

      if (typeof freshWalletBalance !== "number") {
        toast.error("Không thể đồng bộ số dư ví. Vui lòng thử lại hoặc chọn PayOS.");
        return;
      }

      if (freshWalletBalance < paymentAmount) {
        addPaymentSupportLog({
          userId,
          planId: selectedPlanId,
          planName: selectedPlanName,
          amount: paymentAmount,
          paymentPurpose: "BUY_MEMBERSHIP",
          status: "CREATE_FAILED",
          message: "Thanh toán ví cho gói membership thất bại do số dư không đủ.",
          payload: {
            walletBalance: freshWalletBalance,
          },
        });
        toast.error("Số dư ví không đủ. Vui lòng nạp thêm tiền hoặc chọn PayOS.");
        return;
      }

      addPaymentSupportLog({
        userId,
        planId: selectedPlanId,
        planName: selectedPlanName,
        amount: paymentAmount,
        paymentPurpose: "BUY_MEMBERSHIP",
        status: "CREATED",
        message: "Bắt đầu thanh toán bằng ví cho gói membership.",
      });

      const transferOutResult = await transactionManager.transferOut(
        paymentAmount,
        userId,
        "BUY_MEMBERSHIP"
      );

      if (!transferOutResult.success || !transferOutResult.data) {
        addPaymentSupportLog({
          userId,
          planId: selectedPlanId,
          planName: selectedPlanName,
          amount: paymentAmount,
          paymentPurpose: "BUY_MEMBERSHIP",
          status: "CREATE_FAILED",
          message: "Transfer-out thất bại khi thanh toán membership bằng ví.",
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
        const redirectUrl = new URL(transferData.redirectUrl, window.location.origin).toString();
        const orderCode = extractOrderCodeFromUrl(redirectUrl) || undefined;
        const transactionCode =
          transferData.transactionCode || extractTransactionCodeFromUrl(redirectUrl) || undefined;
        const checkoutToken = extractCheckoutTokenFromUrl(redirectUrl) || undefined;

        const createdRecovery = upsertPaymentRecoveryContext({
          orderCode,
          transactionCode,
          checkoutToken,
          userId,
          planId: selectedPlanId,
          planName: selectedPlanName,
          amount: paymentAmount,
          paymentPurpose: "BUY_MEMBERSHIP",
          checkoutUrl: redirectUrl,
          status: "CREATED",
          note: "Transfer-out tra ve checkoutUrl, fallback sang redirect flow.",
        });

        upsertPaymentRecoveryContext({
          supportCode: createdRecovery.supportCode,
          orderCode,
          transactionCode,
          checkoutToken,
          userId,
          planId: selectedPlanId,
          planName: selectedPlanName,
          amount: paymentAmount,
          paymentPurpose: "BUY_MEMBERSHIP",
          checkoutUrl: redirectUrl,
          status: "REDIRECTED",
          note: "Đã redirect sang checkoutUrl được trả về từ transfer-out.",
        });

        setIsPaymentMethodDialogOpen(false);
        toast.success("Đã tạo link thanh toán. Đang chuyển hướng...");
        window.location.assign(redirectUrl);
        return;
      }

      const transferRecovery = upsertPaymentRecoveryContext({
        transactionCode: transferData.transactionCode,
        userId,
        planId: selectedPlanId,
        planName: selectedPlanName,
        amount: paymentAmount,
        paymentPurpose: "BUY_MEMBERSHIP",
        status: "CALLBACK_SUCCESS",
        note: transferData.message || "Thanh toán bằng ví thành công.",
      });

      addPaymentSupportLog({
        supportCode: transferRecovery.supportCode,
        transactionCode: transferData.transactionCode,
        userId,
        planId: selectedPlanId,
        planName: selectedPlanName,
        amount: paymentAmount,
        paymentPurpose: "BUY_MEMBERSHIP",
        status: "CALLBACK_SUCCESS",
        message: transferData.message || "Thanh toán bằng ví thành công.",
        payload: {
          currentBalance: transferData.currentBalance,
          status: transferData.status,
        },
      });

      let subscribeResult: Awaited<ReturnType<typeof userManager.subscribePlan>> | null = null;
      let subscribeAttempt = 0;
      while (subscribeAttempt < 3) {
        subscribeAttempt += 1;
        subscribeResult = await userManager.subscribePlan(userId, selectedPlanId);
        if (subscribeResult.success) {
          break;
        }
      }

      if (!subscribeResult?.success) {
        upsertPaymentRecoveryContext({
          supportCode: transferRecovery.supportCode,
          transactionCode: transferRecovery.transactionCode,
          userId,
          planId: selectedPlanId,
          planName: selectedPlanName,
          amount: paymentAmount,
          paymentPurpose: "BUY_MEMBERSHIP",
          status: "SUBSCRIBE_FAILED",
          note: "Thanh toán ví thành công nhưng kích hoạt gói thất bại sau 3 lần retry.",
        });

        addPaymentSupportLog({
          supportCode: transferRecovery.supportCode,
          transactionCode: transferRecovery.transactionCode,
          userId,
          planId: selectedPlanId,
          planName: selectedPlanName,
          amount: paymentAmount,
          paymentPurpose: "BUY_MEMBERSHIP",
          status: "SUBSCRIBE_FAILED",
          message: "Đã trừ ví nhưng kích hoạt gói thất bại sau 3 lần retry.",
          payload: {
            retryCount: subscribeAttempt,
            error: subscribeResult?.error || null,
          },
        });

        setIsPaymentMethodDialogOpen(false);
        toast.error("Đã trừ ví nhưng kích hoạt gói chưa thành công. Vui lòng liên hệ hỗ trợ.");
        return;
      }

      upsertPaymentRecoveryContext({
        supportCode: transferRecovery.supportCode,
        transactionCode: transferRecovery.transactionCode,
        userId,
        planId: selectedPlanId,
        planName: selectedPlanName,
        amount: paymentAmount,
        paymentPurpose: "BUY_MEMBERSHIP",
        status: "SUBSCRIBE_SUCCESS",
        note: "Thanh toán ví và kích hoạt gói thành công.",
      });

      addPaymentSupportLog({
        supportCode: transferRecovery.supportCode,
        transactionCode: transferRecovery.transactionCode,
        userId,
        planId: selectedPlanId,
        planName: selectedPlanName,
        amount: paymentAmount,
        paymentPurpose: "BUY_MEMBERSHIP",
        status: "SUBSCRIBE_SUCCESS",
        message: "Thanh toán ví và kích hoạt gói thành công.",
        payload: {
          retryCount: subscribeAttempt,
        },
      });

      const latestSubscription = await userManager.getActiveSubscription(userId);
      if (latestSubscription.success && latestSubscription.data) {
        setSubscription(latestSubscription.data);
        if (latestSubscription.data.planName) {
          setCurrentPlanName(latestSubscription.data.planName);
        }
      }

      await refreshWalletBalance(userId);
      setIsPaymentMethodDialogOpen(false);
      toast.success("Thanh toán bằng ví thành công. Gói thành viên đã được kích hoạt.");
    } catch {
      toast.error("Không thể thanh toán bằng ví lúc này. Vui lòng thử lại.");
    } finally {
      walletPaymentInFlightRef.current = false;
      setIsConfirming(false);
    }
  };

  const handleConfirmPayment = async (method: "payos" | "wallet") => {
    if (method === "wallet") {
      await handlePayWithWallet();
      return;
    }

    setIsPaymentMethodDialogOpen(false);
    await handlePayWithPayOS();
  };

  const userId = user?.id ?? "00000";
  const transferContent = selectedPlan
    ? buildTransferContent(selectedPlan, userId)
    : "— Chọn gói bên trên —";
  const selectedPlanInfo = membershipPlans.find((p) => p.id === selectedPlan);

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#0047AB] via-[#0066CC] to-[#007BFF] p-8 text-white">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-white/10" />
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
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-center py-1">
            <Spinner size="md" />
            Đang tải thông tin gói thành viên...
          </div>
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

      {/* Plan Cards Grid */}
      {membershipPlans.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Hiện chưa có gói thành viên khả dụng.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {membershipPlans.map((plan) => (
            <PlanCard
              key={`${plan.id}-${plan.backendId}`}
              plan={plan}
              isSelected={selectedPlan === plan.id}
              isCurrent={currentPlanName === plan.id}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      )}

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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            {/* Left: Bank transfer info */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-800">
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
                  <p className="mb-0.5 font-['Inter'] text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-slate-500">
                    Chủ tài khoản
                  </p>
                  <p className="font-['Inter'] text-sm font-semibold text-cyan-500 dark:text-cyan-400">
                    {BANK_INFO.owner}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-0.5 font-['Inter'] text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-slate-500">
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
                  <p className="mb-0.5 font-['Inter'] text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-slate-500">
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
                    <p className="font-['Inter'] text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-slate-500">
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

                <div className="rounded-xl border border-[#0047AB]/15 bg-white p-3 dark:border-[#66B2FF]/20 dark:bg-slate-900">
                  <p className="font-['Inter'] text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                    Tổng tiền thanh toán
                  </p>
                  <p className="font-['Poppins'] text-2xl font-bold text-[#0047AB] dark:text-[#66B2FF]">
                    {selectedPlanInfo
                      ? formatCurrency(selectedPlanInfo.price)
                      : "— Chọn gói bên trên —"}
                  </p>
                </div>

                <button
                  onClick={handleOpenPaymentMethodDialog}
                  disabled={!selectedPlan || isConfirming || isSyncingWalletBalance}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0047AB] px-4 py-3 font-['Inter'] text-sm font-semibold text-white transition-all duration-150 hover:bg-[#003d99] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                  {isSyncingWalletBalance ? (
                    <>
                      <Spinner size="sm" tone="white" />
                      Đang đồng bộ số dư ví...
                    </>
                  ) : isConfirming ? (
                    <>
                      <Spinner size="sm" tone="white" />
                      Đang tạo liên kết thanh toán...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Thanh toán ngay
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Summary and guidance */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-[#0047AB]/15 bg-[#F6FAFF] p-5 dark:border-[#66B2FF]/20 dark:bg-slate-800/50">
                <p className="mb-3 font-['Inter'] text-sm font-semibold text-[#0047AB] dark:text-[#66B2FF]">
                  Tóm tắt đơn hàng
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
                      Gói đã chọn
                    </span>
                    <span className="font-['Inter'] text-sm font-semibold text-slate-800 dark:text-white">
                      {selectedPlanInfo?.displayName ?? "Chưa chọn"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
                      Thời hạn
                    </span>
                    <span className="font-['Inter'] text-sm font-semibold text-slate-800 dark:text-white">
                      {selectedPlanInfo ? `${selectedPlanInfo.durationDays} ngày` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
                      Thành tiền
                    </span>
                    <span className="font-['Poppins'] text-lg font-bold text-[#0047AB] dark:text-[#66B2FF]">
                      {selectedPlanInfo ? formatCurrency(selectedPlanInfo.price) : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800/30 dark:bg-blue-900/10">
                <p className="mb-3 font-['Inter'] text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Quy trình thanh toán nhanh
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="font-['Inter'] text-sm text-blue-700 dark:text-blue-300">
                      Chọn gói thành viên phù hợp bên trên.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="font-['Inter'] text-sm text-blue-700 dark:text-blue-300">
                      Chuyển khoản đúng số tài khoản và nội dung chuyển.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="font-['Inter'] text-sm text-blue-700 dark:text-blue-300">
                      Nhấn Thanh toán ngay để chuyển đến cổng thanh toán an toàn.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
                <Crown className="h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-['Inter'] text-sm font-semibold text-amber-700 dark:text-amber-400">
                    Mua gói thành viên
                  </p>
                  <p className="font-['Inter'] text-xs text-amber-600 dark:text-amber-500">
                    Sau khi thanh toán thành công, quyền lợi gói sẽ được cập nhật tự động.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="mb-2 font-['Inter'] text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Lưu ý quan trọng
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="font-['Inter'] text-xs text-slate-600 dark:text-slate-400">
                    ✓ Nhập đúng nội dung chuyển
                  </span>
                  <span className="font-['Inter'] text-xs text-slate-600 dark:text-slate-400">
                    ⏱ Chờ 1–5 phút để xử lý
                  </span>
                  <span className="font-['Inter'] text-xs text-slate-600 dark:text-slate-400">
                    ⚠ Tránh chuyển lúc 23h59
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentMethodDialog
        open={isPaymentMethodDialogOpen}
        onOpenChange={setIsPaymentMethodDialogOpen}
        title="Chọn phương thức thanh toán gói"
        description="Bạn có thể thanh toán qua PayOS hoặc thanh toán trực tiếp bằng số dư ví."
        amount={selectedPlanInfo?.price ?? 0}
        walletBalance={typeof user?.walletBalance === "number" ? user.walletBalance : undefined}
        isSubmitting={isConfirming}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
}
