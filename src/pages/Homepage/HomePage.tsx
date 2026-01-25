import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  CheckCircle2,
  Code,
  Database,
  FileText,
  Megaphone,
  Mic,
  Palette,
  Play,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import image1 from "@/assets/image1.svg";
import image2 from "@/assets/image2.svg";
import image3 from "@/assets/image3.svg";
import image4 from "@/assets/image4.svg";

import { Footer, Header } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { ImageCarousel } from "@/components/ui/image-carousel";
import { TestimonialCarousel } from "@/components/ui/testimonial-carousel";
import {
  mockFeatures,
  mockInterviewModes,
  mockJobRoles,
  mockStats,
  mockTestimonials,
} from "@/mocks/homepage.mock";

// Banner images - empty placeholders for now
// const bannerImages = [
//   { src: "", alt: "Banner 1 - Phỏng vấn thành công" },
//   { src: "", alt: "Banner 2 - AI Interview" },
//   { src: "", alt: "Banner 3 - Mentor hàng đầu" },
//   { src: "", alt: "Banner 4 - Cơ hội việc làm" },
// ];

// Icon mapping for job roles - using blue color from color.md
const jobRoleIcons: Record<string, React.ReactNode> = {
  code: <Code className="h-9 w-9 text-[#0047AB]" />,
  database: <Database className="h-9 w-9 text-[#0047AB]" />,
  megaphone: <Megaphone className="h-9 w-9 text-[#0047AB]" />,
  briefcase: <Briefcase className="h-9 w-9 text-[#0047AB]" />,
  palette: <Palette className="h-9 w-9 text-[#0047AB]" />,
  chart: <BarChart3 className="h-9 w-9 text-[#0047AB]" />,
};

