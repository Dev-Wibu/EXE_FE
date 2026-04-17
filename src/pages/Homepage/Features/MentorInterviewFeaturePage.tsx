import {
  ArrowRight,
  Award,
  Calendar,
  Clock,
  MessageSquare,
  Play,
  Star,
  Users,
  Video,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Footer, Header } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";

const mentorBenefits = [
  {
    id: 1,
    title: "Phản hồi từ chuyên gia",
    description:
      "Nhận phản hồi chi tiết và cá nhân hóa từ mentor có nhiều năm kinh nghiệm phỏng vấn.",
    icon: MessageSquare,
  },
  {
    id: 2,
    title: "Mô phỏng thực tế",
    description: "Trải nghiệm buổi phỏng vấn như thật với video call và câu hỏi ngành cụ thể.",
    icon: Video,
  },
  {
    id: 3,
    title: "Lịch linh hoạt",
    description: "Đặt lịch phỏng vấn vào thời gian phù hợp với bạn, 7 ngày trong tuần.",
    icon: Calendar,
  },
  {
    id: 4,
    title: "Đánh giá STAR",
    description: "Nhận đánh giá chi tiết theo phương pháp STAR cho từng câu trả lời của bạn.",
    icon: Award,
  },
];

const featuredMentors = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    title: "Senior Software Engineer",
    company: "Google",
    experience: "8 năm",
    rating: 4.9,
    sessions: 150,
    expertise: ["System Design", "Algorithms", "Backend"],
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    title: "Data Science Lead",
    company: "Microsoft",
    experience: "6 năm",
    rating: 4.8,
    sessions: 120,
    expertise: ["Machine Learning", "Data Analysis", "Python"],
  },
  {
    id: 3,
    name: "Lê Minh Châu",
    title: "Product Manager",
    company: "Meta",
    experience: "7 năm",
    rating: 4.9,
    sessions: 180,
    expertise: ["Product Strategy", "User Research", "Agile"],
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Chọn mentor",
    description: "Duyệt qua danh sách mentor và chọn người phù hợp với ngành và vị trí của bạn.",
  },
  {
    step: 2,
    title: "Đặt lịch",
    description: "Chọn thời gian phù hợp trong lịch của mentor và xác nhận buổi phỏng vấn.",
  },
  {
    step: 3,
    title: "Phỏng vấn",
    description: "Tham gia buổi phỏng vấn mô phỏng qua video call với mentor.",
  },
  {
    step: 4,
    title: "Nhận feedback",
    description: "Nhận đánh giá chi tiết, điểm mạnh, điểm yếu và gợi ý cải thiện từ mentor.",
  },
];

export function MentorInterviewFeaturePage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const dashboardPath = isLoggedIn ? getDashboardPath(user?.role) : "/login";
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
                <Users className="mr-2 h-4 w-4" />
                Mock Interview
              </Badge>
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl dark:text-white">
                Phỏng vấn với{" "}
                <span className="bg-gradient-to-r from-[#0047AB] to-[#007BFF] bg-clip-text text-transparent">
                  Mentor chuyên nghiệp
                </span>
              </h1>
              <p className="mb-8 text-lg text-slate-600 dark:text-slate-400">
                Luyện tập với các chuyên gia từ Google, Microsoft, Meta và nhiều công ty hàng đầu.
                Nhận feedback chi tiết và cá nhân hóa để cải thiện kỹ năng phỏng vấn.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="h-14 rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF] px-8"
                  asChild>
                  <Link to={ctaPath}>
                    <Play className="mr-2 h-5 w-5" />
                    {isLoggedIn ? "Mở Dashboard" : "Đặt lịch ngay"}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Featured Mentor Card */}
            <div className="relative flex-1">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#66B2FF]/20 to-[#A5C8F2]/20 blur-2xl" />
              <Card className="relative overflow-hidden border-slate-200/50 shadow-2xl dark:border-slate-700">
                <CardContent className="p-0">
                  <div className="flex h-80 flex-col items-center justify-center bg-gradient-to-br from-[#F0F8FF] to-[#DCEEFF] p-8 dark:from-slate-800 dark:to-slate-800/50">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0047AB] to-[#007BFF] shadow-lg">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                      50+ Mentor chuyên nghiệp
                    </h3>
                    <p className="mb-4 text-center text-sm text-slate-600 dark:text-slate-400">
                      Từ các công ty hàng đầu thế giới
                    </p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        4.9/5
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Lợi ích
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Tại sao chọn Mock Interview?
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {mentorBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={benefit.id}
                  className="text-center transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#DCEEFF] dark:bg-[#0047AB]/30">
                      <Icon className="h-7 w-7 text-[#0047AB] dark:text-[#66B2FF]" />
                    </div>
                    <CardTitle className="text-lg dark:text-white">{benefit.title}</CardTitle>
                    <CardDescription className="dark:text-slate-400">
                      {benefit.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Mentors */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Mentor nổi bật
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Học từ những người giỏi nhất
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {featuredMentors.map((mentor) => (
              <Card
                key={mentor.id}
                className="transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
                    <span className="text-2xl font-bold text-white">{mentor.name.charAt(0)}</span>
                  </div>
                  <CardTitle className="text-lg dark:text-white">{mentor.name}</CardTitle>
                  <CardDescription className="dark:text-slate-400">
                    {mentor.title} tại {mentor.company}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium dark:text-white">{mentor.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Clock className="h-4 w-4" />
                      {mentor.experience}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Video className="h-4 w-4" />
                      {mentor.sessions}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {mentor.expertise.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs dark:bg-slate-700 dark:text-slate-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full dark:border-slate-700"
              onClick={() => navigate(dashboardPath)}>
              Xem tất cả mentor
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Quy trình
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Cách thức hoạt động
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0047AB] to-[#007BFF] text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Sẵn sàng phỏng vấn với mentor?</h2>
          <p className="mx-auto mb-8 max-w-xl text-[#A5C8F2]">
            Đăng ký ngay và đặt lịch phỏng vấn đầu tiên với mentor chuyên nghiệp.
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
