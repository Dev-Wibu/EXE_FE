import { PaginationControl, ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Company, JobDescription, Round } from "@/services/company.manager";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Check, Lock, Search, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// ============================================================
// Types
// ============================================================

type ApplicationStatus = "IN_PROGRESS" | "PASSED" | "FAILED" | "SOFT_FAILED";

interface EnrichedApplication extends Application {
  jobDescription?: JobDescription;
  company?: Company;
}

// ============================================================
// Status Badge
// ============================================================

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation();
  const config: Record<ApplicationStatus, { label: string; className: string }> = {
    IN_PROGRESS: {
      label: t("userApplicationhistory.statusInterviewing"),
      className: "bg-blue-100 text-blue-700",
    },
    PASSED: {
      label: t("userApplicationhistory.statusCompleted"),
      className: "bg-slate-200 text-slate-600",
    },
    FAILED: {
      label: t("userApplicationhistory.statusRejected"),
      className: "bg-red-100 text-red-700",
    },
    SOFT_FAILED: {
      label: t("userApplicationhistory.needsImprovement"),
      className: "bg-amber-100 text-amber-700",
    },
  };
  const { label, className } = config[status] ?? {
    label: status,
    className: "",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}>
      {label}
    </span>
  );
}

// ============================================================
// Application Card
// ============================================================

