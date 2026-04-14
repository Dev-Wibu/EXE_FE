import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  MessageSquare,
  Star,
  User,
  Video,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMentorById } from "@/hooks/useMentor";
import { useMentorReviewBySession } from "@/hooks/useMentorReview";
import { useSessionById } from "@/hooks/useSession";
import { formatCurrency, formatDateTime } from "@/lib/formatting";
import { useAuthStore } from "@/stores/authStore";

const statusMap: Record<string, { label: string; badgeClass: string }> = {
  DRAFT: { label: "Chờ duyệt", badgeClass: "bg-amber-100 text-amber-700" },
  SCHEDULED: { label: "Sắp diễn ra", badgeClass: "bg-blue-100 text-blue-700" },
  PAID: { label: "Đã thanh toán", badgeClass: "bg-emerald-100 text-emerald-700" },
  ONGOING: { label: "Đang diễn ra", badgeClass: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Hoàn thành", badgeClass: "bg-slate-100 text-slate-700" },
  REJECTED: { label: "Bị từ chối", badgeClass: "bg-red-100 text-red-700" },
  CANCELED: { label: "Đã hủy", badgeClass: "bg-red-100 text-red-700" },
};

const fallbackStatus = statusMap.SCHEDULED;

export function MentorSessionDetailPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const user = useAuthStore((state) => state.user);

  const numericSessionId = Number(sessionId);
  const { data: session, isLoading: sessionLoading } = useSessionById(numericSessionId);
  const { data: mentorInfo } = useMentorById(session?.userId2 || 0);
  const { data: mentorReview, isLoading: reviewLoading } =
    useMentorReviewBySession(numericSessionId);

  const isAllowed = session && session.userId2 === user?.id;

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    if (!session || !isAllowed) {
      navigate("/mentor?tab=sessions", { replace: true });
    }
  }, [isAllowed, navigate, session, sessionLoading]);

  if (sessionLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-[260px]" />
        <Skeleton className="h-[220px]" />
      </div>
    );
  }

  if (!session || !isAllowed) {
    return null;
  }

  const status = statusMap[session.status || "SCHEDULED"] || fallbackStatus;
  const canJoinRoom =
    (session.status === "PAID" || session.status === "ONGOING") &&
    typeof session.roomUrl === "string";
  const canReview = session.status === "COMPLETED";

  return (
    <div className="space-y-5">
      <Button variant="outline" className="w-fit" onClick={() => navigate("/mentor?tab=sessions")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách phiên
      </Button>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Video className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>{session.roomName || `Phiên #${session.id}`}</CardTitle>
                <CardDescription>Chi tiết phiên phỏng vấn mentor</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Mã #{session.id || "-"}</Badge>
              <Badge className={status.badgeClass}>{status.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Mã phiên:</span>
              <span className="font-medium">{session.id || "-"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Học viên:</span>
              <span className="font-medium">#{session.userId || "-"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Mentor:</span>
              <span className="font-medium">
                {mentorInfo?.name || (session.userId2 ? `Mentor #${session.userId2}` : "-")}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Giờ hẹn:</span>
              <span className="font-medium">{formatDateTime(session.joinTime)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Thời lượng:</span>
              <span className="font-medium">
                {typeof session.duration === "number" && session.duration > 0
                  ? `${session.duration} phút`
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Tổng giá:</span>
              <span className="font-medium">
                {typeof session.totalPrice === "number" && session.totalPrice > 0
                  ? formatCurrency(session.totalPrice)
                  : "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:col-span-2 lg:col-span-3 dark:bg-slate-900/50">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Mã giao dịch:</span>
              <span className="font-medium">{session.transactionCode || "-"}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/30">
            <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Hành động nhanh
            </p>
            <div className="flex flex-wrap gap-2">
              {canJoinRoom && (
                <Button
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => navigate(`/mentor/sessions/room/${session.id}`)}>
                  <Video className="h-4 w-4" />
                  Vào phòng phỏng vấn
                </Button>
              )}

              {canReview && !mentorReview && (
                <Button
                  className="gap-2"
                  onClick={() => navigate(`/mentor/sessions/${session.id}/review`)}>
                  <MessageSquare className="h-4 w-4" />
                  Viết đánh giá
                </Button>
              )}

              {canReview && mentorReview?.id && (
                <>
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => navigate(`/mentor/reviews/${mentorReview.id}`)}>
                    <MessageSquare className="h-4 w-4" />
                    Xem đánh giá
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate(`/mentor/sessions/${session.id}/review`)}>
                    Sửa đánh giá
                  </Button>
                </>
              )}

              {!canJoinRoom && !canReview && (
                <p className="text-sm text-slate-500">
                  Phiên này hiện chỉ ở chế độ theo dõi thông tin, chưa có thao tác bổ sung.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle>Đánh giá của bạn</CardTitle>
          </div>
          <CardDescription>Tổng quan nội dung đánh giá đã gửi cho học viên</CardDescription>
        </CardHeader>
        <CardContent>
          {reviewLoading ? (
            <Skeleton className="h-28" />
          ) : !mentorReview ? (
            <p className="text-sm text-slate-500">Phiên này chưa có đánh giá nào được gửi.</p>
          ) : (
            <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/30">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-yellow-100 text-yellow-700">
                  <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {typeof mentorReview.rating === "number" ? mentorReview.rating.toFixed(1) : "-"}
                </Badge>
                {mentorReview.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/mentor/reviews/${mentorReview.id}`)}>
                    Xem chi tiết đánh giá
                  </Button>
                )}
              </div>
              {mentorReview.strength && (
                <p>
                  <span className="font-semibold text-green-700">Điểm mạnh: </span>
                  {mentorReview.strength}
                </p>
              )}
              {mentorReview.weakness && (
                <p>
                  <span className="font-semibold text-amber-700">Điểm cần cải thiện: </span>
                  {mentorReview.weakness}
                </p>
              )}
              {mentorReview.improve && (
                <p>
                  <span className="font-semibold text-blue-700">Đề xuất cải thiện: </span>
                  {mentorReview.improve}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
