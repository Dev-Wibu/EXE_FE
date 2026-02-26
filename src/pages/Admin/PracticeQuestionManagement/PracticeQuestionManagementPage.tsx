import { Plus, Search, Trash2, Upload } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { questionManager } from "@/services";
import {
  questionCategoryManager,
  type QuestionCategory,
} from "@/services/question-category.manager";
import type { PracticeQuestion } from "@/services/question.manager";
import { toast } from "sonner";

const levelBadgeMap: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 hover:bg-green-100",
  MEDIUM: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  HARD: "bg-red-100 text-red-700 hover:bg-red-100",
};

interface QuestionFormData {
  title: string;
  content: string;
  level: "EASY" | "MEDIUM" | "HARD";
  answer: string;
  hint: string;
  categoryId: string;
}

const emptyFormData: QuestionFormData = {
  title: "",
  content: "",
  level: "EASY",
  answer: "",
  hint: "",
  categoryId: "",
};

export function PracticeQuestionManagementPage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestion | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(emptyFormData);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [questionsRes, categoriesRes] = await Promise.all([
        questionManager.getAll(),
        questionCategoryManager.getAll(),
      ]);
      if (questionsRes.success && questionsRes.data) {
        const raw = questionsRes.data;
        const arr = Array.isArray(raw) ? raw : "data" in raw ? raw.data : [];
        setQuestions(arr as unknown as PracticeQuestion[]);
      } else {
        toast.error(questionsRes.error || "Không thể tải danh sách câu hỏi");
      }
      if (categoriesRes.success && categoriesRes.data) {
        const raw = categoriesRes.data;
        const arr = Array.isArray(raw) ? raw : "data" in raw ? raw.data : [];
        setCategories(arr as QuestionCategory[]);
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

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
          q.title?.toLowerCase().includes(lowerQuery) ||
          q.content?.toLowerCase().includes(lowerQuery) ||
          q.lesson?.lessonName?.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }
      if (levelFilter !== "all" && q.level !== levelFilter) {
        return false;
      }
      return true;
    });
  }, [questions, searchQuery, levelFilter]);

  // Sorting
  const { sortedData, toggleSort } = useSortable(filteredQuestions);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  const handleCreate = () => {
    setFormData(emptyFormData);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (question: PracticeQuestion) => {
    setSelectedQuestion(question);
    setFormData({
      title: question.title || "",
      content: question.content || "",
      level: question.level || "EASY",
      answer: question.answer || "",
      hint: question.hint || "",
      categoryId: question.lesson?.id?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (question: PracticeQuestion) => {
    setSelectedQuestion(question);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const selectedCategory = formData.categoryId
        ? categories.find((c) => c.id?.toString() === formData.categoryId)
        : undefined;
      const createData: Partial<PracticeQuestion> = {
        title: formData.title,
        content: formData.content,
        level: formData.level,
        answer: formData.answer,
        hint: formData.hint,
        ...(selectedCategory && {
          lesson: { id: selectedCategory.id, lessonName: selectedCategory.categoryName },
        }),
      };
      const response = await questionManager.create(createData as never);
      if (response.success) {
        toast.success("Đã tạo câu hỏi thành công");
        setIsCreateDialogOpen(false);
        loadData();
      } else {
        toast.error(response.error || "Không thể tạo câu hỏi");
      }
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error("Không thể tạo câu hỏi");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedQuestion?.questionId) return;
    try {
      const selectedCategory = formData.categoryId
        ? categories.find((c) => c.id?.toString() === formData.categoryId)
        : undefined;
      const updateData: Partial<PracticeQuestion> = {
        title: formData.title,
        content: formData.content,
        level: formData.level,
        answer: formData.answer,
        hint: formData.hint,
        ...(selectedCategory && {
          lesson: { id: selectedCategory.id, lessonName: selectedCategory.categoryName },
        }),
      };
      const response = await questionManager.update(
        selectedQuestion.questionId,
        updateData as never
      );
      if (response.success) {
        toast.success("Đã cập nhật câu hỏi thành công");
        setIsEditDialogOpen(false);
        loadData();
      } else {
        toast.error(response.error || "Không thể cập nhật câu hỏi");
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Không thể cập nhật câu hỏi");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuestion?.questionId) return;
    try {
      const response = await questionManager.delete(selectedQuestion.questionId);
      if (response.success) {
        toast.success("Đã xóa câu hỏi thành công");
        setIsDeleteDialogOpen(false);
        loadData();
      } else {
        toast.error(response.error || "Không thể xóa câu hỏi");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Không thể xóa câu hỏi");
    }
  };

  const handleBulkImport = async () => {
    // Placeholder for bulk import - would typically open a file picker
    toast.info("Chức năng nhập hàng loạt đang được phát triển");
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
          Quản Lý Câu Hỏi Luyện Tập
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý ngân hàng câu hỏi luyện tập cho các cấp độ khác nhau
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-96">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo cấp độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả cấp độ</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBulkImport} className="gap-2">
            <Upload className="h-4 w-4" />
            Nhập hàng loạt
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Câu Hỏi
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("title" as keyof PracticeQuestion)}>
                Tiêu đề
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => toggleSort("level" as keyof PracticeQuestion)}>
                Cấp độ
              </TableHead>
              <TableHead>Bài học</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  <p className="text-gray-500 dark:text-slate-400">Không có câu hỏi nào</p>
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((question) => (
                <TableRow key={question.questionId}>
                  <TableCell className="font-medium">{question.title}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        levelBadgeMap[question.level || ""] || "bg-gray-100 text-gray-700"
                      }>
                      {question.level}
                    </Badge>
                  </TableCell>
                  <TableCell>{question.lesson?.lessonName || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(question)}>
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(question)}>
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

        {sortedData.length === 0 && (searchQuery || levelFilter !== "all") && (
          <div className="flex justify-center pb-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setLevelFilter("all");
              }}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <QuestionFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Thêm Câu Hỏi Mới"
        description="Điền thông tin để tạo câu hỏi luyện tập mới."
        submitLabel="Tạo câu hỏi"
        categories={categories}
      />

      {/* Edit Dialog */}
      <QuestionFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Chỉnh Sửa Câu Hỏi"
        description="Cập nhật thông tin câu hỏi."
        submitLabel="Lưu thay đổi"
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa câu hỏi &quot;{selectedQuestion?.title}&quot;? Hành động này
              không thể hoàn tác.
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
    </div>
  );
}

// Form Dialog Component
interface QuestionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: QuestionFormData;
  onFormChange: (data: QuestionFormData) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
  categories: QuestionCategory[];
}

function QuestionFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
  categories,
}: QuestionFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Tiêu đề</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
              placeholder="Nhập tiêu đề câu hỏi"
            />
          </div>
          <div>
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => onFormChange({ ...formData, content: e.target.value })}
              placeholder="Nhập nội dung câu hỏi"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="level">Cấp độ</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  onFormChange({ ...formData, level: value as "EASY" | "MEDIUM" | "HARD" })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="categoryId">Danh mục</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => onFormChange({ ...formData, categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id?.toString() || ""}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="answer">Đáp án</Label>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) => onFormChange({ ...formData, answer: e.target.value })}
              placeholder="Nhập đáp án"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="hint">Gợi ý</Label>
            <Input
              id="hint"
              value={formData.hint}
              onChange={(e) => onFormChange({ ...formData, hint: e.target.value })}
              placeholder="Nhập gợi ý (tùy chọn)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
