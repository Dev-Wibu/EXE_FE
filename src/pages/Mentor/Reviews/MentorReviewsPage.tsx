/**
 * Mentor Reviews Page
 * Displays reviews written by mentor for students
 */

import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ReviewList, ReviewStats } from "@/components/review";
import { PaginationControl } from "@/components/shared/PaginationControl";
import { ReloadButton } from "@/components/shared/ReloadButton";
import { SortButton } from "@/components/shared/SortButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMentorReviewsByMentor, type MentorReview } from "@/hooks/useMentorReview";

import { useSortable } from "@/hooks/useSortable";
import { toTimestamp } from "@/lib/formatting";
import { useAuthStore } from "@/stores/authStore";

type SortableReview = MentorReview & {
  newestSortValue: number;
};

const toSessionTimestamp = (value?: string) => {
  return toTimestamp(value) ?? 0;
};

const getReviewNewestSortValue = (review: MentorReview) => {
  const endTime = toSessionTimestamp(review.session?.endTime1);
  if (endTime > 0) {
    return endTime;
  }

  const startTime = toSessionTimestamp(review.session?.startTime1);
  if (startTime > 0) {
    return startTime;
  }

  return typeof review.id === "number" ? review.id : 0;
};

export function MentorReviewsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const {
    data: reviews = [],
    isLoading,
    isRefetching,
    refetch,
  } = useMentorReviewsByMentor(user?.id || 0);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return reviews.filter((review) => {
      if (normalizedSearch) {
        const matchesSearch =
          review.user?.name?.toLowerCase().includes(normalizedSearch) ||
          review.user?.email?.toLowerCase().includes(normalizedSearch) ||
          review.session?.roomName?.toLowerCase().includes(normalizedSearch);

        if (!matchesSearch) {
          return false;
        }
      }

      const rating = review.rating || 0;
      if (ratingFilter === "high" && rating < 5) {
        return false;
      }
      if (ratingFilter === "medium" && (rating < 3 || rating > 4)) {
        return false;
      }
      if (ratingFilter === "low" && rating > 2) {
        return false;
      }

      return true;
    });
  }, [ratingFilter, reviews, searchQuery]);

  const sortableReviews = useMemo<SortableReview[]>(
    () =>
      filteredReviews.map((review) => ({
        ...review,
        newestSortValue: getReviewNewestSortValue(review),
      })),
    [filteredReviews]
  );

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(sortableReviews, {
    defaultSort: {
      key: "newestSortValue",
      direction: "desc",
    },
    noSortBehavior: "preserve",
    tieBreaker: {
      key: "newestSortValue",
      direction: "desc",
    },
  });

  // Apply pagination
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_mentor_reviews_mentorreviewspage_tsx_pagesize",
    defaultPageSize: 10,
  });
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Đánh Giá Đã Gửi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Xem các đánh giá bạn đã gửi cho học viên sau mỗi phiên phỏng vấn
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
            <CardTitle>Danh sách đánh giá</CardTitle>
          </div>
          <CardDescription>Các đánh giá bạn đã gửi cho học viên</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3 border-b pb-3">
            <div className="relative min-w-60 flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo học viên, email, phiên phỏng vấn..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  pagination.goToFirstPage();
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={ratingFilter}
              onValueChange={(value) => {
                setRatingFilter(value as "all" | "high" | "medium" | "low");
                pagination.goToFirstPage();
              }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo điểm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả điểm</SelectItem>
                <SelectItem value="high">5 sao</SelectItem>
                <SelectItem value="medium">3-4 sao</SelectItem>
                <SelectItem value="low">1-2 sao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Controls */}
          {sortedData.length > 0 && (
            <div className="mb-4 flex items-center gap-4 border-b pb-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sắp xếp theo:
              </span>
              <SortButton {...getSortProps("rating")}>Đánh giá</SortButton>
              <SortButton {...getSortProps("newestSortValue")}>Mới nhất</SortButton>
            </div>
          )}

          <ReviewList
            reviews={pageData}
            isLoading={isLoading}
            showUser
            showMentor={false}
            onSelect={(review) => {
              if (review.id) {
                navigate(`/mentor/reviews/${review.id}`);
              }
            }}
            emptyTitle="Chưa có đánh giá"
            emptyDescription="Bạn chưa gửi đánh giá nào cho học viên."
          />

          {/* Pagination */}
          {sortedData.length > 0 && (
            <div className="mt-4">
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  pagination.goToFirstPage();
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
