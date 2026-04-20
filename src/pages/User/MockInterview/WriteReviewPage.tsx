/**
 * Write Review Page
 * Form for users to write feedbacks for mentors after sessions
 */

import { ArrowLeft, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

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

export function WriteReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const numericSessionId = Number(sessionId);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id;

  const { data: session, isLoading: sessionLoading } = useSessionById(numericSessionId);
  const { data: existingFeedback, isLoading: feedbackLoading } =
    useMentorFeedbackBySession(numericSessionId);
  const { mutate: createFeedback, isPending: isCreating } = useCreateMentorFeedback();
  const { mutate: updateFeedback, isPending: isUpdating } = useUpdateMentorFeedback();

  const isLoading = sessionLoading || feedbackLoading;
  const isSubmitting = isCreating || isUpdating;
  const isEdit = !!existingFeedback;

  const handleSubmit = (data: {
    rating?: number;
    comment?: string;
    sessionId: number;
    mentorId: number;
    userId: number;
  }) => {
    if (!session || !currentUserId || session.userId !== currentUserId) {
      toast.error("Bạn không có quyền gửi phản hồi cho phiên phỏng vấn này.");
      return;
    }

    if (session.status !== "COMPLETED") {
      toast.error("Bạn chỉ có thể gửi phản hồi sau khi phiên phỏng vấn đã hoàn thành.");
      return;
    }

    if (!session.id || !session.userId2) {
      toast.error("Không xác định được mentor của phiên phỏng vấn để gửi phản hồi.");
      return;
    }

    const normalizedRating = data.rating && data.rating > 0 ? data.rating : undefined;
    const normalizedComment = data.comment?.trim() || undefined;

    if (!normalizedRating && !normalizedComment) {
      toast.error("Vui lòng chọn số sao hoặc nhập nhận xét trước khi gửi phản hồi.");
      return;
    }

    const payload = {
      sessionId: session.id,
      mentorId: session.userId2,
      userId: currentUserId,
      rating: normalizedRating,
      comment: normalizedComment,
    };

    if (isEdit && existingFeedback?.id) {
      updateFeedback(
        {
          id: existingFeedback.id,
          data: {
            rating: payload.rating,
            comment: payload.comment,
          },
        },
        {
          onSuccess: () => {
            navigate(`/user/mock-interview/history/${numericSessionId}`);
          },
        }
      );
    } else {
      createFeedback(payload, {
        onSuccess: () => {
          navigate(`/user/mock-interview/history/${numericSessionId}`);
        },
      });
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
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không tìm thấy phiên phỏng vấn</h3>
            <p className="mt-1 text-sm text-slate-500">
              Phiên phỏng vấn này không tồn tại hoặc đã bị xóa
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUserId || session.userId !== currentUserId) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không có quyền truy cập</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bạn không thể gửi phản hồi cho phiên phỏng vấn không thuộc về mình.
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
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Chưa thể viết phản hồi</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bạn chỉ có thể viết phản hồi sau khi phiên phỏng vấn hoàn thành
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session.userId2) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Thiếu thông tin mentor</h3>
            <p className="mt-1 text-sm text-slate-500">
              Không tìm thấy mentor của phiên phỏng vấn này để gửi phản hồi.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/user/mock-interview/history/${numericSessionId}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại chi tiết phiên
      </Button>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle>{isEdit ? "Chỉnh sửa phản hồi" : "Viết phản hồi"}</CardTitle>
          </div>
          <CardDescription>
            {isEdit
              ? "Cập nhật phản hồi của bạn cho mentor"
              : "Chia sẻ phản hồi của bạn về buổi phỏng vấn với mentor"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MentorFeedbackForm
            sessionId={numericSessionId}
            mentorId={session.userId2}
            userId={currentUserId}
            existingFeedback={existingFeedback}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/user/mock-interview/history/${numericSessionId}`)}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
