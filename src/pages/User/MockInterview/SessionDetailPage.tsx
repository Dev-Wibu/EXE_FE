/**
 * Session Detail Page
 * Shows session details with review and feedback
 */

import { ArrowLeft, Calendar, Clock, MessageSquare, Star, User, Video } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { FeedbackCard } from "@/components/feedback";
import { ReviewCard } from "@/components/review";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMentorFeedbackBySession } from "@/hooks/useMentorFeedback";
import { useMentorReviewBySession } from "@/hooks/useMentorReview";
import { useSessionById } from "@/hooks/useSession";

// Status badge mapping
const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Chờ duyệt", variant: "secondary" },
  SCHEDULED: { label: "Đã lên lịch", variant: "secondary" },
  ACTIVE: { label: "Đang diễn ra", variant: "default" },
  ONGOING: { label: "Đang diễn ra", variant: "default" },
  COMPLETED: { label: "Hoàn thành", variant: "outline" },
  REJECTED: { label: "Bị từ chối", variant: "destructive" },
  CANCELED: { label: "Đã hủy", variant: "destructive" },
};

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { data: session, isLoading: sessionLoading } = useSessionById(Number(sessionId));
  const { data: review, isLoading: reviewLoading } = useMentorReviewBySession(Number(sessionId));
  const { data: feedback, isLoading: feedbackLoading } = useMentorFeedbackBySession(
    Number(sessionId)
  );

  const isLoading = sessionLoading;
  const isCompleted = session?.status === "COMPLETED";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không tìm thấy phiên phỏng vấn</h3>
            <p className="mt-1 text-sm text-slate-500">
              Phiên phỏng vấn này không tồn tại hoặc đã bị xóa
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusMap[session.status || "SCHEDULED"] || statusMap.SCHEDULED;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/user/mock-interview")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại lịch sử
      </Button>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0047AB]/10">
                <Video className="h-6 w-6 text-[#0047AB]" />
              </div>
              <div>
                <CardTitle>{session.roomName || `Phiên #${session.id}`}</CardTitle>
                <CardDescription>Chi tiết phiên phỏng vấn</CardDescription>
              </div>
            </div>
            <Badge variant={status.variant} className="text-sm">
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Người hướng dẫn:</span>
              <span className="font-medium">ID #{session.userId2}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Mã phiên:</span>
              <span className="font-medium">{session.id}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">Trạng thái:</span>
              <span className="font-medium">{session.status}</span>
            </div>
            {session.roomUrl &&
              (session.status === "DRAFT" ||
                session.status === "SCHEDULED" ||
                session.status === "ONGOING") && (
                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Phòng:</span>
                  <button
                    onClick={() => navigate(`/dashboard/mock-interview/room/${session.id}`)}
                    className="font-medium text-[#0047AB] hover:underline">
                    Tham gia phòng
                  </button>
                </div>
              )}
          </div>

          {/* Action Buttons */}
          {isCompleted && !review && (
            <div className="border-t pt-4">
              <Button
                onClick={() => navigate(`/dashboard/mock-interview/history/${session.id}/review`)}
                className="gap-2">
                <Star className="h-4 w-4" />
                Viết đánh giá cho Mentor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle className="text-lg">Đánh Giá Của Bạn</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {reviewLoading ? (
            <Skeleton className="h-32" />
          ) : review ? (
            <ReviewCard review={review} showMentor />
          ) : isCompleted ? (
            <div className="py-8 text-center">
              <Star className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">Bạn chưa viết đánh giá cho phiên này</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/dashboard/mock-interview/history/${session.id}/review`)}>
                Viết đánh giá
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Star className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">
                Đánh giá chỉ có thể viết sau khi phiên phỏng vấn hoàn thành
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">Phản Hồi Từ Mentor</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {feedbackLoading ? (
            <Skeleton className="h-32" />
          ) : feedback ? (
            <FeedbackCard feedback={feedback} showMentor showSession={false} />
          ) : isCompleted ? (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">Mentor chưa gửi phản hồi cho phiên này</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-slate-500">
                Phản hồi sẽ được gửi sau khi phiên phỏng vấn hoàn thành
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
