import { PaginationControl, ReloadButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingCardList } from "@/components/ui/loading-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { formatDateTime } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { applicationService, companyManager } from "@/services";
import type { Application } from "@/services/application.manager";
import type { Company, JobDescription } from "@/services/company.manager";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Clock, FileSearch, Search, Star, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type ApplicationStatus = "IN_PROGRESS" | "PASSED" | "FAILED" | "SOFT_FAILED";
interface EnrichedApplication extends Application {
  jobDescription?: JobDescription;
  company?: Company;
}

// ============================================================
// Constants
// ============================================================

// ============================================================
// Hook for translated round type labels
// ============================================================

function useRoundTypeLabels(): Record<string, string> {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      CV_SCREENING: t("userAiinterview.cvScreening"),
      EMAIL_SIMULATOR: t("userAiinterview.emailSimulator"),
      QUIZ: "Quiz",
      DB_DESIGN: t("userAiinterview.dbDesign"),
      AI_INTERVIEW: t("common.aiInterview"),
    }),
    [t]
  );
}

// ============================================================
// Score Ring Component
// ============================================================

// ============================================================
// Score Ring Component
// ============================================================

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
      }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-500 ease-out",
            score >= 70 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "text-xs font-bold",
            score >= 70
              ? "text-emerald-600 dark:text-emerald-400"
              : score >= 50
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
          )}>
          {score}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Application Card (Glass Design)
// ============================================================

function ApplicationCard({
  application,
  onViewDetails,
}: {
  application: EnrichedApplication;
  onViewDetails: () => void;
}) {
  const { t } = useTranslation();
  const roundTypeLabels = useRoundTypeLabels();

  const APPLICATION_STATUS_CONFIG: Record<
    ApplicationStatus,
    { label: string; className: string; dotColor: string; bgClass: string }
  > = {
    IN_PROGRESS: {
      label: t("common.processing1"),
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      dotColor: "bg-yellow-500",
      bgClass: "border-slate-200 dark:border-slate-700",
    },
    PASSED: {
      label: t("common.obtain"),
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
      bgClass: "border-slate-200 dark:border-slate-700",
    },
    FAILED: {
      label: t("common.failed"),
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      dotColor: "bg-red-500",
      bgClass: "border-slate-200 dark:border-slate-700",
    },
    SOFT_FAILED: {
      label: t("userApplicationhistory.needsImprovement"),
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      dotColor: "bg-amber-500",
      bgClass: "border-slate-200 dark:border-slate-700",
    },
  };
  const LEVEL_LABELS: Record<string, string> = {
    INTERN: t("userApplicationhistory.internship"),
    FRESHER: t("common.fresher"),
    JUNIOR: t("common.junior"),
    MIDDLE: t("common.middle"),
  };

  const jd = application.jobDescription;
  const statusConfig = APPLICATION_STATUS_CONFIG[application.status as ApplicationStatus] ?? {
    label: application.status ?? "—",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    dotColor: "bg-gray-500",
    bgClass: "border-gray-200 dark:border-gray-700",
  };
  const rounds = jd?.rounds ?? [];
  const currentRound = rounds.find((r) => r.roundOrder === application.currentRoundOrder);
  const currentRoundTypeLabel = currentRound?.roundType
    ? roundTypeLabels[currentRound.roundType] || currentRound.roundType
    : null;
  const hasScore = application.overallScore !== undefined && application.overallScore !== null;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white/70 backdrop-blur-sm",
        "transition-all duration-300 hover:bg-white/90 hover:shadow-lg dark:bg-slate-900/70 dark:hover:bg-slate-900/90",
        statusConfig.bgClass
      )}>
      <div className="flex flex-col gap-4 p-4 md:flex-row">
        {/* Left: Company Logo & Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row">
          {/* Company Logo */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#0047AB]/10">
            {application.company?.logoUrl ? (
              <img
                src={application.company.logoUrl}
                alt={application.company.name}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <Briefcase className="h-8 w-8 text-[#0047AB]" />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            {/* Title & Status */}
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                  {jd?.title ?? t("common.noTitle")}
                </h3>
                <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                  <FileSearch className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {application.company?.name ?? t("common.company")}
                  </span>
                </p>
              </div>
              <Badge className={cn("shrink-0 gap-1", statusConfig.className)}>
                <span className={cn("h-2 w-2 rounded-full", statusConfig.dotColor)} />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-4">
              {jd?.level && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-slate-600 dark:text-slate-400">
                    {LEVEL_LABELS[jd.level] ?? jd.level}
                  </span>
                </div>
              )}
              {application.createdAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-slate-600 dark:text-slate-400">
                    {formatDateTime(application.createdAt)}
                  </span>
                </div>
              )}
              {currentRoundTypeLabel && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-slate-600 dark:text-slate-400">
                    {currentRoundTypeLabel}
                  </span>
                </div>
              )}
              {currentRound?.configData?.timeLimitMinutes && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-slate-600 dark:text-slate-400">
                    {currentRound.configData.timeLimitMinutes} {t("common.minute")}
                  </span>
                </div>
              )}
            </div>

            {/* Current Round Progress */}
            {currentRound && (
              <div className="mt-2 rounded-md bg-slate-50 px-3 py-1.5 text-xs dark:bg-slate-800/50">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {t("userApplicationhistory.currentRound")}
                </span>{" "}
                <span className="text-slate-500 dark:text-slate-400">{currentRound.name}</span>
                <span className="ml-1.5 text-slate-400">
                  ({application.currentRoundOrder}/{rounds.length})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Score & Action */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200/50 pt-4 md:w-40 md:flex-col md:border-t-0 md:border-l md:pt-0 md:pl-4">
          {hasScore ? (
            <div className="flex flex-col items-center gap-1">
              <ScoreRing score={Math.round(application.overallScore ?? 0)} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("userApplicationhistory.totalScore")}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Clock className="h-6 w-6 text-slate-400" />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("userApplicationhistory.grading")}
              </span>
            </div>
          )}
          <Button
            size="sm"
            onClick={onViewDetails}
            className={cn(
              "w-full gap-1 bg-[#0047AB] hover:bg-[#003d91]",
              !hasScore && "cursor-not-allowed opacity-50"
            )}
            disabled={!hasScore}>
            {t("common.detail")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Stats Card (Glass Design)
// ============================================================

function GlassStatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/50 bg-white/70 p-4 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/70">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", colorClass)}>{value}</p>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

