import { SortButton, type SortDirection } from "@/components/shared";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { getJobDescriptionLevelBadge, getJobDescriptionStatusBadge } from "@/lib/status-utils";
import { Calendar, Coins, Edit, Power, Search, Workflow } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { JobDescription } from "../types";

type JobDescriptionSortKey =
  | "idSortValue"
  | "titleSortValue"
  | "levelSortValue"
  | "statusSortValue"
  | "salaryMinSortValue"
  | "deadlineSortValue"
  | "updatedAtSortValue";

interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}

interface JobDescriptionTableProps {
  jobDescriptions: JobDescription[];
  onEdit: (job: JobDescription) => void;
  onDelete: (job: JobDescription) => void;
  onToggleStatus?: (job: JobDescription, nextStatus: "OPEN" | "CLOSED") => void;
  onView?: (job: JobDescription) => void;
  onConfigureRounds?: (job: JobDescription) => void;
  getSortProps?: (key: JobDescriptionSortKey) => SortProps;
}

export function JobDescriptionTable({
  jobDescriptions,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  onConfigureRounds,
  getSortProps,
}: JobDescriptionTableProps) {
  const { t } = useTranslation();

  const formatSalaryRange = (
    salaryMin?: number | null,
    salaryMax?: number | null,
    currency?: string | null
  ): string => {
    if (salaryMin == null && salaryMax == null) return t("common.agree");
    const currencyNote = currency && currency.toUpperCase() !== "VND" ? ` (${currency})` : "";
    if (salaryMin != null && salaryMax != null) {
      return `${formatCurrency(salaryMin)} - ${formatCurrency(salaryMax)}${currencyNote}`;
    }
    if (salaryMin != null)
      return t("general.from2", {
        var_0: formatCurrency(salaryMin),
        var_1: currencyNote,
      });
    return t("general.to2", {
      var_0: formatCurrency(salaryMax ?? 0),
      var_1: currencyNote,
    });
  };

  if (jobDescriptions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="text-muted-foreground/40 h-12 w-12" />
        <p className="text-muted-foreground text-lg">{t("adminCompanymanagement.noJdYet")}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      {/* Modern Sorting Controls */}
      {getSortProps && (
        <div className="border-border/50 bg-muted/20 flex flex-wrap items-center gap-2 border-b px-6 py-2.5 text-xs">
          <span className="text-muted-foreground mr-2 text-[10px] font-semibold tracking-wider uppercase">
            {t("adminCompanymanagement.sortBy")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <SortButton {...getSortProps("idSortValue")}>{t("common.id")}</SortButton>
            <SortButton {...getSortProps("titleSortValue")}>{t("common.title")}</SortButton>
            <SortButton {...getSortProps("levelSortValue")}>{t("common.level")}</SortButton>
            <SortButton {...getSortProps("statusSortValue")}>{t("common.status")}</SortButton>
            <SortButton {...getSortProps("salaryMinSortValue")}>
              {t("adminCompanymanagement.wage")}
            </SortButton>
            <SortButton {...getSortProps("updatedAtSortValue")}>{t("general.update")}</SortButton>
          </div>
        </div>
      )}

      {/* Compact Cards Grid */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        {jobDescriptions.map((job) => (
          <div
            key={job.id}
            onClick={() => onView?.(job)}
            className="group border-border/50 bg-card/30 hover:border-primary/30 hover:bg-card/60 flex cursor-pointer flex-col justify-between gap-3 rounded-xl border p-4 shadow-sm transition-all duration-300 hover:shadow-md">
            {/* Top Row: Title, ID & Actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/60 shrink-0 font-mono text-[10px] font-semibold">
                    #{job.id}
                  </span>
                  <h4 className="text-foreground group-hover:text-primary truncate text-sm leading-snug font-bold transition-colors">
                    {job.title || "—"}
                  </h4>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                  {job.level ? <StatusBadge {...getJobDescriptionLevelBadge(job.level)} /> : "—"}
                  <StatusBadge {...getJobDescriptionStatusBadge(job.status)} />
                </div>
              </div>

              {/* Compact Actions Group */}
              <div
                className="flex shrink-0 items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}>
                {onConfigureRounds && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onConfigureRounds(job)}
                    className="h-7 w-7 rounded-lg text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
                    title={t("adminCompanymanagement.configureRecruitmentProcess")}>
                    <Workflow className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(job)}
                  className="h-7 w-7 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                  title={t("general.edit")}>
                  <Edit className="h-4 w-4" />
                </Button>
                {job.status === "OPEN" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(job)}
                    className="h-7 w-7 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    title={t("adminCompanymanagement.closeJd")}>
                    <Power className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus && onToggleStatus(job, "OPEN")}
                    className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                    title={t("adminCompanymanagement.openJd", t("recruitment.openRecruitment"))}>
                    <Power className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom Row: Salary & Deadline */}
            <div className="border-border/20 flex items-center justify-between gap-2 border-t pt-2.5 text-xs">
              {/* Salary */}
              <div className="text-muted-foreground flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 shrink-0 text-green-500/80" />
                <span className="text-foreground font-semibold">
                  {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                </span>
              </div>

              {/* Deadline */}
              <div className="text-muted-foreground/80 flex shrink-0 items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span>
                  {t("adminCompanymanagement.deadline")} {formatDate(job.deadlineAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
