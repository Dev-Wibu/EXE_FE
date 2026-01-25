/**
 * Write Feedback Page (Mentor)
 * Form for mentors to write feedback for students after sessions
 */

import { ArrowLeft, MessageSquare, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { MentorFeedbackForm } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateMentorFeedback,
  useMentorFeedbackBySession,
  useUpdateMentorFeedback,
} from "@/hooks/useMentorFeedback";
import { useSessionById } from "@/hooks/useSession";
import { useAuthStore } from "@/stores/authStore";

export function WriteFeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: session, isLoading: sessionLoading } = useSessionById(Number(sessionId));
  const { data: existingFeedback, isLoading: feedbackLoading } = useMentorFeedbackBySession(
    Number(sessionId)
  );
  const { mutate: createFeedback, isPending: isCreating } = useCreateMentorFeedback();
  const { mutate: updateFeedback, isPending: isUpdating } = useUpdateMentorFeedback();

  const isLoading = sessionLoading || feedbackLoading;
  const isSubmitting = isCreating || isUpdating;
  const isEdit = !!existingFeedback;

  const handleSubmit = (data: {
    rating: number;
    comment: string;
    sessionId: number;
    mentorId: number;
    userId: number;
  }) => {
    if (isEdit && existingFeedback?.id) {
      updateFeedback(
        {
          id: existingFeedback.id,
          data: {
            rating: data.rating,
            comment: data.comment,
          },
        },
        {
          onSuccess: () => {
            navigate("/mentor/sessions");
          },
        }
      );
    } else {
      createFeedback(
        {
          sessionId: data.sessionId,
          mentorId: data.mentorId,
          userId: data.userId,
          rating: data.rating,
          comment: data.comment,
        },
        {
          onSuccess: () => {
            navigate("/mentor/sessions");
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
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
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không tìm thấy phiên phỏng vấn</h3>
            <p className="mt-1 text-sm text-slate-500">
              Phiên phỏng vấn này không tồn tại hoặc đã bị xóa
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.status !== "COMPLETED") {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Chưa thể viết phản hồi</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bạn chỉ có thể viết phản hồi sau khi phiên phỏng vấn hoàn thành
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if current user is the mentor for this session
  if (session.userId2 !== user?.id) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không có quyền truy cập</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bạn không phải là mentor của phiên phỏng vấn này
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/mentor/sessions")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách phiên
      </Button>

      {/* Session Info */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base">Học viên #{session.userId}</CardTitle>
              <CardDescription>{session.roomName || `Phiên #${session.id}`}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Feedback Form */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <CardTitle>{isEdit ? "Chỉnh Sửa Phản Hồi" : "Viết Phản Hồi"}</CardTitle>
          </div>
          <CardDescription>
            {isEdit
              ? "Cập nhật phản hồi của bạn về buổi phỏng vấn"
              : "Chia sẻ nhận xét và đánh giá về học viên trong buổi phỏng vấn"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MentorFeedbackForm
            sessionId={Number(sessionId)}
            mentorId={user?.id || 0}
            userId={session.userId || 0}
            existingFeedback={existingFeedback}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/mentor/sessions")}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
