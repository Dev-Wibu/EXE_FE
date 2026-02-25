import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PaginationControl } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { extractDataArray } from "@/lib/utils";
import { practiceSetManager, questionMajorManager } from "@/services";
import { toast } from "sonner";

import { DeletePracticeSetDialog, PracticeSetFormDialog, PracticeSetTable } from "./components";
import type { Major, PracticeSet, PracticeSetFormData } from "./types";

export function PracticeSetManagementPage() {
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPracticeSet, setSelectedPracticeSet] = useState<PracticeSet | null>(null);
  const [formData, setFormData] = useState<Partial<PracticeSetFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load practice sets and majors
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [practiceSetsResponse, majorsResponse] = await Promise.all([
        practiceSetManager.getAll(),
        questionMajorManager.getAll(),
      ]);

      if (practiceSetsResponse.success) {
        setPracticeSets(extractDataArray<PracticeSet>(practiceSetsResponse));
      } else {
        toast.error(practiceSetsResponse.error || "Không thể tải danh sách bộ câu hỏi");
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

  // Filter practice sets based on search query and level filter
  const filteredPracticeSets = useMemo(() => {
    return practiceSets.filter((ps) => {
      // Filter by search query
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
          ps.practiceSetName?.toLowerCase().includes(lowerQuery) ||
          ps.objective?.toLowerCase().includes(lowerQuery) ||
          ps.major?.majorName?.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }

      // Filter by level
      if (levelFilter !== "all" && ps.level !== levelFilter) {
        return false;
      }

      return true;
    });
  }, [practiceSets, searchQuery, levelFilter]);

  // Sorting
  const { sortedData, getSortProps } = useSortable(filteredPracticeSets);

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

  const handleCreate = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (practiceSet: PracticeSet) => {
    setSelectedPracticeSet(practiceSet);
    setFormData({
      practiceSetName: practiceSet.practiceSetName || "",
      objective: practiceSet.objective,
      level: practiceSet.level,
      majorId: practiceSet.major?.id,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (practiceSet: PracticeSet) => {
    setSelectedPracticeSet(practiceSet);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const createData: Partial<PracticeSet> = {
        practiceSetName: formData.practiceSetName,
        objective: formData.objective,
        level: formData.level,
        major: formData.majorId ? { id: formData.majorId } : undefined,
      };
      const response = await practiceSetManager.create(createData);
      if (response.success) {
        toast.success("Đã tạo bộ câu hỏi thành công");
        setIsCreateDialogOpen(false);
        loadData(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể tạo bộ câu hỏi");
      }
    } catch (error) {
      console.error("Error creating practice set:", error);
      toast.error("Không thể tạo bộ câu hỏi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedPracticeSet?.id) return;

    try {
      const updateData: Partial<PracticeSet> = {
        practiceSetName: formData.practiceSetName,
        objective: formData.objective,
        level: formData.level,
        major: formData.majorId ? { id: formData.majorId } : undefined,
      };
      const response = await practiceSetManager.update(selectedPracticeSet.id, updateData);
      if (response.success) {
        toast.success("Đã cập nhật bộ câu hỏi thành công");
        setIsEditDialogOpen(false);
        loadData(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể cập nhật bộ câu hỏi");
      }
    } catch (error) {
      console.error("Error updating practice set:", error);
      toast.error("Không thể cập nhật bộ câu hỏi");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPracticeSet?.id) return;

    try {
      const response = await practiceSetManager.delete(selectedPracticeSet.id);
      if (response.success) {
        toast.success("Đã xóa bộ câu hỏi thành công");
        setIsDeleteDialogOpen(false);
        loadData(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể xóa bộ câu hỏi");
      }
    } catch (error) {
      console.error("Error deleting practice set:", error);
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
              <SelectItem value="INTERN">Thực tập</SelectItem>
              <SelectItem value="FRESHER">Mới tốt nghiệp</SelectItem>
              <SelectItem value="JUNIOR">Mới vào nghề</SelectItem>
              <SelectItem value="MIDDLE">Trung cấp</SelectItem>
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
        <PracticeSetTable
          practiceSets={pageData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          getSortProps={getSortProps}
        />

        {/* Pagination */}
        {sortedData.length > 0 && (
          <PaginationControl pagination={pagination} onPageSizeChange={setPageSize} />
        )}

        {/* Empty State with Clear Filters */}
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
      <PracticeSetFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Thêm Bộ Câu Hỏi Mới"
        description="Điền thông tin để tạo bộ câu hỏi mới."
        submitLabel="Tạo bộ câu hỏi"
        majors={majors}
        isSubmitting={isSubmitting}
      />

      {/* Edit Dialog */}
      <PracticeSetFormDialog
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
      <DeletePracticeSetDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        practiceSet={selectedPracticeSet}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
