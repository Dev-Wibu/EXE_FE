import { ExternalLink, ImageIcon, X } from "lucide-react";
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
import { MAJOR_OPTIONS } from "@/constants/majors";

import type { User, UserFormData } from "../types";

/**
 * Extended form data type to include file uploads
 * Based on schema-from-be.d.ts createUser operation which requires:
 * - data: UserInfo (JSON)
 * - avatar?: File (binary)
 *
 * Note: CV upload is handled separately via dedicated /api/users/upload-cv endpoint
 * which returns CandidateProfile data, avoiding conflicts with general user update operations.
 * See CVUploadModal component.
 */
interface ExtendedUserFormData extends Partial<UserFormData> {
  avatar?: File;
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
  const [showPassword, setShowPassword] = useState(false);

  // Clean up blob URLs when component unmounts or when files change
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Handle dialog open/close with preview reset
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset previews when closing
      setAvatarPreview(null);
      setShowPassword(false);
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

  // Clear avatar selection
  const handleClearAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    onFormChange({ ...formData, avatar: undefined });
  };

  // Get the display image URL - prioritize new upload preview over existing URL
  const displayAvatarUrl = avatarPreview || selectedUser?.avatarUrl;

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
          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu (để trống nếu không đổi)</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password || ""}
                onChange={(e) => onFormChange({ ...formData, password: e.target.value })}
                placeholder="Nhập mật khẩu cho tài khoản"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Ẩn" : "Hiện"}
              </Button>
            </div>
          </div>
          {/* Note: Role field removed as UserInfo schema (used for createUser) does not include role */}
          {/* Backend UserInfo only contains: id, name, email, password, university, major */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="university">Trường đại học</Label>
              <Input
                id="university"
                value={formData.university || ""}
                onChange={(e) => onFormChange({ ...formData, university: e.target.value })}
                placeholder="Tên trường đại học"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="major">Chuyên ngành *</Label>
              <Select
                value={formData.major || ""}
                onValueChange={(value) => onFormChange({ ...formData, major: value })}>
                <SelectTrigger>
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
            </div>
          </div>
          {/* File Upload Section - Avatar Only */}
          {/* Note: CV upload is handled separately via dedicated button in UserTable */}
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
