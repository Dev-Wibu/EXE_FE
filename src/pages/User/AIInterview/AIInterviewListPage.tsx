import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Play,
  Plus,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ReloadButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { $api } from "@/lib/api";
import { formatDateTime, toTimestamp } from "@/lib/formatting";
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

// Map difficulty → label
const DIFFICULTY_LABELS: Record<string, string> = {
  FRESHER_BASIC: "Cơ bản",
  FRESHER_ADVANCED: "Nâng cao",
};

// Map language → label
const LANGUAGE_LABELS: Record<string, string> = {
  VI: "Tiếng Việt",
  EN: "English",
};

// Map domain → label
const DOMAIN_LABELS: Record<string, string> = {
  IT: "IT",
  NON_IT: "Ngoài IT",
};

// Map result → label
const RESULT_LABELS: Record<string, string> = {
  STRONG_HIRE: "Xuất sắc",
  HIRE: "Đạt",
  CONSIDER: "Cần cân nhắc",
  REJECT: "Không đạt",
};

// SessionKey hết hạn sau 1 giờ kể từ lúc tạo (backend chỉ cập nhật status CANCELLED lazily)
const SESSION_EXPIRY_MS = 60 * 60 * 1000;

const isSessionExpired = (createdAt?: string) => {
  const createdTimestamp = toTimestamp(createdAt);
  if (!createdTimestamp) return true;
  return Date.now() - createdTimestamp >= SESSION_EXPIRY_MS;
};