function ApplicationCard({
  application,
  isSelected,
  onClick,
}: {
  application: EnrichedApplication;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const jd = application.jobDescription;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "border-[#0047AB] bg-[#0047AB]/5 ring-2 ring-[#0047AB]/20"
      )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              {application.company?.logoUrl ? (
                <img
                  src={application.company.logoUrl}
                  alt={application.company.name}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <Briefcase className="h-5 w-5 text-[#0047AB]" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-sm">
                {jd?.title ?? t("userApplicationhistory.noTitle")}
              </CardTitle>
              <CardDescription className="truncate">
                {application.company?.name ?? t("userApplicationhistory.company")}
              </CardDescription>
            </div>
          </div>
          <StatusBadge status={application.status as ApplicationStatus} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-500">
            {application.createdAt ? formatDateTime(application.createdAt) : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Timeline Item
// ============================================================

function TimelineItem({
  round,
  index,
  totalRounds,
  isCompleted,
  isCurrent,
  isLocked,
  score,
  onEnterRoom,
}: {
  round?: Round;
  index: number;
  totalRounds: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  score?: number;
  onEnterRoom?: () => void;
}) {
  const { t } = useTranslation();
  const roundName = round?.name ?? `${t("userApplicationhistory.round")} ${index + 1}`;
  const description = round?.configData?.instruction || "";

  if (isLocked) {
    return (
      <div className="flex gap-4">
        {/* Connector */}
        <div className="flex flex-col items-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white dark:bg-slate-800">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
          </div>
          {index < totalRounds - 1 && (
            <div className="mt-2 w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
          )}
        </div>
        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <h4 className="text-sm font-medium text-slate-400">
              {t("userApplicationhistory.nextRound")}
            </h4>
            <p className="mt-1 text-xs text-slate-300 dark:text-slate-600">
              {t("userApplicationhistory.roundInfoLocked")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Connector */}
      <div className="flex flex-col items-center">
        {isCompleted ? (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0047AB] ring-4 ring-[#0047AB]/20">
              <Check className="h-4 w-4 text-white" />
            </div>
            {index < totalRounds - 1 && (
              <div className="mt-2 w-0.5 flex-1 bg-[#0047AB]/30 dark:bg-[#0047AB]/40" />
            )}
          </>
        ) : isCurrent ? (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#0047AB] bg-white shadow-sm dark:bg-slate-800">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#0047AB]" />
            </div>
            {index < totalRounds - 1 && (
              <div className="mt-2 w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
            )}
          </>
        ) : (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-xs font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
              {index + 1}
            </div>
            {index < totalRounds - 1 && (
              <div className="mt-2 w-0.5 flex-1 bg-slate-100 dark:bg-slate-800" />
            )}
          </>
        )}
      </div>

      {/* Content Card */}
      <div className="flex-1 pb-8">
        <div
          className={cn(
            "rounded-lg border p-4 transition-all",
            isCompleted &&
              "border-[#0047AB]/20 bg-[#0047AB]/5 dark:border-[#0047AB]/40 dark:bg-[#0047AB]/10",
            isCurrent &&
              "border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800",
            !isCompleted &&
              !isCurrent &&
              "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          )}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* Left */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {roundName}
                </h4>
                {isCurrent && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {t("userApplicationhistory.current")}
                  </span>
                )}
              </div>
              {description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-4">
              {isCompleted && score !== undefined && (
                <div className="text-right">
                  <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    {t("userApplicationhistory.result")}
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-[#0047AB]">
                    {score}
                    <span className="text-sm font-normal text-slate-400">/100</span>
                  </p>
                </div>
              )}
              {isCurrent && (
                <div className="text-right">
                  <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    {t("userApplicationhistory.status")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t("userApplicationhistory.noResultYet")}
                  </p>
                </div>
              )}
              {isCurrent ? (
                <Button
                  onClick={onEnterRoom}
                  size="sm"
                  className="shrink-0 bg-[#0047AB] text-white hover:bg-[#003d91]">
                  {t("userApplicationhistory.enterRoom")}
                </Button>
              ) : isCompleted ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-[#0047AB] text-[#0047AB] hover:bg-[#0047AB]/5">
                  {t("userApplicationhistory.viewDetails")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Application Detail Panel
// ============================================================

function ApplicationDetail({
  application,
  onEnterRoom,
}: {
  application: EnrichedApplication;
  onEnterRoom?: () => void;
}) {
  const { t } = useTranslation();
  const jd = application.jobDescription;
  const rounds = jd?.rounds ?? [];
  const currentRoundOrder = application.currentRoundOrder ?? 0;

  return (
    <>
      {/* Header Card */}
      <Card className="mb-4 overflow-hidden border-0 bg-gradient-to-r from-[#0047AB] via-[#005B9A] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-200">
              {application.company?.logoUrl ? (
                <img
                  src={application.company.logoUrl}
                  alt={application.company.name}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <Briefcase className="h-7 w-7 text-[#0047AB]" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {jd?.title ?? t("userApplicationhistory.noTitle")}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-white/80">
                {application.company?.name ?? t("userApplicationhistory.company")}
                {jd?.companyName && ` · ${jd.companyName}`}
              </p>
            </div>
          </div>
          <div className="hidden text-right text-white sm:block">
            <p className="text-xs font-medium tracking-wide text-white/70 uppercase">
              {t("userApplicationhistory.overallProgress")}
            </p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <div className="h-2 w-24 rounded-full bg-white/30">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{
                    width: `${(currentRoundOrder / Math.max(rounds.length, 1)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-bold">
                {currentRoundOrder}/{rounds.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t("userApplicationhistory.interviewPipeline")}
          </CardTitle>
          <CardDescription>{t("userApplicationhistory.pageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {rounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Briefcase className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("userApplicationhistory.noRoundsAvailable")}
              </p>
            </div>
          ) : (
            rounds.map((round, index) => {
              const isCompleted = index < currentRoundOrder;
              const isCurrent =
                index === currentRoundOrder - 1 || (currentRoundOrder === 0 && index === 0);
              const isLocked = index > currentRoundOrder;
              return (
                <TimelineItem
                  key={round.id ?? index}
                  round={round}
                  index={index}
                  totalRounds={rounds.length}
                  isCompleted={isCompleted}
                  isCurrent={isCurrent}
                  isLocked={isLocked}
                  score={isCompleted ? application.overallScore : undefined}
                  onEnterRoom={isCurrent ? onEnterRoom : undefined}
                />
              );
            })
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ============================================================
// Main Page
// ============================================================

export function ApplicationHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

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
      const jd = jobDescriptionsResult.find((j) => j.id === app.jdId);
      let company: Company | undefined;
      if (jd?.companyId) {
        company = companiesResult.find((c) => c.id === jd.companyId);
      }
      if (!company) {
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

  // Auto-select first application
  const selectedApplication = useMemo(() => {
    if (selectedAppId) {
      return (
        filteredApplications.find((app) => app.id === selectedAppId) ?? filteredApplications[0]
      );
    }
    return filteredApplications[0] ?? null;
  }, [filteredApplications, selectedAppId]);

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

  const handleEnterRoom = () => {
    if (selectedApplication?.jdId) {
      navigate(`/enterprise/job/${selectedApplication.jdId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("userApplicationhistory.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("userApplicationhistory.pageDescription")}
          </p>
        </div>
        <ReloadButton
          onReload={async () => {
            await Promise.all([
              refetchApplications(),
              refetchJobDescriptions(),
              refetchCompanies(),
            ]);
          }}
          isLoading={isRefetching}
          tooltip={t("userApplicationhistory.reload")}
        />
      </div>

      {/* Controls Card */}
      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
          {/* Search */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              placeholder={t("userApplicationhistory.searchPlaceholder")}
            />
          </div>

          {/* Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ApplicationStatus | "all")}>
            <SelectTrigger className="w-full min-w-[200px]">
              <SelectValue placeholder={t("userApplicationhistory.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("userApplicationhistory.allStatus")}</SelectItem>
              <SelectItem value="IN_PROGRESS">
                {t("userApplicationhistory.statusInterviewing")}
              </SelectItem>
              <SelectItem value="PASSED">{t("userApplicationhistory.statusCompleted")}</SelectItem>
              <SelectItem value="FAILED">{t("userApplicationhistory.statusRejected")}</SelectItem>
              <SelectItem value="SOFT_FAILED">
                {t("userApplicationhistory.needsImprovement")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left: Application List */}
        <div className="lg:col-span-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("userApplicationhistory.applications")} ({filteredApplications.length})
            </span>
          </div>

          <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {isLoading ? (
              <LoadingCardList count={4} />
            ) : applicationsError ? (
              <Card className="flex h-48 flex-col items-center justify-center gap-4 p-6">
                <XCircle className="h-8 w-8 text-red-500" />
                <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">
                  {t("userApplicationhistory.unableToDownload")}
                </p>
                <Button variant="outline" size="sm" onClick={() => void refetchApplications()}>
                  {t("userApplicationhistory.retry")}
                </Button>
              </Card>
            ) : pageData.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title={t("userApplicationhistory.noApplicationsYet")}
                description={t("userApplicationhistory.findJobsDescription")}
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
              <div className="grid gap-3">
                {pageData.map((app) => (
                  <ApplicationCard
                    key={`app-${app.id}`}
                    application={app}
                    isSelected={selectedApplication?.id === app.id}
                    onClick={() => setSelectedAppId(app.id ?? null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination — inside scrollable area */}
          {filteredApplications.length > pageSize && (
            <div className="mt-4 bg-white/80 dark:bg-slate-950/80">
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  pagination.goToFirstPage();
                }}
                pageSizeOptions={[5, 10, 20, 30]}
              />
            </div>
          )}
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-8">
          {selectedApplication ? (
            <ApplicationDetail application={selectedApplication} onEnterRoom={handleEnterRoom} />
          ) : (
            <Card className="flex h-96 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Briefcase className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("userApplicationhistory.selectApplication")}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
