import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          {/* Loading Spinner */}
          <Loader2 className="h-14 w-14 animate-spin text-[#0047AB]" />

          {/* MoMo Logo Placeholder */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/40">
            <span className="text-xl font-bold text-pink-500">M</span>
          </div>

          {/* Title */}
          <h2 className="text-foreground text-xl font-semibold">
            Đang chuyển hướng đến cổng thanh toán...
          </h2>

          {/* Countdown */}
          <p className="text-muted-foreground">
            Chuyển hướng trong <span className="font-bold text-[#0047AB]">{countdown}</span> giây
          </p>

          {/* Description */}
          <p className="text-muted-foreground max-w-sm text-sm">
            Vui lòng không đóng trang này. Bạn sẽ được chuyển đến trang thanh toán MoMo để hoàn tất
            giao dịch.
          </p>

          {/* Cancel Button */}
          <Button variant="link" onClick={() => navigate("/dashboard/ai-interview/payment")}>
            Hủy thanh toán
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
