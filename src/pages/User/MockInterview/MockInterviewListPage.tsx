import { Calendar, Clock, Search, User as UserIcon, Users, Video } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockMockInterviews } from "@/mocks/mentors.mock";

export function MockInterviewListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter interviews based on search query
  const filteredInterviews = mockMockInterviews.filter((interview) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      interview.title.toLowerCase().includes(lowerQuery) ||
      interview.mentorName.toLowerCase().includes(lowerQuery)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✓ Đã hoàn thành</Badge>
        );
      case "upcoming":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">📅 Sắp diễn ra</Badge>
        );
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">✗ Đã hủy</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Banner */}
      <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-white" />
              <h1 className="text-3xl font-bold text-white">Phỏng vấn với Mentor</h1>
            </div>
            <p className="max-w-lg text-lg text-white/90">
              Bạn đã hoàn thành 1 buổi phỏng vấn giả lập với mentor. Hãy tiếp tục giữ vững phong độ
              nhé!
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-2 w-fit"
              onClick={() => navigate("/dashboard/mock-interview/select-mentor")}>
              <Video className="mr-2 h-5 w-5" />
              Đặt lịch phỏng vấn mới
            </Button>
          </div>
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Video className="h-16 w-16 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Search Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Lịch sử phỏng vấn</h2>
          <p className="text-muted-foreground text-sm">
            Xem lại các buổi phỏng vấn với mentor trước đây
          </p>
        </div>
        <div className="relative w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên, mentor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Interview History Cards */}
      <div className="space-y-4">
        {filteredInterviews.map((interview) => (
          <Card
            key={interview.id}
            className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md">
            <CardContent className="flex items-center gap-6 p-6">
              {/* Avatar */}
              <div className="bg-muted flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
                <UserIcon className="text-muted-foreground h-7 w-7" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground text-lg font-semibold">{interview.title}</h3>

                {/* Metadata */}
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{interview.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{interview.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-4 w-4" />
                    <span>{interview.mentorName}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">{getStatusBadge(interview.status)}</div>
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

        {/* CTA to book new interview */}
        {filteredInterviews.length > 0 && (
          <Card className="overflow-hidden border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Đặt lịch phỏng vấn mới?</CardTitle>
              <CardDescription>
                Chọn mentor phù hợp và đặt lịch phỏng vấn ngay hôm nay
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button size="lg" onClick={() => navigate("/dashboard/mock-interview/select-mentor")}>
                <Users className="mr-2 h-5 w-5" />
                Chọn Mentor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
