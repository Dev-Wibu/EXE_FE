/**
 * User Feedback List Page
 * Displays feedbacks received from mentors
 */

import { MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";

import { FeedbackList, FeedbackStats } from "@/components/feedback";
import { PaginationControl } from "@/components/shared/PaginationControl";
import { ReloadButton } from "@/components/shared/ReloadButton";
import { SortButton } from "@/components/shared/SortButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMentorFeedbacksByUser } from "@/hooks/useMentorFeedback";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { useAuthStore } from "@/stores/authStore";

export function UserFeedbackListPage() {
  const user = useAuthStore((state) => state.user);
  const [pageSize, setPageSize] = useState(10);
  const {
    data: feedbacks = [],
    isLoading,
    isRefetching,
    refetch,
  } = useMentorFeedbacksByUser(user?.id || 0);

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(feedbacks);

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
            Phản Hồi Từ Mentor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Xem các phản hồi từ mentor sau mỗi phiên phỏng vấn
          </p>
        </div>
        <ReloadButton
          onReload={async () => {
            await refetch();
          }}
          isLoading={isRefetching}
          tooltip="Tải lại danh sách phản hồi"
        />
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
          {/* Sort Controls */}
          {feedbacks.length > 0 && (
            <div className="mb-4 flex items-center gap-4 border-b pb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sắp xếp theo:
              </span>
              <SortButton {...getSortProps("rating")}>Đánh giá</SortButton>
              <SortButton {...getSortProps("id")}>Mới nhất</SortButton>
            </div>
          )}

          <FeedbackList
            feedbacks={pageData}
            isLoading={isLoading}
            showMentor
            emptyTitle="Chưa có phản hồi"
            emptyDescription="Bạn chưa nhận được phản hồi nào từ mentor. Hãy tham gia phỏng vấn để nhận feedback!"
          />

          {/* Pagination */}
          {feedbacks.length > 0 && (
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
