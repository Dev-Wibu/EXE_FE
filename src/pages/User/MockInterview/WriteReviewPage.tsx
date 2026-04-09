/**
 * Write Review Page
 * Form for users to write feedbacks for mentors after sessions
 */

import { ArrowLeft, Star } from "lucide-react";
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

export function WriteReviewPage() {
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
            navigate(`/user/mock-interview/history/${sessionId}`);
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
            navigate(`/user/mock-interview/history/${sessionId}`);
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
            <h3 className="mt-4 font-semibold">Chua the viet phan hoi</h3>
            <p className="mt-1 text-sm text-slate-500">
              Ban chi co the viet phan hoi sau khi phien phong van hoan thanh
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(`/user/mock-interview/history/${sessionId}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại chi tiết phiên
      </Button>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle>{isEdit ? "Chỉnh Sửa Phản Hồi" : "Viết Phản Hồi"}</CardTitle>
          </div>
          <CardDescription>
            {isEdit
              ? "Cap nhat phan hoi cua ban cho mentor"
              : "Chia se phan hoi cua ban ve buoi phong van voi mentor"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MentorFeedbackForm
            sessionId={Number(sessionId)}
            mentorId={session.userId2 || 0}
            userId={user?.id || 0}
            existingFeedback={existingFeedback}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/user/mock-interview/history/${sessionId}`)}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
