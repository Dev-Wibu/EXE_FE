import { ChevronLeft, Edit, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { PaginationControl } from "@/components/shared";
import { Button } from "@/components/ui/button";
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
import { companyManager, jobDescriptionManager } from "@/services";

import {
  CompanyDeleteDialog,
  CompanyFormDialog,
  JobDescriptionDeleteDialog,
  JobDescriptionDetailDialog,
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

interface CompanyDetailViewProps {
  companyId: number;
  onCompanyUpdate?: () => void;
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

export function CompanyDetailView({ companyId, onCompanyUpdate }: CompanyDetailViewProps) {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);

  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [isJobLoading, setIsJobLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [levelFilter, setLevelFilter] = useState<JobLevelFilter>("all");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyFormData, setCompanyFormData] = useState<CompanyFormData>({});

  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false);
  const [isEditJobDialogOpen, setIsEditJobDialogOpen] = useState(false);
  const [isDeleteJobDialogOpen, setIsDeleteJobDialogOpen] = useState(false);
  const [isViewJobDialogOpen, setIsViewJobDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [jobFormData, setJobFormData] = useState<Partial<JobDescriptionFormData>>({});

  const loadCompany = useCallback(async () => {
    setIsCompanyLoading(true);
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
      setIsCompanyLoading(false);
    }
  }, [companyId]);

  const loadJobDescriptions = useCallback(async () => {
    setIsJobLoading(true);
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
      setIsJobLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!Number.isFinite(companyId) || companyId <= 0) return;
    void loadCompany();
    void loadJobDescriptions();
  }, [companyId, loadCompany, loadJobDescriptions]);

  const handleEditCompany = () => {
    if (!company) return;
    setCompanyFormData({
      name: company.name || "",
      description: company.description || "",
      status: (company.status as CompanyStatus) || "ACTIVE",
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitCompanyEdit = async () => {
    if (!company?.id) return;
    try {
      const response = await companyManager.update({
        data: {
          id: company.id,
          name: companyFormData.name?.trim() || undefined,
          description: companyFormData.description?.trim() || undefined,
          status: companyFormData.status,
        },
        logo: companyFormData.logo,
        banner: companyFormData.banner,
      });
      if (response.success) {
        toast.success("Đã cập nhật công ty thành công");
        setIsEditDialogOpen(false);
        void loadCompany();
        onCompanyUpdate?.();
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
        data: { id: company.id, name: company.name, description: company.description, status: nextStatus },
      });
      if (response.success) {
        const action = nextStatus === "INACTIVE" ? "vô hiệu hóa" : "kích hoạt";
        toast.success(`Đã ${action} công ty thành công`);
        setIsDeleteDialogOpen(false);
        void loadCompany();
        onCompanyUpdate?.();
      } else {
        toast.error(response.error || "Không thể thay đổi trạng thái công ty");
      }
    } catch (error) {
      console.error("Error updating company status:", error);
      toast.error("Không thể thay đổi trạng thái công ty");
    }
  };

  const handleCreateJob = () => {
    setJobFormData({ status: "OPEN", level: "JUNIOR", currency: "VND" });
    setSelectedJob(null);
    setIsCreateJobDialogOpen(true);
  };

  const handleViewJob = (job: JobDescription) => {
    setSelectedJob(job);
    setIsViewJobDialogOpen(true);
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
      const response = await jobDescriptionManager.create({
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
      });
      if (response.success) {
        toast.success("Đã tạo JD thành công");
        setIsCreateJobDialogOpen(false);
        void loadJobDescriptions();
        onCompanyUpdate?.();
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
      const response = await jobDescriptionManager.update({
        id: selectedJob.id,
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
      });
      if (response.success) {
        toast.success("Đã cập nhật JD thành công");
        setIsEditJobDialogOpen(false);
        void loadJobDescriptions();
        onCompanyUpdate?.();
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
      const response = await jobDescriptionManager.update({
        id: selectedJob.id,
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
      });
      if (response.success) {
        toast.success("Đã đóng JD thành công");
        setIsDeleteJobDialogOpen(false);
        void loadJobDescriptions();
        onCompanyUpdate?.();
      } else {
        toast.error(response.error || "Không thể đóng JD");
      }
    } catch (error) {
      console.error("Error closing job description:", error);
      toast.error("Không thể đóng JD");
    }
  };

  const filteredJobs = useMemo(
    () =>
      jobDescriptions.filter((job) => {
        if (statusFilter !== "all" && job.status !== statusFilter) return false;
        if (levelFilter !== "all" && job.level !== levelFilter) return false;
        return true;
      }),
    [jobDescriptions, levelFilter, statusFilter]
  );

  const sortableJobs = useMemo<SortableJobDescription[]>(
    () =>
      filteredJobs.map((job) => ({
        ...job,
        idSortValue: job.id ?? 0,
        titleSortValue: job.title?.toLowerCase() || "",
        levelSortValue: job.level || "",
        statusSortValue: job.status || "",
        salaryMinSortValue: job.salaryMin ?? 0,
        deadlineSortValue: job.deadlineAt ? new Date(job.deadlineAt).getTime() : 0,
        updatedAtSortValue: job.updatedAt ? new Date(job.updatedAt).getTime() : 0,
      })),
    [filteredJobs]
  );

  const { sortedData, getSortProps } = useSortable(sortableJobs, {
    defaultSort: { key: "updatedAtSortValue", direction: "desc" },
    noSortBehavior: "preserve",
    tieBreaker: { key: "updatedAtSortValue", direction: "desc" },
  });

  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_companymanagement_companydetailview_tsx_jobdescriptions_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({ totalCount: sortedData.length, pageSize });
  const pageData = useMemo(
    () => sortedData.slice(pagination.startIndex, pagination.endIndex + 1),
    [pagination.endIndex, pagination.startIndex, sortedData]
  );

  if (!Number.isFinite(companyId) || companyId <= 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center text-muted-foreground">ID công ty không hợp lệ. Vui lòng chọn lại.</div>
      </div>
    );
  }

  if (isCompanyLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <SpinnerBlock size="lg" label="Đang tải thông tin công ty..." />
      </div>
    );
  }

  const activeJobCount = jobDescriptions.filter((j) => j.status === "OPEN").length;
  const activeJobPercentage =
    jobDescriptions.length > 0 ? Math.round((activeJobCount / jobDescriptions.length) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Banner + Header */}
      <div className="relative shrink-0">
        {/* Banner image or gradient placeholder */}
        <div className="h-40 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background">
          {company?.bannerUrl && (
            <img
              src={company.bannerUrl}
              alt="Banner"
              className="h-full w-full object-cover opacity-80"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </div>

        {/* Mobile back button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-background/80 backdrop-blur-sm text-sm md:hidden"
          onClick={() => navigate("/admin/companies?tab=companies")}
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>

        {/* Logo overlapping banner */}
        <div className="absolute bottom-0 left-6 translate-y-1/2">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-background bg-white shadow-md">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name || "Logo"}
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {company?.name?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info + Actions row */}
      <div className="flex flex-col gap-4 px-6 pb-6 pt-12 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{company?.name || "Chi tiết công ty"}</h2>
          {company?.description && (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{company.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 rounded-xl bg-card hover:bg-card/80"
            onClick={handleEditCompany}
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </Button>
          <Button
            className="flex items-center gap-2 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-95"
            onClick={handleCreateJob}
          >
            <Plus className="h-4 w-4" />
            Tạo JD mới
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 px-6 pb-6">
        <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-card/40 p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tổng số JD
          </span>
          <span className="text-3xl font-bold text-foreground">{jobDescriptions.length}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-card/40 p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            JD Đang hoạt động
          </span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-foreground">{activeJobCount}</span>
            {jobDescriptions.length > 0 && (
              <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-600 dark:text-green-400">
                {activeJobPercentage}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* JD Table */}
      <div className="mx-6 mb-6 flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 bg-card/50 p-4 md:flex-row md:items-center">
          <h3 className="text-lg font-bold text-foreground">Danh sách JD</h3>
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as JobStatusFilter);
                pagination.goToFirstPage();
              }}
            >
              <SelectTrigger className="w-[160px] rounded-lg border-none bg-background/50">
                <SelectValue placeholder="Tất cả trạng thái" />
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
              }}
            >
              <SelectTrigger className="w-[150px] rounded-lg border-none bg-background/50">
                <SelectValue placeholder="Tất cả cấp độ" />
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
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isJobLoading ? (
            <div className="p-8">
              <SpinnerBlock size="lg" label="Đang tải danh sách JD..." />
            </div>
          ) : (
            <JobDescriptionTable
              jobDescriptions={pageData}
              onView={handleViewJob}
              onEdit={handleEditJob}
              onDelete={handleDeleteJob}
              getSortProps={getSortProps}
            />
          )}
        </div>

        {sortedData.length > 0 && !isJobLoading && (
          <div className="border-t border-border/50 bg-card/30 p-4">
            <PaginationControl
              pagination={pagination}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                pagination.goToFirstPage();
              }}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
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

      <JobDescriptionDetailDialog
        isOpen={isViewJobDialogOpen}
        onOpenChange={setIsViewJobDialogOpen}
        jobDescription={selectedJob}
        onEdit={handleEditJob}
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
