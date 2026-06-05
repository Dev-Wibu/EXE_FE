import { SortButton, type SortDirection } from "@/components/shared";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { getJobDescriptionLevelBadge, getJobDescriptionStatusBadge } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import { Edit, Eye, Power, Search } from "lucide-react";
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
  onView?: (job: JobDescription) => void;
  getSortProps?: (key: JobDescriptionSortKey) => SortProps;
}
export function JobDescriptionTable({
  jobDescriptions,
  onEdit,
  onDelete,
  onView,
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
    <Table className="min-w-[980px] table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">
            {getSortProps ? (
              <SortButton {...getSortProps("idSortValue")}>{t("common.id")}</SortButton>
            ) : (
              t("common.id")
            )}
          </TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("titleSortValue")}>{t("common.title")}</SortButton>
            ) : (
              t("common.title")
            )}
          </TableHead>
          <TableHead className="w-24">
            {getSortProps ? (
              <SortButton {...getSortProps("levelSortValue")}>{t("common.level")}</SortButton>
            ) : (
              t("common.level")
            )}
          </TableHead>
          <TableHead className="w-28">
            {getSortProps ? (
              <SortButton {...getSortProps("statusSortValue")}>{t("common.status")}</SortButton>
            ) : (
              t("common.status")
            )}
          </TableHead>
          <TableHead className="w-52">
            {getSortProps ? (
              <SortButton {...getSortProps("salaryMinSortValue")}>
                {t("adminCompanymanagement.wage")}
              </SortButton>
            ) : (
              t("adminCompanymanagement.wage")
            )}
          </TableHead>
          <TableHead className="w-28">
            {getSortProps ? (
              <SortButton {...getSortProps("deadlineSortValue")}>
                {t("common.submissionDeadline")}
              </SortButton>
            ) : (
              t("common.submissionDeadline")
            )}
          </TableHead>
          <TableHead className="w-28">
            {getSortProps ? (
              <SortButton {...getSortProps("updatedAtSortValue")}>{t("general.update")}</SortButton>
            ) : (
              t("general.update")
            )}
          </TableHead>
          <TableHead className="w-28 text-right">{t("common.operation")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobDescriptions.map((job) => (
          <TableRow
            key={job.id}
            className={cn(onView && "hover:bg-muted/50 cursor-pointer transition-colors")}
            onClick={() => onView?.(job)}>
            <TableCell className="text-muted-foreground font-medium">{job.id}</TableCell>
            <TableCell className="text-foreground truncate font-semibold">
              {job.title || "—"}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              {job.level ? <StatusBadge {...getJobDescriptionLevelBadge(job.level)} /> : "—"}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <StatusBadge {...getJobDescriptionStatusBadge(job.status)} />
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDate(job.deadlineAt)}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDate(job.updatedAt)}
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end gap-1">
                {onView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(job)}
                    className="h-8 w-8 p-0 hover:bg-sky-50 dark:hover:bg-sky-950"
                    title={t("common.seeDetails")}>
                    <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(job)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950"
                  title={t("general.edit")}>
                  <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(job)}
                  className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950"
                  title={t("adminCompanymanagement.closeJd")}>
                  <Power className="h-4 w-4 text-red-600 dark:text-red-400" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
