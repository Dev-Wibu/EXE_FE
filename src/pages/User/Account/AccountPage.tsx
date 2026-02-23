import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  Camera,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Upload,
  User,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CVUploadModal } from "@/components/ui/cv-upload-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAJOR_OPTIONS, getMajorLabel } from "@/constants/majors";
import {
  formatCurrency,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from "@/mocks/payment.mock";
import {
  mockUserSettings,
  mockWallet,
  type Transaction,
  type UserSettings,
  type Wallet,
} from "@/mocks/user.mock";
import { usersAdminManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

import { CandidateProfileTab } from "./CandidateProfileTab";

// Extended profile type based on schema-from-be User type
// Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  public_id?: string | null;
  university?: string;
  major?: string;
  cvUrl?: string | null;
  cv_public_id?: string | null;
  createdAt?: string;
}

export function AccountPage() {
  const { user: authUser, setUser } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [wallet] = useState<Wallet>(mockWallet);
  const [settings] = useState<UserSettings>(mockUserSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "wallet" | "settings" | "candidateProfile"
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
          major: formData.major,
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

  // Format date to Vietnamese format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "wallet":
        return renderWalletTab();
      case "settings":
        return renderSettingsTab();
      case "candidateProfile":
        return <CandidateProfileTab />;
      default:
        return renderProfileTab();
    }
  };

  const renderProfileTab = () => {
    if (!userProfile) return null;

    return (
      <div className="flex flex-col gap-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
          <div className="relative">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#DCEEFF] dark:bg-[#0047AB]/30">
              {avatarPreview || userProfile.avatar ? (
                <img
                  src={avatarPreview || userProfile.avatar || ""}
                  alt={userProfile.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-[#0047AB] dark:text-[#66B2FF]" />
              )}
            </div>
            {isEditing && (
              <>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute right-0 bottom-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#0047AB] text-white hover:bg-[#005B9A]">
                  <Camera className="h-5 w-5" />
                </label>
                {avatarPreview && (
                  <button
                    onClick={handleClearAvatar}
                    className="absolute bottom-0 left-0 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
          <div className="text-center">
            <h2 className="font-['Inter'] text-2xl font-bold text-zinc-800 dark:text-white">
              {userProfile.name}
            </h2>
            <p className="font-['Inter'] text-sm font-medium text-[#0047AB] dark:text-[#66B2FF]">
              {userProfile.email}
            </p>
            {userProfile.createdAt && (
              <p className="font-['Inter'] text-base font-normal text-gray-500 dark:text-slate-400">
                Thành viên từ {formatDate(userProfile.createdAt)}
              </p>
            )}
          </div>
        </div>

        {/* User Info Section */}
        <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
                Thông tin cá nhân
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshData}
                title="Làm mới dữ liệu">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                Chỉnh sửa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                  <X className="mr-1 h-4 w-4" />
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                  <Save className="mr-1 h-4 w-4" />
                  {isSaving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Full Name - Editable */}
            <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCEEFF] dark:bg-[#0047AB]/30">
                <User className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-gray-500 dark:text-slate-400">Họ và tên</Label>
                {isEditing ? (
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                    {userProfile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Email - LOCKED (read-only) */}
            <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 opacity-75 dark:bg-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-500 dark:text-slate-400">Email</Label>
                  <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-slate-700 dark:text-slate-400">
                    Không thể thay đổi
                  </span>
                </div>
                <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                  {userProfile.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Education & Career Section */}
        <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
          <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
            Học vấn & Mục tiêu nghề nghiệp
          </h3>

          <div className="flex flex-col gap-4">
            {/* University - Editable */}
            <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <GraduationCap className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-gray-500 dark:text-slate-400">Trường đại học</Label>
                {isEditing ? (
                  <Input
                    value={formData.university || ""}
                    onChange={(e) => handleInputChange("university", e.target.value)}
                    className="mt-1"
                    placeholder="VD: Đại học Bách Khoa Hà Nội"
                  />
                ) : (
                  <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                    {userProfile.university || "Chưa cập nhật"}
                  </p>
                )}
              </div>
            </div>

            {/* Major - Editable */}
            <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
                <BookOpen className="h-5 w-5 text-cyan-500" />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-gray-500 dark:text-slate-400">Chuyên ngành</Label>
                {isEditing ? (
                  <Select
                    value={formData.major || ""}
                    onValueChange={(value) => handleInputChange("major", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn chuyên ngành" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAJOR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                    {getMajorLabel(userProfile.major || "") || "Chưa cập nhật"}
                  </p>
                )}
              </div>
            </div>

            {/* CV Upload - Dedicated Modal (PDF only) */}
            <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-gray-500 dark:text-slate-400">CV / Resume</Label>
                <div className="mt-1 flex items-center gap-3">
                  {userProfile.cvUrl ? (
                    <a
                      href={userProfile.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 font-['Inter'] text-base font-medium text-green-600 hover:underline dark:text-green-400">
                      <ExternalLink className="h-4 w-4" />
                      Xem CV hiện tại
                    </a>
                  ) : (
                    <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                      Chưa có CV
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCvModalOpen(true)}
                    className="ml-auto">
                    <Upload className="mr-2 h-4 w-4" />
                    {userProfile.cvUrl ? "Cập nhật CV" : "Upload CV"}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Chỉ chấp nhận file PDF, tối đa 10MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
                  Đổi mật khẩu
                </h3>
                <p className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
                  Đổi mật khẩu để bảo mật tài khoản
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 font-['Inter'] text-base font-medium text-[#0047AB] hover:text-[#005B9A] dark:text-[#66B2FF] dark:hover:text-[#A5C8F2]">
              Thay đổi
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderWalletTab = () => (
    <div className="flex flex-col gap-6">
      {/* Wallet Balance Card */}
      <div className="rounded-2xl bg-linear-to-r from-[#0047AB] to-[#007BFF] p-8 text-white shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <WalletIcon className="h-8 w-8" />
          <span className="font-['Inter'] text-lg font-medium">Ví INBLUE</span>
        </div>
        <div className="mb-6">
          <p className="font-['Inter'] text-sm font-normal opacity-80">Số dư hiện tại</p>
          <p className="font-['Poppins'] text-4xl font-bold">{formatCurrency(wallet.balance)}</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-white/20 px-6 py-3 font-['Inter'] text-base font-medium backdrop-blur-sm hover:bg-white/30">
          <Plus className="h-5 w-5" />
          Nạp tiền
        </button>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
          Lịch sử giao dịch
        </h3>
        <div className="flex flex-col gap-4">
          {wallet.transactions.map((transaction: Transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    transaction.type === "deposit"
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : transaction.type === "refund"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-rose-100 dark:bg-rose-900/30"
                  }`}>
                  {transaction.type === "deposit" || transaction.type === "refund" ? (
                    <ArrowDownLeft
                      className={`h-5 w-5 ${
                        transaction.type === "deposit" ? "text-emerald-500" : "text-blue-500"
                      }`}
                    />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-rose-500" />
                  )}
                </div>
                <div>
                  <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
                      {formatDate(transaction.date)}
                    </span>
                    <span className="text-gray-300 dark:text-slate-600">•</span>
                    <span className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-['Inter'] text-lg font-semibold ${
                    transaction.amount > 0 ? "text-emerald-500" : "text-rose-500"
                  }`}>
                  {transaction.amount > 0 ? "+" : ""}
                  {new Intl.NumberFormat("vi-VN").format(transaction.amount)} đ
                </p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 font-['Inter'] text-xs font-medium ${
                    transaction.status === "completed"
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                      : transaction.status === "pending"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                        : "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
                  }`}>
                  {getTransactionStatusLabel(transaction.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="flex flex-col gap-6">
      {/* Language Settings */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
                Ngôn ngữ
              </h3>
              <p className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
                Chọn ngôn ngữ hiển thị
              </p>
            </div>
          </div>
          <select
            value={settings.language}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-['Inter'] text-base focus:border-[#0047AB] focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCEEFF] dark:bg-[#0047AB]/30">
            <Bell className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
          </div>
          <div>
            <h3 className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
              Thông báo
            </h3>
            <p className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
              Quản lý cài đặt thông báo
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {renderNotificationToggle(
            "Thông báo qua Email",
            "Nhận thông báo về buổi phỏng vấn qua email",
            settings.notifications.emailNotifications
          )}
          {renderNotificationToggle(
            "Thông báo qua SMS",
            "Nhận tin nhắn SMS nhắc nhở",
            settings.notifications.smsNotifications
          )}
          {renderNotificationToggle(
            "Thông báo đẩy",
            "Nhận thông báo đẩy trên trình duyệt",
            settings.notifications.pushNotifications
          )}
          {renderNotificationToggle(
            "Email marketing",
            "Nhận email về ưu đãi và tính năng mới",
            settings.notifications.marketingEmails
          )}
        </div>
      </div>
    </div>
  );

  const renderNotificationToggle = (title: string, description: string, enabled: boolean) => (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
      <div>
        <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
          {title}
        </p>
        <p className="font-['Inter'] text-sm font-normal text-gray-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <button
        className={`relative h-7 w-12 rounded-full transition-colors ${
          enabled ? "bg-[#0047AB]" : "bg-gray-300 dark:bg-slate-600"
        }`}>
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Banner */}
      <div className="flex h-56 items-center justify-between rounded-[30px] bg-[#DCEEFF] px-10 dark:bg-[#0047AB]/20">
        <div className="flex flex-col gap-4">
          <h1 className="font-['Open_Sans'] text-3xl leading-tight font-bold text-blue-800 dark:text-[#66B2FF]">
            Tài khoản của bạn
          </h1>
          <p className="font-['Open_Sans'] text-base font-normal text-gray-700 dark:text-slate-300">
            Quản lý thông tin cá nhân, ví tiền và cài đặt
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
          onClick={() => setActiveTab("settings")}
          className={`px-6 py-3 font-['Inter'] text-base font-medium transition-colors ${
            activeTab === "settings"
              ? "border-b-2 border-[#0047AB] text-[#0047AB] dark:border-[#66B2FF] dark:text-[#66B2FF]"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}>
          Cài đặt
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
