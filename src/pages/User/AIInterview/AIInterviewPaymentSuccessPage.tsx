import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockPaymentInfo } from "@/mocks/interviews.mock";

// Display amount as shown in the design (440,000 VND)
const DISPLAY_AMOUNT = 440000;

export function AIInterviewPaymentSuccessPage() {
  const navigate = useNavigate();

  // Generate mock transaction details
  const transactionDetails = {
    transactionId: "000085752257",
    timestamp: "25-02-2023, 13:22",
    paymentMethod: "MoMo",
    payerName: "Thu Hà",
    amount: DISPLAY_AMOUNT,
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-lg flex-col items-center gap-6">
        {/* Success Card */}
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-6 p-8">
            {/* Success Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="text-center">
              <h2 className="text-foreground text-2xl font-semibold">Thanh toán thành công</h2>
              <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(transactionDetails.amount)} VND
              </p>
            </div>

            <div className="border-border w-full border-t" />

            {/* Transaction Details */}
            <div className="w-full space-y-4">
              {[
                { label: "Mã giao dịch", value: transactionDetails.transactionId },
                { label: "Thời gian", value: transactionDetails.timestamp },
                { label: "Phương thức thanh toán", value: transactionDetails.paymentMethod },
                { label: "Người thanh toán", value: transactionDetails.payerName },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{item.label}</span>
                  <span className="text-foreground text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="border-border w-full border-t" />

            {/* Amount Summary */}
            <div className="flex w-full items-center justify-between">
              <span className="text-foreground font-bold">Số tiền</span>
              <span className="text-foreground font-bold">
                {formatCurrency(mockPaymentInfo.total)} VND
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Start Interview Button */}
        <Button
          onClick={() => navigate("/dashboard/ai-interview/session")}
          size="lg"
          className="w-full bg-[#0047AB] text-white hover:bg-[#005B9A]">
          Bắt đầu phỏng vấn
        </Button>
      </div>
    </div>
  );
}
