/**
 * User Feedback Detail Page
 * Displays detailed mentor review received by user
 */

import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Star,
  Target,
  ThumbsUp,
  User,
  Zap,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { TimeAgo } from "@/components/ui/time-ago";
import { useMentorById } from "@/hooks/useMentor";
import { useMentorReviewById } from "@/hooks/useMentorReview";
import { treatZuluAsVietnamLocal } from "@/lib/formatting";
import { useAuthStore } from "@/stores/authStore";

export function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const reviewId = Number(id);
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { data: review, isLoading } = useMentorReviewById(reviewId);
  const mentorId = review?.mentor?.id || review?.session?.userId2 || 0;
  const { data: mentorInfo } = useMentorById(mentorId);

  const hasStarNotes =
    review?.situationNote || review?.taskNote || review?.actionNote || review?.resultNote;

  const hasAdditionalNotes = review?.strength || review?.weakness || review?.improve;
  const mentorName =
    review?.mentor?.name || mentorInfo?.name || (mentorId ? `Mentor #${mentorId}` : "Mentor");
  const mentorAvatarUrl = review?.mentor?.avatarUrl || mentorInfo?.avatarUrl;
  const mentorExpertise = review?.mentor?.expertise || mentorInfo?.expertise;
  const mentorCompany = review?.mentor?.currentCompany || mentorInfo?.currentCompany;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không tìm thấy đánh giá</h3>
            <p className="mt-1 text-sm text-slate-500">Đánh giá này không tồn tại hoặc đã bị xóa</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser?.id || review.session?.userId !== currentUser.id) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/user?tab=feedback")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không có quyền truy cập</h3>
            <p className="mt-1 text-sm text-slate-500">
              Bạn không thể xem đánh giá không thuộc về các phiên phỏng vấn của mình.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reviewEndedAt = review.session?.endTime1
    ? treatZuluAsVietnamLocal(review.session.endTime1)
    : null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/user?tab=feedback")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chi Tiết Đánh Giá</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Đánh giá từ mentor sau phiên phỏng vấn
        </p>
      </div>

      {/* Mentor Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            Thông Tin Mentor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={mentorAvatarUrl} alt={mentorName} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {mentorName.charAt(0) || "M"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{mentorName}</h3>
              <p className="text-sm text-slate-500">{mentorExpertise || "Chuyên gia phỏng vấn"}</p>
              {mentorCompany && <p className="text-sm text-slate-500">{mentorCompany}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Thông Tin Phiên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Mã phiên</p>
              <p className="font-medium">#{review.session?.id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tên phòng</p>
              <p className="font-medium">
                {review.session?.roomName || `Phiên #${review.session?.id}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Trạng thái</p>
              <p className="font-medium">{review.session?.status || "Không có dữ liệu"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-emerald-600" />
                Nội Dung Đánh Giá
              </CardTitle>
              {reviewEndedAt ? (
                <CardDescription>
                  <TimeAgo date={String(reviewEndedAt)} />
                </CardDescription>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#FFD700]" />
              <span className="text-lg font-bold">{review.rating || 0}/5</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating Display */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Đánh giá:</span>
            <StarRating value={review.rating || 0} readOnly size="md" />
          </div>

          {/* STAR Notes */}
          {hasStarNotes && (
            <div className="space-y-4">
              {review.situationNote && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-emerald-600">
                    <Target className="h-4 w-4" /> Tình huống
                  </h4>
                  <p className="rounded bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
                    {review.situationNote}
                  </p>
                </div>
              )}

              {review.taskNote && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-blue-600">
                    <ClipboardList className="h-4 w-4" /> Nhiệm vụ
                  </h4>
                  <p className="rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
                    {review.taskNote}
                  </p>
                </div>
              )}

              {review.actionNote && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-purple-600">
                    <Zap className="h-4 w-4" /> Hành động
                  </h4>
                  <p className="rounded bg-purple-50 p-3 text-sm dark:bg-purple-900/20">
                    {review.actionNote}
                  </p>
                </div>
              )}

              {review.resultNote && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-amber-600">
                    <CheckCircle2 className="h-4 w-4" /> Kết quả
                  </h4>
                  <p className="rounded bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                    {review.resultNote}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Additional Notes */}
          {hasAdditionalNotes && (
            <div className="grid gap-3 sm:grid-cols-3">
              {review.strength && (
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <h4 className="mb-1 flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-400">
                    <ThumbsUp className="h-4 w-4" /> Điểm mạnh
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-300">{review.strength}</p>
                </div>
              )}

              {review.weakness && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <h4 className="mb-1 flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" /> Điểm cần cải thiện
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-300">{review.weakness}</p>
                </div>
              )}

              {review.improve && (
                <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
                  <h4 className="mb-1 flex items-center gap-1 text-sm font-medium text-indigo-700 dark:text-indigo-400">
                    <Lightbulb className="h-4 w-4" /> Đề xuất cải thiện
                  </h4>
                  <p className="text-sm text-indigo-800 dark:text-indigo-300">{review.improve}</p>
                </div>
              )}
            </div>
          )}

          {!hasStarNotes && !hasAdditionalNotes && (
            <p className="text-sm text-slate-500 italic">Không có nội dung đánh giá chi tiết.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
