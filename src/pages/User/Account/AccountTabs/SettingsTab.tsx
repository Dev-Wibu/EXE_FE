import { Eye, EyeOff, KeyRound, Shield } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userManager } from "@/services/user.manager";
import { toast } from "sonner";

export function SettingsTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    setIsSaving(true);
    try {
      const response = await userManager.updatePassword(currentPassword, newPassword);
      if (response.success) {
        toast.success("Đổi mật khẩu thành công");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.error || "Không thể đổi mật khẩu");
      }
    } catch {
      toast.error("Không thể đổi mật khẩu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Change Password */}
      <Card className="shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:shadow-slate-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <KeyRound className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
            </div>
            <div>
              <CardTitle className="font-['Inter'] text-lg font-semibold text-zinc-800 dark:text-white">
                Đổi mật khẩu
              </CardTitle>
              <CardDescription className="font-['Inter'] text-sm text-gray-500 dark:text-slate-400">
                Cập nhật mật khẩu để bảo vệ tài khoản của bạn
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="currentPassword"
              className="font-['Inter'] text-sm font-medium text-zinc-700 dark:text-slate-300">
              Mật khẩu hiện tại
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="font-['Inter'] text-sm font-medium text-zinc-700 dark:text-slate-300">
              Mật khẩu mới
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="font-['Inter'] text-sm font-medium text-zinc-700 dark:text-slate-300">
              Xác nhận mật khẩu mới
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleChangePassword}
              disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
              className="w-full sm:w-auto">
              {isSaving ? "Đang lưu..." : "Cập nhật mật khẩu"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="border-blue-100 bg-blue-50/50 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.05)] dark:border-blue-900/30 dark:bg-blue-950/20 dark:shadow-slate-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Shield className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
            </div>
            <CardTitle className="font-['Inter'] text-base font-semibold text-blue-800 dark:text-blue-300">
              Lời khuyên bảo mật
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">•</span>
              Sử dụng mật khẩu dài ít nhất 8 ký tự kết hợp chữ hoa, chữ thường, số và ký tự đặc
              biệt.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">•</span>
              Không sử dụng cùng một mật khẩu cho nhiều tài khoản khác nhau.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">•</span>
              Không chia sẻ mật khẩu với bất kỳ ai, kể cả nhân viên hỗ trợ.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-blue-500">•</span>
              Thường xuyên thay đổi mật khẩu để tăng cường bảo mật.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
