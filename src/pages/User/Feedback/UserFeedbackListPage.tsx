/**
 * User Feedback List Page
 * Displays mentor reviews received by users
 */

import { MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";

import { ReviewList, ReviewStats } from "@/components/review";
import { PaginationControl } from "@/components/shared/PaginationControl";
import { ReloadButton } from "@/components/shared/ReloadButton";
import { SortButton } from "@/components/shared/SortButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMentorReviewsByUser } from "@/hooks/useMentorReview";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { useAuthStore } from "@/stores/authStore";

export function UserFeedbackListPage() {
  const user = useAuthStore((state) => state.user);
  const [pageSize, setPageSize] = useState(10);
  const {
    data: reviews = [],
    isLoading,
    isRefetching,
    refetch,
  } = useMentorReviewsByUser(user?.id || 0);

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(reviews);

  // Apply pagination
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Đánh Giá Từ Mentor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Xem các đánh giá mentor gửi cho bạn sau mỗi phiên phỏng vấn
          </p>
        </div>
        <ReloadButton
          onReload={async () => {
            await refetch();
          }}
          isLoading={isRefetching}
          tooltip="Tải lại danh sách đánh giá"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng đánh giá</CardDescription>
            <CardTitle className="text-2xl">{reviews.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Điểm trung bình</CardDescription>
            <CardTitle className="text-2xl text-[#0047AB]">
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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đánh giá cao nhất</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {reviews.length > 0
                ? Math.max(...reviews.map((r: { rating?: number }) => r.rating || 0))
                : 0}{" "}
              ★
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Review Stats Chart */}
      {reviews.length > 0 && <ReviewStats reviews={reviews} />}

      {/* Review List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <CardTitle>Danh Sách Đánh Giá</CardTitle>
          </div>
          <CardDescription>Các đánh giá mentor gửi cho bạn sau mỗi buổi phỏng vấn</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Sort Controls */}
          {reviews.length > 0 && (
            <div className="mb-4 flex items-center gap-4 border-b pb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sắp xếp theo:
              </span>
              <SortButton {...getSortProps("rating")}>Đánh giá</SortButton>
              <SortButton {...getSortProps("id")}>Mới nhất</SortButton>
            </div>
          )}

          <ReviewList
            reviews={pageData}
            isLoading={isLoading}
            showMentor
            emptyTitle="Chưa có đánh giá"
            emptyDescription="Bạn chưa nhận được đánh giá nào từ mentor. Hãy tham gia phỏng vấn để nhận nhận xét!"
          />

          {/* Pagination */}
          {reviews.length > 0 && (
            <div className="mt-4">
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
