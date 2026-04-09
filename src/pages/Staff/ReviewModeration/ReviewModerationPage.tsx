/**
 * Staff Review Moderation Page
 * Allows staff to moderate reviews (focus on low ratings)
 */

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Eye,
  Flag,
  Lightbulb,
  Search,
  Star,
  Target,
  ThumbsUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PaginationControl } from "@/components/shared/PaginationControl";
import { ReloadButton } from "@/components/shared/ReloadButton";
import { SortButton } from "@/components/shared/SortButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingCardList } from "@/components/ui/loading-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/ui/star-rating";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMentorReviews, type MentorReview } from "@/hooks/useMentorReview";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";

// Rating thresholds for moderation
const LOW_RATING_THRESHOLD = 2;
const HIGH_RATING_MIN = 4;

export function ReviewModerationPage() {
  const { data: reviews = [], isLoading, isRefetching, refetch } = useMentorReviews();

  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("low"); // Default to low ratings
  const [pageSize, setPageSize] = useState(10);
  const [selectedReview, setSelectedReview] = useState<MentorReview | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review: MentorReview) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          review.mentor?.name?.toLowerCase().includes(query) ||
          review.user?.name?.toLowerCase().includes(query) ||
          review.situationNote?.toLowerCase().includes(query) ||
          review.taskNote?.toLowerCase().includes(query) ||
          review.weakness?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Rating filter
      if (ratingFilter === "low" && (review.rating || 0) > LOW_RATING_THRESHOLD) return false;
      if (ratingFilter === "high" && (review.rating || 0) < HIGH_RATING_MIN) return false;

      return true;
    });
  }, [reviews, searchQuery, ratingFilter]);

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(filteredReviews);

  // Apply pagination
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  // Calculate stats
  const lowRatingReviews = reviews.filter(
    (r: MentorReview) => (r.rating || 0) <= LOW_RATING_THRESHOLD
  ).length;

  const handleViewDetail = (review: MentorReview) => {
    setSelectedReview(review);
    setIsDetailOpen(true);
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Kiểm Duyệt Đánh Giá
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Xem xét và kiểm duyệt các đánh giá từ mentor cho ứng viên, đặc biệt là đánh giá thấp
        </p>
      </div>

      {/* Alert for low ratings */}
      {lowRatingReviews > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-700 dark:text-amber-400">
                {lowRatingReviews} đánh giá thấp cần xem xét
              </CardTitle>
            </div>
            <CardDescription className="text-amber-600 dark:text-amber-400">
              Có {lowRatingReviews} đánh giá với rating 1-2 sao cần được kiểm tra
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng đánh giá</CardDescription>
            <CardTitle className="text-2xl">{reviews.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-100 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-red-600">
              <Flag className="h-4 w-4" />
              1-{LOW_RATING_THRESHOLD} sao
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{lowRatingReviews}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>3 sao</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {reviews.filter((r: MentorReview) => r.rating === 3).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{HIGH_RATING_MIN}-5 sao</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {reviews.filter((r: MentorReview) => (r.rating || 0) >= HIGH_RATING_MIN).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Bộ lọc</CardTitle>
            <ReloadButton
              onReload={async () => {
                await refetch();
              }}
              isLoading={isRefetching}
              tooltip="Tải lại danh sách đánh giá"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tên mentor, ứng viên, nội dung đánh giá..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Mức đánh giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="low">1-{LOW_RATING_THRESHOLD} sao (Cần xem)</SelectItem>
                <SelectItem value="high">{HIGH_RATING_MIN}-5 sao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Review List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <CardTitle>Danh Sách Kiểm Duyệt</CardTitle>
          </div>
          <CardDescription>
            Hiển thị {sortedData.length} / {reviews.length} đánh giá
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCardList count={5} />
          ) : pageData.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Không có đánh giá"
              description="Không tìm thấy đánh giá nào cần kiểm duyệt."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton {...getSortProps("id")}>ID</SortButton>
                    </TableHead>
                    <TableHead>Mentor gửi</TableHead>
                    <TableHead>Ứng viên được đánh giá</TableHead>
                    <TableHead>
                      <SortButton {...getSortProps("rating")}>Đánh giá</SortButton>
                    </TableHead>
                    <TableHead>Điểm yếu được nêu</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map((review: MentorReview) => (
                    <TableRow
                      key={review.id}
                      className={
                        (review.rating || 0) <= LOW_RATING_THRESHOLD
                          ? "bg-red-50/50 dark:bg-red-900/10"
                          : ""
                      }>
                      <TableCell>#{review.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.mentor?.avatarUrl} />
                            <AvatarFallback>{review.mentor?.name?.charAt(0) || "M"}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{review.mentor?.name || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{review.user?.name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StarRating value={review.rating || 0} readOnly size="sm" />
                          {(review.rating || 0) <= LOW_RATING_THRESHOLD && (
                            <Badge variant="destructive" className="text-xs">
                              Thấp
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-red-600 dark:text-red-400">
                        {review.weakness || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(review)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4">
                <PaginationControl
                  pagination={pagination}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(selectedReview?.rating || 0) <= LOW_RATING_THRESHOLD && (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              Chi Tiết Đánh Giá #{selectedReview?.id}
            </DialogTitle>
            <DialogDescription>
              Từ {selectedReview?.mentor?.name} cho {selectedReview?.user?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              {/* Rating */}
              <div className="flex items-center justify-center py-4">
                <StarRating value={selectedReview.rating || 0} readOnly size="lg" />
              </div>

              {/* STAR Notes */}
              {selectedReview.situationNote && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-emerald-600">
                    <Target className="h-4 w-4" /> Tình huống
                  </h4>
                  <p className="rounded bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
                    {selectedReview.situationNote}
                  </p>
                </div>
              )}

              {selectedReview.taskNote && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-blue-600">
                    <ClipboardList className="h-4 w-4" /> Nhiệm vụ
                  </h4>
                  <p className="rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
                    {selectedReview.taskNote}
                  </p>
                </div>
              )}

              {selectedReview.actionNote && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-purple-600">
                    <Zap className="h-4 w-4" /> Hành động
                  </h4>
                  <p className="rounded bg-purple-50 p-3 text-sm dark:bg-purple-900/20">
                    {selectedReview.actionNote}
                  </p>
                </div>
              )}

              {selectedReview.resultNote && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-amber-600">
                    <CheckCircle2 className="h-4 w-4" /> Kết quả
                  </h4>
                  <p className="rounded bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                    {selectedReview.resultNote}
                  </p>
                </div>
              )}

              {/* Strength & Weakness */}
              {selectedReview.strength && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-green-600">
                    <ThumbsUp className="h-4 w-4" /> Điểm mạnh
                  </h4>
                  <p className="rounded bg-green-50 p-3 text-sm dark:bg-green-900/20">
                    {selectedReview.strength}
                  </p>
                </div>
              )}

              {selectedReview.weakness && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-red-600">
                    <AlertTriangle className="h-4 w-4" /> Điểm yếu (Cần xem xét)
                  </h4>
                  <p className="rounded border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-900/20">
                    {selectedReview.weakness}
                  </p>
                </div>
              )}

              {selectedReview.improve && (
                <div>
                  <h4 className="mb-1 flex items-center gap-1.5 font-medium text-indigo-600">
                    <Lightbulb className="h-4 w-4" /> Đề xuất cải tiến
                  </h4>
                  <p className="rounded bg-indigo-50 p-3 text-sm dark:bg-indigo-900/20">
                    {selectedReview.improve}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
