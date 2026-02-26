import { Home, RefreshCcw, ServerCrash } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function ServerErrorPage() {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        {/* 500 Illustration */}
        <div className="mb-8">
          <div className="relative mx-auto h-48 w-48">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl font-bold text-gray-200 dark:text-slate-800">500</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ServerCrash className="h-24 w-24 text-red-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Lỗi máy chủ</h1>
        <p className="mb-8 max-w-md text-gray-600 dark:text-slate-400">
          Xin lỗi, đã có lỗi xảy ra từ phía máy chủ. Đội ngũ kỹ thuật đã được thông báo và đang khắc
          phục. Vui lòng thử lại sau.
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
      </div>

      {/* Footer */}
      <div className="mt-16 text-sm text-gray-500 dark:text-slate-500">
        Mã lỗi: 500 - Lỗi máy chủ nội bộ
      </div>
    </div>
  );
}
