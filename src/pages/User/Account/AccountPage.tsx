import { Crown, FileText, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CVUploadModal } from "@/components/ui/cv-upload-modal";
import { normalizeMajor } from "@/constants/majors";
import type { Wallet } from "@/mocks/user.mock";
import { usersAdminManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

import { MembershipTab, ProfileTab, WalletTab } from "./AccountTabs";
import type { UserProfileData } from "./AccountTabs/types";
import { CandidateProfileTab } from "./CandidateProfile";

const DEFAULT_WALLET: Wallet = {
  balance: 0,
  currency: "VND",
  transactions: [],
};

export function AccountPage() {
  const { user: authUser, setUser } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [wallet, setWallet] = useState<Wallet>(DEFAULT_WALLET);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "wallet" | "candidateProfile" | "membership"
  >("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!authUser?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await usersAdminManager.getById(authUser.id);
      if (response.success && response.data) {
        const userData = response.data;
        setUserProfile({
          id: String(userData.id || authUser.id),
          name: userData.name || authUser.name || "",
          email: userData.email || authUser.email || "",
          avatar: userData.avatarUrl || null,
          public_id: userData.public_id || null,
          university: userData.university || "",
          major: userData.major || "",
          cvUrl: userData.cvUrl || null,
          cv_public_id: userData.cv_public_id || null,
          createdAt: new Date().toISOString(), // Backend doesn't provide createdAt
        });

        if (typeof userData.walletBalance === "number") {
          setWallet((prev) => ({ ...prev, balance: userData.walletBalance || 0 }));
        }
      } else {
        // Fallback to authUser data if API fails
        setUserProfile({
          id: String(authUser.id),
          name: authUser.name || "",
          email: authUser.email || "",
          avatar: authUser.avatarUrl || null,
          public_id: authUser.public_id || null,
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
      if (authUser) {
        setUserProfile({
          id: String(authUser.id),
          name: authUser.name || "",
          email: authUser.email || "",
          avatar: authUser.avatarUrl || null,
          public_id: authUser.public_id || null,
          university: "",
          major: "",
          cvUrl: null,
          cv_public_id: null,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  // Load user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleRefreshData = async () => {
    await fetchUserData();
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
        return <WalletTab wallet={wallet} />;
      case "candidateProfile":
        return <CandidateProfileTab />;
      case "membership":
        return <MembershipTab />;
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

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Banner */}
      <div className="flex h-56 items-center justify-between rounded-[30px] bg-[#DCEEFF] px-10 dark:bg-[#0047AB]/20">
        <div className="flex flex-col gap-4">
          <h1 className="font-['Open_Sans'] text-3xl leading-tight font-bold text-blue-800 dark:text-[#66B2FF]">
            Tài khoản của bạn
          </h1>
          <p className="font-['Open_Sans'] text-base font-normal text-gray-700 dark:text-slate-300">
            Quản lý thông tin cá nhân, ví tiền, hồ sơ ứng viên và gói thành viên
          </p>
        </div>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50">
          <User className="h-12 w-12 text-[#0047AB] dark:text-[#66B2FF]" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-['Inter'] text-base font-medium transition-colors ${
            activeTab === "profile"
              ? "border-b-2 border-[#0047AB] text-[#0047AB] dark:border-[#66B2FF] dark:text-[#66B2FF]"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}>
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`px-6 py-3 font-['Inter'] text-base font-medium transition-colors ${
            activeTab === "wallet"
              ? "border-b-2 border-[#0047AB] text-[#0047AB] dark:border-[#66B2FF] dark:text-[#66B2FF]"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}>
          Ví tiền
        </button>
        <button
          onClick={() => setActiveTab("candidateProfile")}
          className={`flex items-center gap-2 px-6 py-3 font-['Inter'] text-base font-medium transition-colors ${
            activeTab === "candidateProfile"
              ? "border-b-2 border-[#0047AB] text-[#0047AB] dark:border-[#66B2FF] dark:text-[#66B2FF]"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}>
          <FileText className="h-4 w-4" />
          Hồ sơ ứng viên
        </button>
        <button
          onClick={() => setActiveTab("membership")}
          className={`flex items-center gap-2 px-6 py-3 font-['Inter'] text-base font-medium transition-colors ${
            activeTab === "membership"
              ? "border-b-2 border-[#0047AB] text-[#0047AB] dark:border-[#66B2FF] dark:text-[#66B2FF]"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}>
          <Crown className="h-4 w-4" />
          Gói thành viên
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="font-['Inter'] text-base text-gray-500 dark:text-slate-400">Đang tải...</p>
        </div>
      ) : (
        renderTabContent()
      )}

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