export function ApplicationHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch applications
  const {
    data: applicationsResult = [],
    isLoading: applicationsLoading,
    isError: applicationsError,
    isRefetching: applicationsRefetching,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ["applications", "me"],
    queryFn: async () => {
      const result = await applicationService.getMyApplications();
      if (result.success && Array.isArray(result.data)) {
        return result.data as Application[];
      }
      return [];
    },
  });

  // Fetch all job descriptions for enrichment
  const {
    data: jobDescriptionsResult = [],
    isRefetching: jdRefetching,
    refetch: refetchJobDescriptions,
  } = useQuery({
    queryKey: ["job-descriptions", "all"],
    queryFn: async () => {
      const result = await companyManager.searchJobs({});
      if (result.success && Array.isArray(result.data)) {
        return result.data as JobDescription[];
      }
      return [];
    },
  });

  // Fetch companies for enrichment
  const {
    data: companiesResult = [],
    isRefetching: companiesRefetching,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const result = await companyManager.getAll();
      if (result.success) {
        const data = result.data;
        if (Array.isArray(data)) return data as Company[];
        if (
          data &&
          "content" in data &&
          Array.isArray(
            (
              data as {
                content: unknown[];
              }
            ).content
          )
        ) {
          return (
            data as {
              content: Company[];
            }
          ).content;
        }
      }
      return [];
    },
  });
  const isLoading = applicationsLoading;
  const isRefetching = applicationsRefetching || jdRefetching || companiesRefetching;

  // Enrich applications
  const enrichedApplications = useMemo<EnrichedApplication[]>(() => {
    return applicationsResult.map((app) => {
      // Find job description by jdId
      const jd = jobDescriptionsResult.find((j) => j.id === app.jdId);

      // Try to find company via multiple approaches:
      // 1. From job description's companyId (if exists)
      // 2. From company's jobDescriptions array (reverse lookup)
      let company: Company | undefined;
      if (jd?.companyId) {
        company = companiesResult.find((c) => c.id === jd.companyId);
      }
      if (!company) {
        // Reverse lookup: find company that has this jdId in their jobDescriptions
        company = companiesResult.find((c) =>
          c.jobDescriptions?.some((jdItem) => jdItem.id === app.jdId)
        );
      }
      return {
        ...app,
        jobDescription: jd,
        company,
      };
    });
  }, [applicationsResult, jobDescriptionsResult, companiesResult]);

  // Filter
  const filteredApplications = useMemo(() => {
    let items = enrichedApplications;
    if (statusFilter !== "all") {
      items = items.filter((app) => app.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (app) =>
          app.jobDescription?.title?.toLowerCase().includes(q) ||
          app.company?.name?.toLowerCase().includes(q) ||
          app.jobDescription?.level?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [enrichedApplications, statusFilter, searchQuery]);

  // Stats
  const totalCount = enrichedApplications.length;
  const inProgressCount = enrichedApplications.filter((a) => a.status === "IN_PROGRESS").length;
  const passedCount = enrichedApplications.filter((a) => a.status === "PASSED").length;
  const failedCount = enrichedApplications.filter(
    (a) => a.status === "FAILED" || a.status === "SOFT_FAILED"
  ).length;

  // Pagination
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_user_applicationhistorypage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: filteredApplications.length,
    pageSize,
  });
  const pageData = useMemo(
    () => filteredApplications.slice(pagination.startIndex, pagination.endIndex + 1),
    [filteredApplications, pagination.startIndex, pagination.endIndex]
  );
  const handleViewDetails = (app: EnrichedApplication) => {
    if (app.jdId) {
      navigate(`/enterprise/job/${app.jdId}`);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("common.applicationHistory")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("userApplicationhistory.trackTheStatusOfYour")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={async () => {
              await Promise.all([
                refetchApplications(),
                refetchJobDescriptions(),
                refetchCompanies(),
              ]);
            }}
            isLoading={isRefetching}
            tooltip={t("common.reload")}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <GlassStatCard
          label={t("userApplicationhistory.totalOrder")}
          value={totalCount}
          colorClass="text-slate-900 dark:text-slate-100"
        />
        <GlassStatCard
          label={t("common.processing1")}
          value={inProgressCount}
          colorClass="text-yellow-600 dark:text-yellow-400"
        />
        <GlassStatCard
          label={t("common.obtain")}
          value={passedCount}
          colorClass="text-emerald-600 dark:text-emerald-400"
        />
        <GlassStatCard
          label={t("common.failed")}
          value={failedCount}
          colorClass="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/50 bg-white/70 p-4 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/70">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              pagination.goToFirstPage();
            }}
            className="pl-9"
            placeholder={t("userApplicationhistory.searchByLocationCompany")}
          />
        </div>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as ApplicationStatus | "all");
            pagination.goToFirstPage();
          }}>
          <SelectTrigger className="w-full min-w-[180px]">
            <SelectValue placeholder={t("common.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatus")}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t("common.processing1")}</SelectItem>
            <SelectItem value="PASSED">{t("common.obtain")}</SelectItem>
            <SelectItem value="FAILED">{t("common.failed")}</SelectItem>
            <SelectItem value="SOFT_FAILED">
              {t("userApplicationhistory.needsImprovement")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingCardList count={4} />
      ) : applicationsError ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-4">
          <XCircle className="h-8 w-8 text-red-500" />
          <p className="text-destructive font-medium">
            {t("userApplicationhistory.unableToDownloadApplicationHistory")}
          </p>
          <Button variant="outline" onClick={() => void refetchApplications()}>
            {t("common.retry")}
          </Button>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t("userApplicationhistory.thereAreNoApplicationsYet")}
          description={t("userApplicationhistory.findJobsAndApplyTo")}
          action={
            <Button
              onClick={() => navigate("/enterprise/companies")}
              className="gap-2 bg-[#0047AB] hover:bg-[#003d91]">
              <Briefcase className="h-4 w-4" />
              {t("userApplicationhistory.findAJobNow")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4">
            {pageData.map((app) => (
              <ApplicationCard
                key={`app-${app.id}`}
                application={app}
                onViewDetails={() => handleViewDetails(app)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <PaginationControl
              pagination={pagination}
              onPageSizeChange={(size) => {
                setPageSize(size);
                pagination.goToFirstPage();
              }}
              pageSizeOptions={[5, 10, 20, 30]}
            />
          )}
        </>
      )}
    </div>
  );
}
