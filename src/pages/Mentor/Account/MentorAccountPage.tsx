import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  ChevronRight,
  ExternalLink,
  FileText,
  Hash,
  Linkedin,
  Lock,
  Mail,
  RefreshCw,
  Save,
  Star,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mentorManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

// Mentor profile type based on schema-from-be Mentor type
interface MentorProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  public_id?: string | null;
  bio?: string;
  expertise?: string;
  yearsOfExperience?: number;
  linkedInUrl?: string;
  currentCompany?: string;
  rate?: number;
  identityImg?: string | null;
  public_id_identity?: string | null;
  degreeImg?: string | null;
  public_id_degree?: string | null;
  otherFile?: string | null;
  public_id_other?: string | null;
  totalSession?: number;
  active?: boolean;
  createdAt?: string;
}

export function MentorAccountPage() {
  const { user: authUser, setUser } = useAuthStore();
  const [mentorProfile, setMentorProfile] = useState<MentorProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state for editing
  const [formData, setFormData] = useState<Partial<MentorProfileData>>({});

  // File upload state
  const [_avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch mentor data from backend
  const fetchMentorData = useCallback(async () => {
    if (!authUser?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await mentorManager.getById(authUser.id);
      if (response.success && response.data) {
        const mentorData = response.data;
        setMentorProfile({
          id: String(mentorData.id || authUser.id),
          name: mentorData.name || authUser.name || "",
          email: mentorData.email || authUser.email || "",
          avatar: mentorData.avatarUrl || null,
          public_id: mentorData.public_id || null,
          bio: mentorData.bio || "",
          expertise: mentorData.expertise || "",
          yearsOfExperience: mentorData.yearsOfExperience || 0,
          linkedInUrl: mentorData.linkedInUrl || "",
          currentCompany: mentorData.currentCompany || "",
          rate: mentorData.rate || 0,
          identityImg: mentorData.identityImg || null,
          public_id_identity: mentorData.public_id_identity || null,
          degreeImg: mentorData.degreeImg || null,
          public_id_degree: mentorData.public_id_degree || null,
          otherFile: mentorData.otherFile || null,
          public_id_other: mentorData.public_id_other || null,
          totalSession: mentorData.totalSession || 0,
          active: mentorData.active !== false,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Fallback to authUser data if API fails
        setMentorProfile({
          id: String(authUser.id),
          name: authUser.name || "",
          email: authUser.email || "",
          avatar: authUser.avatarUrl || null,
          public_id: authUser.public_id || null,
          bio: "",
          expertise: "",
          yearsOfExperience: 0,
          linkedInUrl: "",
          currentCompany: "",
          rate: 0,
          totalSession: 0,
          active: true,
          createdAt: new Date().toISOString(),
        });
        console.warn("Failed to fetch mentor data, using auth store data");
      }
    } catch (error) {
      console.error("Error fetching mentor data:", error);
      // Fallback to authUser data
      if (authUser) {
        setMentorProfile({
          id: String(authUser.id),
          name: authUser.name || "",
          email: authUser.email || "",
          avatar: authUser.avatarUrl || null,
          public_id: authUser.public_id || null,
          bio: "",
          expertise: "",
          yearsOfExperience: 0,
          linkedInUrl: "",
          currentCompany: "",
          rate: 0,
          totalSession: 0,
          active: true,
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  // Load mentor data on mount
  useEffect(() => {
    fetchMentorData();
  }, [fetchMentorData]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleRefreshData = async () => {
    await fetchMentorData();
    toast.success("Đã cập nhật dữ liệu!");
  };

  // Start editing - populate form with current values
  const handleStartEdit = () => {
    if (!mentorProfile) return;
    setFormData({
      name: mentorProfile.name,
      bio: mentorProfile.bio,
      expertise: mentorProfile.expertise,
      yearsOfExperience: mentorProfile.yearsOfExperience,
      linkedInUrl: mentorProfile.linkedInUrl,
      currentCompany: mentorProfile.currentCompany,
      rate: mentorProfile.rate,
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

  // Save profile changes to backend
  const handleSaveProfile = async () => {
    if (!mentorProfile?.id) {
      toast.error("Không tìm thấy ID mentor");
      return;
    }

    setIsSaving(true);
    try {
      // Call backend API to update mentor
      // Note: Mentor update API uses JSON body, not multipart/form-data
      // Avatar upload is only available during mentor creation
      // To update avatar, need to contact admin or use manager page
      const response = await mentorManager.update(mentorProfile.id, {
        name: formData.name,
        bio: formData.bio,
        expertise: formData.expertise,
        yearsOfExperience: formData.yearsOfExperience,
        linkedInUrl: formData.linkedInUrl,
        currentCompany: formData.currentCompany,
        rate: formData.rate,
        // Include public_id for Cloudinary file management (if present)
        ...(mentorProfile.public_id ? { public_id: mentorProfile.public_id } : {}),
      });

      if (response.success) {
        // Refresh data from backend to get updated URLs
        await fetchMentorData();

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
  const handleInputChange = (field: keyof MentorProfileData, value: string | number) => {
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

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="font-['Inter'] text-base text-gray-500 dark:text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (!mentorProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="font-['Inter'] text-base text-gray-500 dark:text-slate-400">
          Không tìm thấy thông tin mentor
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Banner */}
      <div className="flex h-56 items-center justify-between rounded-[30px] bg-gradient-to-r from-emerald-100 to-teal-100 px-10 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="flex flex-col gap-4">
          <h1 className="font-['Open_Sans'] text-3xl leading-tight font-bold text-emerald-800 dark:text-emerald-400">
            Tài khoản Mentor
          </h1>
          <p className="font-['Open_Sans'] text-base font-normal text-gray-700 dark:text-slate-300">
            Quản lý thông tin cá nhân và hồ sơ mentor của bạn
          </p>
        </div>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50">
          <Award className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            {avatarPreview || mentorProfile.avatar ? (
              <img
                src={avatarPreview || mentorProfile.avatar || ""}
                alt={mentorProfile.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
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
                className="absolute right-0 bottom-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
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
            {mentorProfile.name}
          </h2>
          <p className="font-['Inter'] text-sm font-medium text-emerald-600 dark:text-emerald-400">
            ID: {mentorProfile.id}
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
              <Star className="h-4 w-4 text-yellow-500" />
              {mentorProfile.totalSession || 0} phiên
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                mentorProfile.active
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
              }`}>
              {mentorProfile.active ? "Đang hoạt động" : "Không hoạt động"}
            </span>
          </div>
          {mentorProfile.createdAt && (
            <p className="mt-1 font-['Inter'] text-base font-normal text-gray-500 dark:text-slate-400">
              Mentor từ {formatDate(mentorProfile.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* Mentor Info Section */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
              Thông tin cá nhân
            </h3>
            <Button variant="ghost" size="icon" onClick={handleRefreshData} title="Làm mới dữ liệu">
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
          {/* User ID - LOCKED (read-only) */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 opacity-75 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
              <Hash className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-500 dark:text-slate-400">ID Mentor</Label>
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-slate-700 dark:text-slate-400">
                  Hệ thống
                </span>
              </div>
              <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                {mentorProfile.id}
              </p>
            </div>
          </div>

          {/* Full Name - Editable */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
                  {mentorProfile.name}
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
                {mentorProfile.email}
              </p>
            </div>
          </div>

          {/* Bio - Editable */}
          <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">
                Giới thiệu bản thân
              </Label>
              {isEditing ? (
                <Textarea
                  value={formData.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  className="mt-1"
                  placeholder="Viết vài dòng giới thiệu về bản thân..."
                  rows={3}
                />
              ) : (
                <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                  {mentorProfile.bio || "Chưa cập nhật"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Info Section */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
          Thông tin nghề nghiệp
        </h3>

        <div className="flex flex-col gap-4">
          {/* Expertise - Editable */}
          <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <Briefcase className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">Chuyên môn</Label>
              {isEditing ? (
                <Textarea
                  value={formData.expertise || ""}
                  onChange={(e) => handleInputChange("expertise", e.target.value)}
                  className="mt-1"
                  placeholder="VD: React, Node.js, AWS, System Design..."
                  rows={2}
                />
              ) : (
                <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                  {mentorProfile.expertise || "Chưa cập nhật"}
                </p>
              )}
            </div>
          </div>

          {/* Years of Experience - Editable */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <Award className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">
                Số năm kinh nghiệm
              </Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange("yearsOfExperience", value === "" ? 0 : parseInt(value));
                  }}
                  className="mt-1"
                  placeholder="0"
                />
              ) : (
                <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                  {mentorProfile.yearsOfExperience || 0} năm
                </p>
              )}
            </div>
          </div>

          {/* Current Company - Editable */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
              <Building2 className="h-5 w-5 text-cyan-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">Công ty hiện tại</Label>
              {isEditing ? (
                <Input
                  value={formData.currentCompany || ""}
                  onChange={(e) => handleInputChange("currentCompany", e.target.value)}
                  className="mt-1"
                  placeholder="VD: Google, Microsoft, FPT..."
                />
              ) : (
                <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                  {mentorProfile.currentCompany || "Chưa cập nhật"}
                </p>
              )}
            </div>
          </div>

          {/* LinkedIn URL - Editable */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Linkedin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">LinkedIn URL</Label>
              {isEditing ? (
                <Input
                  value={formData.linkedInUrl || ""}
                  onChange={(e) => handleInputChange("linkedInUrl", e.target.value)}
                  className="mt-1"
                  placeholder="https://linkedin.com/in/..."
                />
              ) : mentorProfile.linkedInUrl ? (
                <a
                  href={mentorProfile.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-['Inter'] text-base font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Xem LinkedIn
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                  Chưa cập nhật
                </p>
              )}
            </div>
          </div>

          {/* Rate - Editable */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Star className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">
                Giá mỗi phiên (VND)
              </Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  value={formData.rate ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange("rate", value === "" ? 0 : parseInt(value));
                  }}
                  className="mt-1"
                  placeholder="500000"
                />
              ) : (
                <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                  {formatCurrency(mentorProfile.rate || 0)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section - View Only */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:shadow-slate-900/50">
        <h3 className="mb-4 font-['Inter'] text-xl font-semibold text-zinc-800 dark:text-white">
          Giấy tờ đã nộp
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Identity Document */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
              <FileText className="h-5 w-5 text-rose-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">CCCD/CMND</Label>
              {mentorProfile.identityImg ? (
                <a
                  href={mentorProfile.identityImg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-['Inter'] text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Xem file
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="font-['Inter'] text-sm font-medium text-gray-400">Chưa có</p>
              )}
            </div>
          </div>

          {/* Degree Document */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">
                Bằng cấp/Chứng chỉ
              </Label>
              {mentorProfile.degreeImg ? (
                <a
                  href={mentorProfile.degreeImg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-['Inter'] text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Xem file
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="font-['Inter'] text-sm font-medium text-gray-400">Chưa có</p>
              )}
            </div>
          </div>

          {/* Other File */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <FileText className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">Tài liệu khác</Label>
              {mentorProfile.otherFile ? (
                <a
                  href={mentorProfile.otherFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-['Inter'] text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                  Xem file
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="font-['Inter'] text-sm font-medium text-gray-400">Chưa có</p>
              )}
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
          <button className="flex items-center gap-2 font-['Inter'] text-base font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
            Thay đổi
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
