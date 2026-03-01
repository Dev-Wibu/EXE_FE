/**
 * User Feedback Detail Page
 * Displays detailed feedback from mentor
 */

import { ArrowLeft, Calendar, MessageSquare, Star, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { TimeAgo } from "@/components/ui/time-ago";
import { useMentorFeedbackById } from "@/hooks/useMentorFeedback";

export function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: feedback, isLoading } = useMentorFeedbackById(Number(id));

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

  if (!feedback) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 font-semibold">Không tìm thấy phản hồi</h3>
            <p className="mt-1 text-sm text-slate-500">Phản hồi này không tồn tại hoặc đã bị xóa</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/user/feedback")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chi Tiết Phản Hồi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Phản hồi từ mentor sau phiên phỏng vấn
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
              <AvatarImage src={feedback.mentor?.avatarUrl} alt={feedback.mentor?.name} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {feedback.mentor?.name?.charAt(0) || "M"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{feedback.mentor?.name || "Mentor"}</h3>
              <p className="text-sm text-slate-500">
                {feedback.mentor?.expertise || "Chuyên gia phỏng vấn"}
              </p>
              {feedback.mentor?.currentCompany && (
                <p className="text-sm text-slate-500">{feedback.mentor.currentCompany}</p>
              )}
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
              <p className="font-medium">#{feedback.session?.id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tên phòng</p>
              <p className="font-medium">
                {feedback.session?.roomName || `Phiên #${feedback.session?.id}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Trạng thái</p>
              <p className="font-medium">{feedback.session?.status || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                Nội Dung Phản Hồi
              </CardTitle>
              <CardDescription>
                <TimeAgo date={feedback.session?.endTime1 || new Date()} />
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#FFD700]" />
              <span className="text-lg font-bold">{feedback.rating || 0}/5</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating Display */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Đánh giá:</span>
            <StarRating value={feedback.rating || 0} readOnly size="md" />
          </div>

          {/* Comment */}
          <div>
            <h4 className="mb-2 font-medium text-slate-900 dark:text-slate-100">
              Nhận xét của Mentor
            </h4>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {feedback.comment || "Không có nhận xét chi tiết."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
