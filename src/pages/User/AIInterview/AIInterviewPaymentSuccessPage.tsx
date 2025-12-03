import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen bg-white">
      {/* Success Card */}
      <div className="mx-auto mt-12 flex w-[653px] flex-col items-center gap-14 rounded-[40px] bg-purple-100 p-10 shadow-[0px_13px_40px_0px_rgba(170,170,170,0.12)] outline outline-1 outline-offset-[-1px] outline-black">
        {/* Success Icon */}
        <div className="flex flex-col items-center gap-7">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600/10">
            <CheckCircle className="h-14 w-14 text-emerald-600" />
          </div>

          {/* Title and Amount */}
          <div className="flex flex-col items-center gap-3.5">
            <h2 className="font-['Poppins'] text-4xl leading-10 font-medium text-zinc-700">
              Thanh toán thành công
            </h2>
            <p className="font-['Poppins'] text-4xl leading-[53px] font-semibold text-green-500">
              {formatCurrency(transactionDetails.amount)} VND
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1.67px] w-[495px] bg-gray-200" />

        {/* Transaction Details */}
        <div className="flex w-full flex-col items-center gap-7">
          <div className="flex w-full flex-col gap-6">
            {/* Transaction ID */}
            <div className="flex items-start justify-between">
              <span className="font-['Poppins'] text-2xl leading-7 font-normal text-neutral-500">
                Mã giao dịch
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-medium text-neutral-900">
                {transactionDetails.transactionId}
              </span>
            </div>

            {/* Timestamp */}
            <div className="flex items-start justify-between">
              <span className="font-['Poppins'] text-2xl leading-7 font-normal text-neutral-500">
                Thời gian
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-medium text-neutral-900">
                {transactionDetails.timestamp}
              </span>
            </div>

            {/* Payment Method */}
            <div className="flex items-start justify-between">
              <span className="font-['Poppins'] text-2xl leading-7 font-normal text-neutral-500">
                Phương thức thanh toán
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-medium text-neutral-900">
                {transactionDetails.paymentMethod}
              </span>
            </div>

            {/* Payer Name */}
            <div className="flex items-start justify-between">
              <span className="font-['Poppins'] text-2xl leading-7 font-normal text-neutral-500">
                Người thanh toán
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-medium text-neutral-900">
                {transactionDetails.payerName}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1.67px] w-[495px] bg-gray-200" />

          {/* Amount Summary */}
          <div className="flex w-full flex-col gap-6">
            <div className="flex items-start justify-between">
              <span className="font-['Poppins'] text-2xl leading-7 font-bold text-neutral-500">
                Số tiền
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-bold text-neutral-900">
                {formatCurrency(mockPaymentInfo.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Start Interview Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigate("/dashboard/ai-interview/session")}
          className="flex h-12 items-center justify-center gap-2.5 rounded-lg bg-violet-500 px-8 py-3">
          <span className="font-['Inter'] text-2xl font-medium text-white">Bắt đầu phỏng vấn</span>
        </button>
      </div>
    </div>
  );
}
