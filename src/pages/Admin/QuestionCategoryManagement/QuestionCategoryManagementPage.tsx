import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpinnerBlock } from "@/components/ui/spinner";
import { extractDataArray } from "@/lib/utils";
import { questionCategoryManager } from "@/services";
import { toast } from "sonner";

import {
  DeleteQuestionCategoryDialog,
  QuestionCategoryFormDialog,
  QuestionCategoryTable,
} from "./components";
import type { QuestionCategory, QuestionCategoryFormData } from "./types";

export function QuestionCategoryManagementPage() {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [formData, setFormData] = useState<Partial<QuestionCategoryFormData>>({});

  // Load categories using the question category manager service
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await questionCategoryManager.getAll();
      if (response.success) {
        setCategories(extractDataArray<QuestionCategory>(response));
      } else {
        toast.error(response.error || "Không thể tải danh sách danh mục câu hỏi");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Không thể tải danh sách danh mục câu hỏi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Filter categories based on search query
  const filteredCategories = categories.filter((category) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      category.categoryName?.toLowerCase().includes(lowerQuery) ||
      category.description?.toLowerCase().includes(lowerQuery)
    );
  });

  const handleCreate = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (category: QuestionCategory) => {
    setSelectedCategory(category);
    setFormData({
      categoryName: category.categoryName || "",
      description: category.description,
      urlTutorial: category.urlTutorial,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (category: QuestionCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const response = await questionCategoryManager.create(formData);
      if (response.success) {
        toast.success("Đã tạo danh mục câu hỏi thành công");
        setIsCreateDialogOpen(false);
        loadCategories(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể tạo danh mục câu hỏi");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Không thể tạo danh mục câu hỏi");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedCategory?.id) return;

    try {
      const response = await questionCategoryManager.update(selectedCategory.id, formData);
      if (response.success) {
        toast.success("Đã cập nhật danh mục câu hỏi thành công");
        setIsEditDialogOpen(false);
        loadCategories(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể cập nhật danh mục câu hỏi");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Không thể cập nhật danh mục câu hỏi");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory?.id) return;

    try {
      const response = await questionCategoryManager.delete(selectedCategory.id);
      if (response.success) {
        toast.success("Đã xóa danh mục câu hỏi thành công");
        setIsDeleteDialogOpen(false);
        loadCategories(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể xóa danh mục câu hỏi");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Không thể xóa danh mục câu hỏi");
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-950">
        <SpinnerBlock fullScreen size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Quản Lý Danh Mục Câu Hỏi
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý các danh mục câu hỏi cho đánh giá phỏng vấn
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-96">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={loadCategories}
            isLoading={loading}
            tooltip="Tải lại danh sách danh mục"
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Danh Mục
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <QuestionCategoryTable
          categories={filteredCategories.slice().reverse()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Empty State with Clear Search */}
        {filteredCategories.length === 0 && searchQuery && (
          <div className="flex justify-center pb-4">
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <QuestionCategoryFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Thêm Danh Mục Câu Hỏi Mới"
        description="Điền thông tin để tạo danh mục câu hỏi mới."
        submitLabel="Tạo danh mục"
      />

      {/* Edit Dialog */}
      <QuestionCategoryFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Chỉnh Sửa Danh Mục Câu Hỏi"
        description="Cập nhật thông tin danh mục câu hỏi."
        submitLabel="Lưu thay đổi"
      />

      {/* Delete Confirmation Dialog */}
      <DeleteQuestionCategoryDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={selectedCategory}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
