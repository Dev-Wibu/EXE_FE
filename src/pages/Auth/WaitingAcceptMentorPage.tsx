import { CheckCircle, Clock, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function WaitingAcceptMentorPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="h-40 w-full overflow-hidden bg-gradient-to-r from-white via-slate-50 to-sky-100">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-28 w-40 items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-blue-800" />
            </div>
            <span className="font-['Orelega_One'] text-2xl font-normal text-blue-800">
              AI INTERVIEW
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <span className="font-['Open_Sans'] text-xl font-normal text-neutral-900">Câu hỏi</span>
            <span className="font-['Open_Sans'] text-xl font-normal text-neutral-900">
              Tính năng
            </span>
            <span className="font-['Open_Sans'] text-xl font-normal text-neutral-900">
              Tài nguyên
            </span>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="flex h-12 w-36 items-center justify-center rounded-2xl border border-black/20 bg-white font-['Open_Sans'] text-2xl font-normal text-neutral-900">
              Đăng nhập
            </Link>
            <button className="flex h-12 w-44 items-center justify-center rounded-2xl bg-violet-600 font-['Open_Sans'] text-xl font-normal text-white">
              Bắt đầu
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex justify-center px-4 py-12">
        <div className="w-full max-w-[800px] rounded-2xl bg-white p-10 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.10)]">
          {/* Clock Icon */}
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
            <Clock className="h-16 w-16 text-amber-600" />
          </div>

          {/* Title */}
          <h1 className="mt-8 text-center font-['Roboto'] text-3xl font-bold text-gray-800">
            Đơn đăng ký đang được xem xét
          </h1>

          {/* Description */}
          <p className="mt-4 text-center font-['Roboto'] text-base leading-6 font-normal text-gray-500">
            Cảm ơn bạn đã đăng ký trở thành Mentor tại INBLUE Interview. Đơn đăng ký của bạn đang
            được đội
            <br />
            ngũ của chúng tôi xem xét kỹ lưỡng.
          </p>

          {/* Info Box */}
          <div className="mx-auto mt-8 rounded-xl bg-gray-50 p-6">
            {/* Review Time */}
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-amber-600" />
              <p className="font-['Roboto'] text-base font-normal text-gray-700">
                Thời gian xét duyệt: <span className="font-bold text-gray-800">24-48 giờ</span>
              </p>
            </div>

            {/* Email Notification */}
            <div className="mt-4 flex items-center gap-4">
              <Mail className="h-5 w-5 text-amber-600" />
              <p className="font-['Roboto'] text-base font-normal text-gray-700">
                Chúng tôi sẽ gửi email thông báo kết quả
              </p>
            </div>

            {/* Check Email */}
            <div className="mt-4 flex items-center gap-4">
              <CheckCircle className="h-5 w-5 text-amber-600" />
              <p className="font-['Roboto'] text-base font-normal text-gray-700">
                Kiểm tra email thường xuyên để không bỏ lỡ thông báo
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-10 space-y-0">
            {/* Step 1: Submitted */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full border-4 border-white bg-emerald-500" />
                <div className="h-10 w-0.5 bg-gray-200" />
              </div>
              <div>
                <h3 className="font-['Roboto'] text-base font-bold text-gray-800">Đã nộp đơn</h3>
                <p className="font-['Roboto'] text-sm font-normal text-gray-500">
                  Đơn đăng ký của bạn đã được gửi thành công
                </p>
              </div>
            </div>

            {/* Step 2: Reviewing */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full border-4 border-white bg-amber-600" />
                <div className="h-10 w-0.5 bg-gray-200" />
              </div>
              <div>
                <h3 className="font-['Roboto'] text-base font-bold text-gray-800">Đang xem xét</h3>
                <p className="font-['Roboto'] text-sm font-normal text-gray-500">
                  Chúng tôi đang xem xét hồ sơ của bạn
                </p>
              </div>
            </div>

            {/* Step 3: Result */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full border-4 border-white bg-gray-200" />
              </div>
              <div>
                <h3 className="font-['Roboto'] text-base font-bold text-gray-800">
                  Thông báo kết quả
                </h3>
                <p className="font-['Roboto'] text-sm font-normal text-gray-500">
                  Bạn sẽ nhận được email thông báo
                </p>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-10 flex justify-center">
            <Link
              to="/"
              className="flex h-11 w-96 items-center justify-center rounded-lg bg-white font-['Inter'] text-base font-bold text-gray-700 outline outline-2 outline-offset-[-2px] outline-gray-300 transition-colors hover:bg-gray-50">
              Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
