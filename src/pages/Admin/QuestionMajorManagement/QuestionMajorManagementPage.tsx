import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpinnerBlock } from "@/components/ui/spinner";
import { extractDataArray } from "@/lib/utils";
import { questionMajorManager } from "@/services";
import { toast } from "sonner";

import {
  DeleteQuestionMajorDialog,
  QuestionMajorFormDialog,
  QuestionMajorTable,
} from "./components";
import type { Major, MajorFormData } from "./types";

export function QuestionMajorManagementPage() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<Major | null>(null);
  const [formData, setFormData] = useState<Partial<MajorFormData>>({});

  // Load majors using the question major manager service
  const loadMajors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await questionMajorManager.getAll();
      if (response.success) {
        setMajors(extractDataArray<Major>(response));
      } else {
        toast.error(response.error || "Không thể tải danh sách chuyên ngành");
      }
    } catch (error) {
      console.error("Error loading majors:", error);
      toast.error("Không thể tải danh sách chuyên ngành");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMajors();
  }, [loadMajors]);

  // Filter majors based on search query
  const filteredMajors = majors.filter((major) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      major.majorName?.toLowerCase().includes(lowerQuery) ||
      major.description?.toLowerCase().includes(lowerQuery)
    );
  });

  const handleCreate = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (major: Major) => {
    setSelectedMajor(major);
    setFormData({
      majorName: major.majorName || "",
      description: major.description,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (major: Major) => {
    setSelectedMajor(major);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const response = await questionMajorManager.create(formData);
      if (response.success) {
        toast.success("Đã tạo chuyên ngành thành công");
        setIsCreateDialogOpen(false);
        loadMajors(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể tạo chuyên ngành");
      }
    } catch (error) {
      console.error("Error creating major:", error);
      toast.error("Không thể tạo chuyên ngành");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedMajor?.id) return;

    try {
      const response = await questionMajorManager.update(selectedMajor.id, formData);
      if (response.success) {
        toast.success("Đã cập nhật chuyên ngành thành công");
        setIsEditDialogOpen(false);
        loadMajors(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể cập nhật chuyên ngành");
      }
    } catch (error) {
      console.error("Error updating major:", error);
      toast.error("Không thể cập nhật chuyên ngành");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMajor?.id) return;

    try {
      const response = await questionMajorManager.delete(selectedMajor.id);
      if (response.success) {
        toast.success("Đã xóa chuyên ngành thành công");
        setIsDeleteDialogOpen(false);
        loadMajors(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể xóa chuyên ngành");
      }
    } catch (error) {
      console.error("Error deleting major:", error);
      toast.error("Không thể xóa chuyên ngành");
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
          Quản Lý Chuyên Ngành
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý các chuyên ngành cho bộ câu hỏi phỏng vấn
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
            onReload={loadMajors}
            isLoading={loading}
            tooltip="Tải lại danh sách chuyên ngành"
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Chuyên Ngành
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <QuestionMajorTable
          majors={filteredMajors.slice().reverse()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Empty State with Clear Search */}
        {filteredMajors.length === 0 && searchQuery && (
          <div className="flex justify-center pb-4">
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <QuestionMajorFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Thêm Chuyên Ngành Mới"
        description="Điền thông tin để tạo chuyên ngành mới."
        submitLabel="Tạo mới"
      />

      {/* Edit Dialog */}
      <QuestionMajorFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Chỉnh Sửa Chuyên Ngành"
        description="Cập nhật thông tin chuyên ngành."
        submitLabel="Lưu thay đổi"
      />

      {/* Delete Confirmation Dialog */}
      <DeleteQuestionMajorDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        major={selectedMajor}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
