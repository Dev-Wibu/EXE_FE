/**
 * Mentor Sessions Page
 * Displays mentor's interview sessions with option to join video call or write reviews
 */

import { Calendar, Check, Clock, LogIn, MessageSquare, User, Video, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PaginationControl } from "@/components/shared/PaginationControl";
import { ReloadButton } from "@/components/shared/ReloadButton";
import { SortButton } from "@/components/shared/SortButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardList } from "@/components/ui/loading-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMentorReviews } from "@/hooks/useMentorReview";
import { usePagination } from "@/hooks/usePagination";
import { useSessions, useUpdateSessionStatus } from "@/hooks/useSession";
import { useSortable } from "@/hooks/useSortable";
import type { Session } from "@/interfaces";
import { useAuthStore } from "@/stores/authStore";

// Status badge mapping
const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }
> = {
  DRAFT: { label: "Chờ duyệt", variant: "secondary", color: "bg-amber-100 text-amber-700" },
  SCHEDULED: { label: "Sắp diễn ra", variant: "secondary", color: "bg-blue-100 text-blue-700" },
  PAID: { label: "Đã thanh toán", variant: "secondary", color: "bg-emerald-100 text-emerald-700" },
  ONGOING: { label: "Đang diễn ra", variant: "default", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Hoàn thành", variant: "outline", color: "bg-slate-100 text-slate-600" },
  REJECTED: { label: "Bị từ chối", variant: "destructive", color: "bg-red-100 text-red-600" },
  CANCELED: { label: "Đã hủy", variant: "destructive", color: "bg-red-100 text-red-600" },
};

interface SessionCardProps {
  session: Session;
  hasReview: boolean;
  reviewId?: number;
  now: number;
  onViewDetails: () => void;
  onJoinSession: () => void;
  onWriteReview: () => void;
  onViewReview: () => void;
  onEditReview: () => void;
  onAcceptSession: () => void;
  onRejectSession: () => void;
  isUpdatingStatus: boolean;
}

function SessionCard({
  session,
  hasReview,
  reviewId,
  now,
  onViewDetails,
  onJoinSession,
  onWriteReview,
  onViewReview,
  onEditReview,
  onAcceptSession,
  onRejectSession,
  isUpdatingStatus,
}: SessionCardProps) {
  const status = statusMap[session.status || "SCHEDULED"] || statusMap.SCHEDULED;
  const isCompleted = session.status === "COMPLETED";
  const isTimeReached = session.joinTime ? new Date(session.joinTime).getTime() <= now : true;
  const isDraft = session.status === "DRAFT";
  const canJoin =
    (session.status === "PAID" || session.status === "ONGOING") &&
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
            {isDraft && (
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcceptSession();
                        }}
                        disabled={isUpdatingStatus}
                        className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                        <Check className="h-3.5 w-3.5" />
                        Duyệt
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Chấp nhận phiên phỏng vấn</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRejectSession();
                        }}
                        disabled={isUpdatingStatus}
                        className="gap-1">
                        <X className="h-3.5 w-3.5" />
                        Từ chối
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Từ chối phiên phỏng vấn</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
          <Button variant="outline" size="sm" onClick={onViewDetails} className="gap-1">
            Xem chi tiết
          </Button>
          {isCompleted && !hasReview && (
            <Button
              size="sm"
              onClick={onWriteReview}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              <MessageSquare className="h-4 w-4" />
              Viết đánh giá
            </Button>
          )}
          {isCompleted && hasReview && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onViewReview}
                disabled={!reviewId}
                className="gap-1">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                Xem chi tiết
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditReview}
                disabled={typeof session.id !== "number"}
                className="gap-1">
                Sửa đánh giá
              </Button>
            </>
          )}
          {!isCompleted && !canJoin && (
            <span className="text-sm text-slate-500 italic">
              {session.status === "SCHEDULED"
                ? "Chờ học viên thanh toán để mở phòng"
                : session.status === "PAID" && !isTimeReached
                  ? "Chưa đến giờ tham gia phòng"
                  : "Phiên chưa đủ điều kiện để vào phòng"}
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
  const {
    data: allSessions = [],
    isLoading: sessionsLoading,
    isRefetching: sessionsRefetching,
    refetch: refetchSessions,
  } = useSessions();
  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isRefetching: reviewsRefetching,
    refetch: refetchReviews,
  } = useMentorReviews();
  const updateStatusMutation = useUpdateSessionStatus();

  // Current time state for joinTime-based blocking (updates every 30s)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const isLoading = sessionsLoading || reviewsLoading;

  // Filter sessions where current user is the mentor (userId2)
  const mentorSessions = allSessions.filter((session: Session) => session.userId2 === user?.id);

  // Get session IDs that already have mentor reviews
  const reviewBySessionId = new Map<number, number>();
  reviews.forEach((review) => {
    if (typeof review.session?.id === "number" && typeof review.id === "number") {
      reviewBySessionId.set(review.session.id, review.id);
    }
  });
  const reviewSessionIds = new Set(reviewBySessionId.keys());

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

  const handleWriteReview = (session: Session) => {
    navigate(`/mentor/sessions/${session.id}/review`);
  };

  const handleViewDetails = (session: Session) => {
    if (typeof session.id === "number") {
      navigate(`/mentor/sessions/${session.id}`);
    }
  };

  const handleViewReview = (reviewId: number) => {
    navigate(`/mentor/reviews/${reviewId}`);
  };

  const handleEditReview = (sessionId: number) => {
    navigate(`/mentor/sessions/${sessionId}/review`);
  };

  const handleAcceptSession = (session: Session) => {
    if (session.id) {
      updateStatusMutation.mutate({ sessionId: session.id, isApproved: true });
    }
  };

  const handleRejectSession = (session: Session) => {
    if (session.id) {
      updateStatusMutation.mutate({ sessionId: session.id, isApproved: false });
    }
  };

  // Stats — DRAFT is counted separately, not in "Sắp diễn ra"
  const draftCount = mentorSessions.filter((s: Session) => s.status === "DRAFT").length;
  const scheduledCount = mentorSessions.filter(
    (s: Session) => s.status === "SCHEDULED" || s.status === "PAID" || s.status === "ONGOING"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Phiên Phỏng Vấn</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý các phiên phỏng vấn và gửi đánh giá cho học viên
          </p>
        </div>
        <ReloadButton
          onReload={async () => {
            await Promise.all([refetchSessions(), refetchReviews()]);
          }}
          isLoading={sessionsRefetching || reviewsRefetching}
          tooltip="Tải lại danh sách phiên phỏng vấn"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Tổng phiên</CardDescription>
            <CardTitle className="text-2xl">{mentorSessions.length}</CardTitle>
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
            <CardDescription>Chờ đánh giá</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {
                mentorSessions.filter(
                  (s: Session) =>
                    s.status === "COMPLETED" &&
                    typeof s.id === "number" &&
                    !reviewSessionIds.has(s.id)
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
              // Prefer opening existing review detail when available.
              <SessionCard
                key={session.id}
                session={session}
                hasReview={typeof session.id === "number" && reviewSessionIds.has(session.id)}
                reviewId={
                  typeof session.id === "number" ? reviewBySessionId.get(session.id) : undefined
                }
                now={now}
                onViewDetails={() => handleViewDetails(session)}
                onJoinSession={() => handleJoinSession(session)}
                onWriteReview={() => handleWriteReview(session)}
                onViewReview={() => {
                  if (typeof session.id !== "number") return;
                  const reviewId = reviewBySessionId.get(session.id);
                  if (reviewId) {
                    handleViewReview(reviewId);
                  }
                }}
                onEditReview={() => {
                  if (typeof session.id === "number") {
                    handleEditReview(session.id);
                  }
                }}
                onAcceptSession={() => handleAcceptSession(session)}
                onRejectSession={() => handleRejectSession(session)}
                isUpdatingStatus={updateStatusMutation.isPending}
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
