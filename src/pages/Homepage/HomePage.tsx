import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Code,
  Database,
  FileText,
  Megaphone,
  Mic,
  Palette,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";

import image2 from "@/assets/image2.svg";
import image3 from "@/assets/image3.svg";
import image4 from "@/assets/image4.svg";

import {
  CompanyGridSection,
  EnhancedStatsSection,
  HomepageFooter,
  HomepageHeader,
  HomepageHero,
  JobSearchSection,
} from "@/components/homepage-redesign";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestimonialCarousel } from "@/components/ui/testimonial-carousel";
import { homepageFeatures, homepageInterviewModes, homepageJobRoles } from "@/constants/homepage";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";

const jobRoleIcons: Record<string, React.ReactNode> = {
  code: <Code className="h-9 w-9 text-[#0047AB]" />,
  database: <Database className="h-9 w-9 text-[#0047AB]" />,
  megaphone: <Megaphone className="h-9 w-9 text-[#0047AB]" />,
  briefcase: <Briefcase className="h-9 w-9 text-[#0047AB]" />,
  palette: <Palette className="h-9 w-9 text-[#0047AB]" />,
  chart: <BarChart3 className="h-9 w-9 text-[#0047AB]" />,
};

export function HomePage() {
  const { isLoggedIn, user } = useAuthStore();
  const ctaPath = isLoggedIn ? getDashboardPath(user?.role) : "/select-role";
  const loginPath = isLoggedIn ? getDashboardPath(user?.role) : "/login";

  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950">
      {/* Header - Homepage Redesign with 3 main menus */}
      <HomepageHeader />

      {/* Hero Section - New design from Stitch */}
      <HomepageHero />

      {/* Job Roles Section */}
      <section className="relative w-full bg-white py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Đa dạng vị trí
            </Badge>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl dark:text-white">
              Chuẩn bị cho mọi vị trí công việc
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Hơn 1000 câu hỏi phỏng vấn thực tế từ hơn 530 công ty hàng đầu
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {homepageJobRoles.map((role) => (
              <Card
                key={role.id}
                className="group cursor-pointer border-slate-200 transition-all hover:border-[#007BFF]/50 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="flex flex-col items-center justify-center p-5">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#DCEEFF] transition-colors group-hover:bg-[#A5C8F2] dark:bg-[#0047AB]/30 dark:group-hover:bg-[#0047AB]/50">
                    {jobRoleIcons[role.icon]}
                  </div>
                  <span className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {role.name}
                  </span>
                </CardContent>
              </Card>
            ))}
            <Link to={loginPath}>
              <Card className="group h-full cursor-pointer border-dashed border-slate-300 transition-all hover:border-[#007BFF] dark:border-slate-600 dark:bg-slate-800">
                <CardContent className="flex h-full flex-col items-center justify-center p-5">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
                    <ArrowRight className="h-6 w-6 text-slate-400 group-hover:text-[#0047AB] dark:group-hover:text-[#66B2FF]" />
                  </div>
                  <span className="text-center text-sm font-semibold text-slate-500 group-hover:text-[#0047AB] dark:text-slate-400 dark:group-hover:text-[#66B2FF]">
                    Xem tất cả
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Job Search Section with 3D hover effect */}
      <JobSearchSection />

      {/* Features Section */}
      <section className="relative w-full bg-slate-50 py-16 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Tính năng
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl dark:text-white">
              Mọi thứ bạn cần để thành công
            </h2>
          </div>

          <div className="space-y-16">
            {/* Feature 1 - AI Simulation */}
            <div className="flex flex-col items-center gap-10 lg:flex-row">
              <div className="relative flex-1">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#DCEEFF] to-[#A5C8F2] blur-xl dark:from-[#0047AB]/30 dark:to-[#007BFF]/30" />
                <Card className="relative overflow-hidden dark:border-slate-700">
                  <CardContent className="relative h-72 overflow-hidden bg-gradient-to-br from-[#F0F8FF] to-[#DCEEFF] p-0 dark:from-slate-800 dark:to-slate-800/50">
                    <img
                      src={image2}
                      alt="Trải nghiệm cá nhân hóa"
                      className="h-full w-full object-cover"
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="flex-1 space-y-4">
                <Badge className="bg-[#DCEEFF] text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                  {homepageFeatures[0].title}
                </Badge>
                <h3 className="text-xl font-bold text-slate-900 lg:text-2xl dark:text-white">
                  {homepageFeatures[0].headline}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {homepageFeatures[0].description}
                </p>
                <Button
                  className="mt-4 rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF]"
                  asChild>
                  <Link to={ctaPath}>
                    {homepageFeatures[0].cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Feature 2 - Trending Questions */}
            <div className="flex flex-col-reverse items-center gap-10 lg:flex-row">
              <div className="flex-1 space-y-4">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {homepageFeatures[1].title}
                </Badge>
                <h3 className="text-xl font-bold text-slate-900 lg:text-2xl dark:text-white">
                  {homepageFeatures[1].headline}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {homepageFeatures[1].description}
                </p>
                <Button
                  className="mt-4 rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF]"
                  asChild>
                  <Link to={ctaPath}>
                    {homepageFeatures[1].cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative flex-1">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-green-100 to-emerald-100 blur-xl dark:from-green-900/30 dark:to-emerald-900/30" />
                <Card className="relative overflow-hidden dark:border-slate-700">
                  <CardContent className="relative h-72 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 p-0 dark:from-slate-800 dark:to-slate-800/50">
                    <img
                      src={image3}
                      alt="Làm chủ các câu hỏi thực tế"
                      className="h-full w-full object-cover"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Feature 3 - Job Description Practice */}
            <div className="flex flex-col items-center gap-10 lg:flex-row">
              <div className="relative flex-1">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#66B2FF]/30 to-[#A5C8F2]/30 blur-xl dark:from-[#0047AB]/20 dark:to-[#007BFF]/20" />
                <Card className="relative overflow-hidden dark:border-slate-700">
                  <CardContent className="relative h-72 overflow-hidden bg-gradient-to-br from-[#F0F8FF] to-[#DCEEFF] p-0 dark:from-slate-800 dark:to-slate-800/50">
                    <img
                      src={image4}
                      alt="Thực hành từ mô tả công việc"
                      className="h-full w-full object-cover"
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="flex-1 space-y-4">
                <Badge className="bg-[#DCEEFF] text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                  {homepageFeatures[2].title}
                </Badge>
                <h3 className="text-xl font-bold text-slate-900 lg:text-2xl dark:text-white">
                  {homepageFeatures[2].headline}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {homepageFeatures[2].description}
                </p>
                <Button
                  className="mt-4 rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF]"
                  asChild>
                  <Link to={ctaPath}>
                    {homepageFeatures[2].cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Grid Section */}
      <CompanyGridSection />

      {/* Enhanced Stats Section */}
      <EnhancedStatsSection />

      {/* Interview Styles Section */}
      <section className="relative w-full bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Chế độ phỏng vấn
            </Badge>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl dark:text-white">
              Chọn phong cách phỏng vấn của bạn
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Thực hành phỏng vấn theo cách phù hợp nhất với bạn. Tất cả các chế độ đều cung cấp
              phản hồi chất lượng như nhau.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {homepageInterviewModes.map((mode) => (
              <Card
                key={mode.id}
                className="group cursor-pointer transition-all hover:border-[#007BFF]/50 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-[#DCEEFF] transition-colors group-hover:bg-[#A5C8F2] dark:bg-[#0047AB]/30 dark:group-hover:bg-[#0047AB]/50">
                    {mode.icon === "text" && (
                      <FileText className="h-7 w-7 text-[#0047AB] dark:text-[#66B2FF]" />
                    )}
                    {mode.icon === "mic" && (
                      <Mic className="h-7 w-7 text-[#0047AB] dark:text-[#66B2FF]" />
                    )}
                    {mode.icon === "video" && (
                      <Video className="h-7 w-7 text-[#0047AB] dark:text-[#66B2FF]" />
                    )}
                  </div>
                  <CardTitle className="text-lg dark:text-white">{mode.title}</CardTitle>
                  <CardDescription className="text-xs dark:text-slate-400">
                    {mode.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {mode.benefits.map((benefit, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative w-full bg-slate-50 py-16 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Đánh giá
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl dark:text-white">
              Mọi người nói gì về chúng tôi
            </h2>
          </div>
          <div className="mt-8">
            <TestimonialCarousel
              testimonials={[
                {
                  id: 1,
                  name: "Nguyễn Phạm Thu Hà",
                  role: "Software Engineering",
                  content:
                    "I always felt confident about coding, but behavioral questions were a different story. AMA Interview helped me practice clear, impactful answers using the STAR method. It gave me the confidence to handle even the toughest behavioral rounds.",
                  avatar: null,
                  rating: 5,
                },
                {
                  id: 2,
                  name: "Trần Minh Đức",
                  role: "Data Science",
                  content:
                    "The AI interview practice sessions were incredibly helpful. I could practice anytime, anywhere, and the feedback was detailed and actionable. After two weeks of practice, I landed my dream job at a top tech company.",
                  avatar: null,
                  rating: 5,
                },
                {
                  id: 3,
                  name: "Lê Thị Mai Anh",
                  role: "Product Management",
                  content:
                    "As a PM transitioning from engineering, I needed help with product sense questions. InBlue Interview's curated questions and AI feedback helped me understand what interviewers look for. Highly recommend!",
                  avatar: null,
                  rating: 5,
                },
                {
                  id: 4,
                  name: "Phạm Văn Hùng",
                  role: "Frontend Developer",
                  content:
                    "Tôi đã chuẩn bị rất nhiều cho các buổi phỏng vấn kỹ thuật nhưng vẫn thất bại. InBlue AI đã giúp tôi thực hành với các câu hỏi thực tế và nhận feedback chi tiết. Sau 1 tháng, tôi đã nhận được offer từ công ty mơ ước!",
                  avatar: null,
                  rating: 5,
                },
                {
                  id: 5,
                  name: "Hoàng Thị Linh",
                  role: "UX Designer",
                  content:
                    "Các câu hỏi phỏng vấn thiết kế rất khó tìm trên mạng. InBlue AI cung cấp những câu hỏi thực tế từ các công ty lớn và hướng dẫn cách trả lời hiệu quả. Tuyệt vời!",
                  avatar: null,
                  rating: 4,
                },
                {
                  id: 6,
                  name: "Ngô Đình Khoa",
                  role: "Backend Engineer",
                  content:
                    "AI Interview giúp tôi tự tin hơn rất nhiều khi trả lời các câu hỏi behavioral. Feedback chi tiết và gợi ý cải thiện rất hữu ích. Đã recommend cho tất cả bạn bè!",
                  avatar: null,
                  rating: 5,
                },
              ]}
              speed={40}
              pauseOnHover={true}
              className="py-4"
            />
          </div>
        </div>
      </section>

      {/* Footer - Homepage Redesign */}
      <HomepageFooter />
    </div>
  );
}
