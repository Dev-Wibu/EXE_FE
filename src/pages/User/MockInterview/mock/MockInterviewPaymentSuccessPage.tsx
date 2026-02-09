import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MockInterviewPaymentSuccessPage() {
  const navigate = useNavigate();

  const transactionInfo = {
    transactionId: "000085752257",
    timestamp: "25-02-2023, 13:22",
    paymentMethod: "MoMo",
    payerName: "Thu Hà",
    amount: 440000,
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const handleBack = () => {
    navigate("/dashboard/mock-interview");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Stepper */}
      <div className="relative mx-auto flex w-full max-w-4xl items-center justify-center pt-10">
        {/* Step 1: Chọn mentor - Completed */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-16 w-16 text-white" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Chọn mentor
          </span>
        </div>

        {/* Line 1 */}
        <div className="mx-4 h-0.5 w-40 bg-blue-800/50" />

        {/* Step 2: Lên lịch - Completed */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-16 w-16 text-white" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Lên lịch
          </span>
        </div>

        {/* Line 2 */}
        <div className="mx-4 h-0.5 w-40 bg-blue-800/50" />

        {/* Step 3: Xác nhận - Completed */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-600">
            <Check className="h-16 w-16 text-white" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Xác nhận
          </span>
        </div>
      </div>

      {/* Success Card */}
      <div className="mx-auto mt-16 flex max-w-[653px] flex-col items-center gap-14 rounded-[40px] bg-purple-100 p-10 shadow-[0px_13px_40px_0px_rgba(170,170,170,0.12)] outline outline-1 outline-offset-[-1px] outline-black">
        {/* Success Icon and Title */}
        <div className="flex flex-col items-center gap-7">
          {/* Green Circle Background */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600/10">
            <div className="flex h-14 w-14 items-center justify-center">
              <Check className="h-10 w-10 text-emerald-600" strokeWidth={3} />
            </div>
          </div>

          {/* Title and Amount */}
          <div className="flex flex-col items-center gap-3.5">
            <h1 className="text-center font-['Poppins'] text-4xl leading-10 font-medium text-zinc-700">
              Thanh toán thành công
            </h1>
            <p className="text-center font-['Poppins'] text-4xl leading-[53px] font-semibold text-green-500">
              {formatCurrency(transactionInfo.amount)} VND
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-0.5 w-full bg-gray-200" />

        {/* Transaction Details */}
        <div className="flex w-full flex-col gap-7">
          <div className="flex flex-col gap-6">
            {/* Transaction ID */}
            <div className="flex items-center justify-between">
              <span className="flex-1 font-['Poppins'] text-2xl leading-7 font-normal text-neutral-500">
                Mã giao dịch
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-medium text-neutral-900">
                {transactionInfo.transactionId}
              </span>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <span className="flex-1 font-['Poppins'] text-2xl leading-7 font-normal text-neutral-500">
                Thời gian
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-medium text-neutral-900">
                {transactionInfo.timestamp}
              </span>
            </div>

            {/* Payment Method */}
            <div className="flex items-center justify-between">
              <span className="flex-1 font-['Poppins'] text-2xl leading-7 font-normal text-neutral-500">
                Phương thức thanh toán
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-medium text-neutral-900">
                {transactionInfo.paymentMethod}
              </span>
            </div>

            {/* Payer Name */}
            <div className="flex items-center justify-between">
              <span className="flex-1 font-['Poppins'] text-2xl leading-7 font-normal text-neutral-500">
                Người thanh toán
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-medium text-neutral-900">
                {transactionInfo.payerName}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-0.5 w-full bg-gray-200" />

          {/* Amount */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="flex-1 font-['Poppins'] text-2xl leading-7 font-bold text-neutral-500">
                Amount
              </span>
              <span className="font-['Poppins'] text-2xl leading-7 font-bold text-neutral-900">
                {formatCurrency(transactionInfo.amount - 40000)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mx-auto mt-8 flex justify-center">
        <button
          onClick={handleBack}
          className="flex h-12 w-48 items-center justify-center rounded-lg bg-violet-500 hover:bg-violet-600">
          <span className="font-['Inter'] text-2xl font-medium text-white">Quay lại</span>
        </button>
      </div>
    </div>
  );
}
