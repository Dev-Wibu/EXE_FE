/**
 * Mentor Reviews Page
 * Displays reviews received from students
 */

import { Star } from "lucide-react";

import { ReviewList, ReviewStats } from "@/components/review";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMentorReviewsByMentor } from "@/hooks/useMentorReview";
import { useAuthStore } from "@/stores/authStore";

export function MentorReviewsPage() {
  const user = useAuthStore((state) => state.user);
  const { data: reviews = [], isLoading } = useMentorReviewsByMentor(user?.id || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Đánh Giá Nhận Được
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Xem các đánh giá từ học viên sau mỗi phiên phỏng vấn
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Tổng đánh giá</CardDescription>
            <CardTitle className="text-2xl">{reviews.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Điểm trung bình</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">
              {reviews.length > 0
                ? (
                    reviews.reduce(
                      (sum: number, r: { rating?: number }) => sum + (r.rating || 0),
                      0
                    ) / reviews.length
                  ).toFixed(1)
                : "0.0"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Đánh giá 5 sao</CardDescription>
            <CardTitle className="text-2xl text-yellow-500">
              {reviews.filter((r: { rating?: number }) => r.rating === 5).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Review Stats Chart */}
      {reviews.length > 0 && <ReviewStats reviews={reviews} />}

      {/* Review List */}
      <Card className="border-emerald-100 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle>Danh Sách Đánh Giá</CardTitle>
          </div>
          <CardDescription>Các đánh giá bạn nhận được từ học viên</CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewList
            reviews={reviews}
            isLoading={isLoading}
            showUser
            showMentor={false}
            emptyTitle="Chưa có đánh giá"
            emptyDescription="Bạn chưa nhận được đánh giá nào từ học viên."
          />
        </CardContent>
      </Card>
    </div>
  );
}
