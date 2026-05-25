import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { PaginationControl, ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerBlock } from "@/components/ui/spinner";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { extractDataArray } from "@/lib/utils";
import { companyManager } from "@/services";

import { CompanyDetailPage } from "./CompanyDetailPage";
import { CompanyDeleteDialog, CompanyFormDialog, CompanyTable } from "./components";
import type { Company, CompanyFormData, CompanyStatus } from "./types";

type CompanyStatusFilter = "active" | "inactive" | "all";

type SortableCompany = Company & {
  idSortValue: number;
  nameSortValue: string;
  statusSortValue: number;
  createdAtSortValue: number;
  updatedAtSortValue: number;
};

const isCompanyActive = (company: Company) =>
  (company.status ?? "ACTIVE").toUpperCase() !== "INACTIVE";

const normalizeStatus = (status?: string | null): CompanyStatus => {
  if (!status) return "ACTIVE";
  return status.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";
};

export function CompanyManagementPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const detailCompanyId = companyId ? Number(companyId) : null;

  if (companyId) {
    return <CompanyDetailPage companyId={detailCompanyId ?? 0} />;
  }

  return <CompanyListPage onNavigate={navigate} />;
}

interface CompanyListPageProps {
  onNavigate: ReturnType<typeof useNavigate>;
}

function CompanyListPage({ onNavigate }: CompanyListPageProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CompanyStatusFilter>("active");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({});

  const loadCompanies = useCallback(async (showReloading = false) => {
    if (showReloading) {
      setIsReloading(true);
    } else {
      setIsInitialLoading(true);
    }

    try {
      const response = await companyManager.getAll();
      if (response.success) {
        setCompanies(extractDataArray<Company>(response));
      } else {
        toast.error(response.error || "Không thể tải danh sách công ty");
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Không thể tải danh sách công ty");
    } finally {
      if (showReloading) {
        setIsReloading(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const active = isCompanyActive(company);
      if (statusFilter === "active" && !active) {
        return false;
      }
      if (statusFilter === "inactive" && active) {
        return false;
      }

      if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        const matches =
          company.name?.toLowerCase().includes(lower) ||
          company.description?.toLowerCase().includes(lower);
        if (!matches) return false;
      }

      return true;
    });
  }, [companies, searchQuery, statusFilter]);

  const sortableCompanies = useMemo<SortableCompany[]>(() => {
    return filteredCompanies.map((company) => ({
      ...company,
      idSortValue: company.id ?? 0,
      nameSortValue: company.name?.toLowerCase() || "",
      statusSortValue: isCompanyActive(company) ? 1 : 0,
      createdAtSortValue: company.createdAt ? new Date(company.createdAt).getTime() : 0,
      updatedAtSortValue: company.updatedAt ? new Date(company.updatedAt).getTime() : 0,
    }));
  }, [filteredCompanies]);

  const { sortedData, getSortProps } = useSortable(sortableCompanies, {
    defaultSort: {
      key: "updatedAtSortValue",
      direction: "desc",
    },
    noSortBehavior: "preserve",
    tieBreaker: {
      key: "updatedAtSortValue",
      direction: "desc",
    },
  });

  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_companymanagement_companymanagementpage_tsx_pagesize",
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
    setFormData({ status: "ACTIVE" });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name || "",
      description: company.description || "",
      status: normalizeStatus(company.status),
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetail = (company: Company) => {
    if (!company.id) return;
    onNavigate(`/admin/companies/${company.id}?tab=companies`);
  };

  const handleSubmitCreate = async () => {
    try {
      const response = await companyManager.create({
        data: {
          name: formData.name?.trim() || undefined,
          description: formData.description?.trim() || undefined,
          status: formData.status,
        },
        logo: formData.logo,
        banner: formData.banner,
      });

      if (response.success) {
        toast.success("Đã tạo công ty thành công");
        setIsCreateDialogOpen(false);
        void loadCompanies();
      } else {
        toast.error(response.error || "Không thể tạo công ty");
      }
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Không thể tạo công ty");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedCompany?.id) return;

    try {
      const response = await companyManager.update({
        data: {
          id: selectedCompany.id,
          name: formData.name?.trim() || undefined,
          description: formData.description?.trim() || undefined,
          status: formData.status,
        },
        logo: formData.logo,
        banner: formData.banner,
      });

      if (response.success) {
        toast.success("Đã cập nhật công ty thành công");
        setIsEditDialogOpen(false);
        void loadCompanies();
      } else {
        toast.error(response.error || "Không thể cập nhật công ty");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Không thể cập nhật công ty");
    }
  };

  const handleConfirmToggle = async () => {
    if (!selectedCompany?.id) return;

    try {
      const nextStatus = isCompanyActive(selectedCompany) ? "INACTIVE" : "ACTIVE";
      const response = await companyManager.update({
        data: {
          id: selectedCompany.id,
          name: selectedCompany.name,
          description: selectedCompany.description,
          status: nextStatus,
        },
      });

      if (response.success) {
        const action = nextStatus === "INACTIVE" ? "vô hiệu hóa" : "kích hoạt";
        toast.success(`Đã ${action} công ty thành công`);
        setIsDeleteDialogOpen(false);
        void loadCompanies();
      } else {
        toast.error(response.error || "Không thể thay đổi trạng thái công ty");
      }
    } catch (error) {
      console.error("Error updating company status:", error);
      toast.error("Không thể thay đổi trạng thái công ty");
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Quản Lý Công Ty
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý danh sách công ty và trạng thái hoạt động
        </p>
      </div>

      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as CompanyStatusFilter);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {(searchQuery || statusFilter !== "active") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("active");
                pagination.goToFirstPage();
              }}>
              Xóa bộ lọc
            </Button>
          )}
          <ReloadButton
            onReload={() => loadCompanies(true)}
            isLoading={isReloading}
            tooltip="Tải lại danh sách công ty"
            showLabel
            hideTooltip
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Công Ty
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isInitialLoading ? (
          <SpinnerBlock size="lg" label="Đang tải danh sách công ty..." />
        ) : (
          <>
            <CompanyTable
              companies={pageData}
              onView={handleViewDetail}
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

            {sortedData.length === 0 && (searchQuery || statusFilter !== "active") && (
              <div className="flex justify-center pb-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("active");
                    pagination.goToFirstPage();
                  }}>
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CompanyFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Thêm công ty mới"
        description="Điền thông tin để tạo công ty mới"
        submitLabel="Tạo công ty"
      />

      <CompanyFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Chỉnh sửa công ty"
        description="Cập nhật thông tin công ty"
        submitLabel="Lưu thay đổi"
        selectedCompany={selectedCompany}
      />

      <CompanyDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        company={selectedCompany}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
