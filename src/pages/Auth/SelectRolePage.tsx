import { Check, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SelectRolePage() {
  const navigate = useNavigate();

  const handleUserSelect = () => {
    // Navigate to user dashboard
    navigate("/dashboard");
  };

  const handleMentorSelect = () => {
    // Navigate to mentor registration
    navigate("/mentor-register");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50">
      {/* Logo */}
      <div className="flex justify-center pt-12">
        <div className="h-48 w-64" />
      </div>

      {/* Title Section */}
      <div className="mt-4 text-center">
        <h1 className="font-['Roboto'] text-4xl font-bold">
          <span className="text-gray-800">Chào mừng đến với </span>
          <span className="text-violet-600">INBLUE AI Interview</span>
        </h1>
        <p className="mt-4 font-['Roboto'] text-lg font-normal text-gray-500">
          Vui lòng chọn vai trò của bạn để tiếp tục
        </p>
      </div>

      {/* Role Cards */}
      <div className="mx-auto mt-10 flex max-w-7xl justify-center gap-8 px-4">
        {/* User Card */}
        <div className="w-[584px] rounded-2xl bg-white p-8 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.10)]">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <User className="h-10 w-10 text-blue-600" />
          </div>

          {/* Title */}
          <h2 className="mt-6 text-center font-['Roboto'] text-2xl font-bold text-gray-800">
            Người dùng
          </h2>

          {/* Description */}
          <p className="mt-4 text-center font-['Roboto'] text-base leading-6 font-normal text-gray-500">
            Tham gia phỏng vấn với AI và các mentor chuyên nghiệp để nâng cao kỹ năng của bạn
          </p>

          {/* Benefits */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-4 w-4 items-center justify-center">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                Luyện tập phỏng vấn với AI thông minh
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-4 w-4 items-center justify-center">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                Nhận feedback chi tiết từ mentor
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-4 w-4 items-center justify-center">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                Theo dõi tiến độ học tập
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleUserSelect}
            className="mt-8 h-10 w-full rounded-lg bg-blue-600 font-['Inter'] text-base font-bold text-white transition-opacity hover:opacity-90">
            Bắt đầu ngay
          </button>
        </div>

        {/* Mentor Card */}
        <div className="w-[584px] rounded-2xl bg-white p-8 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.10)]">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
            <Users className="h-10 w-10 text-violet-600" />
          </div>

          {/* Title */}
          <h2 className="mt-6 text-center font-['Roboto'] text-2xl font-bold text-gray-800">
            Mentor
          </h2>

          {/* Description */}
          <p className="mt-4 text-center font-['Roboto'] text-base leading-6 font-normal text-gray-500">
            Chia sẻ kinh nghiệm và giúp đỡ người khác phát triển sự nghiệp của họ
          </p>

          {/* Benefits */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-4 w-4 items-center justify-center">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                Hỗ trợ người học trên toàn quốc
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-4 w-4 items-center justify-center">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                Linh hoạt thời gian làm việc
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-4 w-4 items-center justify-center">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="font-['Roboto'] text-sm font-normal text-gray-500">
                Nhận thu nhập hấp dẫn
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleMentorSelect}
            className="mt-8 h-10 w-full rounded-lg bg-violet-600 font-['Inter'] text-base font-bold text-white transition-opacity hover:opacity-90">
            Đăng ký Mentor
          </button>
        </div>
      </div>
    </div>
  );
}
