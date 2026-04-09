/**
 * Mentor Given Feedback List Page
 * Displays all feedbacks that mentor has received from students
 */

import { MessageSquare, TrendingUp, Users } from "lucide-react";

import { FeedbackCard, FeedbackStats } from "@/components/feedback";
import { ReloadButton } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardList } from "@/components/ui/loading-card";
import { useMentorFeedbacksByMentor } from "@/hooks/useMentorFeedback";
import { useAuthStore } from "@/stores/authStore";

export function GivenFeedbackListPage() {
  const user = useAuthStore((state) => state.user);
  const {
    data: feedbacks = [],
    isLoading,
    isRefetching,
    refetch,
  } = useMentorFeedbacksByMentor(user?.id || 0);

  // Calculate stats
  const totalFeedbacks = feedbacks.length;
  const avgRating =
    totalFeedbacks > 0
      ? (
          feedbacks.reduce((sum: number, f: { rating?: number }) => sum + (f.rating || 0), 0) /
          totalFeedbacks
        ).toFixed(1)
      : "0.0";

  // Get unique students
  const uniqueStudents = new Set(feedbacks.map((f: { user?: { id?: number } }) => f.user?.id));

  // Sort feedbacks by session ID descending (newest first)
  const sortedFeedbacks = [...feedbacks].sort(
    (a: { session?: { id?: number } }, b: { session?: { id?: number } }) =>
      (b.session?.id || 0) - (a.session?.id || 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Phản Hồi Nhận Được
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Các phản hồi học viên gửi cho bạn sau mỗi phiên phỏng vấn
          </p>
        </div>
        <ReloadButton
          onReload={async () => {
            await refetch();
          }}
          isLoading={isRefetching}
          tooltip="Tải lại phản hồi đã gửi"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Tổng phản hồi
            </CardDescription>
            <CardTitle className="text-2xl">{totalFeedbacks}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Điểm TB đánh giá
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{avgRating}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Số học viên
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">{uniqueStudents.size}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Đánh giá 5 sao</CardDescription>
            <CardTitle className="text-2xl text-[#FFD700]">
              {feedbacks.filter((f: { rating?: number }) => f.rating === 5).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Feedback Stats Chart */}
      {feedbacks.length > 0 && <FeedbackStats feedbacks={feedbacks} />}

      {/* Feedback List */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <CardTitle>Danh Sách Phản Hồi</CardTitle>
          </div>
          <CardDescription>Các phản hồi học viên gửi cho bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCardList count={4} />
          ) : sortedFeedbacks.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Chưa có phản hồi"
              description="Bạn chưa nhận được phản hồi nào từ học viên."
            />
          ) : (
            <div className="space-y-4">
              {sortedFeedbacks.map((feedback: { id?: number }) => (
                <FeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                  showUser
                  showMentor={false}
                  showSession
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
