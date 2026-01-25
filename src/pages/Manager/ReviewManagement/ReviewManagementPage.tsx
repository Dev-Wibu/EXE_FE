/**
 * Admin Review Management Page
 * Allows admin to view and moderate all mentor reviews
 */

import { Eye, Search, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { ReviewStats } from "@/components/review";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { MentorReview } from "@/hooks/useMentorReview";
import { useDeleteMentorReview, useMentorReviews } from "@/hooks/useMentorReview";
import { toast } from "sonner";

export function ReviewManagementPage() {
  const { data: reviews = [], isLoading } = useMentorReviews();
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteMentorReview();

  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<MentorReview | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Convert rating filter once for efficiency
  const numericRatingFilter = ratingFilter !== "all" ? Number(ratingFilter) : null;

  // Filter reviews
  const filteredReviews = reviews.filter((review: MentorReview) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        review.mentor?.name?.toLowerCase().includes(query) ||
        review.user?.name?.toLowerCase().includes(query) ||
        review.session?.roomName?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Rating filter
    if (numericRatingFilter !== null && review.rating !== numericRatingFilter) {
      return false;
    }

    return true;
  });

  // Calculate stats
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: MentorReview) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  const handleViewDetail = (review: MentorReview) => {
    setSelectedReview(review);
    setIsDetailOpen(true);
  };

  const handleDeleteClick = (review: MentorReview) => {
    setSelectedReview(review);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedReview?.id) {
      deleteReview(selectedReview.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedReview(null);
          toast.success("Đã xóa đánh giá");
        },
      });
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Quản Lý Đánh Giá
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Xem và kiểm duyệt các đánh giá từ học viên
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng đánh giá</CardDescription>
            <CardTitle className="text-2xl">{reviews.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Điểm trung bình</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{avgRating.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>5 sao</CardDescription>
            <CardTitle className="text-2xl text-[#FFD700]">
              {reviews.filter((r: MentorReview) => r.rating === 5).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>1-2 sao</CardDescription>
            <CardTitle className="text-2xl text-red-500">
              {reviews.filter((r: MentorReview) => (r.rating || 0) <= 2).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Stats Chart */}
      {reviews.length > 0 && <ReviewStats reviews={reviews} />}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tên mentor, học viên, phiên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Số sao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="5">5 sao</SelectItem>
                <SelectItem value="4">4 sao</SelectItem>
                <SelectItem value="3">3 sao</SelectItem>
                <SelectItem value="2">2 sao</SelectItem>
                <SelectItem value="1">1 sao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Review List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle>Danh Sách Đánh Giá</CardTitle>
          </div>
          <CardDescription>
            Hiển thị {filteredReviews.length} / {reviews.length} đánh giá
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCardList count={5} />
          ) : filteredReviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Không có đánh giá"
              description="Không tìm thấy đánh giá nào phù hợp với bộ lọc."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Phiên</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review: MentorReview) => (
                  <TableRow key={review.id}>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.user?.avatarUrl} />
                          <AvatarFallback>{review.user?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span>{review.user?.name || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">#{review.session?.id}</Badge>
                    </TableCell>
                    <TableCell>
                      <StarRating value={review.rating || 0} readOnly size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(review)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(review)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi Tiết Đánh Giá #{selectedReview?.id}</DialogTitle>
            <DialogDescription>
              Đánh giá từ {selectedReview?.user?.name} cho {selectedReview?.mentor?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <StarRating value={selectedReview.rating || 0} readOnly size="lg" />
              </div>

              {selectedReview.situationNote && (
                <div>
                  <h4 className="mb-1 font-medium text-emerald-600">Tình huống</h4>
                  <p className="rounded bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
                    {selectedReview.situationNote}
                  </p>
                </div>
              )}

              {selectedReview.taskNote && (
                <div>
                  <h4 className="mb-1 font-medium text-blue-600">Nhiệm vụ</h4>
                  <p className="rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
                    {selectedReview.taskNote}
                  </p>
                </div>
              )}

              {selectedReview.actionNote && (
                <div>
                  <h4 className="mb-1 font-medium text-purple-600">Hành động</h4>
                  <p className="rounded bg-purple-50 p-3 text-sm dark:bg-purple-900/20">
                    {selectedReview.actionNote}
                  </p>
                </div>
              )}

              {selectedReview.resultNote && (
                <div>
                  <h4 className="mb-1 font-medium text-amber-600">Kết quả</h4>
                  <p className="rounded bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                    {selectedReview.resultNote}
                  </p>
                </div>
              )}

              {selectedReview.strength && (
                <div>
                  <h4 className="mb-1 font-medium text-green-600">Điểm mạnh</h4>
                  <p className="rounded bg-green-50 p-3 text-sm dark:bg-green-900/20">
                    {selectedReview.strength}
                  </p>
                </div>
              )}

              {selectedReview.weakness && (
                <div>
                  <h4 className="mb-1 font-medium text-red-600">Điểm yếu</h4>
                  <p className="rounded bg-red-50 p-3 text-sm dark:bg-red-900/20">
                    {selectedReview.weakness}
                  </p>
                </div>
              )}

              {selectedReview.improve && (
                <div>
                  <h4 className="mb-1 font-medium text-indigo-600">Đề xuất cải tiến</h4>
                  <p className="rounded bg-indigo-50 p-3 text-sm dark:bg-indigo-900/20">
                    {selectedReview.improve}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác Nhận Xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá #{selectedReview?.id}? Hành động này không thể hoàn
              tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