export function AIInterviewListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const userId = useAuthStore((s) => s.user?.id);

  const {
    data: sessions,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = $api.useQuery(
    "get",
    "/api/interview-sessions/user/{userId}",
    { params: { path: { userId: userId ?? 0 } } },
    { enabled: !!userId }
  );

  const allSessions = useMemo(
    () =>
      [...(Array.isArray(sessions) ? sessions : [])].sort(
        (a, b) => (toTimestamp(b.createdAt) ?? 0) - (toTimestamp(a.createdAt) ?? 0)
      ),
    [sessions]
  );

  const activeSessions = useMemo(
    () =>
      allSessions.filter(
        (s) => s.status === "IN_PROGRESS" && s.sessionKey != null && !isSessionExpired(s.createdAt)
      ),
    [allSessions]
  );

  const historySessions = useMemo(() => {
    // Session bị loại khỏi activeSessions (không phải IN_PROGRESS, không có sessionKey, hoặc đã hết hạn) → vào lịch sử
    const list = allSessions.filter(
      (s) => s.status !== "IN_PROGRESS" || s.sessionKey == null || isSessionExpired(s.createdAt)
    );
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((s) => {
      const modeLabel = MODE_LABELS[s.mode ?? ""] ?? s.mode ?? "";
      const domain = s.domain ?? "";
      return modeLabel.toLowerCase().includes(q) || domain.toLowerCase().includes(q);
    });
  }, [allSessions, searchQuery]);

  const handleResume = (key: string) => {
    navigate(`/user/ai-interview/session?sessionKey=${key}`);
  };

  const handleViewResult = (sessionId: number | undefined) => {
    navigate(`/user/ai-interview/result/${sessionId}`);
  };

  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Banner */}
      <Card className="mb-8 overflow-hidden border-0 bg-linear-to-r from-[#0047AB] via-[#005B9A] to-[#007BFF] py-0">
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
              onClick={() => navigate("/user/ai-interview/setup")}>
              <Plus className="mr-2 h-5 w-5" />
              Bắt đầu phỏng vấn mới
            </Button>
          </div>
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <TrendingUp className="h-16 w-16 text-white" />
          </div>
        </CardContent>
      </Card>

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

      {!isLoading && !isError && (
        <div className="space-y-8">
          {/* Active Sessions Section */}
          {activeSessions.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-foreground text-2xl font-bold">Phiên đang tiến hành</h2>
                <p className="text-muted-foreground text-sm">
                  Các buổi phỏng vấn chưa hoàn thành — còn hiệu lực trong 1 giờ từ lúc tạo
                </p>
              </div>
              <div className="space-y-4">
                {activeSessions.map((session, index) => {
                  const activeKey = session.sessionKey!;
                  const modeLabel =
                    MODE_LABELS[session.mode ?? ""] ?? session.mode ?? "Phỏng vấn AI";
                  const targetRole = session.candidateProfile?.targetRole;
                  const targetLevel = session.candidateProfile?.targetLevel;
                  const difficulty = session.sessionConfig?.difficulty;
                  const language = session.sessionConfig?.language;
                  return (
                    <Card
                      key={session.id}
                      className="cursor-pointer border-amber-300 bg-amber-50 transition-all hover:shadow-md dark:border-amber-700 dark:bg-amber-950/20">
                      <CardContent className="flex items-center gap-6 p-6">
                        {/* Number Badge */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                          <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                            {index + 1}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {/* Pulsing active indicator */}
                            <span className="relative flex h-3 w-3">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
                            </span>
                            <h3 className="text-foreground text-lg font-semibold">{modeLabel}</h3>
                          </div>

                          {/* Role / level row */}
                          {(targetRole || targetLevel) && (
                            <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              <span className="font-medium text-amber-700 dark:text-amber-400">
                                {[targetRole, targetLevel].filter(Boolean).join(" · ")}
                              </span>
                            </div>
                          )}

                          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Tạo: {formatDateTime(session.createdAt)}</span>
                            </div>
                            {session.updatedAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Cập nhật: {formatDateTime(session.updatedAt)}</span>
                              </div>
                            )}
                            {session.sessionConfig?.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{session.sessionConfig.duration_minutes} phút</span>
                              </div>
                            )}
                            {language && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-4 w-4" />
                                <span>{LANGUAGE_LABELS[language] ?? language}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge className="bg-amber-100 text-amber-700">Đang diễn ra</Badge>
                            {session.domain && (
                              <Badge variant="secondary">
                                {DOMAIN_LABELS[session.domain] ?? session.domain}
                              </Badge>
                            )}
                            {difficulty && (
                              <Badge variant="outline" className="text-xs">
                                <Zap className="mr-1 h-3 w-3" />
                                {DIFFICULTY_LABELS[difficulty] ?? difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Resume Button */}
                        <Button
                          size="sm"
                          className="bg-amber-500 text-white hover:bg-amber-600"
                          onClick={() => handleResume(activeKey)}>
                          <Play className="mr-1 h-3.5 w-3.5" />
                          Tiếp tục phỏng vấn
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* History Section */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-foreground text-2xl font-bold">Lịch sử phỏng vấn</h2>
                <p className="text-muted-foreground text-sm">
                  Xem lại các buổi phỏng vấn trước đây
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                <ReloadButton
                  onReload={async () => {
                    await refetch();
                  }}
                  isLoading={isRefetching}
                  tooltip="Tải lại lịch sử phỏng vấn AI"
                />
              </div>
            </div>
            <div className="space-y-4">
              {historySessions.map((session, index) => {
                // "Đã hết hạn" nếu: sessionKey null, HOẶC session IN_PROGRESS nhưng đã qua 1 giờ
                const isExpired =
                  (session.status === "CREATED" || session.status === "IN_PROGRESS") &&
                  (session.sessionKey == null || isSessionExpired(session.createdAt));
                const statusConfig = isExpired
                  ? { label: "Đã hết hạn", className: "bg-gray-100 text-gray-600" }
                  : (STATUS_CONFIG[session.status ?? ""] ?? {
                      label: session.status,
                      className: "bg-gray-100 text-gray-700",
                    });
                const modeLabel = MODE_LABELS[session.mode ?? ""] ?? session.mode ?? "Phỏng vấn AI";
                const hasScore =
                  session.overallScore !== undefined && session.overallScore !== null;
                const histTargetRole = session.candidateProfile?.targetRole;
                const histTargetLevel = session.candidateProfile?.targetLevel;
                const histDifficulty = session.sessionConfig?.difficulty;
                const histLanguage = session.sessionConfig?.language;
                const jobTitle = (
                  session.jobRequirement?.basic_info as Record<string, string> | undefined
                )?.job_title;

                return (
                  <Card
                    key={session.id}
                    className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md">
                    <CardContent className="flex items-center gap-6 p-6">
                      {/* Number Badge */}
                      <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
                        <span className="text-primary text-xl font-bold">{index + 1}</span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-foreground text-lg font-semibold">{modeLabel}</h3>

                        {/* Role / level / job title row */}
                        {(histTargetRole || histTargetLevel || jobTitle) && (
                          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
                            {(histTargetRole || histTargetLevel) && (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                <span className="text-foreground font-medium">
                                  {[histTargetRole, histTargetLevel].filter(Boolean).join(" · ")}
                                </span>
                              </span>
                            )}
                            {jobTitle && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" />
                                <span>{jobTitle}</span>
                              </span>
                            )}
                          </div>
                        )}

                        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Tạo: {formatDateTime(session.createdAt)}</span>
                          </div>
                          {session.updatedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Cập nhật: {formatDateTime(session.updatedAt)}</span>
                            </div>
                          )}
                          {session.completedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              <span>Hoàn thành: {formatDateTime(session.completedAt)}</span>
                            </div>
                          )}
                          {session.sessionConfig?.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{session.sessionConfig.duration_minutes} phút</span>
                            </div>
                          )}
                          {histLanguage && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-4 w-4" />
                              <span>{LANGUAGE_LABELS[histLanguage] ?? histLanguage}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {isExpired ? (
                            <Badge className="flex items-center gap-1 bg-gray-100 text-gray-600">
                              <AlertTriangle className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          ) : (
                            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                          )}
                          {session.domain && (
                            <Badge variant="secondary">
                              {DOMAIN_LABELS[session.domain] ?? session.domain}
                            </Badge>
                          )}
                          {histDifficulty && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="mr-1 h-3 w-3" />
                              {DIFFICULTY_LABELS[histDifficulty] ?? histDifficulty}
                            </Badge>
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

                      {/* View Detail Button */}
                      {!isExpired && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResult(session.id)}>
                          Xem chi tiết
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {historySessions.length === 0 && (
                <Card className="flex h-64 flex-col items-center justify-center gap-4">
                  <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                    {searchQuery ? (
                      <Search className="text-muted-foreground h-8 w-8" />
                    ) : (
                      <Clock className="text-muted-foreground h-8 w-8" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-medium">
                      {searchQuery
                        ? "Không tìm thấy buổi phỏng vấn nào"
                        : "Chưa có buổi phỏng vấn nào"}
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
              <Card className="overflow-hidden border-0 bg-linear-to-br from-[#0047AB] to-[#007BFF]">
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
                    onClick={() => navigate("/user/ai-interview/setup")}>
                    Tạo phỏng vấn mới
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
