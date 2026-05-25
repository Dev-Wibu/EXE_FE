import {
  ArrowRight,
  BookCheck,
  Brain,
  CheckCircle2,
  Clock,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { HomepageHeader } from "@/components/homepage-redesign";
import { Footer } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";

const interviewTips = [
  {
    id: 1,
    title: "Phương pháp STAR",
    description:
      "Học cách trả lời câu hỏi hành vi với Situation (Tình huống), Task (Nhiệm vụ), Action (Hành động), Result (Kết quả).",
    icon: Target,
    category: "Behavioral",
    readTime: "5 phút",
  },
  {
    id: 2,
    title: "Nghiên cứu công ty",
    description:
      "Tìm hiểu kỹ về công ty, văn hóa, sản phẩm và đối thủ cạnh tranh trước khi phỏng vấn.",
    icon: BookCheck,
    category: "Chuẩn bị",
    readTime: "8 phút",
  },
  {
    id: 3,
    title: "Ngôn ngữ cơ thể",
    description:
      "Tầm quan trọng của giao tiếp phi ngôn ngữ: ánh mắt, tư thế, cử chỉ tay và nụ cười.",
    icon: Users,
    category: "Kỹ năng mềm",
    readTime: "6 phút",
  },
  {
    id: 4,
    title: "Xử lý câu hỏi khó",
    description:
      "Chiến lược đối phó với những câu hỏi bất ngờ và cách giữ bình tĩnh trong tình huống áp lực.",
    icon: Brain,
    category: "Kỹ năng",
    readTime: "7 phút",
  },
  {
    id: 5,
    title: "Đàm phán lương",
    description:
      "Cách nghiên cứu mức lương thị trường và kỹ năng đàm phán để đạt được offer tốt nhất.",
    icon: TrendingUp,
    category: "Đàm phán",
    readTime: "10 phút",
  },
  {
    id: 6,
    title: "Câu hỏi cho nhà tuyển dụng",
    description:
      "Danh sách câu hỏi thông minh để hỏi nhà tuyển dụng, thể hiện sự quan tâm và hiểu biết.",
    icon: MessageSquare,
    category: "Chiến lược",
    readTime: "5 phút",
  },
];

const quickTips = [
  "Đến sớm 10-15 phút trước giờ phỏng vấn",
  "Mang theo bản sao CV và portfolio",
  "Tắt điện thoại hoặc để chế độ im lặng",
  "Ăn mặc chuyên nghiệp và phù hợp với văn hóa công ty",
  "Chuẩn bị câu hỏi để hỏi nhà tuyển dụng",
  "Gửi email cảm ơn sau buổi phỏng vấn",
];

export function InterviewTipsPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const dashboardPath = isLoggedIn ? getDashboardPath(user?.role) : "/login";
  const ctaPath = isLoggedIn ? getDashboardPath(user?.role) : "/select-role";

  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950">
      <HomepageHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-[#DCEEFF]/30 py-16 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-[#66B2FF]/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-20 h-72 w-72 rounded-full bg-[#A5C8F2]/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <Badge
              variant="secondary"
              className="mb-4 bg-[#DCEEFF] text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]">
              <Lightbulb className="mr-2 h-4 w-4" />
              Mẹo phỏng vấn
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl dark:text-white">
              Bí quyết phỏng vấn thành công
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Tổng hợp những mẹo và chiến lược phỏng vấn hiệu quả nhất từ các chuyên gia tuyển dụng
              hàng đầu.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Tips Banner */}
      <section className="border-b bg-[#DCEEFF]/50 py-8 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <Clock className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
            Mẹo nhanh cho ngày phỏng vấn
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickTips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips Cards */}
      <section className="py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-white">
            Hướng dẫn chi tiết
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {interviewTips.map((tip) => {
              const Icon = tip.icon;
              return (
                <Card
                  key={tip.id}
                  className="group cursor-pointer transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCEEFF] transition-colors group-hover:bg-[#A5C8F2] dark:bg-[#0047AB]/30 dark:group-hover:bg-[#0047AB]/50">
                        <Icon className="h-6 w-6 text-[#0047AB] dark:text-[#66B2FF]" />
                      </div>
                      <Badge variant="outline" className="text-xs dark:border-slate-600">
                        {tip.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg dark:text-white">{tip.title}</CardTitle>
                    <CardDescription className="dark:text-slate-400">
                      {tip.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <Clock className="h-4 w-4" />
                        {tip.readTime}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#0047AB] dark:text-[#66B2FF]"
                        onClick={() => navigate(dashboardPath)}>
                        Đọc thêm
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-white/80" />
          <h2 className="mb-4 text-3xl font-bold text-white">
            Sẵn sàng cho buổi phỏng vấn tiếp theo?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-[#A5C8F2]">
            Đăng ký để luyện tập với AI và nhận phản hồi chi tiết về kỹ năng phỏng vấn của bạn.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full bg-white text-[#0047AB] hover:bg-slate-100"
              asChild>
              <Link to={ctaPath}>{isLoggedIn ? "Mở Dashboard" : "Bắt đầu luyện tập"}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
