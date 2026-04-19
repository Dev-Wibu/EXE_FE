import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PaginationControl, ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpinnerBlock } from "@/components/ui/spinner";

import { useSortable } from "@/hooks/useSortable";
import { extractDataArray } from "@/lib/utils";
import { memberShipPlanManager } from "@/services";
import { toast } from "sonner";

import {
  DeleteMembershipPlanDialog,
  MembershipPlanFormDialog,
  MembershipPlanTable,
} from "./components";
import type { MemberShipPlan, MemberShipPlanFormData } from "./types";

type SortableMembershipPlan = MemberShipPlan & {
  idSortValue: number;
  nameSortValue: string;
  priceSortValue: number;
  durationSortValue: number;
};

export function MembershipPlanManagementPage() {
  const [plans, setPlans] = useState<MemberShipPlan[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MemberShipPlan | null>(null);
  const [formData, setFormData] = useState<Partial<MemberShipPlanFormData>>({});

  const loadPlans = useCallback(async (showReloading = false) => {
    if (showReloading) {
      setIsReloading(true);
    } else {
      setIsInitialLoading(true);
    }

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
      if (showReloading) {
        setIsReloading(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      return plan.name?.toLowerCase().includes(lowerQuery);
    });
  }, [plans, searchQuery]);

  const sortablePlans = useMemo<SortableMembershipPlan[]>(() => {
    return filteredPlans.map((plan) => ({
      ...plan,
      idSortValue: typeof plan.id === "number" ? plan.id : 0,
      nameSortValue: plan.name?.toLowerCase() || "",
      priceSortValue: plan.price || 0,
      durationSortValue: plan.durationDays || 0,
    }));
  }, [filteredPlans]);

  const { sortedData, getSortProps } = useSortable(sortablePlans, {
    defaultSort: {
      key: "idSortValue",
      direction: "desc",
    },
    noSortBehavior: "preserve",
    tieBreaker: {
      key: "idSortValue",
      direction: "desc",
    },
  });
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_membershipplanmanagement_membershipplanmanagementpage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  const pageData = useMemo(
    () => sortedData.slice(pagination.startIndex, pagination.endIndex + 1),
    [pagination.endIndex, pagination.startIndex, sortedData]
  );

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
        void loadPlans();
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
        void loadPlans();
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
        void loadPlans();
      } else {
        toast.error(response.error || "Không thể xóa gói thành viên");
      }
    } catch (error) {
      console.error("Error deleting membership plan:", error);
      toast.error("Không thể xóa gói thành viên");
    }
  };

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
      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên gói..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              pagination.goToFirstPage();
            }}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                pagination.goToFirstPage();
              }}>
              Xóa bộ lọc
            </Button>
          )}
          <ReloadButton
            onReload={() => loadPlans(true)}
            isLoading={isReloading}
            tooltip="Tải lại danh sách gói thành viên"
            showLabel
            hideTooltip
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Gói
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isInitialLoading ? (
          <SpinnerBlock size="lg" label="Đang tải danh sách gói thành viên..." />
        ) : (
          <>
            <MembershipPlanTable
              plans={pageData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getSortProps={getSortProps}
            />

            {sortedData.length > 0 && (
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  pagination.goToFirstPage();
                }}
              />
            )}

            {sortedData.length === 0 && searchQuery && (
              <div className="flex justify-center pb-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    pagination.goToFirstPage();
                  }}>
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </>
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
