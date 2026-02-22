/**
 * Mentor Sessions Page
 * Displays mentor's interview sessions with option to join video call or write feedback
 */

import { Calendar, Clock, LogIn, MessageSquare, User, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PaginationControl } from "@/components/shared/PaginationControl";
import { SortButton } from "@/components/shared/SortButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardList } from "@/components/ui/loading-card";
import { useMentorFeedbacks } from "@/hooks/useMentorFeedback";
import { usePagination } from "@/hooks/usePagination";
import { useSessions } from "@/hooks/useSession";
import { useSortable } from "@/hooks/useSortable";
import type { Session } from "@/interfaces";
import { useAuthStore } from "@/stores/authStore";

// Status badge mapping
const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  SCHEDULED: { label: "Sắp diễn ra", variant: "secondary", color: "bg-blue-100 text-blue-700" },
  ONGOING: { label: "Đang diễn ra", variant: "default", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Hoàn thành", variant: "outline", color: "bg-slate-100 text-slate-600" },
  CANCELED: { label: "Đã hủy", variant: "destructive", color: "bg-red-100 text-red-600" },
};

interface SessionCardProps {
  session: Session;
  hasFeedback: boolean;
  now: number;
  onJoinSession: () => void;
  onWriteFeedback: () => void;
}

function SessionCard({
  session,
  hasFeedback,
  now,
  onJoinSession,
  onWriteFeedback,
}: SessionCardProps) {
  const status = statusMap[session.status || "SCHEDULED"] || statusMap.SCHEDULED;
  const isCompleted = session.status === "COMPLETED";
  const isTimeReached = session.joinTime ? new Date(session.joinTime).getTime() <= now : true;
  const canJoin =
    (session.status === "SCHEDULED" || session.status === "ONGOING") &&
    !!session.roomUrl &&
    isTimeReached;

  return (
    <Card className="border-emerald-100 transition-all hover:shadow-md dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Video className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base">
                {session.roomName || `Phiên #${session.id}`}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="h-3 w-3" />
                Học viên #{session.userId}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={status.color}>{status.label}</Badge>
            {!isTimeReached &&
              !isCompleted &&
              session.status !== "CANCELED" &&
              session.joinTime && (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                  <Clock className="mr-1 h-3 w-3" />
                  Chưa đến giờ
                </Badge>
              )}
            {canJoin && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinSession();
                }}
                className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                <LogIn className="h-3.5 w-3.5" />
                Join
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
          {session.joinTime && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Giờ họp:{" "}
              {new Date(session.joinTime).toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {session.startTime1 && (
            <>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(session.startTime1).toLocaleDateString("vi-VN")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(session.startTime1).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </>
          )}
          {!session.startTime1 && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Phiên #{session.id}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {isCompleted && !hasFeedback && (
            <Button
              size="sm"
              onClick={onWriteFeedback}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              <MessageSquare className="h-4 w-4" />
              Viết phản hồi
            </Button>
          )}
          {isCompleted && hasFeedback && (
            <Button variant="secondary" size="sm" disabled className="gap-1">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              Đã gửi phản hồi
            </Button>
          )}
          {!isCompleted && !canJoin && (
            <span className="text-sm text-slate-500 italic">Phiên đã kết thúc hoặc bị hủy</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MentorSessionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [pageSize, setPageSize] = useState(10);
  const { data: allSessions = [], isLoading: sessionsLoading } = useSessions();
  const { data: feedbacks = [], isLoading: feedbacksLoading } = useMentorFeedbacks();

  // Current time state for joinTime-based blocking (updates every 30s)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const isLoading = sessionsLoading || feedbacksLoading;

  // Filter sessions where current user is the mentor (userId2)
  const mentorSessions = allSessions.filter((session: Session) => session.userId2 === user?.id);

  // Get session IDs that already have feedback
  const feedbackSessionIds = new Set(
    feedbacks.map((f: { session?: { id?: number } }) => f.session?.id).filter(Boolean)
  );

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(mentorSessions);

  // Apply pagination
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  const handleJoinSession = (session: Session) => {
    if (session.roomUrl) {
      navigate(`/mentor/sessions/room/${session.id}`);
    }
  };

  const handleWriteFeedback = (session: Session) => {
    navigate(`/mentor/sessions/${session.id}/feedback`);
  };

  // Stats
  const scheduledCount = mentorSessions.filter(
    (s: Session) => s.status === "SCHEDULED" || s.status === "ONGOING"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Phiên Phỏng Vấn</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quản lý các phiên phỏng vấn và tham gia video call với học viên
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Tổng phiên</CardDescription>
            <CardTitle className="text-2xl">{mentorSessions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Sắp diễn ra</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{scheduledCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Hoàn thành</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {mentorSessions.filter((s: Session) => s.status === "COMPLETED").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Chờ phản hồi</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {
                mentorSessions.filter(
                  (s: Session) => s.status === "COMPLETED" && !feedbackSessionIds.has(s.id)
                ).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Session List */}
      {isLoading ? (
        <LoadingCardList count={4} />
      ) : mentorSessions.length === 0 ? (
        <EmptyState
          icon={Video}
          title="Chưa có phiên phỏng vấn"
          description="Bạn chưa có phiên phỏng vấn nào với học viên."
        />
      ) : (
        <>
          {/* Sort Controls */}
          <Card className="border-emerald-100 p-4 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sắp xếp theo:
              </span>
              <SortButton {...getSortProps("id")}>ID</SortButton>
              <SortButton {...getSortProps("status")}>Trạng thái</SortButton>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {pageData.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                hasFeedback={feedbackSessionIds.has(session.id)}
                now={now}
                onJoinSession={() => handleJoinSession(session)}
                onWriteFeedback={() => handleWriteFeedback(session)}
              />
            ))}
          </div>

          {/* Pagination */}
          <PaginationControl
            pagination={pagination}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </>
      )}
    </div>
  );
}
