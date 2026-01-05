import { Calendar, Clock, Plus, Search, Sparkles, Star, TrendingUp, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockAIInterviews } from "@/mocks/interviews.mock";

export function AIInterviewListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter interviews based on search query
  const filteredInterviews = mockAIInterviews.filter((interview) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      interview.title.toLowerCase().includes(lowerQuery) ||
      interview.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  });

  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Banner */}
      <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] via-[#005B9A] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-white" />
              <h1 className="text-3xl font-bold text-white">Phỏng vấn với AI</h1>
            </div>
            <p className="max-w-lg text-lg text-white/90">
              Luyện tập với AI để cải thiện kỹ năng phỏng vấn. Nhận phản hồi chi tiết và điểm số
              ngay lập tức!
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-2 w-fit"
              onClick={() => navigate("/dashboard/ai-interview/payment")}>
              <Plus className="mr-2 h-5 w-5" />
              Bắt đầu phỏng vấn mới
            </Button>
          </div>
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <TrendingUp className="h-16 w-16 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Search Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Lịch sử phỏng vấn</h2>
          <p className="text-muted-foreground text-sm">Xem lại các buổi phỏng vấn trước đây</p>
        </div>
        <div className="relative w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên, vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Interview History Cards */}
      <div className="space-y-4">
        {filteredInterviews.map((interview, index) => (
          <Card
            key={interview.id}
            className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
            onClick={() => navigate(`/dashboard/ai-interview/result/${interview.id}`)}>
            <CardContent className="flex items-center gap-6 p-6">
              {/* Number Badge */}
              <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
                <span className="text-primary text-xl font-bold">{index + 1}</span>
              </div>

              {/* Title and Info */}
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground text-lg font-semibold">{interview.title}</h3>

                {/* Metadata */}
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{interview.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{interview.duration} phút</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{interview.interviewer}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {interview.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Score Badge */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-4 py-2">
                  <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                  <span className="text-xl font-bold text-emerald-600">{interview.score}</span>
                  <span className="text-sm text-emerald-600">/10</span>
                </div>
                <span className="text-muted-foreground text-xs">Điểm số</span>
              </div>

              {/* View Details Button */}
              <Button variant="outline" size="sm">
                Xem chi tiết
              </Button>
            </CardContent>
          </Card>
        ))}

        {filteredInterviews.length === 0 && (
          <Card className="flex h-64 flex-col items-center justify-center gap-4">
            <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
              <Search className="text-muted-foreground h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Không tìm thấy buổi phỏng vấn nào</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Hãy thử tìm kiếm với từ khóa khác
              </p>
            </div>
          </Card>
        )}

        {/* CTA Card */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Plus className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Bắt đầu buổi phỏng vấn mới</CardTitle>
            <CardDescription className="text-white/90">
              Luyện tập với AI để cải thiện kỹ năng phỏng vấn của bạn
            </CardDescription>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/dashboard/ai-interview/payment")}>
              Tạo phỏng vấn mới
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
