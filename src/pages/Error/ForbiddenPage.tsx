import { Home, LogIn, ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        {/* 403 Illustration */}
        <div className="mb-8">
          <div className="relative mx-auto h-48 w-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl font-bold text-gray-200 dark:text-slate-800">403</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldOff className="h-24 w-24 text-orange-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          Truy cập bị từ chối
        </h1>
        <p className="mb-8 max-w-md text-gray-600 dark:text-slate-400">
          Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập với tài khoản có quyền phù
          hợp hoặc liên hệ quản trị viên.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button variant="outline" onClick={() => navigate("/login")} className="gap-2">
            <LogIn className="h-4 w-4" />
            Đăng nhập
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-sm text-gray-500 dark:text-slate-500">
        Mã lỗi: 403 - Truy cập bị từ chối
      </div>
    </div>
  );
}
