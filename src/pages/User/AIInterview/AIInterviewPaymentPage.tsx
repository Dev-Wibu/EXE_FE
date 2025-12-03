import { Calendar, Clock, CreditCard, FileText, Landmark, Video, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { mockInterviewInfo, mockPaymentInfo, mockPaymentMethods } from "@/mocks/interviews.mock";

export function AIInterviewPaymentPage() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string>("wallet");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const getPaymentIcon = (iconName: string) => {
    switch (iconName) {
      case "wallet":
        return <Wallet className="h-5 w-5 text-violet-600" />;
      case "bank":
        return <Landmark className="h-5 w-5 text-gray-500" />;
      case "credit-card":
        return <CreditCard className="h-5 w-5 text-gray-500" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  const handleConfirm = () => {
    if (!agreedToTerms) {
      return;
    }
    navigate("/dashboard/ai-interview/payment-redirect");
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex gap-6">
        {/* Left Column - Info Cards */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Interview Info Card */}
          <div className="rounded-lg bg-white p-6 outline outline-1 outline-offset-[-1px] outline-gray-200">
            <h3 className="font-['Roboto'] text-lg font-bold text-gray-900">
              Thông tin buổi phỏng vấn
            </h3>

            <div className="mt-6 grid grid-cols-2 gap-6">
              {/* Date */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                  <Calendar className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-500">
                    Ngày phỏng vấn
                  </p>
                  <p className="font-['Roboto'] text-base font-bold text-gray-900">
                    {mockInterviewInfo.date}
                  </p>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-700">
                    {mockInterviewInfo.fullDate}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-500">Thời gian</p>
                  <p className="font-['Roboto'] text-base font-bold text-gray-900">
                    {mockInterviewInfo.time}
                  </p>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-700">
                    ({mockInterviewInfo.duration})
                  </p>
                </div>
              </div>

              {/* Format */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <Video className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-500">Hình thức</p>
                  <p className="font-['Roboto'] text-base font-bold text-gray-900">
                    {mockInterviewInfo.format}
                  </p>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-700">
                    {mockInterviewInfo.type}
                  </p>
                </div>
              </div>

              {/* Interview Type */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-200">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-500">
                    Loại phỏng vấn
                  </p>
                  <p className="font-['Roboto'] text-base font-bold text-gray-900">
                    {mockInterviewInfo.interviewType}
                  </p>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-700">
                    {mockInterviewInfo.position}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Card */}
          <div className="rounded-lg bg-white p-6 outline outline-1 outline-offset-[-1px] outline-gray-200">
            <h3 className="font-['Roboto'] text-lg font-bold text-gray-900">
              Phương thức thanh toán
            </h3>

            <div className="mt-4 flex flex-col gap-4">
              {mockPaymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex items-start gap-4 rounded-lg p-4 ${
                    selectedMethod === method.id
                      ? "bg-purple-50 outline outline-2 outline-offset-[-2px] outline-violet-500"
                      : "bg-white outline outline-2 outline-offset-[-2px] outline-gray-200"
                  }`}>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      selectedMethod === method.id ? "bg-violet-100" : "bg-gray-100"
                    }`}>
                    {getPaymentIcon(method.icon)}
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className={`font-['Inter'] text-sm font-bold ${
                        selectedMethod === method.id ? "text-gray-900" : "text-gray-900"
                      }`}>
                      {method.name}
                    </p>
                    <p className="font-['Inter'] text-sm font-normal text-gray-500">
                      {method.description}
                    </p>
                    {method.balance && (
                      <p className="font-['Inter'] text-sm font-medium text-emerald-600">
                        Số dư: {formatCurrency(method.balance)}
                      </p>
                    )}
                  </div>
                  {selectedMethod === method.id && (
                    <div className="flex h-5 w-5 items-center justify-center">
                      <div className="h-4 w-4 rounded-full border-2 border-violet-500 bg-violet-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-4 rounded-lg bg-blue-50 p-4 outline outline-1 outline-offset-[-1px] outline-blue-200">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-neutral-500 bg-white"
            />
            <label htmlFor="terms" className="font-['Roboto'] text-sm leading-5 font-normal">
              <span className="text-gray-700">Tôi đồng ý với </span>
              <span className="font-medium text-violet-600">điều khoản và điều kiện</span>
              <span className="text-gray-700">
                {" "}
                của INTELITE. Tôi hiểu rằng buổi phỏng vấn sẽ được ghi lại để phục vụ mục đích đánh
                giá và cải thiện chất lượng dịch vụ.
              </span>
            </label>
          </div>
        </div>

        {/* Right Column - Payment Summary */}
        <div className="w-96">
          <div className="rounded-lg bg-white p-6 outline outline-1 outline-offset-[-1px] outline-gray-200">
            <h3 className="font-['Roboto'] text-lg font-bold text-gray-900">Chi tiết thanh toán</h3>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-['Roboto'] text-base font-normal text-gray-700">
                  Phí buổi phỏng vấn
                </span>
                <span className="font-['Roboto'] text-base font-medium text-gray-700">
                  {formatCurrency(mockPaymentInfo.interviewFee)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-['Roboto'] text-base font-normal text-gray-700">
                  Phí dịch vụ
                </span>
                <span className="font-['Roboto'] text-base font-medium text-gray-700">
                  {formatCurrency(mockPaymentInfo.serviceFee)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="font-['Roboto'] text-lg font-bold text-gray-900">Tổng cộng</span>
                <span className="font-['Roboto'] text-2xl font-bold text-violet-500">
                  {formatCurrency(mockPaymentInfo.total)}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!agreedToTerms}
              aria-disabled={!agreedToTerms}
              aria-label={
                agreedToTerms ? "Xác nhận thanh toán" : "Vui lòng đồng ý với điều khoản để tiếp tục"
              }
              className={`mt-6 flex h-10 w-full items-center justify-center rounded-lg ${
                agreedToTerms
                  ? "bg-violet-500 hover:bg-violet-600"
                  : "cursor-not-allowed bg-violet-300"
              }`}>
              <span className="font-['Inter'] text-xl font-medium text-white">Xác nhận</span>
            </button>

            <p className="mt-4 text-center font-['Roboto'] text-base font-normal text-gray-900">
              Bạn sẽ được gửi email xác nhận sau khi thanh toán
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
