import { FileText, History, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { CVUploadModal } from "@/components/ui/cv-upload-modal";
import { SpinnerBlock } from "@/components/ui/spinner";
import { normalizeMajor } from "@/constants/majors";
import type { TransactionEntity } from "@/interfaces";
import {
  addPaymentSupportLog,
  extractCheckoutTokenFromUrl,
  extractOrderCodeFromUrl,
  extractTransactionCodeFromUrl,
  reconcileWalletBalance,
  upsertPaymentRecoveryContext,
} from "@/lib";
import { formatDate } from "@/lib/formatting";
import { transactionManager, usersAdminManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

import { ProfileTab, TransactionHistoryTab, WalletTab } from "./AccountTabs";
import type { UserProfileData } from "./AccountTabs/types";
import { CandidateProfileTab } from "./CandidateProfile";
import { shouldHideTransactionFromHistory } from "./wallet-mapping";

type AccountSubTab = "profile" | "wallet" | "transactionHistory" | "candidateProfile";

const parseAccountSubTab = (value?: string | null): AccountSubTab | null => {
  if (
    value === "profile" ||
    value === "wallet" ||
    value === "transactionHistory" ||
    value === "candidateProfile"
  ) {
    return value as AccountSubTab;
  }

  return null;
};

const TOP_UP_MIN_AMOUNT = 10_000;
const TOP_UP_MAX_AMOUNT = 20_000_000;
const TOP_UP_STEP = 1_000;
const TOP_UP_PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

export function AccountPage() {
  const { user: authUser, setUser } = useAuthStore();
  const authUserId = authUser?.id;
  const [searchParams, setSearchParams] = useSearchParams();

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountSubTab>(
    parseAccountSubTab(searchParams.get("subtab")) || "profile"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>(String(TOP_UP_PRESET_AMOUNTS[1]));
  const topUpInFlightRef = useRef(false);
  const hasLoadedUserDataRef = useRef(false);

  // Form state for editing
  const [formData, setFormData] = useState<Partial<UserProfileData>>({});

  // File upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // CV Upload Modal state
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [isCvUploading, setIsCvUploading] = useState(false);

  // Fetch user data from backend
  const fetchUserData = useCallback(async () => {
    const currentAuthUser = useAuthStore.getState().user;

    if (!authUserId || !currentAuthUser) {
      setIsLoading(false);
      return;
    }

    if (!hasLoadedUserDataRef.current) {
      setIsLoading(true);
    }

    try {
      const response = await usersAdminManager.getById(authUserId);
      if (response.success && response.data) {
        const userData = response.data;
        setUserProfile({
          id: String(userData.id || authUserId),
          name: userData.name || currentAuthUser.name || "",
          email: userData.email || currentAuthUser.email || "",
          avatar: userData.avatarUrl || null,
          public_id: userData.public_id || null,
          university: userData.university || "",
          major: userData.major || "",
          cvUrl: userData.cvUrl || null,
          cv_public_id: userData.cv_public_id || null,
          createdAt: new Date().toISOString(), // Backend doesn't provide createdAt
        });

        const transactionResponse = await transactionManager.getByUserId(Number(authUserId));
        const walletResolution = reconcileWalletBalance({
          userDetailBalance: userData.walletBalance,
          transactions: transactionResponse.success ? transactionResponse.data : undefined,
          authStoreBalance: currentAuthUser.walletBalance,
        });

        if (walletResolution.hasMismatch) {
          console.warn("Wallet balance mismatch detected", {
            userId: Number(authUserId),
            userDetailBalance: walletResolution.userDetailBalance,
            transactionBalance: walletResolution.transactionBalance,
            authStoreBalance: walletResolution.authStoreBalance,
          });
        }

        const nextWalletBalance =
          typeof walletResolution.walletBalance === "number"
            ? walletResolution.walletBalance
            : typeof currentAuthUser.walletBalance === "number"
              ? currentAuthUser.walletBalance
              : 0;

        setWalletBalance(nextWalletBalance);

        if (currentAuthUser.walletBalance !== nextWalletBalance) {
          setUser({
            ...currentAuthUser,
            walletBalance: nextWalletBalance,
          });
        }
      } else {
        // Fallback to authUser data if API fails
        setUserProfile({
          id: String(authUserId),
          name: currentAuthUser.name || "",
          email: currentAuthUser.email || "",
          avatar: currentAuthUser.avatarUrl || null,
          public_id: currentAuthUser.public_id || null,
          university: "",
          major: "",
          cvUrl: null,
          cv_public_id: null,
          createdAt: new Date().toISOString(),
        });
        console.warn("Failed to fetch user data, using auth store data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to authUser data
      if (currentAuthUser) {
        setUserProfile({
          id: String(currentAuthUser.id),
          name: currentAuthUser.name || "",
          email: currentAuthUser.email || "",
          avatar: currentAuthUser.avatarUrl || null,
          public_id: currentAuthUser.public_id || null,
          university: "",
          major: "",
          cvUrl: null,
          cv_public_id: null,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsLoading(false);
      hasLoadedUserDataRef.current = true;
    }
  }, [authUserId, setUser]);

  const fetchUserTransactions = useCallback(async () => {
    if (!authUserId) {
      setTransactions([]);
      return;
    }

    setIsWalletLoading(true);
    try {
      const response = await transactionManager.getByUserId(Number(authUserId));
      if (response.success && response.data) {
        const visibleTransactions = response.data.filter(
          (transaction) => !shouldHideTransactionFromHistory(transaction)
        );

        const sortedTransactions = [...visibleTransactions].sort((a, b) => {
          return Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "");
        });

        setTransactions(sortedTransactions);
      }
    } catch {
      setTransactions([]);
    } finally {
      setIsWalletLoading(false);
    }
  }, [authUserId]);

  // Load user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    void fetchUserTransactions();
  }, [fetchUserTransactions]);

  useEffect(() => {
    const nextTab = parseAccountSubTab(searchParams.get("subtab")) || "profile";
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [searchParams]);

  const handleSwitchTab = useCallback(
    (nextTab: AccountSubTab) => {
      setActiveTab(nextTab);

      const nextParams = new URLSearchParams(searchParams);
      if (nextTab === "profile") {
        nextParams.delete("subtab");
      } else {
        nextParams.set("subtab", nextTab);
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleRefreshData = async () => {
    await Promise.all([fetchUserData(), fetchUserTransactions()]);
    toast.success("Đã cập nhật dữ liệu!");
  };

  // Start editing - populate form with current values
  const handleStartEdit = () => {
    if (!userProfile) return;
    setFormData({
      name: userProfile.name,
      university: userProfile.university,
      major: userProfile.major,
    });
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setFormData({});
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setAvatarFile(file);
    }
  };

  // Clear avatar selection
  const handleClearAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Handle CV upload via dedicated modal
  const handleCvUpload = async (file: File) => {
    if (!userProfile?.id) {
      toast.error("Không tìm thấy ID người dùng");
      return;
    }

    setIsCvUploading(true);
    try {
      const response = await usersAdminManager.uploadCv(userProfile.id, file);
      if (response.success) {
        // Refresh data to get updated CV URL
        await fetchUserData();
        toast.success("Upload CV thành công!");
      } else {
        toast.error(response.error || "Upload CV thất bại");
        throw new Error(response.error);
      }
    } catch {
      throw new Error("Upload CV thất bại");
    } finally {
      setIsCvUploading(false);
    }
  };

  // Save profile changes to backend
  const handleSaveProfile = async () => {
    if (!userProfile?.id) {
      toast.error("Không tìm thấy ID người dùng");
      return;
    }

    setIsSaving(true);
    try {
      // Call backend API to update user (with optional file uploads)
      // Include public_id and cv_public_id for proper Cloudinary file management
      // Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
      // Note: CV is now uploaded separately via CVUploadModal using /api/users/upload-cv endpoint
      const response = await usersAdminManager.update(
        userProfile.id,
        {
          name: formData.name,
          university: formData.university,
          major: normalizeMajor(formData.major),
          // Include Cloudinary public_id for proper file management (only when present)
          ...(userProfile.public_id ? { public_id: userProfile.public_id } : {}),
          ...(userProfile.cv_public_id ? { cv_public_id: userProfile.cv_public_id } : {}),
        },
        avatarFile || undefined,
        undefined // CV is uploaded separately
      );

      if (response.success) {
        // Refresh data from backend to get updated URLs
        await fetchUserData();

        // Update auth store with new data if needed
        if (response.data) {
          setUser({
            ...authUser,
            ...response.data,
          });
        }

        toast.success("Cập nhật thông tin thành công!");
        setIsEditing(false);
        setFormData({});
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        toast.error(response.error || "Cập nhật thất bại. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof UserProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTopUpAmountChange = (value: string) => {
    const normalized = value.replace(/[^\d]/g, "");
    setTopUpAmount(normalized);
  };

  const handleTopUpWallet = async (amount: number) => {
    if (!authUser?.id) {
      toast.error("Không tìm thấy tài khoản người dùng");
      return;
    }

    if (topUpInFlightRef.current) {
      return;
    }

    if (amount < TOP_UP_MIN_AMOUNT || amount > TOP_UP_MAX_AMOUNT || amount % TOP_UP_STEP !== 0) {
      toast.error(
        `Số tiền nạp phải từ ${TOP_UP_MIN_AMOUNT.toLocaleString("vi-VN")} đến ${TOP_UP_MAX_AMOUNT.toLocaleString("vi-VN")} và chia hết cho ${TOP_UP_STEP.toLocaleString("vi-VN")}.`
      );
      return;
    }

    topUpInFlightRef.current = true;
    setIsTopUpLoading(true);
    try {
      const response = await transactionManager.transferIn(amount, Number(authUser.id));
      if (!response.success || !response.data) {
        addPaymentSupportLog({
          userId: Number(authUser.id),
          amount,
          paymentPurpose: "TOP_UP_WALLET",
          status: "CREATE_FAILED",
          message: "Tạo link nạp tiền ví thất bại.",
          payload: {
            error: response.error || null,
          },
        });
        toast.error(response.error || "Không thể tạo link nạp tiền.");
        return;
      }

      const redirectUrl = new URL(response.data, window.location.origin).toString();
      const orderCode = extractOrderCodeFromUrl(redirectUrl) || undefined;
      const transactionCode = extractTransactionCodeFromUrl(redirectUrl) || undefined;
      const checkoutToken = extractCheckoutTokenFromUrl(redirectUrl) || undefined;

      const createdRecovery = upsertPaymentRecoveryContext({
        orderCode,
        transactionCode,
        checkoutToken,
        userId: Number(authUser.id),
        amount,
        paymentPurpose: "TOP_UP_WALLET",
        checkoutUrl: redirectUrl,
        status: "CREATED",
        note: "Đã tạo checkoutUrl nạp tiền ví.",
      });

      addPaymentSupportLog({
        supportCode: createdRecovery.supportCode,
        orderCode,
        transactionCode,
        checkoutToken,
        userId: createdRecovery.userId,
        amount: createdRecovery.amount,
        paymentPurpose: "TOP_UP_WALLET",
        status: "CREATED",
        message: "Đã tạo checkoutUrl nạp tiền ví thành công.",
        payload: {
          checkoutUrl: redirectUrl,
        },
      });

      const redirectedRecovery = upsertPaymentRecoveryContext({
        supportCode: createdRecovery.supportCode,
        orderCode,
        transactionCode,
        checkoutToken,
        userId: createdRecovery.userId,
        amount: createdRecovery.amount,
        paymentPurpose: "TOP_UP_WALLET",
        checkoutUrl: redirectUrl,
        status: "REDIRECTED",
        note: "Đã redirect sang trang thanh toán nạp tiền ví.",
      });

      if (!transactionCode) {
        addPaymentSupportLog({
          supportCode: redirectedRecovery.supportCode,
          orderCode,
          checkoutToken,
          userId: redirectedRecovery.userId,
          amount: redirectedRecovery.amount,
          paymentPurpose: "TOP_UP_WALLET",
          status: "UNMAPPED_ORDER",
          message:
            "Checkout URL nạp ví chưa có transactionCode, sẽ fallback orderCode có guard khi callback hủy.",
          payload: {
            orderCode: orderCode || null,
            checkoutToken: checkoutToken || null,
            recoveryStrategy: "orderCode-fallback-guarded",
          },
        });
      }

      toast.success("Đã tạo link nạp tiền. Đang chuyển hướng...");
      window.location.assign(redirectUrl);
    } catch (error) {
      addPaymentSupportLog({
        userId: Number(authUser.id),
        amount,
        paymentPurpose: "TOP_UP_WALLET",
        status: "CREATE_FAILED",
        message: "Exception khi tạo link nạp tiền ví.",
        payload: {
          error: error instanceof Error ? error.message : "unknown",
        },
      });
      toast.error("Không thể tạo link nạp tiền.");
    } finally {
      topUpInFlightRef.current = false;
      setIsTopUpLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return userProfile ? (
          <ProfileTab
            userProfile={userProfile}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            avatarPreview={avatarPreview}
            onRefreshData={handleRefreshData}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveProfile={handleSaveProfile}
            onInputChange={handleInputChange}
            onAvatarChange={handleAvatarChange}
            onClearAvatar={handleClearAvatar}
            onOpenCvModal={() => setIsCvModalOpen(true)}
          />
        ) : null;
      case "wallet":
        return (
          <WalletTab
            balance={walletBalance}
            isTopUpLoading={isTopUpLoading}
            topUpAmount={topUpAmount}
            minTopUp={TOP_UP_MIN_AMOUNT}
            maxTopUp={TOP_UP_MAX_AMOUNT}
            step={TOP_UP_STEP}
            presetAmounts={TOP_UP_PRESET_AMOUNTS}
            onTopUpAmountChange={handleTopUpAmountChange}
            onTopUp={handleTopUpWallet}
          />
        );
      case "transactionHistory":
        return <TransactionHistoryTab transactions={transactions} isLoading={isWalletLoading} />;
      case "candidateProfile":
        return <CandidateProfileTab />;
      default:
        return userProfile ? (
          <ProfileTab
            userProfile={userProfile}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            avatarPreview={avatarPreview}
            onRefreshData={handleRefreshData}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveProfile={handleSaveProfile}
            onInputChange={handleInputChange}
            onAvatarChange={handleAvatarChange}
            onClearAvatar={handleClearAvatar}
            onOpenCvModal={() => setIsCvModalOpen(true)}
          />
        ) : null;
    }
  };

  const tabItems: Array<{
    id: AccountSubTab;
    label: string;
    description: string;
    icon: React.ElementType;
  }> = [
    {
      id: "profile",
      label: "Thông tin cá nhân",
      description: "Cập nhật hồ sơ, học vấn và CV",
      icon: User,
    },
    {
      id: "transactionHistory",
      label: "Lịch sử giao dịch",
      description: "Xem các khoản thanh toán gần đây",
      icon: History,
    },
    {
      id: "candidateProfile",
      label: "Hồ sơ ứng viên",
      description: "Quản lý hồ sơ tuyển dụng cá nhân",
      icon: FileText,
    },
  ];

  const summaryAvatar = avatarPreview || userProfile?.avatar || authUser?.avatarUrl || null;
  const summaryName = userProfile?.name || authUser?.name || "Tài khoản";
  const summaryEmail = userProfile?.email || authUser?.email || "—";
  const summaryJoinedAt = userProfile?.createdAt ? formatDate(userProfile.createdAt) : "—";

  return (
    <div className="px-2 pt-6 pb-10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0px_6px_20px_0px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#DCEEFF] dark:bg-[#0047AB]/30">
                    {summaryAvatar ? (
                      <img
                        src={summaryAvatar}
                        alt={summaryName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-[#0047AB] dark:text-[#66B2FF]" />
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="font-['Inter'] text-xl font-semibold text-slate-900 dark:text-white">
                    {summaryName}
                  </h2>
                  <p className="font-['Inter'] text-sm text-slate-500 dark:text-slate-400">
                    {summaryEmail}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Ngày tham gia: {summaryJoinedAt}
                  </p>
                </div>
              </div>

              <div className="my-4 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0px_6px_20px_0px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Danh mục
              </p>
              <div className="mt-3 flex flex-col gap-1">
                {tabItems.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSwitchTab(tab.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                        isActive
                          ? "border-[#0047AB]/40 bg-[#DCEEFF]/60 text-[#0047AB] shadow-sm dark:border-[#66B2FF]/40 dark:bg-[#0047AB]/20 dark:text-[#66B2FF]"
                          : "border-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-white text-[#0047AB] dark:bg-slate-900 dark:text-[#66B2FF]"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                        <TabIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm leading-tight font-semibold">{tab.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <SpinnerBlock size="lg" />
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>

      {/* CV Upload Modal */}
      <CVUploadModal
        isOpen={isCvModalOpen}
        onOpenChange={setIsCvModalOpen}
        currentCvUrl={userProfile?.cvUrl}
        onUpload={handleCvUpload}
        isUploading={isCvUploading}
        title="Upload CV"
        description="Tải lên CV của bạn để mentor có thể xem trước khi phỏng vấn. Chỉ chấp nhận file PDF."
      />
    </div>
  );
}
