import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  LineChart,
  MessageSquare,
  Mic,
  Play,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Footer, Header } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";

const aiFeatures = [
  {
    id: 1,
    title: "Phản hồi thời gian thực",
    description:
      "Nhận phản hồi ngay lập tức về cách trả lời, giọng nói và ngôn ngữ cơ thể trong quá trình phỏng vấn.",
    icon: Zap,
  },
  {
    id: 2,
    title: "Phân tích ngôn ngữ",
    description:
      "AI phân tích từ ngữ, cấu trúc câu và mức độ chuyên nghiệp trong câu trả lời của bạn.",
    icon: MessageSquare,
  },
  {
    id: 3,
    title: "Đánh giá biểu cảm khuôn mặt",
    description:
      "Theo dõi biểu cảm, ánh mắt và ngôn ngữ cơ thể để cải thiện cách giao tiếp phi ngôn ngữ.",
    icon: Brain,
  },
  {
    id: 4,
    title: "Báo cáo chi tiết",
    description:
      "Nhận báo cáo đầy đủ với điểm số, gợi ý cải thiện và so sánh với các ứng viên khác.",
    icon: LineChart,
  },
];

const interviewModes = [
  {
    id: 1,
    title: "Chế độ văn bản",
    description: "Luyện tập viết câu trả lời với phản hồi chi tiết về nội dung và cấu trúc.",
    icon: MessageSquare,
    benefits: ["Tập trung vào nội dung", "Có thời gian suy nghĩ", "Dễ chỉnh sửa"],
  },
  {
    id: 2,
    title: "Chế độ giọng nói",
    description: "Luyện nói với AI và nhận phản hồi về giọng điệu, tốc độ và sự tự tin.",
    icon: Mic,
    benefits: ["Cải thiện phát âm", "Kiểm soát tốc độ nói", "Giảm từ đệm"],
  },
  {
    id: 3,
    title: "Chế độ video",
    description: "Trải nghiệm phỏng vấn chân thực với camera và phân tích ngôn ngữ cơ thể.",
    icon: Video,
    benefits: ["Thực tế nhất", "Phân tích biểu cảm", "Chuẩn bị toàn diện"],
  },
];

export function AIInterviewFeaturePage() {
  const { isLoggedIn, user } = useAuthStore();
  const ctaPath = isLoggedIn ? getDashboardPath(user?.role) : "/select-role";

  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-[#DCEEFF]/30 py-20 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-[#66B2FF]/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-20 h-72 w-72 rounded-full bg-[#A5C8F2]/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center gap-12 lg:flex-row">
            <div className="flex-1 text-center lg:text-left">
              <Badge
                variant="secondary"
                className="mb-4 bg-[#DCEEFF] text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]">
                <Bot className="mr-2 h-4 w-4" />
                AI Interview
              </Badge>
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl dark:text-white">
                Phỏng vấn với{" "}
                <span className="bg-gradient-to-r from-[#0047AB] to-[#007BFF] bg-clip-text text-transparent">
                  Trí tuệ nhân tạo
                </span>
              </h1>
              <p className="mb-8 text-lg text-slate-600 dark:text-slate-400">
                Luyện tập phỏng vấn 24/7 với AI tiên tiến. Nhận phản hồi tức thì, phân tích chi tiết
                và gợi ý cải thiện để bạn tự tin hơn trong buổi phỏng vấn thực.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="h-14 rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF] px-8"
                  asChild>
                  <Link to={ctaPath}>
                    <Play className="mr-2 h-5 w-5" />
                    {isLoggedIn ? "Mở Dashboard" : "Thử ngay miễn phí"}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero Image Card */}
            <div className="relative flex-1">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#66B2FF]/20 to-[#A5C8F2]/20 blur-2xl" />
              <Card className="relative overflow-hidden border-slate-200/50 shadow-2xl dark:border-slate-700">
                <CardContent className="flex h-80 flex-col items-center justify-center bg-gradient-to-br from-[#F0F8FF] to-[#DCEEFF] p-8 dark:from-slate-800 dark:to-slate-800/50">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0047AB] to-[#007BFF] shadow-lg">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                    AI Interviewer
                  </h3>
                  <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                    Sẵn sàng phỏng vấn bạn bất cứ lúc nào
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                    </span>
                    Đang hoạt động
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Tính năng AI
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Công nghệ AI tiên tiến
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.id}
                  className="text-center transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#DCEEFF] dark:bg-[#0047AB]/30">
                      <Icon className="h-7 w-7 text-[#0047AB] dark:text-[#66B2FF]" />
                    </div>
                    <CardTitle className="text-lg dark:text-white">{feature.title}</CardTitle>
                    <CardDescription className="dark:text-slate-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interview Modes */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Chế độ phỏng vấn
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Chọn cách luyện tập của bạn
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {interviewModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Card
                  key={mode.id}
                  className="transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DCEEFF] dark:bg-[#0047AB]/30">
                      <Icon className="h-8 w-8 text-[#0047AB] dark:text-[#66B2FF]" />
                    </div>
                    <CardTitle className="text-xl dark:text-white">{mode.title}</CardTitle>
                    <CardDescription className="dark:text-slate-400">
                      {mode.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {mode.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 text-center md:grid-cols-4">
            <div>
              <div className="text-4xl font-bold text-white">24/7</div>
              <div className="mt-2 text-[#A5C8F2]">Luyện tập mọi lúc</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">90%</div>
              <div className="mt-2 text-[#A5C8F2]">Độ chính xác AI</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">1,500+</div>
              <div className="mt-2 text-[#A5C8F2]">Câu hỏi phỏng vấn</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">50K+</div>
              <div className="mt-2 text-[#A5C8F2]">Người dùng tin tưởng</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-[#0047AB] dark:text-[#66B2FF]" />
          <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
            Bắt đầu phỏng vấn với AI ngay hôm nay
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-slate-600 dark:text-slate-400">
            Đăng ký miễn phí và nhận 3 buổi phỏng vấn AI miễn phí. Không cần thẻ tín dụng.
          </p>
          <Button
            size="lg"
            className="rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF] px-8"
            asChild>
            <Link to={ctaPath}>
              {isLoggedIn ? "Mở Dashboard" : "Đăng ký miễn phí"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
