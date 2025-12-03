import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function MockInterviewPaymentRedirectPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard/mock-interview/payment-success");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleCancel = () => {
    navigate("/dashboard/mock-interview/confirm");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-violet-50 via-blue-50 to-indigo-50">
      <div className="flex flex-col items-center gap-8">
        {/* Loading Spinner */}
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-violet-500" />
        </div>

        {/* MoMo Logo Placeholder */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-pink-100">
          <span className="font-['Inter'] text-2xl font-bold text-pink-600">MoMo</span>
        </div>

        {/* Title */}
        <h1 className="font-['Roboto'] text-2xl font-bold text-gray-900">
          Đang chuyển hướng đến cổng thanh toán...
        </h1>

        {/* Countdown */}
        <div className="flex items-center gap-2">
          <span className="font-['Inter'] text-lg font-medium text-gray-600">
            Chuyển hướng trong
          </span>
          <span className="font-['Inter'] text-2xl font-bold text-violet-500">{countdown}</span>
          <span className="font-['Inter'] text-lg font-medium text-gray-600">giây</span>
        </div>

        {/* Description */}
        <p className="max-w-md text-center font-['Roboto'] text-base font-normal text-gray-500">
          Vui lòng không đóng trang này. Bạn sẽ được chuyển hướng đến cổng thanh toán MoMo để hoàn
          tất giao dịch.
        </p>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="mt-4 rounded-lg border border-gray-300 bg-white px-6 py-2 font-['Inter'] text-base font-medium text-gray-700 hover:bg-gray-50">
          Hủy thanh toán
        </button>
      </div>
    </div>
  );
}
