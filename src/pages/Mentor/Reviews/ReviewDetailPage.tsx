/**
 * Mentor Review Detail Page
 * Displays detailed review from a student
 */

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Star,
  Target,
  ThumbsUp,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { TimeAgo } from "@/components/ui/time-ago";
import { useMentorReviewById } from "@/hooks/useMentorReview";

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: review, isLoading } = useMentorReviewById(Number(id));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
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
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không tìm thấy đánh giá</h3>
            <p className="mt-1 text-sm text-slate-500">Đánh giá này không tồn tại hoặc đã bị xóa</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/mentor?tab=reviews")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chi Tiết Đánh Giá</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Đánh giá từ học viên sau phiên phỏng vấn
        </p>
      </div>

      {/* Student Info Card */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            Thông Tin Học Viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={review.user?.avatarUrl} alt={review.user?.name} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {review.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{review.user?.name || "Học viên"}</h3>
              <p className="text-sm text-slate-500">{review.user?.email}</p>
              {review.user?.university && (
                <p className="text-sm text-slate-500">{review.user.university}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card className="border-emerald-100 dark:border-slate-800">
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
          </div>
        </CardContent>
      </Card>

      {/* Rating Card */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-[#FFD700]" />
                Đánh Giá Tổng Quan
              </CardTitle>
              <CardDescription>
                <TimeAgo date={review.session?.endTime1 || new Date()} />
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#FFD700]">{review.rating || 0}</span>
              <span className="text-lg text-slate-500">/5</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StarRating value={review.rating || 0} readOnly size="lg" />
        </CardContent>
      </Card>

      {/* STAR Method Review */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Đánh Giá Chi Tiết (STAR Method)</CardTitle>
          <CardDescription>Phương pháp đánh giá STAR từ học viên</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Situation */}
          {review.situationNote && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <Target className="h-4 w-4" /> Situation (Tình huống)
              </h4>
              <div className="rounded-lg bg-emerald-50/50 p-4 dark:bg-emerald-900/20">
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {review.situationNote}
                </p>
              </div>
            </div>
          )}

          {/* Task */}
          {review.taskNote && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400">
                <ClipboardList className="h-4 w-4" /> Task (Nhiệm vụ)
              </h4>
              <div className="rounded-lg bg-blue-50/50 p-4 dark:bg-blue-900/20">
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {review.taskNote}
                </p>
              </div>
            </div>
          )}

          {/* Action */}
          {review.actionNote && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-medium text-purple-700 dark:text-purple-400">
                <Zap className="h-4 w-4" /> Action (Hành động)
              </h4>
              <div className="rounded-lg bg-purple-50/50 p-4 dark:bg-purple-900/20">
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {review.actionNote}
                </p>
              </div>
            </div>
          )}

          {/* Result */}
          {review.resultNote && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                <CheckCircle2 className="h-4 w-4" /> Result (Kết quả)
              </h4>
              <div className="rounded-lg bg-amber-50/50 p-4 dark:bg-amber-900/20">
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {review.resultNote}
                </p>
              </div>
            </div>
          )}

          {/* No STAR notes */}
          {!review.situationNote &&
            !review.taskNote &&
            !review.actionNote &&
            !review.resultNote && (
              <p className="text-slate-500 italic">Học viên chưa điền chi tiết STAR method.</p>
            )}
        </CardContent>
      </Card>

      {/* Additional Feedback */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Nhận Xét Bổ Sung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strengths */}
          {review.strength && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-medium text-green-700 dark:text-green-400">
                <ThumbsUp className="h-4 w-4" /> Điểm mạnh
              </h4>
              <div className="rounded-lg bg-green-50/50 p-4 dark:bg-green-900/20">
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {review.strength}
                </p>
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {review.weakness && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-medium text-red-700 dark:text-red-400">
                <Wrench className="h-4 w-4" /> Điểm cần cải thiện
              </h4>
              <div className="rounded-lg bg-red-50/50 p-4 dark:bg-red-900/20">
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {review.weakness}
                </p>
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          {review.improve && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-medium text-indigo-700 dark:text-indigo-400">
                <Lightbulb className="h-4 w-4" /> Đề xuất cải tiến
              </h4>
              <div className="rounded-lg bg-indigo-50/50 p-4 dark:bg-indigo-900/20">
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {review.improve}
                </p>
              </div>
            </div>
          )}

          {/* No additional feedback */}
          {!review.strength && !review.weakness && !review.improve && (
            <p className="text-slate-500 italic">Không có nhận xét bổ sung.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
