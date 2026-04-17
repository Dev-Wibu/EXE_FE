import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Code,
  Database,
  Filter,
  Megaphone,
  Palette,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Footer, Header } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";

const questionCategories = [
  {
    id: 1,
    name: "Kỹ thuật phần mềm",
    icon: Code,
    count: 450,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: 2,
    name: "Khoa học dữ liệu",
    icon: Database,
    count: 280,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    id: 3,
    name: "Marketing",
    icon: Megaphone,
    count: 150,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    id: 4,
    name: "Quản lý sản phẩm",
    icon: Briefcase,
    count: 200,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    id: 5,
    name: "Thiết kế UI/UX",
    icon: Palette,
    count: 180,
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  },
  {
    id: 6,
    name: "Phân tích tài chính",
    icon: BarChart3,
    count: 120,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
];

const trendingQuestions = [
  {
    id: 1,
    question: "Hãy giới thiệu về bản thân bạn",
    category: "Behavioral",
    difficulty: "Easy",
    views: 15420,
  },
  {
    id: 2,
    question: "Điểm mạnh và điểm yếu lớn nhất của bạn là gì?",
    category: "Behavioral",
    difficulty: "Medium",
    views: 12350,
  },
  {
    id: 3,
    question: "Tại sao bạn muốn làm việc tại công ty chúng tôi?",
    category: "Behavioral",
    difficulty: "Medium",
    views: 11280,
  },
  {
    id: 4,
    question: "Hãy kể về một dự án mà bạn tự hào nhất",
    category: "Behavioral",
    difficulty: "Medium",
    views: 9850,
  },
  {
    id: 5,
    question: "Bạn xử lý xung đột trong nhóm như thế nào?",
    category: "Behavioral",
    difficulty: "Hard",
    views: 8920,
  },
];

const difficultyColors: Record<string, string> = {
  Easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function QuestionBankPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const dashboardPath = isLoggedIn ? getDashboardPath(user?.role) : "/login";
  const ctaPath = isLoggedIn ? getDashboardPath(user?.role) : "/select-role";

  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950">
      <Header />

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
              <BookOpen className="mr-2 h-4 w-4" />
              Ngân hàng câu hỏi
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl dark:text-white">
              Hơn 1,500+ câu hỏi phỏng vấn
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Khám phá bộ sưu tập câu hỏi phỏng vấn thực tế từ hơn 530 công ty hàng đầu. Luyện tập
              và chuẩn bị cho mọi vị trí công việc.
            </p>

            {/* Search Bar */}
            <div className="mx-auto flex max-w-xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm câu hỏi..."
                  className="h-12 pl-10 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <Button variant="outline" className="h-12 gap-2 dark:border-slate-700">
                <Filter className="h-4 w-4" />
                Lọc
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-white">
            Danh mục câu hỏi
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {questionCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className="group cursor-pointer transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-xl ${category.color}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {category.count} câu hỏi
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Questions */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#0047AB] dark:text-[#66B2FF]" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Câu hỏi phổ biến nhất
              </h2>
            </div>
            <Button
              variant="ghost"
              className="text-[#0047AB] dark:text-[#66B2FF]"
              onClick={() => navigate(dashboardPath)}>
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {trendingQuestions.map((item, index) => (
              <Card
                key={item.id}
                className="group cursor-pointer transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCEEFF] font-bold text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">{item.question}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs dark:border-slate-600">
                        {item.category}
                      </Badge>
                      <Badge className={`text-xs ${difficultyColors[item.difficulty]}`}>
                        {item.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                    <Star className="h-4 w-4" />
                    {item.views.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Bắt đầu luyện tập ngay hôm nay</h2>
          <p className="mx-auto mb-8 max-w-xl text-[#A5C8F2]">
            Đăng ký miễn phí để truy cập hơn 1,500 câu hỏi phỏng vấn và nhận phản hồi chi tiết từ
            AI.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full bg-white text-[#0047AB] hover:bg-slate-100"
              asChild>
              <Link to={ctaPath}>{isLoggedIn ? "Mở Dashboard" : "Đăng ký miễn phí"}</Link>
            </Button>
            {!isLoggedIn && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white text-white hover:bg-white/10"
                asChild>
                <Link to="/login">Đăng nhập</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
