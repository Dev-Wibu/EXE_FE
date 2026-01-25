/**
 * Write Review Page
 * Form for users to write reviews for mentors after sessions
 */

import { ArrowLeft, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { MentorReviewForm } from "@/components/review";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateMentorReview,
  useMentorReviewBySession,
  useUpdateMentorReview,
} from "@/hooks/useMentorReview";
import { useSessionById } from "@/hooks/useSession";
import { useAuthStore } from "@/stores/authStore";

export function WriteReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: session, isLoading: sessionLoading } = useSessionById(Number(sessionId));
  const { data: existingReview, isLoading: reviewLoading } = useMentorReviewBySession(
    Number(sessionId)
  );
  const { mutate: createReview, isPending: isCreating } = useCreateMentorReview();
  const { mutate: updateReview, isPending: isUpdating } = useUpdateMentorReview();

  const isLoading = sessionLoading || reviewLoading;
  const isSubmitting = isCreating || isUpdating;
  const isEdit = !!existingReview;

  const handleSubmit = (data: {
    rating: number;
    situationNote?: string;
    taskNote?: string;
    actionNote?: string;
    resultNote?: string;
    strength?: string;
    weakness?: string;
    improve?: string;
    sessionId: number;
    mentorId: number;
    userId: number;
  }) => {
    if (isEdit && existingReview?.id) {
      updateReview(
        {
          id: existingReview.id,
          data: {
            rating: data.rating,
            situationNote: data.situationNote,
            taskNote: data.taskNote,
            actionNote: data.actionNote,
            resultNote: data.resultNote,
            strength: data.strength,
            weakness: data.weakness,
            improve: data.improve,
          },
        },
        {
          onSuccess: () => {
            navigate(`/dashboard/mock-interview/history/${sessionId}`);
          },
        }
      );
    } else {
      createReview(
        {
          sessionId: data.sessionId,
          mentorId: data.mentorId,
          userId: data.userId,
          rating: data.rating,
          situationNote: data.situationNote,
          taskNote: data.taskNote,
          actionNote: data.actionNote,
          resultNote: data.resultNote,
          strength: data.strength,
          weakness: data.weakness,
          improve: data.improve,
        },
        {
          onSuccess: () => {
            navigate(`/dashboard/mock-interview/history/${sessionId}`);
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
            <h3 className="mt-4 font-semibold">Chưa thể viết đánh giá</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bạn chỉ có thể viết đánh giá sau khi phiên phỏng vấn hoàn thành
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
        onClick={() => navigate(`/dashboard/mock-interview/history/${sessionId}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại chi tiết phiên
      </Button>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle>{isEdit ? "Chỉnh Sửa Đánh Giá" : "Viết Đánh Giá"}</CardTitle>
          </div>
          <CardDescription>
            {isEdit
              ? "Cập nhật đánh giá của bạn về buổi phỏng vấn"
              : "Chia sẻ trải nghiệm của bạn về buổi phỏng vấn với mentor"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MentorReviewForm
            sessionId={Number(sessionId)}
            mentorId={session.userId2 || 0}
            userId={user?.id || 0}
            existingReview={existingReview}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/dashboard/mock-interview/history/${sessionId}`)}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
