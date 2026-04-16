import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpinnerBlock } from "@/components/ui/spinner";
import { extractDataArray } from "@/lib/utils";
import { memberShipPlanManager } from "@/services";
import { toast } from "sonner";

import {
  DeleteMembershipPlanDialog,
  MembershipPlanFormDialog,
  MembershipPlanTable,
} from "./components";
import type { MemberShipPlan, MemberShipPlanFormData } from "./types";

export function MembershipPlanManagementPage() {
  const [plans, setPlans] = useState<MemberShipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MemberShipPlan | null>(null);
  const [formData, setFormData] = useState<Partial<MemberShipPlanFormData>>({});

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await memberShipPlanManager.getAll();
      if (response.success) {
        setPlans(extractDataArray<MemberShipPlan>(response));
      } else {
        toast.error(response.error || "Không thể tải danh sách gói thành viên");
      }
    } catch (error) {
      console.error("Error loading membership plans:", error);
      toast.error("Không thể tải danh sách gói thành viên");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const filteredPlans = plans.filter((plan) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return plan.name?.toLowerCase().includes(lowerQuery);
  });

  const handleCreate = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (plan: MemberShipPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price ?? 0,
      max_ai_interview: plan.max_ai_interview ?? 0,
      max_practice_sets: plan.max_practice_sets ?? 0,
      max_quiz_sets: plan.max_quiz_sets ?? 0,
      durationDays: plan.durationDays ?? 30,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (plan: MemberShipPlan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    try {
      const response = await memberShipPlanManager.create(formData);
      if (response.success) {
        toast.success("Đã tạo gói thành viên thành công");
        setIsCreateDialogOpen(false);
        loadPlans();
      } else {
        toast.error(response.error || "Không thể tạo gói thành viên");
      }
    } catch (error) {
      console.error("Error creating membership plan:", error);
      toast.error("Không thể tạo gói thành viên");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedPlan?.id) return;

    try {
      const response = await memberShipPlanManager.update(selectedPlan.id, formData);
      if (response.success) {
        toast.success("Đã cập nhật gói thành viên thành công");
        setIsEditDialogOpen(false);
        loadPlans();
      } else {
        toast.error(response.error || "Không thể cập nhật gói thành viên");
      }
    } catch (error) {
      console.error("Error updating membership plan:", error);
      toast.error("Không thể cập nhật gói thành viên");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan?.id) return;

    try {
      const response = await memberShipPlanManager.delete(selectedPlan.id);
      if (response.success) {
        toast.success("Đã xóa gói thành viên thành công");
        setIsDeleteDialogOpen(false);
        loadPlans();
      } else {
        toast.error(response.error || "Không thể xóa gói thành viên");
      }
    } catch (error) {
      console.error("Error deleting membership plan:", error);
      toast.error("Không thể xóa gói thành viên");
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
          Quản Lý Gói Thành Viên
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý các gói thành viên (Membership Plans) của hệ thống
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative w-96">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên gói..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={loadPlans}
            isLoading={loading}
            tooltip="Tải lại danh sách gói thành viên"
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Gói
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <MembershipPlanTable
          plans={filteredPlans.slice().reverse()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {filteredPlans.length === 0 && searchQuery && (
          <div className="flex justify-center pb-4">
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <MembershipPlanFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Thêm Gói Thành Viên Mới"
        description="Điền thông tin để tạo gói thành viên mới."
        submitLabel="Tạo gói"
      />

      {/* Edit Dialog */}
      <MembershipPlanFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Chỉnh Sửa Gói Thành Viên"
        description="Cập nhật thông tin gói thành viên."
        submitLabel="Lưu thay đổi"
      />

      {/* Delete Confirmation Dialog */}
      <DeleteMembershipPlanDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        plan={selectedPlan}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