export function HomePage() {
  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950">
      {/* Header - Using shared component */}
      <Header />

      {/* Hero Banner Carousel - Temporarily disabled */}
      {/* <section className="relative w-full bg-gradient-to-b from-slate-50 to-white pt-4 pb-8 dark:from-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-6">
          <ImageCarousel
            images={bannerImages}
            autoPlay={true}
            interval={5000}
            className="shadow-xl"
          />
        </div>
      </section> */}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-[#DCEEFF]/30 py-20 lg:py-32 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-[#66B2FF]/30 blur-3xl dark:bg-[#0047AB]/20" />
          <div className="absolute right-1/4 bottom-20 h-72 w-72 rounded-full bg-[#A5C8F2]/30 blur-3xl dark:bg-[#007BFF]/20" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center gap-16 lg:flex-row lg:justify-between">
            {/* Left Content */}
            <div className="flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left">
              {/* Badge */}
              <Badge
                variant="secondary"
                className="mb-6 gap-2 rounded-full bg-[#DCEEFF] px-4 py-2 text-sm text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]">
                <Sparkles className="h-4 w-4" />
                Hơn 160.000 cuộc phỏng vấn thành công
              </Badge>

              {/* Title */}
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 lg:text-6xl dark:text-white">
                Phỏng vấn thành công với{" "}
                <span className="bg-gradient-to-r from-[#0047AB] to-[#007BFF] bg-clip-text text-transparent">
                  Chuyên gia AI
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                Chuẩn bị thông minh với các câu hỏi phỏng vấn thực tế, AI phản hồi tức thì và phản
                hồi chi tiết từ các mô hình AI tiên tiến.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-14 rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF] px-8 text-base shadow-lg hover:shadow-xl"
                  asChild>
                  <Link to="/select-role">
                    <Play className="mr-2 h-5 w-5" />
                    Thử phỏng vấn miễn phí
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full px-8 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap justify-center gap-8 lg:justify-start">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {mockStats.offers}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Lời mời làm việc</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCEEFF] dark:bg-[#0047AB]/30">
                    <Zap className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {mockStats.accuracy}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Độ chính xác AI</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#66B2FF]/20 to-[#A5C8F2]/20 blur-2xl" />
              <Card className="relative w-[400px] overflow-hidden border-slate-200/50 shadow-2xl lg:w-[500px]">
                <div className="relative h-[400px] overflow-hidden bg-gradient-to-br from-[#F0F8FF] to-[#DCEEFF]">
                  <img src={image1} alt="AI Interviewer" className="h-full w-full object-cover" />
                </div>
                <CardContent className="border-t bg-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">AI Interviewer</p>
                      <p className="text-sm text-slate-500">Sẵn sàng phỏng vấn...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Job Roles Section */}
      <section className="relative w-full bg-white py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Đa dạng vị trí
            </Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Chuẩn bị cho mọi vị trí công việc
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">
              Hơn 1000 câu hỏi phỏng vấn thực tế từ hơn 530 công ty hàng đầu
            </p>
          </div>

          {/* Job Role Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {mockJobRoles.map((role) => (
              <Card
                key={role.id}
                className="group cursor-pointer border-slate-200 transition-all hover:border-[#007BFF]/50 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#DCEEFF] transition-colors group-hover:bg-[#A5C8F2] dark:bg-[#0047AB]/30 dark:group-hover:bg-[#0047AB]/50">
                    {jobRoleIcons[role.icon]}
                  </div>
                  <span className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {role.name}
                  </span>
                </CardContent>
              </Card>
            ))}
            <Link to="/login">
              <Card className="group h-full cursor-pointer border-dashed border-slate-300 transition-all hover:border-[#007BFF] dark:border-slate-600 dark:bg-slate-800">
                <CardContent className="flex h-full flex-col items-center justify-center p-6">
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

      {/* Statistics Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOSAxLjc5MS00IDQtNHM0IDEuNzkxIDQgNC0xLjc5MSA0LTQgNC00LTEuNzkxLTQtNHptLTI0IDBjMC0yLjIwOSAxLjc5MS00IDQtNHM0IDEuNzkxIDQgNC0xLjc5MSA0LTQgNC00LTEuNzkxLTQtNHptMTItMTJjMC0yLjIwOSAxLjc5MS00IDQtNHM0IDEuNzkxIDQgNC0xLjc5MSA0LTQgNC00LTEuNzkxLTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6">
          {/* Title */}
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white lg:text-4xl">
              Nhận được lời mời làm việc nhanh hơn gấp 3,5 lần
            </h2>
            <p className="mt-4 text-lg text-[#A5C8F2]">với INBLUE AI Interview</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <span className="text-4xl font-bold text-white">{mockStats.offers}</span>
              <span className="mt-2 text-center text-[#A5C8F2]">Lời đề nghị</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <span className="text-4xl font-bold text-white">{mockStats.costSaving}</span>
              <span className="mt-2 text-center text-[#A5C8F2]">Tiết kiệm chi phí huấn luyện</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <span className="text-4xl font-bold text-white">{mockStats.accuracy}</span>
              <span className="mt-2 text-center text-[#A5C8F2]">Độ chính xác AI</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <span className="text-4xl font-bold text-white">{mockStats.availability}</span>
              <span className="mt-2 text-center text-[#A5C8F2]">Hỗ trợ khách hàng</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative w-full bg-slate-50 py-20 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Tính năng
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Mọi thứ bạn cần để thành công
            </h2>
          </div>

          <div className="space-y-20">
            {/* Feature 1 - AI Simulation */}
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="relative flex-1">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#DCEEFF] to-[#A5C8F2] blur-xl dark:from-[#0047AB]/30 dark:to-[#007BFF]/30" />
                <Card className="relative overflow-hidden dark:border-slate-700">
                  <CardContent className="relative h-80 overflow-hidden bg-gradient-to-br from-[#F0F8FF] to-[#DCEEFF] p-0 dark:from-slate-800 dark:to-slate-800/50">
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
                  {mockFeatures[0].title}
                </Badge>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {mockFeatures[0].headline}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{mockFeatures[0].description}</p>
                <Button
                  className="mt-4 rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF]"
                  asChild>
                  <Link to="/select-role">
                    {mockFeatures[0].cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Feature 2 - Trending Questions */}
            <div className="flex flex-col-reverse items-center gap-12 lg:flex-row">
              <div className="flex-1 space-y-4">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {mockFeatures[1].title}
                </Badge>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {mockFeatures[1].headline}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{mockFeatures[1].description}</p>
                <Button
                  className="mt-4 rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF]"
                  asChild>
                  <Link to="/select-role">
                    {mockFeatures[1].cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="relative flex-1">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-green-100 to-emerald-100 blur-xl dark:from-green-900/30 dark:to-emerald-900/30" />
                <Card className="relative overflow-hidden dark:border-slate-700">
                  <CardContent className="relative h-80 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 p-0 dark:from-slate-800 dark:to-slate-800/50">
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
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="relative flex-1">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#66B2FF]/30 to-[#A5C8F2]/30 blur-xl dark:from-[#0047AB]/20 dark:to-[#007BFF]/20" />
                <Card className="relative overflow-hidden dark:border-slate-700">
                  <CardContent className="relative h-80 overflow-hidden bg-gradient-to-br from-[#F0F8FF] to-[#DCEEFF] p-0 dark:from-slate-800 dark:to-slate-800/50">
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
                  {mockFeatures[2].title}
                </Badge>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {mockFeatures[2].headline}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{mockFeatures[2].description}</p>
                <Button
                  className="mt-4 rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF]"
                  asChild>
                  <Link to="/select-role">
                    {mockFeatures[2].cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interview Styles Section */}
      <section className="relative w-full bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Chế độ phỏng vấn
            </Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Chọn phong cách phỏng vấn của bạn
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">
              Thực hành phỏng vấn theo cách phù hợp nhất với bạn. Tất cả các chế độ đều cung cấp
              phản hồi chất lượng như nhau.
            </p>
          </div>

          {/* Mode Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {mockInterviewModes.map((mode) => (
              <Card
                key={mode.id}
                className="group cursor-pointer transition-all hover:border-[#007BFF]/50 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <CardHeader className="pb-4">
                  <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DCEEFF] transition-colors group-hover:bg-[#A5C8F2] dark:bg-[#0047AB]/30 dark:group-hover:bg-[#0047AB]/50">
                    {mode.icon === "text" && (
                      <FileText className="h-8 w-8 text-[#0047AB] dark:text-[#66B2FF]" />
                    )}
                    {mode.icon === "mic" && (
                      <Mic className="h-8 w-8 text-[#0047AB] dark:text-[#66B2FF]" />
                    )}
                    {mode.icon === "video" && (
                      <Video className="h-8 w-8 text-[#0047AB] dark:text-[#66B2FF]" />
                    )}
                  </div>
                  <CardTitle className="text-xl dark:text-white">{mode.title}</CardTitle>
                  <CardDescription className="text-sm dark:text-slate-400">
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
      <section className="relative w-full bg-slate-50 py-20 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 dark:border-slate-700 dark:text-slate-300">
              Đánh giá
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Mọi người nói gì về chúng tôi
            </h2>
          </div>
          <div className="mt-8">
            <TestimonialCarousel
              testimonials={mockTestimonials}
              speed={40}
              pauseOnHover={true}
              className="py-4"
            />
          </div>
        </div>
        {/* Scrolling Testimonial Carousel */}{" "}
      </section>

      {/* Footer - Using shared component */}
      <Footer />
    </div>
  );
}
