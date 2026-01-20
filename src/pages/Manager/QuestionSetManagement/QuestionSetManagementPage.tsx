import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractDataArray } from "@/lib/utils";
import { questionMajorManager, questionSetManager } from "@/services";
import { toast } from "sonner";

import { DeleteQuestionSetDialog, QuestionSetFormDialog, QuestionSetTable } from "./components";
import type { Major, QuestionSet, QuestionSetFormData } from "./types";

export function QuestionSetManagementPage() {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<QuestionSet | null>(null);
  const [formData, setFormData] = useState<Partial<QuestionSetFormData>>({});

  // Load question sets and majors
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [questionSetsResponse, majorsResponse] = await Promise.all([
        questionSetManager.getAll(),
        questionMajorManager.getAll(),
      ]);

      if (questionSetsResponse.success) {
        setQuestionSets(extractDataArray<QuestionSet>(questionSetsResponse));
      } else {
        toast.error(questionSetsResponse.error || "Không thể tải danh sách bộ câu hỏi");
      }

      if (majorsResponse.success) {
        setMajors(extractDataArray<Major>(majorsResponse));
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

  // Filter question sets based on search query and level filter
  const filteredQuestionSets = questionSets.filter((questionSet) => {
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch =
        questionSet.questionSetName?.toLowerCase().includes(lowerQuery) ||
        questionSet.objective?.toLowerCase().includes(lowerQuery) ||
        questionSet.major?.majorName?.toLowerCase().includes(lowerQuery);
      if (!matchesSearch) return false;
    }

    // Filter by level
    if (levelFilter !== "all" && questionSet.level !== levelFilter) {
      return false;
    }

    return true;
  });

  const handleCreate = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setFormData({
      questionSetName: questionSet.questionSetName || "",
      objective: questionSet.objective,
      level: questionSet.level,
      majorId: questionSet.major?.id,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (questionSet: QuestionSet) => {
    setSelectedQuestionSet(questionSet);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const createData: Partial<QuestionSet> = {
        questionSetName: formData.questionSetName,
        objective: formData.objective,
        level: formData.level,
        major: formData.majorId ? { id: formData.majorId } : undefined,
      };
      const response = await questionSetManager.create(createData);
      if (response.success) {
        toast.success("Đã tạo bộ câu hỏi thành công");
        setIsCreateDialogOpen(false);
        loadData(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể tạo bộ câu hỏi");
      }
    } catch (error) {
      console.error("Error creating question set:", error);
      toast.error("Không thể tạo bộ câu hỏi");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedQuestionSet?.questionSetId) return;

    try {
      const updateData: Partial<QuestionSet> = {
        questionSetName: formData.questionSetName,
        objective: formData.objective,
        level: formData.level,
        major: formData.majorId ? { id: formData.majorId } : undefined,
      };
      const response = await questionSetManager.update(
        selectedQuestionSet.questionSetId,
        updateData
      );
      if (response.success) {
        toast.success("Đã cập nhật bộ câu hỏi thành công");
        setIsEditDialogOpen(false);
        loadData(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể cập nhật bộ câu hỏi");
      }
    } catch (error) {
      console.error("Error updating question set:", error);
      toast.error("Không thể cập nhật bộ câu hỏi");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuestionSet?.questionSetId) return;

    try {
      const response = await questionSetManager.delete(selectedQuestionSet.questionSetId);
      if (response.success) {
        toast.success("Đã xóa bộ câu hỏi thành công");
        setIsDeleteDialogOpen(false);
        loadData(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể xóa bộ câu hỏi");
      }
    } catch (error) {
      console.error("Error deleting question set:", error);
      toast.error("Không thể xóa bộ câu hỏi");
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
          Quản Lý Bộ Câu Hỏi
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý các bộ câu hỏi cho các cấp độ phỏng vấn khác nhau
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative w-96">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mục tiêu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Level Filter */}
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo cấp độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả cấp độ</SelectItem>
              <SelectItem value="INTERN">Intern</SelectItem>
              <SelectItem value="FRESHER">Fresher</SelectItem>
              <SelectItem value="JUNIOR">Junior</SelectItem>
              <SelectItem value="MIDDLE">Middle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Button */}
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm Bộ Câu Hỏi
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <QuestionSetTable
          questionSets={filteredQuestionSets.slice().reverse()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Empty State with Clear Filters */}
        {filteredQuestionSets.length === 0 && (searchQuery || levelFilter !== "all") && (
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
      <QuestionSetFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Thêm Bộ Câu Hỏi Mới"
        description="Điền thông tin để tạo bộ câu hỏi mới."
        submitLabel="Tạo bộ câu hỏi"
        majors={majors}
      />

      {/* Edit Dialog */}
      <QuestionSetFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Chỉnh Sửa Bộ Câu Hỏi"
        description="Cập nhật thông tin bộ câu hỏi."
        submitLabel="Lưu thay đổi"
        majors={majors}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteQuestionSetDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        questionSet={selectedQuestionSet}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
