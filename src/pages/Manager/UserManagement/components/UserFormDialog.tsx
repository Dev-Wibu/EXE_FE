import { ExternalLink, FileText, ImageIcon, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { User, UserFormData } from "../types";

/**
 * Extended form data type to include file uploads
 * Based on schema-from-be.d.ts createUser operation which requires:
 * - data: UserInfo (JSON)
 * - avatar?: File (binary)
 * - cvFile?: File (binary)
 */
interface ExtendedUserFormData extends Partial<UserFormData> {
  avatar?: File;
  cvFile?: File;
}

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ExtendedUserFormData;
  onFormChange: (data: ExtendedUserFormData) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
  /** User being edited (optional, for showing existing avatar/cv URLs) */
  selectedUser?: User | null;
}

export function UserFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
  selectedUser,
}: UserFormDialogProps) {
  // State for local file previews (blob URLs for new file uploads)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cvPreview, setCvPreview] = useState<string | null>(null);

  // Clean up blob URLs when component unmounts or when files change
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (cvPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(cvPreview);
      }
    };
  }, [avatarPreview, cvPreview]);

  // Handle dialog open/close with preview reset
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset previews when closing
      setAvatarPreview(null);
      setCvPreview(null);
    }
    onOpenChange(open);
  };

  // Handle file input change for avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL for the selected file
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      onFormChange({ ...formData, avatar: file });
    }
  };

  // Handle file input change for CV
  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL for the selected file
      if (cvPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(cvPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setCvPreview(previewUrl);
      onFormChange({ ...formData, cvFile: file });
    }
  };

  // Clear avatar selection
  const handleClearAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    onFormChange({ ...formData, avatar: undefined });
  };

  // Clear CV selection
  const handleClearCv = () => {
    if (cvPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(cvPreview);
    }
    setCvPreview(null);
    onFormChange({ ...formData, cvFile: undefined });
  };

  // Get the display image URL - prioritize new upload preview over existing URL
  const displayAvatarUrl = avatarPreview || selectedUser?.avatarUrl;
  const displayCvUrl = cvPreview || selectedUser?.cvUrl;

  // Check if CV is an image (for preview purposes)
  const isCvImage = (url: string | null | undefined): boolean => {
    if (!url) return false;
    // For blob URLs, check the file extension from formData
    if (url.startsWith("blob:") && formData.cvFile) {
      const fileName = formData.cvFile.name.toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some((ext) =>
        fileName.endsWith(ext)
      );
    }
    // For server URLs, extract the path and check extension
    try {
      const urlPath = new URL(url).pathname.toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some((ext) =>
        urlPath.endsWith(ext)
      );
    } catch {
      // If URL parsing fails, fallback to includes check on the full string
      const lowerUrl = url.toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some((ext) =>
        lowerUrl.endsWith(ext)
      );
    }
  };

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
                placeholder="Nhập họ tên người dùng"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="role">Vai trò *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  onFormChange({ ...formData, role: value as UserFormData["role"] })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Người dùng</SelectItem>
                  <SelectItem value="MENTOR">Mentor</SelectItem>
                  <SelectItem value="STAFF">Nhân viên</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="university">Trường đại học</Label>
              <Input
                id="university"
                value={formData.university || ""}
                onChange={(e) => onFormChange({ ...formData, university: e.target.value })}
                placeholder="Tên trường đại học"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="major">Chuyên ngành</Label>
              <Input
                id="major"
                value={formData.major || ""}
                onChange={(e) => onFormChange({ ...formData, major: e.target.value })}
                placeholder="VD: Khoa học máy tính"
              />
            </div>
          </div>
          {/* File Upload Section with Previews */}
          <div className="grid grid-cols-2 gap-4">
            {/* Avatar Section */}
            <div className="space-y-1.5">
              <Label htmlFor="avatar">Ảnh đại diện</Label>
              {/* Image Preview - Show either new upload or existing avatar */}
              {displayAvatarUrl && (
                <div className="relative mb-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-800">
                  <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full">
                    <img
                      src={displayAvatarUrl}
                      alt="Xem trước ảnh đại diện"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // Hide image on error
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {avatarPreview ? (
                      <>
                        <span className="text-xs text-green-600">Đã chọn file mới</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={handleClearAvatar}
                          title="Xóa ảnh đại diện mới">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <a
                        href={displayAvatarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
                        <span>Xem ảnh đầy đủ</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              {/* File Input */}
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

            {/* CV Section */}
            <div className="space-y-1.5">
              <Label htmlFor="cvFile">File CV</Label>
              {/* CV Preview - Show image preview for images, or file icon for documents */}
              {displayCvUrl && (
                <div className="relative mb-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-800">
                  {isCvImage(displayCvUrl) ? (
                    <div className="relative mx-auto h-32 w-full overflow-hidden rounded-md">
                      <img
                        src={displayCvUrl}
                        alt="Xem trước CV"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 flex-col items-center justify-center">
                      <FileText className="h-12 w-12 text-green-500" />
                      <span className="mt-2 text-xs text-gray-500">
                        {formData.cvFile?.name || "File tài liệu"}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {cvPreview ? (
                      <>
                        <span className="text-xs text-green-600">
                          {formData.cvFile?.name || "Đã chọn file mới"}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={handleClearCv}
                          title="Xóa CV mới">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <a
                        href={displayCvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline dark:text-green-400">
                        <span>Xem CV</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              {/* File Input */}
              <Input
                id="cvFile"
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleCvChange}
                className="cursor-pointer"
              />
              {!displayCvUrl && (
                <p className="text-muted-foreground flex items-center gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  Chưa chọn CV
                </p>
              )}
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
