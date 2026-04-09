import { ExternalLink, Eye, EyeOff, FileText, ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { Mentor, MentorFormData } from "../types";

/**
 * Extended form data type to include file uploads
 * Based on schema-from-be.d.ts createMentor operation which requires:
 * - data: MentorInfo (JSON)
 * - avatar?: File (binary)
 * - identityFile?: File (binary)
 * - degreeFile?: File (binary)
 * - otherFile?: File (binary)
 */
interface ExtendedMentorFormData extends Partial<MentorFormData> {
  avatar?: File;
  identityFile?: File;
  degreeFile?: File;
  otherFile?: File;
}

interface MentorFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ExtendedMentorFormData;
  onFormChange: (data: ExtendedMentorFormData) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
  /** Mentor being edited (optional, for showing existing file URLs) */
  selectedMentor?: Mentor | null;
}

// Check if URL is an image
const isImageUrl = (url: string | null | undefined, fileName?: string): boolean => {
  if (!url) return false;
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

  // For blob URLs, check the file name if provided
  if (url.startsWith("blob:") && fileName) {
    return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  }

  // For server URLs, extract the path and check extension
  try {
    const urlPath = new URL(url).pathname.toLowerCase();
    return imageExtensions.some((ext) => urlPath.endsWith(ext));
  } catch {
    // If URL parsing fails, fallback to endsWith check on the full string
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
  }
};

// File preview component - defined outside main component to avoid re-creation during render
interface FilePreviewProps {
  url: string | null | undefined;
  previewUrl: string | null;
  isNew: boolean;
  onClear: () => void;
  label: string;
  fileName?: string;
}

