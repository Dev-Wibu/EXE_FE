import { Eye, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PaginationControl } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { quizSetManager } from "@/services";
import type { QuizItem, QuizSet } from "@/services/quiz-set.manager";
import { toast } from "sonner";

export function QuizSetManagementPage() {
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [selectedQuizSet, setSelectedQuizSet] = useState<QuizSet | null>(null);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await quizSetManager.getAll();
      if (response.success && response.data) {
        setQuizSets(response.data);
      } else {
        toast.error(response.error || "Không thể tải danh sách quiz");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter quiz sets
  const filteredQuizSets = useMemo(() => {
    if (!searchQuery) return quizSets;
    const lowerQuery = searchQuery.toLowerCase();
    return quizSets.filter((qs) => {
      return (
        qs.quizName?.toLowerCase().includes(lowerQuery) ||
        qs.practiceSet?.practiceSetName?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [quizSets, searchQuery]);

  // Sorting
  const { sortedData, toggleSort } = useSortable(filteredQuizSets);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  const handleDelete = (quizSet: QuizSet) => {
    setSelectedQuizSet(quizSet);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuizSet?.quizId) return;
    try {
      const response = await quizSetManager.delete(selectedQuizSet.quizId);
      if (response.success) {
        toast.success("Đã xóa quiz thành công");
        setIsDeleteDialogOpen(false);
        loadData();
      } else {
        toast.error(response.error || "Không thể xóa quiz");
      }
    } catch (error) {
      console.error("Error deleting quiz set:", error);
      toast.error("Không thể xóa quiz");
    }
  };

  const handleViewItems = async (quizSet: QuizSet) => {
    if (!quizSet.quizId) return;
    setSelectedQuizSet(quizSet);
    setIsItemsDialogOpen(true);
    setLoadingItems(true);
    try {
      const response = await quizSetManager.getQuizItems(quizSet.quizId);
      if (response.success && response.data) {
        setQuizItems(response.data);
      } else {
        toast.error(response.error || "Không thể tải câu hỏi quiz");
      }
    } catch (error) {
      console.error("Error loading quiz items:", error);
      toast.error("Không thể tải câu hỏi quiz");
    } finally {
      setLoadingItems(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="font-['Inter'] text-lg text-gray-500 dark:text-slate-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Quản Lý Quiz
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý các bộ quiz và kết quả thi
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative w-96">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên quiz hoặc bộ luyện tập..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("quizName" as keyof QuizSet)}>
                Tên Quiz
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("score" as keyof QuizSet)}>
                Điểm
              </TableHead>
              <TableHead>Bộ Luyện Tập</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("createdAt" as keyof QuizSet)}>
                Ngày tạo
              </TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <p className="text-gray-500 dark:text-slate-400">Không có quiz nào</p>
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((quizSet) => (
                <TableRow key={quizSet.quizId}>
                  <TableCell className="font-medium">{quizSet.quizName}</TableCell>
                  <TableCell>{quizSet.score !== undefined ? quizSet.score : "—"}</TableCell>
                  <TableCell>{quizSet.practiceSet?.practiceSetName || "—"}</TableCell>
                  <TableCell>
                    {quizSet.createdAt
                      ? new Date(quizSet.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={quizSet.submitted ? "default" : "secondary"}>
                      {quizSet.submitted ? "Đã nộp" : "Chưa nộp"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleViewItems(quizSet)}>
                        <Eye className="h-4 w-4" />
                        Xem
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(quizSet)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {sortedData.length > 0 && (
          <PaginationControl pagination={pagination} onPageSizeChange={setPageSize} />
        )}

        {sortedData.length === 0 && searchQuery && (
          <div className="flex justify-center pb-4">
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa quiz &quot;{selectedQuizSet?.quizName}&quot;? Hành
              động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Quiz Items Dialog */}
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Câu hỏi trong Quiz: {selectedQuizSet?.quizName}</DialogTitle>
            <DialogDescription>Danh sách các câu hỏi trong bộ quiz này</DialogDescription>
          </DialogHeader>
          {loadingItems ? (
            <div className="flex items-center justify-center py-8">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
          ) : quizItems.length === 0 ? (
            <p className="py-8 text-center text-gray-500">Không có câu hỏi nào</p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {quizItems.map((item, index) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">
                    {index + 1}. {item.question}
                  </p>
                  <div className="mt-1 text-xs text-gray-500">
                    {item.correctAnswer && <span>Đáp án: {item.correctAnswer}</span>}
                    {item.userResponse && <span className="ml-4">Trả lời: {item.userResponse}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemsDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
