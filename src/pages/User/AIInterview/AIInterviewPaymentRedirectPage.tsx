import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function AIInterviewPaymentRedirectPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard/ai-interview/payment-success");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50">
      <div className="flex flex-col items-center gap-8 rounded-2xl bg-white p-12 shadow-lg">
        {/* Loading Spinner */}
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-violet-500" />
        </div>

        {/* MoMo Logo Placeholder */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-100">
          <span className="font-['Poppins'] text-2xl font-bold text-pink-500">M</span>
        </div>

        {/* Title */}
        <h2 className="font-['Poppins'] text-2xl font-semibold text-zinc-700">
          Đang chuyển hướng đến cổng thanh toán...
        </h2>

        {/* Countdown */}
        <p className="font-['Poppins'] text-lg font-normal text-gray-500">
          Chuyển hướng trong <span className="font-bold text-violet-500">{countdown}</span> giây
        </p>

        {/* Description */}
        <p className="max-w-md text-center font-['Roboto'] text-base font-normal text-gray-500">
          Vui lòng không đóng trang này. Bạn sẽ được chuyển đến trang thanh toán MoMo để hoàn tất
          giao dịch.
        </p>

        {/* Cancel Button */}
        <button
          onClick={() => navigate("/dashboard/ai-interview/payment")}
          className="font-['Inter'] text-base font-medium text-violet-600 hover:text-violet-800">
          Hủy thanh toán
        </button>
      </div>
    </div>
  );
}
