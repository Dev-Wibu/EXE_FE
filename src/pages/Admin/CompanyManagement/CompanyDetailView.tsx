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
import { ChevronLeft, Edit, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CompanyDeleteDialog,
  CompanyFormDialog,
  JobDescriptionDeleteDialog,
  JobDescriptionDetailDialog,
  JobDescriptionFormDialog,
  JobDescriptionRoundsDialog,
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
  const { t } = useTranslation();
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
  const [isRoundsDialogOpen, setIsRoundsDialogOpen] = useState(false);
  const [selectedJobForRounds, setSelectedJobForRounds] = useState<JobDescription | null>(null);
  const loadCompany = useCallback(async () => {
    setIsCompanyLoading(true);
    try {
      const response = await companyManager.getById(companyId);
      if (response.success && response.data) {
        // @ts-expect-error: Schema type mismatch between frontend and backend
        setCompany(response.data);
      } else {
        toast.error(response.error || t("common.unableToLoadCompanyInformation"));
      }
    } catch (error) {
      console.error("Error loading company:", error);
      toast.error(t("common.unableToLoadCompanyInformation"));
    } finally {
      setIsCompanyLoading(false);
    }
  }, [companyId, t]);
  const loadJobDescriptions = useCallback(async () => {
    setIsJobLoading(true);
    try {
      const response = await jobDescriptionManager.getByCompanyId(companyId);
      if (response.success) {
        setJobDescriptions(extractDataArray<JobDescription>(response));
      } else {
        toast.error(response.error || t("adminCompanymanagement.unableToLoadJdList"));
      }
    } catch (error) {
      console.error("Error loading job descriptions:", error);
      toast.error(t("adminCompanymanagement.unableToLoadJdList"));
    } finally {
      setIsJobLoading(false);
    }
  }, [companyId, t]);
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
        toast.success(t("adminCompanymanagement.companyUpdatedSuccessfully"));
        setIsEditDialogOpen(false);
        void loadCompany();
        onCompanyUpdate?.();
      } else {
        toast.error(response.error || t("common.unableToUpdateCompany"));
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error(t("common.unableToUpdateCompany"));
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
        const action = nextStatus === "INACTIVE" ? t("common.disable") : t("common.activate");
        toast.success(
          t("general.successfullyCompany", {
            var_0: action,
          })
        );
        setIsDeleteDialogOpen(false);
        void loadCompany();
        onCompanyUpdate?.();
      } else {
        toast.error(response.error || t("adminCompanymanagement.companyStatusCannotBeChanged"));
      }
    } catch (error) {
      console.error("Error updating company status:", error);
      toast.error(t("adminCompanymanagement.companyStatusCannotBeChanged"));
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
  const handleConfigureRounds = (job: JobDescription) => {
    setSelectedJobForRounds(job);
    setIsRoundsDialogOpen(true);
  };
  const handleSubmitCreateJob = async () => {
    try {
      const response = await jobDescriptionManager.create({
        companyId: Number(companyId),
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
        toast.success(t("adminCompanymanagement.successfullyCreatedJd"));
        setIsCreateJobDialogOpen(false);
        void loadJobDescriptions();
        onCompanyUpdate?.();
      } else {
        toast.error(response.error || t("adminCompanymanagement.unableToCreateJd"));
      }
    } catch (error) {
      console.error("Error creating job description:", error);
      toast.error(t("adminCompanymanagement.unableToCreateJd"));
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
        toast.success(t("adminCompanymanagement.updatedJdSuccessfully"));
        setIsEditJobDialogOpen(false);
        void loadJobDescriptions();
        onCompanyUpdate?.();
      } else {
        toast.error(response.error || t("adminCompanymanagement.unableToUpdateJd"));
      }
    } catch (error) {
      console.error("Error updating job description:", error);
      toast.error(t("adminCompanymanagement.unableToUpdateJd"));
    }
  };
  const handleToggleJobStatus = async (job: JobDescription, nextStatus: "OPEN" | "CLOSED") => {
    try {
      const response = await jobDescriptionManager.update({
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits,
        level: job.level,
        status: nextStatus as JobDescriptionStatus,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency,
        deadlineAt: job.deadlineAt,
      });
      if (response.success) {
        const msg =
          nextStatus === "OPEN"
            ? t("adminCompanymanagement.successfullyOpenedJd", t("recruitment.openSuccess"))
            : t("adminCompanymanagement.successfullyClosedJd", t("recruitment.closeSuccess"));
        toast.success(msg);
        void loadJobDescriptions();
        onCompanyUpdate?.();
      } else {
        toast.error(
          response.error ||
            t("adminCompanymanagement.unableToUpdateJdStatus", t("recruitment.updateStatusFailed"))
        );
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error(
        t("adminCompanymanagement.unableToUpdateJdStatus", t("recruitment.updateStatusFailed"))
      );
    }
  };
  const handleConfirmCloseJob = async () => {
    if (!selectedJob) return;
    await handleToggleJobStatus(selectedJob, "CLOSED");
    setIsDeleteJobDialogOpen(false);
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
    key: "src_pages_admin_companymanagement_companydetailview_tsx_jobdescriptions_pagesize",
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
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-muted-foreground text-center">
          {t("adminCompanymanagement.invalidCompanyIdPleaseSelect")}
        </div>
      </div>
    );
  }
  if (isCompanyLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <SpinnerBlock size="lg" label={t("common.loadingCompanyInformation")} />
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      {/* Banner + Header */}
      <div className="relative shrink-0">
        {/* Banner image or gradient placeholder */}
        <div className="border-border/10 relative h-28 w-full overflow-hidden border-b bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:1.5rem_1.5rem] opacity-35" />
          <div className="absolute top-0 right-1/4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="absolute top-4 left-1/3 h-16 w-16 rounded-full bg-indigo-500/10 blur-2xl" />
          {company?.bannerUrl && (
            <img
              src={company.bannerUrl}
              alt={t("common.banner")}
              className="absolute inset-0 h-full w-full object-cover opacity-60"
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
          className="bg-background/80 absolute top-3 left-3 flex items-center gap-1 rounded-lg text-sm backdrop-blur-sm md:hidden"
          onClick={() => navigate("/admin/companies?tab=companies")}>
          <ChevronLeft className="h-4 w-4" />
          {t("general.back")}
        </Button>

        {/* Logo overlapping banner */}
        <div className="absolute bottom-0 left-6 translate-y-1/2">
          <div className="border-background/50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-md">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name || t("common.logo")}
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-muted-foreground text-2xl font-bold">
                {company?.name?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info + Actions row */}
      <div className="flex flex-col gap-4 px-6 pt-8 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">
            {company?.name || t("adminCompanymanagement.companyDetails")}
          </h2>
          {company?.description && company.description !== "string" ? (
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">{company.description}</p>
          ) : (
            <p className="text-muted-foreground/50 mt-1 max-w-xl text-sm italic">
              {t("adminCompanymanagement.noCompanyDescription")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="outline"
            className="bg-card hover:bg-card/80 flex items-center gap-2 rounded-xl"
            onClick={handleEditCompany}>
            <Edit className="h-4 w-4" />
            {t("general.edit")}
          </Button>
          <Button
            className="flex items-center gap-2 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-95"
            onClick={handleCreateJob}>
            <Plus className="h-4 w-4" />
            {t("adminCompanymanagement.createNewJd")}
          </Button>
        </div>
      </div>

      {/* JD Table */}
      <div className="border-border/50 bg-card/40 mx-6 mb-2 flex flex-col rounded-2xl border shadow-sm">
        <div className="border-border/50 bg-card/50 flex flex-col items-start justify-between gap-4 border-b p-4 md:flex-row md:items-center">
          <h3 className="text-foreground text-lg font-bold">
            {t("adminCompanymanagement.jdList")}
          </h3>
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as JobStatusFilter);
                pagination.goToFirstPage();
              }}>
              <SelectTrigger className="bg-background/50 w-[160px] rounded-lg border-none">
                <SelectValue placeholder={t("common.allStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatus")}</SelectItem>
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
              <SelectTrigger className="bg-background/50 w-[150px] rounded-lg border-none">
                <SelectValue placeholder={t("common.allLevels")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allLevels")}</SelectItem>
                {LEVEL_OPTIONS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isJobLoading ? (
            <div className="p-8">
              <SpinnerBlock size="lg" label={t("adminCompanymanagement.loadingJdList")} />
            </div>
          ) : (
            <JobDescriptionTable
              jobDescriptions={pageData}
              onView={handleViewJob}
              onEdit={handleEditJob}
              onDelete={handleDeleteJob}
              onToggleStatus={handleToggleJobStatus}
              onConfigureRounds={handleConfigureRounds}
              getSortProps={getSortProps}
            />
          )}
        </div>

        {sortedData.length > 0 && !isJobLoading && (
          <div className="border-border/50 bg-card/30 border-t pr-4 pl-4">
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
        title={t("adminCompanymanagement.editCompany")}
        description={t("adminCompanymanagement.updateCompanyInformation")}
        submitLabel={t("common.saveChanges")}
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
        title={t("adminCompanymanagement.addNewJd")}
        description={t("adminCompanymanagement.enterJdInformationToCreate")}
        submitLabel={t("adminCompanymanagement.createJd")}
      />

      <JobDescriptionFormDialog
        isOpen={isEditJobDialogOpen}
        onOpenChange={setIsEditJobDialogOpen}
        formData={jobFormData}
        onFormChange={setJobFormData}
        onSubmit={handleSubmitEditJob}
        title={t("adminCompanymanagement.editJd")}
        description={t("adminCompanymanagement.updateJdInformation")}
        submitLabel={t("common.saveChanges")}
      />

      <JobDescriptionDeleteDialog
        isOpen={isDeleteJobDialogOpen}
        onOpenChange={setIsDeleteJobDialogOpen}
        jobDescription={selectedJob}
        onConfirm={handleConfirmCloseJob}
      />

      <JobDescriptionRoundsDialog
        isOpen={isRoundsDialogOpen}
        onOpenChange={setIsRoundsDialogOpen}
        jobDescription={selectedJobForRounds}
        onSaved={loadJobDescriptions}
      />
    </div>
  );
}