function FilePreview({ url, previewUrl, isNew, onClear, label, fileName }: FilePreviewProps) {
  if (!url) return null;
  // Check if the URL points to an image, using fileName for blob URLs
  const isImage =
    isImageUrl(url, fileName) ||
    (previewUrl?.startsWith("blob:") && fileName && isImageUrl(previewUrl, fileName));

  return (
    <div className="relative mb-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-800">
      {isImage ? (
        <div className="relative mx-auto h-24 w-full overflow-hidden rounded-md">
          <img
            src={url}
            alt={label}
            className="h-full w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : (
        <div className="flex h-24 flex-col items-center justify-center">
          <FileText className="h-10 w-10 text-blue-500" />
          <span className="mt-1 max-w-full truncate text-xs text-gray-500">
            {fileName || "Document"}
          </span>
        </div>
      )}
      <div className="mt-1 flex items-center justify-center gap-2">
        {isNew ? (
          <>
            <span className="text-xs text-green-600">File mới</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={onClear}
              title="Xóa">
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
            <span>Xem</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function MentorFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
  selectedMentor,
}: MentorFormDialogProps) {
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  // State for local file previews (blob URLs for new file uploads)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [degreePreview, setDegreePreview] = useState<string | null>(null);
  const [otherPreview, setOtherPreview] = useState<string | null>(null);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      if (identityPreview?.startsWith("blob:")) URL.revokeObjectURL(identityPreview);
      if (degreePreview?.startsWith("blob:")) URL.revokeObjectURL(degreePreview);
      if (otherPreview?.startsWith("blob:")) URL.revokeObjectURL(otherPreview);
    };
  }, [avatarPreview, identityPreview, degreePreview, otherPreview]);

  // Handle dialog open/close with preview reset
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset previews when closing
      setAvatarPreview(null);
      setIdentityPreview(null);
      setDegreePreview(null);
      setOtherPreview(null);
    }
    onOpenChange(open);
  };

  // Handle file input changes with preview
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(URL.createObjectURL(file));
      onFormChange({ ...formData, avatar: file });
    }
  };

  const handleIdentityFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (identityPreview?.startsWith("blob:")) URL.revokeObjectURL(identityPreview);
      setIdentityPreview(URL.createObjectURL(file));
      onFormChange({ ...formData, identityFile: file });
    }
  };

  const handleDegreeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (degreePreview?.startsWith("blob:")) URL.revokeObjectURL(degreePreview);
      setDegreePreview(URL.createObjectURL(file));
      onFormChange({ ...formData, degreeFile: file });
    }
  };

  const handleOtherFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (otherPreview?.startsWith("blob:")) URL.revokeObjectURL(otherPreview);
      setOtherPreview(URL.createObjectURL(file));
      onFormChange({ ...formData, otherFile: file });
    }
  };

  // Clear file handlers
  const handleClearAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    onFormChange({ ...formData, avatar: undefined });
  };

  const handleClearIdentity = () => {
    if (identityPreview?.startsWith("blob:")) URL.revokeObjectURL(identityPreview);
    setIdentityPreview(null);
    onFormChange({ ...formData, identityFile: undefined });
  };

  const handleClearDegree = () => {
    if (degreePreview?.startsWith("blob:")) URL.revokeObjectURL(degreePreview);
    setDegreePreview(null);
    onFormChange({ ...formData, degreeFile: undefined });
  };

  const handleClearOther = () => {
    if (otherPreview?.startsWith("blob:")) URL.revokeObjectURL(otherPreview);
    setOtherPreview(null);
    onFormChange({ ...formData, otherFile: undefined });
  };

  // Get display URLs - prioritize new upload preview over existing URL
  const displayAvatarUrl = avatarPreview || selectedMentor?.avatarUrl;
  const displayIdentityUrl = identityPreview || selectedMentor?.identityImg;
  const displayDegreeUrl = degreePreview || selectedMentor?.degreeImg;
  const displayOtherUrl = otherPreview || selectedMentor?.otherFile;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Họ tên *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                placeholder="Nhập tên mentor"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
                placeholder="mentor@example.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password || ""}
                onChange={(e) => onFormChange({ ...formData, password: e.target.value })}
                placeholder="Nhập mật khẩu"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Giới thiệu bản thân</Label>
            <Textarea
              id="bio"
              value={formData.bio || ""}
              onChange={(e) => onFormChange({ ...formData, bio: e.target.value })}
              placeholder="Mô tả ngắn gọn - kinh nghiệm, kỹ năng và phương pháp giảng dạy của bạn"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expertise">Chuyên môn</Label>
            <Textarea
              id="expertise"
              value={formData.expertise || ""}
              onChange={(e) => onFormChange({ ...formData, expertise: e.target.value })}
              placeholder="VD: React, Node.js, AWS, Thiết kế hệ thống, Cố vấn phỏng vấn, v.v."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="yearsOfExperience">Số năm kinh nghiệm</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                value={formData.yearsOfExperience || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    yearsOfExperience: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentCompany">Công ty hiện tại</Label>
              <Input
                id="currentCompany"
                value={formData.currentCompany || ""}
                onChange={(e) => onFormChange({ ...formData, currentCompany: e.target.value })}
                placeholder="Tên công ty"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pricePerMinute">Đơn giá mỗi phút (VNĐ)</Label>
            <Input
              id="pricePerMinute"
              type="number"
              min={0}
              value={formData.pricePerMinute ?? ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  pricePerMinute: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="Ví dụ: 5000"
            />
          </div>
          {/* MentorInfo: id, name, email, password, bio, expertise, yearsOfExperience, linkedInUrl, currentCompany, pricePerMinute */}
          <div className="space-y-1.5">
            <Label htmlFor="linkedInUrl">Đường dẫn LinkedIn</Label>
            <Input
              id="linkedInUrl"
              value={formData.linkedInUrl || ""}
              onChange={(e) => onFormChange({ ...formData, linkedInUrl: e.target.value })}
              placeholder="https://www.linkedin.com/in/..."
            />
          </div>
          {/* File Upload Section with Previews */}
          <div className="mt-2 border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Tài liệu</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Avatar */}
              <div className="space-y-1.5">
                <Label htmlFor="avatar">Ảnh đại diện</Label>
                <FilePreview
                  url={displayAvatarUrl}
                  previewUrl={avatarPreview}
                  isNew={!!avatarPreview}
                  onClear={handleClearAvatar}
                  label="Avatar"
                  fileName={formData.avatar?.name}
                />
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="cursor-pointer"
                />
                {!displayAvatarUrl && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <ImageIcon className="h-3 w-3" />
                    Chưa chọn ảnh đại diện
                  </p>
                )}
              </div>

              {/* Identity Document */}
              <div className="space-y-1.5">
                <Label htmlFor="identityFile">Giấy tờ tùy thân</Label>
                <FilePreview
                  url={displayIdentityUrl}
                  previewUrl={identityPreview}
                  isNew={!!identityPreview}
                  onClear={handleClearIdentity}
                  label="Identity"
                  fileName={formData.identityFile?.name}
                />
                <Input
                  id="identityFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleIdentityFileChange}
                  className="cursor-pointer"
                />
                {!displayIdentityUrl && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    Chưa chọn giấy tờ tùy thân
                  </p>
                )}
              </div>

              {/* Degree/Certificate */}
              <div className="space-y-1.5">
                <Label htmlFor="degreeFile">Bằng cấp/Chứng chỉ</Label>
                <FilePreview
                  url={displayDegreeUrl}
                  previewUrl={degreePreview}
                  isNew={!!degreePreview}
                  onClear={handleClearDegree}
                  label="Degree"
                  fileName={formData.degreeFile?.name}
                />
                <Input
                  id="degreeFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleDegreeFileChange}
                  className="cursor-pointer"
                />
                {!displayDegreeUrl && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    Chưa chọn bằng cấp/chứng chỉ
                  </p>
                )}
              </div>

              {/* Other File */}
              <div className="space-y-1.5">
                <Label htmlFor="otherFile">Tệp khác</Label>
                <FilePreview
                  url={displayOtherUrl}
                  previewUrl={otherPreview}
                  isNew={!!otherPreview}
                  onClear={handleClearOther}
                  label="Other"
                  fileName={formData.otherFile?.name}
                />
                <Input
                  id="otherFile"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleOtherFileChange}
                  className="cursor-pointer"
                />
                {!displayOtherUrl && (
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    Chưa chọn tệp khác
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
