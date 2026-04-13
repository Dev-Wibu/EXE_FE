/**
 * Write Feedback Page (Mentor)
 * Form for mentors to write reviews for students after sessions
 */

import { ArrowLeft, Star, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

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

export function WriteFeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const numericSessionId = Number(sessionId);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: session, isLoading: sessionLoading } = useSessionById(numericSessionId);
  const { data: existingReview, isLoading: reviewLoading } =
    useMentorReviewBySession(numericSessionId);
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
    if (!session || !user?.id || session.userId2 !== user.id) {
      toast.error("Bạn không có quyền gửi đánh giá cho phiên phỏng vấn này.");
      return;
    }

    if (session.status !== "COMPLETED") {
      toast.error("Bạn chỉ có thể gửi đánh giá sau khi phiên phỏng vấn hoàn thành.");
      return;
    }

    if (!session.id || !session.userId) {
      toast.error("Thiếu thông tin học viên của phiên phỏng vấn.");
      return;
    }

    const payload = {
      sessionId: session.id,
      mentorId: user.id,
      userId: session.userId,
      rating: data.rating,
      situationNote: data.situationNote,
      taskNote: data.taskNote,
      actionNote: data.actionNote,
      resultNote: data.resultNote,
      strength: data.strength,
      weakness: data.weakness,
      improve: data.improve,
    };

    if (isEdit && existingReview?.id) {
      updateReview(
        {
          id: existingReview.id,
          data: {
            rating: payload.rating,
            situationNote: payload.situationNote,
            taskNote: payload.taskNote,
            actionNote: payload.actionNote,
            resultNote: payload.resultNote,
            strength: payload.strength,
            weakness: payload.weakness,
            improve: payload.improve,
          },
        },
        {
          onSuccess: () => {
            navigate("/mentor?tab=sessions");
          },
        }
      );
    } else {
      createReview(payload, {
        onSuccess: () => {
          navigate("/mentor?tab=sessions");
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
        <Card className="border-emerald-100 dark:border-slate-800">
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
        <Card className="border-emerald-100 dark:border-slate-800">
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
      <Button variant="ghost" onClick={() => navigate("/mentor?tab=sessions")}>
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
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle>{isEdit ? "Chỉnh Sửa Đánh Giá" : "Viết Đánh Giá"}</CardTitle>
          </div>
          <CardDescription>
            {isEdit
              ? "Cập nhật đánh giá của bạn về học viên"
              : "Đánh giá học viên sau buổi phỏng vấn theo mẫu STAR"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MentorReviewForm
            sessionId={numericSessionId}
            mentorId={user?.id || 0}
            userId={session.userId || 0}
            existingReview={existingReview}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/mentor?tab=sessions")}
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
