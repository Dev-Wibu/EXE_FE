/**
 * Mentor Sessions Page
 * Displays mentor's interview sessions with option to write feedback
 */

import { Calendar, Clock, MessageSquare, User, Video } from "lucide-react";
import { useMemo, useState } from "react";
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
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  SCHEDULED: { label: "Đã lên lịch", variant: "secondary" },
  ACTIVE: { label: "Đang diễn ra", variant: "default" },
  COMPLETED: { label: "Hoàn thành", variant: "outline" },
  CANCELED: { label: "Đã hủy", variant: "destructive" },
};

interface SessionCardProps {
  session: Session;
  hasFeedback: boolean;
  onWriteFeedback: () => void;
}

function SessionCard({ session, hasFeedback, onWriteFeedback }: SessionCardProps) {
  const status = statusMap[session.status || "SCHEDULED"] || statusMap.SCHEDULED;
  const isCompleted = session.status === "COMPLETED";

  return (
    <Card className="border-emerald-100 transition-shadow hover:shadow-md dark:border-slate-800">
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
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            ID: {session.id}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {session.status}
          </span>
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
          {!isCompleted && (
            <span className="text-sm text-slate-500 italic">
              Chờ phiên hoàn thành để gửi phản hồi
            </span>
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

  const handleWriteFeedback = (session: Session) => {
    navigate(`/mentor/sessions/${session.id}/feedback`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Phiên Phỏng Vấn</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quản lý các phiên phỏng vấn và gửi phản hồi cho học viên
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
            <CardDescription>Hoàn thành</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {mentorSessions.filter((s: Session) => s.status === "COMPLETED").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Đã phản hồi</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">
              {mentorSessions.filter((s: Session) => feedbackSessionIds.has(s.id)).length}
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
