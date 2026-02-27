import {
  Calendar,
  Clock,
  Loader2,
  Play,
  Plus,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { $api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

// Map interview mode enum → label tiếng Việt
const MODE_LABELS: Record<string, string> = {
  STANDARD_MOCK: "Phỏng vấn thử",
  THEORY_CHECK: "Kiểm tra lý thuyết",
  PROJECT_DEFENSE: "Bảo vệ dự án",
};

// Map status → Vietnamese + color
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  CREATED: { label: "Đã tạo", className: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Đang diễn ra", className: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
};

// Map result → label
const RESULT_LABELS: Record<string, string> = {
  STRONG_HIRE: "Xuất sắc",
  HIRE: "Đạt",
  CONSIDER: "Cần cân nhắc",
  REJECT: "Không đạt",
};

function getStoredSessionKeys(): Record<string, { createdAt: string }> {
  try {
    return JSON.parse(localStorage.getItem("interview-session-keys") ?? "{}");
  } catch {
    return {};
  }
}

export function AIInterviewListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const userId = useAuthStore((s) => s.user?.id);
  const storedKeys = useMemo(() => getStoredSessionKeys(), []);

  const handleSessionClick = useCallback(
    (session: { id?: number; status?: string; createdAt?: string }) => {
      const isResumable = session.status === "CREATED" || session.status === "IN_PROGRESS";

      if (isResumable) {
        // Tìm sessionKey gần nhất trong localStorage dựa trên thời gian tạo
        if (session.createdAt) {
          const sessionTime = new Date(session.createdAt).getTime();
          const TOLERANCE_MS = 2 * 60 * 1000;
          let bestKey: string | null = null;
          let bestDiff = Infinity;
          for (const [key, meta] of Object.entries(storedKeys)) {
            const diff = Math.abs(new Date(meta.createdAt).getTime() - sessionTime);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestKey = key;
            }
          }
          if (bestKey && bestDiff < TOLERANCE_MS) {
            localStorage.setItem("current-interview-session-key", bestKey);
            navigate("/dashboard/ai-interview/session");
            return;
          }
        }
        // Không tìm thấy session key → thông báo lỗi thay vì vào trang kết quả
        toast.error("Không tìm thấy session key cho phiên này. Vui lòng tạo phỏng vấn mới.");
      } else {
        navigate(`/dashboard/ai-interview/result/${session.id}`);
      }
    },
    [navigate, storedKeys]
  );

  const {
    data: sessions,
    isLoading,
    isError,
  } = $api.useQuery(
    "get",
    "/api/interview-sessions/user/{userId}",
    { params: { path: { userId: userId ?? 0 } } },
    { enabled: !!userId }
  );

  const filteredSessions = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions : [];
    const filtered = list.filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const modeLabel = MODE_LABELS[s.mode ?? ""] ?? "";
      const domain = s.domain ?? "";
      return modeLabel.toLowerCase().includes(q) || domain.toLowerCase().includes(q);
    });
    // Sắp xếp mới nhất lên trên
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
  }, [sessions, searchQuery]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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
            placeholder="Tìm kiếm theo chế độ, lĩnh vực..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-6 p-6">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-20 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-destructive font-medium">Không thể tải lịch sử phỏng vấn</p>
          <p className="text-muted-foreground text-sm">Vui lòng thử lại sau</p>
        </Card>
      )}

      {/* Interview History Cards */}
      {!isLoading && !isError && (
        <div className="space-y-4">
          {filteredSessions.map((session, index) => {
            const statusConfig = STATUS_CONFIG[session.status ?? ""] ?? {
              label: session.status,
              className: "bg-gray-100 text-gray-700",
            };
            const modeLabel = MODE_LABELS[session.mode ?? ""] ?? session.mode ?? "Phỏng vấn AI";
            const hasScore = session.overallScore !== undefined && session.overallScore !== null;

            return (
              <Card
                key={session.id}
                className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleSessionClick(session)}>
                <CardContent className="flex items-center gap-6 p-6">
                  {/* Number Badge */}
                  <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
                    <span className="text-primary text-xl font-bold">{index + 1}</span>
                  </div>

                  {/* Title and Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-foreground text-lg font-semibold">{modeLabel}</h3>

                    {/* Metadata */}
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(session.createdAt)}</span>
                      </div>
                      {session.sessionConfig?.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{session.sessionConfig.duration_minutes} phút</span>
                        </div>
                      )}
                    </div>

                    {/* Tags / Status */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                      {session.domain && <Badge variant="secondary">{session.domain}</Badge>}
                      {session.sessionConfig?.language && (
                        <Badge variant="outline">{session.sessionConfig.language}</Badge>
                      )}
                      {session.result && (
                        <Badge variant="secondary">
                          {RESULT_LABELS[session.result] ?? session.result}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Score Badge */}
                  {hasScore && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-4 py-2">
                        <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                        <span className="text-xl font-bold text-emerald-600">
                          {session.overallScore!.toFixed(1)}
                        </span>
                        <span className="text-sm text-emerald-600">/10</span>
                      </div>
                      <span className="text-muted-foreground text-xs">Điểm số</span>
                    </div>
                  )}

                  {/* Action Button */}
                  {session.status === "CREATED" || session.status === "IN_PROGRESS" ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-[#0047AB] text-white hover:bg-[#005B9A]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionClick(session);
                      }}>
                      <Play className="mr-1 h-3.5 w-3.5" />
                      Tiếp tục phỏng vấn
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      Xem chi tiết
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {filteredSessions.length === 0 && !isLoading && (
            <Card className="flex h-64 flex-col items-center justify-center gap-4">
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                {searchQuery ? (
                  <Search className="text-muted-foreground h-8 w-8" />
                ) : (
                  <Loader2 className="text-muted-foreground h-8 w-8" />
                )}
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">
                  {searchQuery ? "Không tìm thấy buổi phỏng vấn nào" : "Chưa có buổi phỏng vấn nào"}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {searchQuery
                    ? "Hãy thử tìm kiếm với từ khóa khác"
                    : "Bắt đầu phỏng vấn mới để luyện tập"}
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
      )}
    </div>
  );
}
