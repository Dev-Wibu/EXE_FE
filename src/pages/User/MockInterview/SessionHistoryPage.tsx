/**
 * Session History Page
 * Displays user's interview sessions with option to join or write reviews
 */

import { ArrowRight, Calendar, Clock, Star, User, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PaginationControl } from "@/components/shared/PaginationControl";
import { SortButton } from "@/components/shared/SortButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardList } from "@/components/ui/loading-card";
import { useMentorReviews } from "@/hooks/useMentorReview";
import { usePagination } from "@/hooks/usePagination";
import { useUserSessions } from "@/hooks/useSession";
import { useSortable } from "@/hooks/useSortable";
import type { Session } from "@/interfaces";

// Status badge mapping
const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  DRAFT: { label: "Chờ duyệt", variant: "secondary", color: "bg-amber-100 text-amber-700" },
  SCHEDULED: { label: "Sắp diễn ra", variant: "secondary", color: "bg-blue-100 text-blue-700" },
  ONGOING: { label: "Đang diễn ra", variant: "default", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Hoàn thành", variant: "outline", color: "bg-slate-100 text-slate-600" },
  REJECTED: { label: "Bị từ chối", variant: "destructive", color: "bg-red-100 text-red-600" },
  CANCELED: { label: "Đã hủy", variant: "destructive", color: "bg-red-100 text-red-600" },
};

interface SessionCardProps {
  session: Session;
  hasReview: boolean;
  onViewDetails: () => void;
  onWriteReview: () => void;
}

function SessionCard({ session, hasReview, onViewDetails, onWriteReview }: SessionCardProps) {
  const navigate = useNavigate();
  const status = statusMap[session.status || "SCHEDULED"] || statusMap.SCHEDULED;
  const isCompleted = session.status === "COMPLETED";
  const isDraft = session.status === "DRAFT";
  const isRejected = session.status === "REJECTED";

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0047AB]/10">
              <Video className="h-5 w-5 text-[#0047AB]" />
            </div>
            <div>
              <CardTitle className="text-base">
                {session.roomName || `Phiên #${session.id}`}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="h-3 w-3" />
                Mentor #{session.userId2}
              </CardDescription>
            </div>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* DRAFT banner */}
        {isDraft && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <Clock className="mr-1 inline h-3.5 w-3.5" />
            Yêu cầu đang chờ Staff/Admin xét duyệt
          </div>
        )}
        {/* REJECTED banner */}
        {isRejected && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Yêu cầu đã bị từ chối. Bạn có thể đặt lịch lại.
          </div>
        )}

        <div className="mb-4 flex items-center gap-4 text-sm text-slate-500">
          {session.joinTime && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Giờ hẹn:{" "}
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
                <Clock className="h-4 w-4" />
                Bắt đầu:{" "}
                {new Date(session.startTime1).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </>
          )}
          {!session.joinTime && !session.startTime1 && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Phiên #{session.id}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            Xem chi tiết
          </Button>
          {isCompleted && !hasReview && (
            <Button size="sm" onClick={onWriteReview} className="gap-1">
              <Star className="h-4 w-4" />
              Viết đánh giá
            </Button>
          )}
          {isCompleted && hasReview && (
            <Button variant="secondary" size="sm" disabled className="gap-1">
              <Star className="h-4 w-4 text-[#FFD700]" />
              Đã đánh giá
            </Button>
          )}
          {isRejected && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/dashboard/mock-interview/schedule")}
              className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50">
              <ArrowRight className="h-4 w-4" />
              Đặt lịch lại
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SessionHistoryPage() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions();
  const { data: reviews = [], isLoading: reviewsLoading } = useMentorReviews();

  const isLoading = sessionsLoading || reviewsLoading;

  // Get reviewed session IDs
  const reviewedSessionIds = new Set(
    reviews.map((r: { session?: { id?: number } }) => r.session?.id).filter(Boolean)
  );

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(sessions);

  // Apply pagination
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  const handleViewDetails = (session: Session) => {
    navigate(`/dashboard/mock-interview/history/${session.id}`);
  };

  const handleWriteReview = (session: Session) => {
    navigate(`/dashboard/mock-interview/history/${session.id}/review`);
  };

  // Stats — DRAFT is counted separately
  const draftCount = sessions.filter((s) => s.status === "DRAFT").length;
  const scheduledCount = sessions.filter(
    (s) => s.status === "SCHEDULED" || s.status === "ONGOING"
  ).length;
  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Lịch Sử Phỏng Vấn
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Xem lại các phiên phỏng vấn và viết đánh giá cho mentor
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/mock-interview/schedule")}
          className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
          <Video className="h-4 w-4" />
          Đặt lịch phỏng vấn mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng phiên</CardDescription>
            <CardTitle className="text-2xl">{sessions.length}</CardTitle>
          </CardHeader>
        </Card>
        {draftCount > 0 && (
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-2">
              <CardDescription>Chờ duyệt</CardDescription>
              <CardTitle className="text-2xl text-amber-600">{draftCount}</CardTitle>
            </CardHeader>
          </Card>
        )}
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardDescription>Sắp diễn ra</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{scheduledCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoàn thành</CardDescription>
            <CardTitle className="text-2xl text-green-600">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chờ đánh giá</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {
                sessions.filter((s) => s.status === "COMPLETED" && !reviewedSessionIds.has(s.id))
                  .length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Session List */}
      {isLoading ? (
        <LoadingCardList count={4} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Video}
          title="Chưa có phiên phỏng vấn"
          description="Bạn chưa có phiên phỏng vấn nào. Hãy đặt lịch phỏng vấn với mentor!"
          action={
            <Button onClick={() => navigate("/dashboard/mock-interview/schedule")}>
              Đặt lịch phỏng vấn
            </Button>
          }
        />
      ) : (
        <>
          {/* Sort Controls */}
          <Card className="p-4">
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
                hasReview={reviewedSessionIds.has(session.id)}
                onViewDetails={() => handleViewDetails(session)}
                onWriteReview={() => handleWriteReview(session)}
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
