import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  ExternalLink,
  Hash,
  Linkedin,
  Mail,
  RefreshCw,
  Save,
  Star,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/formatting";

import type { MentorProfileData } from "./types";

interface MentorProfileSectionProps {
  mentorProfile: MentorProfileData;
  isEditing: boolean;
  isSaving: boolean;
  formData: Partial<MentorProfileData>;
  avatarPreview: string | null;
  onRefreshData: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveProfile: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAvatar: () => void;
  onInputChange: (field: keyof MentorProfileData, value: string | number) => void;
}

export function MentorProfileSection({
  mentorProfile,
  isEditing,
  isSaving,
  formData,
  avatarPreview,
  onRefreshData,
  onStartEdit,
  onCancelEdit,
  onSaveProfile,
  onAvatarChange,
  onClearAvatar,
  onInputChange,
}: MentorProfileSectionProps) {
  return (
    <>
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
                onChange={onAvatarChange}
                className="hidden"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute right-0 bottom-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
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
                  onChange={(e) => onInputChange("name", e.target.value)}
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
                  onChange={(e) => onInputChange("bio", e.target.value)}
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
                  onChange={(e) => onInputChange("expertise", e.target.value)}
                  className="mt-1"
                  placeholder="VD: React, Node.js, AWS, Thiết kế hệ thống..."
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
                    onInputChange("yearsOfExperience", value === "" ? 0 : parseInt(value));
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
                  onChange={(e) => onInputChange("currentCompany", e.target.value)}
                  className="mt-1"
                  placeholder="VD: Tập đoàn công nghệ lớn, công ty sản phẩm, công ty outsourcing..."
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
              <Label className="text-sm text-gray-500 dark:text-slate-400">
                Đường dẫn LinkedIn
              </Label>
              {isEditing ? (
                <Input
                  value={formData.linkedInUrl || ""}
                  onChange={(e) => onInputChange("linkedInUrl", e.target.value)}
                  className="mt-1"
                  placeholder="https://www.linkedin.com/in/..."
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

          {/* Average Rating - Read-only from backend */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Star className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-500 dark:text-slate-400">
                Đánh giá trung bình
              </Label>
              <p className="font-['Inter'] text-base font-medium text-zinc-800 dark:text-white">
                {mentorProfile.averageRating ? mentorProfile.averageRating.toFixed(1) : "0.0"}/5
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
