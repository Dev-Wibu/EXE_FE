import { Home, RefreshCcw, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function ServiceUnavailablePage() {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        {/* 503 Illustration */}
        <div className="mb-8">
          <div className="relative mx-auto h-48 w-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl font-bold text-gray-200 dark:text-slate-800">503</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <WifiOff className="h-24 w-24 text-yellow-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          Dịch vụ tạm thời không khả dụng
        </h1>
        <p className="mb-8 max-w-md text-gray-600 dark:text-slate-400">
          Máy chủ đang bảo trì hoặc quá tải. Vui lòng đợi vài phút và thử lại. Chúng tôi đang nỗ lực
          khôi phục dịch vụ nhanh nhất có thể.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Tải lại trang
          </Button>
          <Button onClick={() => navigate("/")} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Button>
        </div>

        {/* Maintenance Notice */}
        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 Mẹo: Thử kiểm tra kết nối internet của bạn hoặc quay lại sau 5-10 phút.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-sm text-gray-500 dark:text-slate-500">
        Mã lỗi: 503 - Dịch vụ không khả dụng
      </div>
    </div>
  );
}
