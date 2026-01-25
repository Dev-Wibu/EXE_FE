/**
 * User Feedback List Page
 * Displays feedbacks received from mentors
 */

import { MessageSquare } from "lucide-react";

import { FeedbackList, FeedbackStats } from "@/components/feedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMentorFeedbacksByUser } from "@/hooks/useMentorFeedback";
import { useAuthStore } from "@/stores/authStore";

export function UserFeedbackListPage() {
  const user = useAuthStore((state) => state.user);
  const { data: feedbacks = [], isLoading } = useMentorFeedbacksByUser(user?.id || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Phản Hồi Từ Mentor
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Xem các phản hồi từ mentor sau mỗi phiên phỏng vấn
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng phản hồi</CardDescription>
            <CardTitle className="text-2xl">{feedbacks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Điểm trung bình</CardDescription>
            <CardTitle className="text-2xl text-[#0047AB]">
              {feedbacks.length > 0
                ? (
                    feedbacks.reduce(
                      (sum: number, f: { rating?: number }) => sum + (f.rating || 0),
                      0
                    ) / feedbacks.length
                  ).toFixed(1)
                : "0.0"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đánh giá cao nhất</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {feedbacks.length > 0
                ? Math.max(...feedbacks.map((f: { rating?: number }) => f.rating || 0))
                : 0}{" "}
              ★
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Feedback Stats Chart */}
      {feedbacks.length > 0 && <FeedbackStats feedbacks={feedbacks} />}

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <CardTitle>Danh Sách Phản Hồi</CardTitle>
          </div>
          <CardDescription>
            Các phản hồi bạn nhận được từ mentor sau mỗi buổi phỏng vấn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackList
            feedbacks={feedbacks}
            isLoading={isLoading}
            showMentor
            emptyTitle="Chưa có phản hồi"
            emptyDescription="Bạn chưa nhận được phản hồi nào từ mentor. Hãy tham gia phỏng vấn để nhận feedback!"
          />
        </CardContent>
      </Card>
    </div>
  );
}
