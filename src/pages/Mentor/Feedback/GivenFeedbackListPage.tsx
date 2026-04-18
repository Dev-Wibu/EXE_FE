/**
 * Mentor Given Feedback List Page
 * Displays all feedbacks that mentor has received from students
 */

import { MessageSquare, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

import { FeedbackCard, FeedbackStats } from "@/components/feedback";
import { ReloadButton } from "@/components/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingCardList } from "@/components/ui/loading-card";
import { StarRating } from "@/components/ui/star-rating";
import { useMentorFeedbacksByMentor, type MentorFeedback } from "@/hooks/useMentorFeedback";
import { toTimestamp } from "@/lib/formatting";
import { useAuthStore } from "@/stores/authStore";

const toSessionTimestamp = (value?: string) => {
  return toTimestamp(value) ?? 0;
};

const getFeedbackNewestSortValue = (feedback: MentorFeedback) => {
  const endTime = toSessionTimestamp(feedback.session?.endTime1);
  if (endTime > 0) {
    return endTime;
  }

  const startTime = toSessionTimestamp(feedback.session?.startTime1);
  if (startTime > 0) {
    return startTime;
  }

  return typeof feedback.id === "number" ? feedback.id : 0;
};

export function GivenFeedbackListPage() {
  const user = useAuthStore((state) => state.user);
  const [selectedFeedback, setSelectedFeedback] = useState<MentorFeedback | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
  const uniqueStudents = new Set(
    feedbacks
      .map((feedback) => feedback.user?.id ?? feedback.session?.userId)
      .filter((id): id is number => typeof id === "number")
  );

  // Sort feedbacks by session timeline descending (newest first)
  const sortedFeedbacks = [...feedbacks].sort(
    (a: MentorFeedback, b: MentorFeedback) =>
      getFeedbackNewestSortValue(b) - getFeedbackNewestSortValue(a)
  );

  const handleOpenDetail = (feedback: MentorFeedback) => {
    setSelectedFeedback(feedback);
    setIsDetailOpen(true);
  };

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
              {sortedFeedbacks.map((feedback: MentorFeedback) => (
                <FeedbackCard
                  key={feedback.id}
                  feedback={feedback}
                  showUser
                  showMentor={false}
                  showSession
                  onClick={() => handleOpenDetail(feedback)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Phản Hồi #{selectedFeedback?.id}</DialogTitle>
            <DialogDescription>
              Phản hồi từ {selectedFeedback?.user?.name || "học viên"} gửi cho bạn
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <StarRating value={selectedFeedback.rating || 0} readOnly size="lg" />
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nội dung phản hồi
                </h4>
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedFeedback.comment || "Học viên chưa để lại nhận xét chi tiết."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-slate-500">Mã phiên:</span>{" "}
                  <span className="font-medium">
                    #{selectedFeedback.session?.id || "Không có dữ liệu"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Tên phòng:</span>{" "}
                  <span className="font-medium">
                    {selectedFeedback.session?.roomName || "Không có dữ liệu"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Học viên:</span>{" "}
                  <span className="font-medium">
                    {selectedFeedback.user?.name ||
                      (selectedFeedback.session?.userId
                        ? `Học viên #${selectedFeedback.session.userId}`
                        : "Không có dữ liệu")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Email học viên:</span>{" "}
                  <span className="font-medium">
                    {selectedFeedback.user?.email || "Không có dữ liệu"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
