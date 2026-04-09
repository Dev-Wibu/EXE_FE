/**
 * Admin Feedback Management Page
 * Allows admin to view and moderate all candidate feedbacks for mentors
 */

import { Eye, MessageSquare, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { FeedbackStats } from "@/components/feedback";
import { PaginationControl, ReloadButton, SortButton } from "@/components/shared";
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
import {
  useDeleteMentorFeedback,
  useMentorFeedbacks,
  type MentorFeedback,
} from "@/hooks/useMentorFeedback";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { toast } from "sonner";

export function FeedbackManagementPage() {
  const { data: feedbacks = [], isLoading, isRefetching, refetch } = useMentorFeedbacks();
  const { mutate: deleteFeedback, isPending: isDeleting } = useDeleteMentorFeedback();

  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<MentorFeedback | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Convert rating filter once for efficiency
  const numericRatingFilter = ratingFilter !== "all" ? Number(ratingFilter) : null;

  // Filter feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((feedback: MentorFeedback) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          feedback.mentor?.name?.toLowerCase().includes(query) ||
          feedback.user?.name?.toLowerCase().includes(query) ||
          feedback.comment?.toLowerCase().includes(query) ||
          feedback.session?.roomName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Rating filter
      if (numericRatingFilter !== null && feedback.rating !== numericRatingFilter) {
        return false;
      }

      return true;
    });
  }, [feedbacks, searchQuery, numericRatingFilter]);

  // Sorting
  const { sortedData, getSortProps } = useSortable(filteredFeedbacks);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  // Calculate stats
  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum: number, f: MentorFeedback) => sum + (f.rating || 0), 0) /
        feedbacks.length
      : 0;

  const handleViewDetail = (feedback: MentorFeedback) => {
    setSelectedFeedback(feedback);
    setIsDetailOpen(true);
  };

  const handleDeleteClick = (feedback: MentorFeedback) => {
    setSelectedFeedback(feedback);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedFeedback?.id) {
      deleteFeedback(selectedFeedback.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedFeedback(null);
          toast.success("Đã xóa phản hồi");
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
            Quản Lý Phản Hồi
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Xem và kiểm duyệt các phản hồi từ ứng viên dành cho mentor
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng phản hồi</CardDescription>
            <CardTitle className="text-2xl">{feedbacks.length}</CardTitle>
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
              {feedbacks.filter((f: MentorFeedback) => f.rating === 5).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>1-2 sao</CardDescription>
            <CardTitle className="text-2xl text-red-500">
              {feedbacks.filter((f: MentorFeedback) => (f.rating || 0) <= 2).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Stats Chart */}
      {feedbacks.length > 0 && <FeedbackStats feedbacks={feedbacks} />}

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
              tooltip="Tải lại danh sách phản hồi"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tên ứng viên, mentor, nội dung..."
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

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <CardTitle>Danh Sách Phản Hồi</CardTitle>
          </div>
          <CardDescription>
            Hiển thị {filteredFeedbacks.length} / {feedbacks.length} phản hồi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCardList count={5} />
          ) : pageData.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Không có phản hồi"
              description="Không tìm thấy phản hồi nào phù hợp với bộ lọc."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Mentor nhận</TableHead>
                    <TableHead>Ứng viên gửi</TableHead>
                    <TableHead>Phiên</TableHead>
                    <TableHead>
                      <SortButton {...getSortProps("rating" as keyof MentorFeedback)}>
                        Đánh giá
                      </SortButton>
                    </TableHead>
                    <TableHead>Nhận xét</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map((feedback: MentorFeedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>#{feedback.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={feedback.mentor?.avatarUrl} />
                            <AvatarFallback>
                              {feedback.mentor?.name?.charAt(0) || "M"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{feedback.mentor?.name || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={feedback.user?.avatarUrl} />
                            <AvatarFallback>{feedback.user?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span>{feedback.user?.name || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">#{feedback.session?.id}</Badge>
                      </TableCell>
                      <TableCell>
                        <StarRating value={feedback.rating || 0} readOnly size="sm" />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {feedback.comment || "Không có nhận xét"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(feedback)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(feedback)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {sortedData.length > 0 && (
                <PaginationControl pagination={pagination} onPageSizeChange={setPageSize} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Phản Hồi #{selectedFeedback?.id}</DialogTitle>
            <DialogDescription>
              Phản hồi từ {selectedFeedback?.user?.name} cho {selectedFeedback?.mentor?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              {/* Rating */}
              <div className="flex items-center justify-center">
                <StarRating value={selectedFeedback.rating || 0} readOnly size="lg" />
              </div>

              {/* Comment */}
              <div>
                <h4 className="mb-2 font-medium text-slate-700 dark:text-slate-300">Nhận xét</h4>
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="whitespace-pre-wrap">
                    {selectedFeedback.comment || "Không có nhận xét chi tiết."}
                  </p>
                </div>
              </div>

              {/* Session Info */}
              <div>
                <h4 className="mb-2 font-medium text-slate-700 dark:text-slate-300">
                  Thông tin phiên
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Mã phiên:</span>{" "}
                    <span className="font-medium">#{selectedFeedback.session?.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tên phòng:</span>{" "}
                    <span className="font-medium">
                      {selectedFeedback.session?.roomName || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
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
              Bạn có chắc chắn muốn xóa phản hồi #{selectedFeedback?.id}? Hành động này không thể
              hoàn tác.
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
