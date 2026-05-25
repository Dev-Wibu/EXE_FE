import {
  ChevronDown,
  FileText,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { HomepageHeader } from "@/components/homepage-redesign";
import { Footer } from "@/components/layouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";

const faqCategories = [
  {
    id: "general",
    name: "Câu hỏi chung",
    icon: HelpCircle,
  },
  {
    id: "ai-interview",
    name: "AI Interview",
    icon: MessageCircle,
  },
  {
    id: "mentor",
    name: "Mock Interview",
    icon: GraduationCap,
  },
  {
    id: "account",
    name: "Tài khoản",
    icon: FileText,
  },
];

const faqs = [
  {
    id: 1,
    category: "general",
    question: "INBLUE AI là gì?",
    answer:
      "INBLUE AI là nền tảng luyện tập phỏng vấn trực tuyến sử dụng trí tuệ nhân tạo và kết nối với mentor chuyên nghiệp. Chúng tôi giúp bạn chuẩn bị cho các buổi phỏng vấn thực tế với hơn 1,500 câu hỏi và phản hồi chi tiết.",
  },
  {
    id: 2,
    category: "general",
    question: "Tôi có thể dùng thử miễn phí không?",
    answer:
      "Có! Bạn có thể đăng ký tài khoản miễn phí và nhận 3 buổi phỏng vấn AI miễn phí. Không cần thẻ tín dụng để bắt đầu.",
  },
  {
    id: 3,
    category: "general",
    question: "INBLUE AI hỗ trợ những ngành nghề nào?",
    answer:
      "Chúng tôi hỗ trợ đa dạng ngành nghề bao gồm: Công nghệ thông tin, Marketing, Tài chính, Thiết kế, Quản lý sản phẩm, và nhiều lĩnh vực khác. Câu hỏi được tổng hợp từ hơn 530 công ty hàng đầu.",
  },
  {
    id: 4,
    category: "ai-interview",
    question: "AI Interview hoạt động như thế nào?",
    answer:
      "AI Interview sử dụng công nghệ AI tiên tiến để đặt câu hỏi, lắng nghe và phân tích câu trả lời của bạn. Bạn có thể chọn chế độ văn bản, giọng nói hoặc video. Sau mỗi buổi, bạn sẽ nhận được báo cáo chi tiết về điểm mạnh, điểm yếu và gợi ý cải thiện.",
  },
  {
    id: 5,
    category: "ai-interview",
    question: "AI có thể phân tích ngôn ngữ cơ thể không?",
    answer:
      "Có! Trong chế độ video, AI sẽ phân tích biểu cảm khuôn mặt, ánh mắt và ngôn ngữ cơ thể của bạn. Bạn sẽ nhận được phản hồi về cách cải thiện giao tiếp phi ngôn ngữ.",
  },
  {
    id: 6,
    category: "mentor",
    question: "Mentor là ai?",
    answer:
      "Mentor của chúng tôi là các chuyên gia từ các công ty hàng đầu như Google, Microsoft, Meta, Amazon và nhiều công ty khác. Họ có nhiều năm kinh nghiệm phỏng vấn và tuyển dụng trong ngành.",
  },
  {
    id: 7,
    category: "mentor",
    question: "Làm sao để đặt lịch với mentor?",
    answer:
      "Sau khi đăng nhập, bạn có thể duyệt danh sách mentor, xem hồ sơ và đánh giá của họ. Chọn mentor phù hợp, chọn thời gian trong lịch của họ và xác nhận đặt lịch. Bạn sẽ nhận được link video call trước buổi phỏng vấn.",
  },
  {
    id: 8,
    category: "account",
    question: "Làm sao để nâng cấp tài khoản?",
    answer:
      "Bạn có thể nâng cấp tài khoản trong mục Cài đặt > Gói dịch vụ. Chúng tôi hỗ trợ nhiều phương thức thanh toán bao gồm thẻ tín dụng, ví điện tử và chuyển khoản ngân hàng.",
  },
  {
    id: 9,
    category: "account",
    question: "Dữ liệu của tôi có được bảo mật không?",
    answer:
      "Chắc chắn! Chúng tôi sử dụng mã hóa SSL và tuân thủ các tiêu chuẩn bảo mật quốc tế. Video và dữ liệu phỏng vấn của bạn được lưu trữ an toàn và chỉ bạn mới có quyền truy cập.",
  },
];

export function FAQPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const dashboardPath = isLoggedIn ? getDashboardPath(user?.role) : "/login";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
              <HelpCircle className="mr-2 h-4 w-4" />
              Trung tâm hỗ trợ
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl dark:text-white">
              Câu hỏi thường gặp
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Tìm câu trả lời nhanh chóng cho các thắc mắc phổ biến về INBLUE AI
            </p>

            {/* Search */}
            <div className="mx-auto max-w-xl">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm câu hỏi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-10 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b bg-white py-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={
                selectedCategory === "all" ? "bg-[#0047AB] text-white" : "dark:border-slate-700"
              }>
              Tất cả
            </Button>
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={
                    selectedCategory === category.id
                      ? "bg-[#0047AB] text-white"
                      : "dark:border-slate-700"
                  }>
                  <Icon className="mr-2 h-4 w-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-6">
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <Card
                key={faq.id}
                className="cursor-pointer transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <h3 className="pr-4 font-medium text-slate-900 dark:text-white">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${expandedId === faq.id ? "rotate-180" : ""}`}
                    />
                  </div>
                  {expandedId === faq.id && (
                    <div className="border-t px-4 py-4 dark:border-slate-700">
                      <p className="text-slate-600 dark:text-slate-400">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">Không tìm thấy câu hỏi phù hợp</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
            Không tìm thấy câu trả lời?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-slate-600 dark:text-slate-400">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn
          </p>
          <Button
            size="lg"
            className="rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF]"
            onClick={() => navigate(dashboardPath)}>
            <MessageCircle className="mr-2 h-5 w-5" />
            Liên hệ hỗ trợ
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
