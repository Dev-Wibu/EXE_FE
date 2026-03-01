import {
  BookOpen,
  Camera,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  Lock,
  Mail,
  RefreshCw,
  Save,
  Upload,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { formatDate } from "@/lib/formatting";

import type { UserProfileData } from "./types";

interface ProfileTabProps {
  userProfile: UserProfileData;
  isEditing: boolean;
  isSaving: boolean;
  formData: Partial<UserProfileData>;
  avatarPreview: string | null;
  onRefreshData: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveProfile: () => void;
  onInputChange: (field: keyof UserProfileData, value: string) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAvatar: () => void;
  onOpenCvModal: () => void;
}

export function ProfileTab({
  userProfile,
  isEditing,
  isSaving,
  formData,
  avatarPreview,
  onRefreshData,
  onStartEdit,
  onCancelEdit,
  onSaveProfile,
  onInputChange,
  onAvatarChange,
  onClearAvatar,
  onOpenCvModal,
}: ProfileTabProps) {
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
                onChange={onAvatarChange}
                className="hidden"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute right-0 bottom-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#0047AB] text-white hover:bg-[#005B9A]">
                <Camera className="h-5 w-5" />
              </label>
              {avatarPreview && (
                <button
                  onClick={onClearAvatar}
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
            <Button variant="ghost" size="icon" onClick={onRefreshData} title="Làm mới dữ liệu">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={onStartEdit}>
              Chỉnh sửa
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={isSaving}>
                <X className="mr-1 h-4 w-4" />
                Hủy
              </Button>
              <Button size="sm" onClick={onSaveProfile} disabled={isSaving}>
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
                  onChange={(e) => onInputChange("name", e.target.value)}
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
                  onChange={(e) => onInputChange("university", e.target.value)}
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
                  onValueChange={(value) => onInputChange("major", value)}>
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
                <Button variant="outline" size="sm" onClick={onOpenCvModal} className="ml-auto">
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
}
