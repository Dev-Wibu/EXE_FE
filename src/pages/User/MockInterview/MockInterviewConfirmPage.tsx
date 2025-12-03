import {
  Calendar,
  Check,
  Clock,
  CreditCard,
  FileText,
  Landmark,
  Star,
  User,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { mockPaymentMethods } from "@/mocks/interviews.mock";
import { mockBookingInfo, mockMentors } from "@/mocks/mentors.mock";

export function MockInterviewConfirmPage() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string>("wallet");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const mentor = mockMentors[0];
  const booking = mockBookingInfo;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

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

  const handleConfirm = () => {
    if (!agreedToTerms) {
      return;
    }
    navigate("/dashboard/mock-interview/payment-redirect");
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Progress Stepper */}
      <div className="relative mx-auto mt-10 flex w-full max-w-4xl items-center justify-center">
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

        {/* Step 3: Xác nhận - Active */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-600">
            <FileText className="h-16 w-16 text-white" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Xác nhận
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto mt-16 flex max-w-5xl gap-8 px-6">
        {/* Left Column */}
        <div className="flex-1 space-y-6">
          {/* Mentor Info Card */}
          <div className="rounded-lg bg-white p-6 outline outline-1 outline-offset-[-1px] outline-gray-200">
            <h3 className="font-['Roboto'] text-lg font-bold text-gray-900">Thông tin Mentor</h3>

            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[32px] bg-gradient-to-br from-violet-400 to-blue-500">
                <User className="h-8 w-8 text-white" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-['Roboto'] text-xl font-bold text-gray-900">{mentor.name}</h4>
                  <div className="flex items-center gap-1 rounded-sm bg-amber-100 px-2 py-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="font-['Roboto'] text-sm font-medium text-amber-800">
                      {mentor.rating}
                    </span>
                  </div>
                </div>
                <p className="mt-1 font-['Roboto'] text-base font-normal text-gray-500">
                  {mentor.position} tại {mentor.company}
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                      Quản lý 10
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                      {mentor.totalSessions} buổi
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  {mentor.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-2xl bg-blue-100 px-3 py-1 font-['Roboto'] text-xs font-medium text-blue-800">
                      {skill}
                    </span>
                  ))}
                  {mentor.moreSkills > 0 && (
                    <span className="rounded-2xl bg-blue-100 px-3 py-1 font-['Roboto'] text-xs font-medium text-blue-800">
                      +{mentor.moreSkills}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Info Card */}
          <div className="rounded-lg bg-white p-6 outline outline-1 outline-offset-[-1px] outline-gray-200">
            <h3 className="font-['Roboto'] text-lg font-bold text-gray-900">Thông tin lịch hẹn</h3>

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
                  <p className="font-['Roboto'] text-base font-bold text-gray-900">Thứ Sáu</p>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-700">28/10/2025</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-500">Thời gian</p>
                  <p className="font-['Roboto'] text-base font-bold text-gray-900">14:00 - 15:00</p>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-700">(60 phút)</p>
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
                    Phỏng vấn Online
                  </p>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-700">Google Meet</p>
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
                    Technical Interview
                  </p>
                  <p className="font-['Roboto'] text-sm font-normal text-gray-700">
                    Backend Developer
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
                    <p className="font-['Inter'] text-sm font-bold text-gray-900">{method.name}</p>
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
                  {formatCurrency(booking.price)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-['Roboto'] text-base font-normal text-gray-700">
                  Phí dịch vụ
                </span>
                <span className="font-['Roboto'] text-base font-medium text-gray-700">
                  {formatCurrency(booking.serviceFee)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="font-['Roboto'] text-lg font-bold text-gray-900">Tổng cộng</span>
                <span className="font-['Roboto'] text-2xl font-bold text-violet-500">
                  {formatCurrency(booking.total)}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!agreedToTerms}
              className={`mt-6 flex h-10 w-full items-center justify-center rounded-lg ${
                agreedToTerms
                  ? "bg-violet-500 hover:bg-violet-600"
                  : "cursor-not-allowed bg-violet-300"
              }`}>
              <span className="font-['Inter'] text-xl font-medium text-white">
                Xác nhận đặt lịch
              </span>
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
