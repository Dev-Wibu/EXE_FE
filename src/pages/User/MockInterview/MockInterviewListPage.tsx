import {
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  LoaderCircle,
  LogIn,
  Search,
  User as UserIcon,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingCardList } from "@/components/ui/loading-card";
import { useUserSessions } from "@/hooks/useSession";

export function MockInterviewListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: sessions = [], isLoading } = useUserSessions();

  // Current time state for joinTime-based blocking (updates every 30s)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Transform sessions to interview format for display (newest first)
  const interviews = useMemo(() => {
    return [...sessions]
      .filter((session) => session.status !== "COMPLETED")
      .reverse()
      .map((session) => {
        const isTimeReached = session.joinTime ? new Date(session.joinTime).getTime() <= now : true;
        return {
          id: session.id,
          title: session.roomName || `Phiên #${session.id}`,
          mentorName: `Mentor #${session.userId2 || "N/A"}`,
          date: session.joinTime
            ? new Date(session.joinTime).toLocaleDateString("vi-VN")
            : session.startTime1
              ? new Date(session.startTime1).toLocaleDateString("vi-VN")
              : "N/A",
          time: session.joinTime
            ? new Date(session.joinTime).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : session.startTime1
              ? new Date(session.startTime1).toLocaleTimeString("vi-VN")
              : "N/A",
          joinTime: session.joinTime,
          status:
            session.status === "SCHEDULED"
              ? "upcoming"
              : session.status === "CANCELED"
                ? "cancelled"
                : session.status === "ONGOING"
                  ? "ongoing"
                  : "upcoming",
          canJoin:
            (session.status === "SCHEDULED" || session.status === "ONGOING") &&
            !!session.roomUrl &&
            isTimeReached,
          isTimeReached,
        };
      });
  }, [sessions, now]);

  // Filter interviews based on search query
  const filteredInterviews = useMemo(() => {
    if (!searchQuery) return interviews;
    const lowerQuery = searchQuery.toLowerCase();
    return interviews.filter(
      (interview) =>
        interview.title.toLowerCase().includes(lowerQuery) ||
        interview.mentorName.toLowerCase().includes(lowerQuery)
    );
  }, [interviews, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã hoàn thành
          </Badge>
        );
      case "upcoming":
        return (
          <Badge className="inline-flex items-center gap-1 border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700 hover:bg-sky-100">
            <Calendar className="h-3.5 w-3.5" />
            Sắp diễn ra
          </Badge>
        );
      case "ongoing":
        return (
          <Badge className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 hover:bg-emerald-100">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Đang diễn ra
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="inline-flex items-center gap-1 border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700 hover:bg-rose-100">
            <Ban className="h-3.5 w-3.5" />
            Đã hủy
          </Badge>
        );
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
              {sessions.length > 0
                ? `Bạn đã hoàn thành ${sessions.filter((s) => s.status === "COMPLETED").length} buổi phỏng vấn giả lập với mentor. Hãy tiếp tục giữ vững phong độ nhé!`
                : "Bạn chưa có buổi phỏng vấn nào. Hãy đặt lịch phỏng vấn với mentor ngay hôm nay!"}
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-2 w-fit"
              onClick={() => navigate("/dashboard/mock-interview/schedule")}>
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
          <h2 className="text-foreground text-2xl font-bold">Phiên chưa hoàn thành</h2>
          <p className="text-muted-foreground text-sm">
            Danh sách các phiên sắp diễn ra, đang diễn ra hoặc đã hủy
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

      {/* Active/Incomplete Interview Cards */}
      {isLoading ? (
        <LoadingCardList count={4} />
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview, index) => (
            <Card
              key={interview.id}
              className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate(`/dashboard/mock-interview/history/${interview.id}`)}>
              <CardContent className="flex items-center gap-6 p-6">
                {/* Sequential Number */}
                <div className="bg-primary/10 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-foreground text-lg font-semibold">
                    {interview.title}
                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                      (ID: {interview.id})
                    </span>
                  </h3>

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

                {/* Status Badge & Join Button */}
                <div className="flex shrink-0 items-center gap-2">
                  {interview.canJoin && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/mock-interview/room/${interview.id}`);
                      }}
                      className="gap-1 bg-green-600 hover:bg-green-700">
                      <LogIn className="h-3.5 w-3.5" />
                      Tham gia
                    </Button>
                  )}
                  {!interview.isTimeReached &&
                    interview.status !== "cancelled" &&
                    interview.joinTime && (
                      <Badge className="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700 hover:bg-amber-100">
                        <Clock className="h-3.5 w-3.5" />
                        Chưa đến giờ
                      </Badge>
                    )}
                  {getStatusBadge(interview.status)}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredInterviews.length === 0 && !isLoading && (
            <Card className="flex h-64 flex-col items-center justify-center gap-4">
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                <Search className="text-muted-foreground h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">
                  {searchQuery ? "Không tìm thấy phiên phù hợp" : "Không có phiên chưa hoàn thành"}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {searchQuery
                    ? "Hãy thử tìm kiếm với từ khóa khác"
                    : "Bạn đang không có phiên chờ xử lý nào"}
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
                <Button size="lg" onClick={() => navigate("/dashboard/mock-interview/schedule")}>
                  <Users className="mr-2 h-5 w-5" />
                  Chọn Mentor
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
