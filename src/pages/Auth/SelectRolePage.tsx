import { Check, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Footer, Header } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";

export function SelectRolePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Check if user is already a mentor (role === "MENTOR" or "mentor")
  const isMentor = user?.role?.toUpperCase() === "MENTOR" || user?.role?.toLowerCase() === "mentor";

  const handleUserSelect = () => {
    // Navigate to user registration/signup
    navigate("/signup?role=user");
  };

  const handleMentorSelect = () => {
    if (isMentor) {
      // If user is already a mentor, go directly to mentor dashboard
      navigate("/mentor");
    } else {
      // Navigate to mentor registration
      navigate("/mentor-register");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50/50 to-[#DCEEFF]/30">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Title Section */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Chào mừng đến với{" "}
            <span className="bg-gradient-to-r from-[#0047AB] to-[#007BFF] bg-clip-text text-transparent">
              INBLUE AI Interview
            </span>
          </h1>
          <p className="mt-3 text-lg text-slate-600">Vui lòng chọn vai trò của bạn để tiếp tục</p>
        </div>

        {/* Role Cards */}
        <div className="flex w-full max-w-4xl flex-col gap-6 md:flex-row">
          {/* User Card */}
          <Card className="flex-1 transition-all hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0047AB]/10">
                <User className="h-8 w-8 text-[#0047AB]" />
              </div>
              <CardTitle className="mt-4">Người dùng</CardTitle>
              <CardDescription>
                Tham gia phỏng vấn với AI và các mentor chuyên nghiệp để nâng cao kỹ năng của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <BenefitItem text="Luyện tập phỏng vấn với AI thông minh" />
                <BenefitItem text="Nhận feedback chi tiết từ mentor" />
                <BenefitItem text="Theo dõi tiến độ học tập" />
              </div>
              <Button className="w-full" onClick={handleUserSelect}>
                Bắt đầu ngay
              </Button>
            </CardContent>
          </Card>

          {/* Mentor Card */}
          <Card className="flex-1 transition-all hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="mt-4">Mentor</CardTitle>
              <CardDescription>
                {isMentor
                  ? "Truy cập trang quản lý mentor của bạn"
                  : "Chia sẻ kinh nghiệm và giúp đỡ người khác phát triển sự nghiệp của họ"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {isMentor ? (
                  <>
                    <BenefitItem text="Quản lý phiên phỏng vấn" />
                    <BenefitItem text="Xem đánh giá từ học viên" />
                    <BenefitItem text="Theo dõi thu nhập" />
                  </>
                ) : (
                  <>
                    <BenefitItem text="Hỗ trợ người học trên toàn quốc" />
                    <BenefitItem text="Linh hoạt thời gian làm việc" />
                    <BenefitItem text="Nhận thu nhập hấp dẫn" />
                  </>
                )}
              </div>
              <Button
                variant={isMentor ? "default" : "outline"}
                className={isMentor ? "w-full bg-emerald-600 hover:bg-emerald-700" : "w-full"}
                onClick={handleMentorSelect}>
                {isMentor ? "Vào trang Mentor" : "Đăng ký Mentor"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
        <Check className="h-3 w-3 text-emerald-600" />
      </div>
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  );
}
