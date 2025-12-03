import {
  BarChart3,
  Bot,
  Briefcase,
  ChevronDown,
  Code,
  Cpu,
  Database,
  FileText,
  Linkedin,
  Megaphone,
  MessageSquare,
  Mic,
  Palette,
  User,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  mockFeatures,
  mockFooterLinks,
  mockInterviewModes,
  mockJobRoles,
  mockStats,
  mockTestimonials,
} from "@/mocks/homepage.mock";

// Icon mapping for job roles
const jobRoleIcons: Record<string, React.ReactNode> = {
  code: <Code className="h-9 w-9 text-violet-600" />,
  database: <Database className="h-9 w-9 text-violet-600" />,
  megaphone: <Megaphone className="h-9 w-9 text-violet-600" />,
  briefcase: <Briefcase className="h-9 w-9 text-violet-600" />,
  palette: <Palette className="h-9 w-9 text-violet-600" />,
  chart: <BarChart3 className="h-9 w-9 text-violet-600" />,
};

// Icon mapping for interview modes
const modeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-24 w-28 text-violet-600" />,
  mic: <Mic className="h-24 w-24 text-violet-600" />,
  video: <Video className="h-24 w-28 text-violet-600" />,
};

export function HomePage() {
  return (
    <div className="relative w-full overflow-hidden bg-white">
      {/* Header */}
      <header className="h-40 w-full overflow-hidden bg-gradient-to-r from-white via-slate-50 to-sky-100">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-28 w-40 items-center justify-center">
              <Cpu className="h-12 w-12 text-blue-800" />
            </div>
            <span className="font-['Orelega_One'] text-2xl font-normal text-blue-800">
              AI INTERVIEW
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <div className="flex items-center gap-1 font-['Open_Sans'] text-xl font-normal text-neutral-900">
              <span>Câu hỏi</span>
              <ChevronDown className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 font-['Open_Sans'] text-xl font-normal text-neutral-900">
              <span>Tính năng</span>
              <ChevronDown className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 font-['Open_Sans'] text-xl font-normal text-neutral-900">
              <span>Tài nguyên</span>
              <ChevronDown className="h-5 w-5" />
            </div>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="flex h-12 w-36 items-center justify-center rounded-2xl border border-black/20 bg-white font-['Open_Sans'] text-xl font-normal text-neutral-900">
              Đăng nhập
            </Link>
            <Link
              to="/signup"
              className="flex h-12 w-44 items-center justify-center rounded-2xl bg-violet-600 font-['Open_Sans'] text-xl font-normal text-white">
              Bắt đầu
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[792px] w-full overflow-hidden bg-gradient-to-l from-white via-slate-50 to-indigo-100">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Left Content */}
          <div className="flex flex-col items-start gap-8">
            {/* Badge */}
            <div className="inline-flex items-center justify-center gap-2.5 rounded-full border border-violet-300 px-6 py-4 backdrop-blur-sm">
              <span className="font-['Manrope'] text-lg font-semibold text-neutral-900">
                Hơn 30.000 lời mời nhận được | Hơn 160.000 cuộc phỏng vấn thành công
              </span>
            </div>

            {/* Title */}
            <div className="max-w-xl">
              <span className="font-['Manrope'] text-5xl leading-[81px] font-bold text-neutral-900">
                Phỏng vấn Ace với
                <br />
              </span>
              <span className="font-['Manrope'] text-5xl leading-[81px] font-bold text-indigo-500">
                Chuyên gia AI
              </span>
            </div>

            {/* Subtitle */}
            <p className="max-w-lg font-['Manrope'] text-lg leading-7 font-semibold text-gray-400">
              Chuẩn bị thông minh với các câu hỏi phỏng vấn thực tế, hình đại diện AI chân thực và
              phản hồi hữu ích, được hỗ trợ bởi các mô hình AI do các nhà nghiên cứu Stanford đào
              tạo.
            </p>

            {/* CTA Button */}
            <Link
              to="/signup"
              className="flex h-24 w-96 items-center justify-center rounded-[70px] bg-violet-600 shadow-md">
              <span className="font-['Manrope'] text-base font-semibold text-white">
                Hãy thử một cuộc phỏng vấn thử miễn phí ngay bây giờ
              </span>
            </Link>
          </div>

          {/* Right Content - Hero Image */}
          <div className="flex h-[543px] w-[600px] items-center justify-center rounded-2xl bg-indigo-100 opacity-80">
            <Bot className="h-48 w-48 text-indigo-400" />
          </div>
        </div>
      </section>

      {/* Job Roles Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-sky-50 via-indigo-50 to-indigo-100 py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Company Logos Text */}
          <div className="mb-8 text-center">
            <p className="font-['Open_Sans'] text-lg leading-7 font-semibold text-gray-950">
              Hơn 1000 câu hỏi phỏng vấn thực tế - Từ hơn 530 công ty và công ty khởi nghiệp hàng
              đầu!
            </p>
          </div>

          {/* Company Logos Placeholder */}
          <div className="mb-12 flex justify-center gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-12 w-32 rounded-lg bg-gray-200/50"
                aria-label={`Company logo ${i}`}
              />
            ))}
          </div>

          {/* Job Role Cards */}
          <div className="flex flex-wrap justify-center gap-4">
            {mockJobRoles.map((role) => (
              <div
                key={role.id}
                className="flex h-44 w-40 flex-col items-center justify-center gap-4 rounded-2xl bg-white outline outline-1 outline-neutral-200">
                <div className="flex h-9 w-9 items-center justify-center">
                  {jobRoleIcons[role.icon]}
                </div>
                <span className="text-center font-['Open_Sans'] text-base font-bold text-neutral-900">
                  {role.name}
                </span>
              </div>
            ))}

            {/* View All Roles */}
            <div className="flex h-44 w-32 flex-col items-center justify-center">
              <span className="text-center font-['Open_Sans'] text-base font-bold text-neutral-900">
                Xem tất cả
                <br />
                vai trò
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative w-full bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Title */}
          <div className="mb-16 text-center">
            <h2 className="font-['Open_Sans'] text-3xl leading-[48px] font-bold text-violet-500">
              Nhận được lời mời làm việc mơ ước nhanh hơn gấp 3,5 lần
              <br />
              với INBLUE Interview
            </h2>
          </div>

          {/* Stats Grid */}
          <div className="flex flex-wrap justify-center gap-16">
            {/* Stat 1 */}
            <div className="flex flex-col items-center">
              <span className="font-['Manrope'] text-3xl font-bold text-violet-500">
                {mockStats.offers}
              </span>
              <span className="font-['Manrope'] text-lg text-gray-950">Lời đề nghị</span>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center">
              <span className="font-['Manrope'] text-3xl font-bold text-violet-500">
                Tiết kiệm {mockStats.costSaving}
              </span>
              <span className="font-['Manrope'] text-lg text-black">Chi phí huấn luyện</span>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center">
              <span className="font-['Manrope'] text-3xl font-bold text-violet-500">
                {mockStats.accuracy} Độ chính xác
              </span>
              <span className="font-['Manrope'] text-lg text-gray-950">AI Phản hồi tức thì</span>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col items-center">
              <span className="font-['Manrope'] text-3xl font-bold text-violet-500">
                {mockStats.availability} Truy cập
              </span>
              <span className="font-['Manrope'] text-lg text-gray-950">Với hỗ trợ khách hàng</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative w-full bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Feature 1 - AI Simulation */}
          <div className="mb-24 flex items-center justify-between gap-12">
            {/* Image */}
            <div className="flex h-96 w-[524px] items-center justify-center rounded-lg bg-indigo-100/50 shadow-lg">
              <Bot className="h-32 w-32 text-indigo-400" />
            </div>

            {/* Content */}
            <div className="flex max-w-xl flex-col gap-6">
              <span className="font-['Manrope'] text-lg font-semibold text-violet-600">
                {mockFeatures[0].title}
              </span>
              <h3 className="font-['Manrope'] text-3xl leading-[48px] font-bold text-neutral-900">
                {mockFeatures[0].headline}
              </h3>
              <p className="font-['Manrope'] text-base text-black">{mockFeatures[0].description}</p>
              <Link
                to="/signup"
                className="flex h-14 w-56 items-center justify-center rounded-full bg-gradient-to-r from-purple-800 via-violet-700 to-indigo-500">
                <span className="font-['Manrope'] text-base font-semibold text-white">
                  {mockFeatures[0].cta}
                </span>
              </Link>
            </div>
          </div>

          {/* Feature 2 - Trending Questions */}
          <div className="mb-24 flex items-center justify-between gap-12">
            {/* Content */}
            <div className="flex max-w-xl flex-col gap-6">
              <span className="font-['Manrope'] text-lg font-semibold text-violet-600">
                {mockFeatures[1].title}
              </span>
              <h3 className="font-['Manrope'] text-3xl leading-[48px] font-bold text-neutral-900">
                {mockFeatures[1].headline}
              </h3>
              <p className="font-['Manrope'] text-base text-black">{mockFeatures[1].description}</p>
              <Link
                to="/signup"
                className="flex h-16 w-48 items-center justify-center rounded-full bg-gradient-to-r from-purple-800 via-violet-700 to-indigo-500">
                <span className="font-['Manrope'] text-base font-semibold text-white">
                  {mockFeatures[1].cta}
                </span>
              </Link>
            </div>

            {/* Image */}
            <div className="flex h-80 w-[525px] items-center justify-center rounded-lg bg-indigo-100/50 shadow-lg">
              <MessageSquare className="h-32 w-32 text-indigo-400" />
            </div>
          </div>

          {/* Feature 3 - LinkedIn Integration */}
          <div className="flex items-center justify-between gap-12">
            {/* Image */}
            <div className="flex h-96 w-[524px] items-center justify-center rounded-lg bg-indigo-100/50 shadow-lg">
              <Linkedin className="h-32 w-32 text-indigo-400" />
            </div>

            {/* Content */}
            <div className="flex max-w-xl flex-col gap-6">
              <span className="font-['Manrope'] text-lg font-semibold text-violet-600">
                {mockFeatures[2].title}
              </span>
              <h3 className="font-['Manrope'] text-3xl leading-[48px] font-bold text-neutral-900">
                {mockFeatures[2].headline}
              </h3>
              <p className="font-['Manrope'] text-base text-black">{mockFeatures[2].description}</p>
              <Link
                to="/signup"
                className="flex h-12 w-32 items-center justify-center rounded-full bg-gradient-to-r from-purple-800 via-violet-700 to-indigo-500">
                <span className="font-['Manrope'] text-base font-semibold text-white">
                  {mockFeatures[2].cta}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interview Styles Section */}
      <section className="relative w-full overflow-hidden bg-stone-200/20 py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Title */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-['Manrope'] text-4xl font-semibold text-violet-600">
              Luyện tập theo cách của bạn
            </h2>
            <h3 className="mb-8 font-['Manrope'] text-4xl font-extrabold text-black">
              Chọn phong cách phỏng vấn của bạn
            </h3>
            <p className="mx-auto max-w-4xl font-['Manjari'] text-xl text-black/60">
              Thực hành phỏng vấn theo cách phù hợp nhất với bạn. Tất cả các chế độ đều cung cấp
              phản hồi chất lượng và chấm điểm cá nhân hóa như nhau.
            </p>
          </div>

          {/* Mode Cards */}
          <div className="flex flex-wrap justify-center gap-6">
            {mockInterviewModes.map((mode) => (
              <div
                key={mode.id}
                className="flex h-[452px] w-96 flex-col gap-4 overflow-hidden rounded-3xl bg-white p-8 outline outline-1 outline-black/10">
                {/* Icon */}
                <div className="flex h-24 w-28 items-center justify-center rounded-[20px] bg-indigo-50">
                  {modeIcons[mode.icon]}
                </div>

                {/* Title */}
                <h4 className="font-['Manrope'] text-3xl font-semibold text-black">{mode.title}</h4>

                {/* Description and Benefits */}
                <div className="font-['Manrope'] text-xl font-medium text-black">
                  <p className="mb-4">{mode.description}</p>
                  <ul className="list-inside list-disc">
                    {mode.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative w-full bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Title */}
          <div className="mb-16 text-center">
            <h2 className="font-['Inter'] text-4xl font-extrabold text-black">
              Mọi người nói gì về chúng tôi
            </h2>
          </div>

          {/* Testimonial Cards */}
          <div className="flex flex-wrap justify-center gap-6">
            {mockTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`size-96 overflow-hidden rounded-[30px] p-6 ${
                  index <= 1
                    ? "bg-gradient-to-br from-white/80 via-slate-50/80 to-sky-100/80"
                    : "bg-gradient-to-br from-sky-100/0 via-sky-100/10 to-sky-100/60"
                }`}>
                {/* Avatar and Name */}
                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-20 w-16 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                    <User className="h-12 w-12 text-indigo-400" />
                  </div>
                </div>

                {/* Name */}
                <h4 className="mb-2 font-['Inknut_Antiqua'] text-lg font-extrabold text-gray-950">
                  {testimonial.name}
                </h4>

                {/* Role */}
                <p className="mb-6 font-['Inter'] text-lg font-semibold text-gray-950/70">
                  {testimonial.role}
                </p>

                {/* Content */}
                <p className="font-['Inter'] text-lg text-black">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative w-full overflow-hidden bg-gradient-to-r from-white via-violet-100/90 to-violet-500/20 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex justify-between">
            {/* Brand Section */}
            <div className="max-w-xs">
              <h3 className="mb-4 font-['Open_Sans'] text-2xl leading-[48.5px] font-bold text-neutral-900">
                InBlue Interview
              </h3>
              <p className="mb-6 font-['Manrope'] text-base font-semibold text-slate-500">
                Nền tảng chuẩn bị cho phỏng vấn
              </p>
              {/* Social Icons */}
              <div className="flex gap-4">
                <div className="flex h-5 w-5 items-center justify-center text-indigo-600">
                  <Linkedin className="h-5 w-5" />
                </div>
                <div className="flex h-5 w-5 items-center justify-center text-indigo-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Links Sections */}
            <div className="flex gap-20">
              {/* Product Links */}
              <div>
                <h4 className="mb-4 font-['Open_Sans'] text-xl font-bold text-indigo-950">
                  Product
                </h4>
                <ul className="space-y-4">
                  {mockFooterLinks.product.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="font-['Manrope'] text-sm font-semibold text-slate-500 hover:text-indigo-600">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources Links */}
              <div>
                <h4 className="mb-4 font-['Open_Sans'] text-xl font-bold text-indigo-950">
                  Resources
                </h4>
                <ul className="space-y-4">
                  {mockFooterLinks.resources.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="font-['Manrope'] text-sm font-semibold text-slate-500 hover:text-indigo-600">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className="mb-4 font-['Open_Sans'] text-xl font-bold text-indigo-950">
                  Company
                </h4>
                <ul className="space-y-4">
                  {mockFooterLinks.company.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="font-['Manrope'] text-sm font-semibold text-slate-500 hover:text-indigo-600">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-10">
            <span className="font-['Manrope'] text-sm font-semibold text-slate-500">
              Copyright © 2025 INLUE AI
            </span>
            <div className="font-['Manrope'] text-sm font-semibold">
              <span className="text-slate-500">All Rights Reserved | </span>
              <Link to="/terms" className="text-indigo-600 hover:underline">
                Terms and Conditions
              </Link>
              <span className="text-slate-500"> | </span>
              <Link to="/privacy" className="text-indigo-600 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
