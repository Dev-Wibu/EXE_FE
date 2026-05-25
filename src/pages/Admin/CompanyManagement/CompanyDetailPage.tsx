import { ArrowLeft, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { PaginationControl, ReloadButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/formatting";
import { extractDataArray } from "@/lib/utils";
import { companyManager, jobDescriptionManager } from "@/services";

import {
  CompanyDeleteDialog,
  CompanyFormDialog,
  JobDescriptionDeleteDialog,
  JobDescriptionFormDialog,
  JobDescriptionTable,
} from "./components";
import type {
  Company,
  CompanyFormData,
  CompanyStatus,
  JobDescription,
  JobDescriptionFormData,
  JobDescriptionLevel,
  JobDescriptionStatus,
} from "./types";

interface CompanyDetailPageProps {
  companyId: number;
}

type JobStatusFilter = "all" | JobDescriptionStatus;

type JobLevelFilter = "all" | JobDescriptionLevel;

type SortableJobDescription = JobDescription & {
  idSortValue: number;
  titleSortValue: string;
  levelSortValue: string;
  statusSortValue: string;
  salaryMinSortValue: number;
  deadlineSortValue: number;
  updatedAtSortValue: number;
};

const STATUS_OPTIONS: JobDescriptionStatus[] = ["OPEN", "CLOSED", "DRAFT"];
const LEVEL_OPTIONS: JobDescriptionLevel[] = ["INTERN", "FRESHER", "JUNIOR", "MIDDLE"];

const isCompanyActive = (company?: Company | null) =>
  (company?.status ?? "ACTIVE").toUpperCase() !== "INACTIVE";

export function CompanyDetailPage({ companyId }: CompanyDetailPageProps) {
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [isCompanyReloading, setIsCompanyReloading] = useState(false);

  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [isJobLoading, setIsJobLoading] = useState(true);
  const [isJobReloading, setIsJobReloading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [levelFilter, setLevelFilter] = useState<JobLevelFilter>("all");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyFormData, setCompanyFormData] = useState<CompanyFormData>({});

  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false);
  const [isEditJobDialogOpen, setIsEditJobDialogOpen] = useState(false);
  const [isDeleteJobDialogOpen, setIsDeleteJobDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [jobFormData, setJobFormData] = useState<Partial<JobDescriptionFormData>>({});

  const loadCompany = useCallback(
    async (showReloading = false) => {
      if (showReloading) {
        setIsCompanyReloading(true);
      } else {
        setIsCompanyLoading(true);
      }

      try {
        const response = await companyManager.getById(companyId);
        if (response.success && response.data) {
          setCompany(response.data);
        } else {
          toast.error(response.error || "Không thể tải thông tin công ty");
        }
      } catch (error) {
        console.error("Error loading company:", error);
        toast.error("Không thể tải thông tin công ty");
      } finally {
        if (showReloading) {
          setIsCompanyReloading(false);
        } else {
          setIsCompanyLoading(false);
        }
      }
    },
    [companyId]
  );

  const loadJobDescriptions = useCallback(
    async (showReloading = false) => {
      if (showReloading) {
        setIsJobReloading(true);
      } else {
        setIsJobLoading(true);
      }

      try {
        const response = await jobDescriptionManager.getByCompanyId(companyId);
        if (response.success) {
          setJobDescriptions(extractDataArray<JobDescription>(response));
        } else {
          toast.error(response.error || "Không thể tải danh sách JD");
        }
      } catch (error) {
        console.error("Error loading job descriptions:", error);
        toast.error("Không thể tải danh sách JD");
      } finally {
        if (showReloading) {
          setIsJobReloading(false);
        } else {
          setIsJobLoading(false);
        }
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (!Number.isFinite(companyId) || companyId <= 0) {
      return;
    }

    void loadCompany();
    void loadJobDescriptions();
  }, [companyId, loadCompany, loadJobDescriptions]);

  const handleReloadAll = async () => {
    await Promise.all([loadCompany(true), loadJobDescriptions(true)]);
  };

  const handleEditCompany = () => {
    if (!company) return;
    setCompanyFormData({
      name: company.name || "",
      description: company.description || "",
      status: (company.status as CompanyStatus) || "ACTIVE",
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleCompanyStatus = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitCompanyEdit = async () => {
    if (!company?.id) return;

    try {
      const payload = {
        data: {
          id: company.id,
          name: companyFormData.name?.trim() || undefined,
          description: companyFormData.description?.trim() || undefined,
          status: companyFormData.status,
        },
        logo: companyFormData.logo,
        banner: companyFormData.banner,
      };
      const response = await companyManager.update(payload);
      if (response.success) {
        toast.success("Đã cập nhật công ty thành công");
        setIsEditDialogOpen(false);
        void loadCompany();
      } else {
        toast.error(response.error || "Không thể cập nhật công ty");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Không thể cập nhật công ty");
    }
  };

  const handleConfirmCompanyToggle = async () => {
    if (!company?.id) return;

    try {
      const nextStatus = isCompanyActive(company) ? "INACTIVE" : "ACTIVE";
      const response = await companyManager.update({
        data: {
          id: company.id,
          name: company.name,
          description: company.description,
          status: nextStatus,
        },
      });

      if (response.success) {
        const action = nextStatus === "INACTIVE" ? "vô hiệu hóa" : "kích hoạt";
        toast.success(`Đã ${action} công ty thành công`);
        setIsDeleteDialogOpen(false);
        void loadCompany();
      } else {
        toast.error(response.error || "Không thể thay đổi trạng thái công ty");
      }
    } catch (error) {
      console.error("Error updating company status:", error);
      toast.error("Không thể thay đổi trạng thái công ty");
    }
  };

  const handleCreateJob = () => {
    setJobFormData({
      status: "OPEN",
      level: "JUNIOR",
      currency: "VND",
    });
    setSelectedJob(null);
    setIsCreateJobDialogOpen(true);
  };

  const handleEditJob = (job: JobDescription) => {
    setSelectedJob(job);
    setJobFormData({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      level: job.level,
      status: job.status,
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      currency: job.currency,
      deadlineAt: job.deadlineAt ?? undefined,
    });
    setIsEditJobDialogOpen(true);
  };

  const handleDeleteJob = (job: JobDescription) => {
    setSelectedJob(job);
    setIsDeleteJobDialogOpen(true);
  };

  const handleSubmitCreateJob = async () => {
    try {
      const payload = {
        companyId,
        title: jobFormData.title?.trim() || undefined,
        description: jobFormData.description?.trim() || undefined,
        requirements: jobFormData.requirements?.trim() || undefined,
        benefits: jobFormData.benefits?.trim() || undefined,
        level: jobFormData.level,
        status: jobFormData.status,
        salaryMin: jobFormData.salaryMin,
        salaryMax: jobFormData.salaryMax,
        currency: jobFormData.currency?.trim() || undefined,
        deadlineAt: jobFormData.deadlineAt,
      };

      const response = await jobDescriptionManager.create(payload);
      if (response.success) {
        toast.success("Đã tạo JD thành công");
        setIsCreateJobDialogOpen(false);
        void loadJobDescriptions();
      } else {
        toast.error(response.error || "Không thể tạo JD");
      }
    } catch (error) {
      console.error("Error creating job description:", error);
      toast.error("Không thể tạo JD");
    }
  };

  const handleSubmitEditJob = async () => {
    if (!selectedJob?.id) return;

    try {
      const payload = {
        id: selectedJob.id,
        companyId,
        title: jobFormData.title ?? selectedJob.title,
        description: jobFormData.description ?? selectedJob.description,
        requirements: jobFormData.requirements ?? selectedJob.requirements,
        benefits: jobFormData.benefits ?? selectedJob.benefits,
        level: jobFormData.level ?? selectedJob.level,
        status: jobFormData.status ?? selectedJob.status,
        salaryMin: jobFormData.salaryMin ?? selectedJob.salaryMin,
        salaryMax: jobFormData.salaryMax ?? selectedJob.salaryMax,
        currency: jobFormData.currency ?? selectedJob.currency,
        deadlineAt: jobFormData.deadlineAt ?? selectedJob.deadlineAt,
      };

      const response = await jobDescriptionManager.update(payload);
      if (response.success) {
        toast.success("Đã cập nhật JD thành công");
        setIsEditJobDialogOpen(false);
        void loadJobDescriptions();
      } else {
        toast.error(response.error || "Không thể cập nhật JD");
      }
    } catch (error) {
      console.error("Error updating job description:", error);
      toast.error("Không thể cập nhật JD");
    }
  };

  const handleConfirmCloseJob = async () => {
    if (!selectedJob?.id) return;

    try {
      const payload = {
        id: selectedJob.id,
        companyId,
        title: selectedJob.title,
        description: selectedJob.description,
        requirements: selectedJob.requirements,
        benefits: selectedJob.benefits,
        level: selectedJob.level,
        status: "CLOSED" as JobDescriptionStatus,
        salaryMin: selectedJob.salaryMin,
        salaryMax: selectedJob.salaryMax,
        currency: selectedJob.currency,
        deadlineAt: selectedJob.deadlineAt,
      };

      const response = await jobDescriptionManager.update(payload);
      if (response.success) {
        toast.success("Đã đóng JD thành công");
        setIsDeleteJobDialogOpen(false);
        void loadJobDescriptions();
      } else {
        toast.error(response.error || "Không thể đóng JD");
      }
    } catch (error) {
      console.error("Error closing job description:", error);
      toast.error("Không thể đóng JD");
    }
  };

  const filteredJobs = useMemo(() => {
    return jobDescriptions.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) {
        return false;
      }

      if (levelFilter !== "all" && job.level !== levelFilter) {
        return false;
      }

      if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        const matches =
          job.title?.toLowerCase().includes(lower) ||
          job.description?.toLowerCase().includes(lower) ||
          job.requirements?.toLowerCase().includes(lower);
        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [jobDescriptions, levelFilter, searchQuery, statusFilter]);

  const sortableJobs = useMemo<SortableJobDescription[]>(() => {
    return filteredJobs.map((job) => ({
      ...job,
      idSortValue: job.id ?? 0,
      titleSortValue: job.title?.toLowerCase() || "",
      levelSortValue: job.level || "",
      statusSortValue: job.status || "",
      salaryMinSortValue: job.salaryMin ?? 0,
      deadlineSortValue: job.deadlineAt ? new Date(job.deadlineAt).getTime() : 0,
      updatedAtSortValue: job.updatedAt ? new Date(job.updatedAt).getTime() : 0,
    }));
  }, [filteredJobs]);

  const { sortedData, getSortProps } = useSortable(sortableJobs, {
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
    key: "src_pages_admin_companymanagement_companydetailpage_tsx_jobdescriptions_pagesize",
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

  if (!Number.isFinite(companyId) || companyId <= 0) {
    return (
      <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="mb-2 font-['Inter'] text-2xl font-bold text-zinc-800 dark:text-white">
            Không tìm thấy công ty
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            ID công ty không hợp lệ. Vui lòng quay lại danh sách.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/admin?tab=companies")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin?tab=companies")}
            className="h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Quay lại danh sách">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="mb-1 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
              {company?.name || "Chi tiết công ty"}
            </h1>
            <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
              Quản lý thông tin công ty và JD liên quan
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReloadButton
            onReload={handleReloadAll}
            isLoading={isCompanyReloading || isJobReloading}
            tooltip="Tải lại dữ liệu"
            showLabel
            hideTooltip
          />
          <Button variant="outline" onClick={handleEditCompany}>
            Chỉnh sửa công ty
          </Button>
          <Button
            variant={isCompanyActive(company) ? "destructive" : "default"}
            onClick={handleToggleCompanyStatus}>
            {isCompanyActive(company) ? "Vô hiệu hóa" : "Kích hoạt"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {isCompanyLoading ? (
            <SpinnerBlock size="lg" label="Đang tải thông tin công ty..." />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border bg-white">
                  {company?.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company?.name || "Logo"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {company?.name || "-"}
                    </h2>
                    <Badge variant={isCompanyActive(company) ? "default" : "destructive"}>
                      {isCompanyActive(company) ? "Hoạt động" : "Ngưng hoạt động"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    ID: {company?.id ?? "-"}
                  </p>
                </div>
              </div>

              {company?.bannerUrl ? (
                <div className="overflow-hidden rounded-lg border bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <img
                    src={company.bannerUrl}
                    alt="Banner công ty"
                    className="h-40 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : null}

              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mô tả
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {company?.description || "Chưa có mô tả"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
            Thông tin nhanh
          </h3>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Ngày tạo</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatDate(company?.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cập nhật</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatDate(company?.updatedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Số JD</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {jobDescriptions.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">
              Quản lý Job Description
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              CRUD danh sách JD thuộc công ty này
            </p>
          </div>
          <Button onClick={handleCreateJob} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm JD
          </Button>
        </div>

        <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Tìm kiếm theo tiêu đề, mô tả, yêu cầu..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as JobStatusFilter);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={levelFilter}
            onValueChange={(value) => {
              setLevelFilter(value as JobLevelFilter);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Lọc cấp độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả cấp độ</SelectItem>
              {LEVEL_OPTIONS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {(searchQuery || statusFilter !== "all" || levelFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setLevelFilter("all");
                  pagination.goToFirstPage();
                }}>
                Xóa bộ lọc
              </Button>
            )}
            <ReloadButton
              onReload={() => loadJobDescriptions(true)}
              isLoading={isJobReloading}
              tooltip="Tải lại danh sách JD"
              showLabel
              hideTooltip
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {isJobLoading ? (
            <SpinnerBlock size="lg" label="Đang tải danh sách JD..." />
          ) : (
            <>
              <JobDescriptionTable
                jobDescriptions={pageData}
                onEdit={handleEditJob}
                onDelete={handleDeleteJob}
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

              {sortedData.length === 0 &&
                (searchQuery || statusFilter !== "all" || levelFilter !== "all") && (
                  <div className="flex justify-center pb-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setLevelFilter("all");
                        pagination.goToFirstPage();
                      }}>
                      Xóa bộ lọc
                    </Button>
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      <CompanyFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={companyFormData}
        onFormChange={setCompanyFormData}
        onSubmit={handleSubmitCompanyEdit}
        title="Chỉnh sửa công ty"
        description="Cập nhật thông tin công ty"
        submitLabel="Lưu thay đổi"
        selectedCompany={company}
      />

      <CompanyDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        company={company}
        onConfirm={handleConfirmCompanyToggle}
      />

      <JobDescriptionFormDialog
        isOpen={isCreateJobDialogOpen}
        onOpenChange={setIsCreateJobDialogOpen}
        formData={jobFormData}
        onFormChange={setJobFormData}
        onSubmit={handleSubmitCreateJob}
        title="Thêm JD mới"
        description="Nhập thông tin JD để tạo mới"
        submitLabel="Tạo JD"
      />

      <JobDescriptionFormDialog
        isOpen={isEditJobDialogOpen}
        onOpenChange={setIsEditJobDialogOpen}
        formData={jobFormData}
        onFormChange={setJobFormData}
        onSubmit={handleSubmitEditJob}
        title="Chỉnh sửa JD"
        description="Cập nhật thông tin JD"
        submitLabel="Lưu thay đổi"
      />

      <JobDescriptionDeleteDialog
        isOpen={isDeleteJobDialogOpen}
        onOpenChange={setIsDeleteJobDialogOpen}
        jobDescription={selectedJob}
        onConfirm={handleConfirmCloseJob}
      />
    </div>
  );
}
