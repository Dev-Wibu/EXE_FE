import { Edit, Power, Search } from "lucide-react";

import { SortButton, type SortDirection } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
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

import type { JobDescription, JobDescriptionLevel, JobDescriptionStatus } from "../types";

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
  getSortProps?: (key: JobDescriptionSortKey) => SortProps;
}

const getLevelBadgeClass = (level?: JobDescriptionLevel): string => {
  switch (level) {
    case "INTERN":
      return "bg-gray-500 hover:bg-gray-500";
    case "FRESHER":
      return "bg-green-500 hover:bg-green-500";
    case "JUNIOR":
      return "bg-blue-500 hover:bg-blue-500";
    case "MIDDLE":
      return "bg-purple-600 hover:bg-purple-600";
    default:
      return "bg-gray-400 hover:bg-gray-400";
  }
};

const getStatusBadgeClass = (status?: JobDescriptionStatus): string => {
  switch (status) {
    case "OPEN":
      return "bg-emerald-600 hover:bg-emerald-600";
    case "CLOSED":
      return "bg-red-600 hover:bg-red-600";
    case "DRAFT":
      return "bg-amber-500 hover:bg-amber-500";
    default:
      return "bg-gray-400 hover:bg-gray-400";
  }
};

const getStatusLabel = (status?: JobDescriptionStatus) => {
  switch (status) {
    case "OPEN":
      return "Đang mở";
    case "CLOSED":
      return "Đã đóng";
    case "DRAFT":
      return "Nháp";
    default:
      return status || "-";
  }
};

const formatSalaryRange = (salaryMin?: number, salaryMax?: number, currency?: string): string => {
  if (salaryMin == null && salaryMax == null) {
    return "-";
  }

  const currencyNote = currency && currency.toUpperCase() !== "VND" ? ` (${currency})` : "";

  if (salaryMin != null && salaryMax != null) {
    return `${formatCurrency(salaryMin)} - ${formatCurrency(salaryMax)}${currencyNote}`;
  }

  if (salaryMin != null) {
    return `Từ ${formatCurrency(salaryMin)}${currencyNote}`;
  }

  return `Đến ${formatCurrency(salaryMax ?? 0)}${currencyNote}`;
};

export function JobDescriptionTable({
  jobDescriptions,
  onEdit,
  onDelete,
  getSortProps,
}: JobDescriptionTableProps) {
  if (jobDescriptions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">Chưa có JD nào</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">
            {getSortProps ? <SortButton {...getSortProps("idSortValue")}>ID</SortButton> : "ID"}
          </TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("titleSortValue")}>Tiêu đề</SortButton>
            ) : (
              "Tiêu đề"
            )}
          </TableHead>
          <TableHead className="w-24">
            {getSortProps ? (
              <SortButton {...getSortProps("levelSortValue")}>Cấp độ</SortButton>
            ) : (
              "Cấp độ"
            )}
          </TableHead>
          <TableHead className="w-28">
            {getSortProps ? (
              <SortButton {...getSortProps("statusSortValue")}>Trạng thái</SortButton>
            ) : (
              "Trạng thái"
            )}
          </TableHead>
          <TableHead className="w-48">
            {getSortProps ? (
              <SortButton {...getSortProps("salaryMinSortValue")}>Lương</SortButton>
            ) : (
              "Lương"
            )}
          </TableHead>
          <TableHead className="w-32">
            {getSortProps ? (
              <SortButton {...getSortProps("deadlineSortValue")}>Hạn nộp</SortButton>
            ) : (
              "Hạn nộp"
            )}
          </TableHead>
          <TableHead className="w-32">
            {getSortProps ? (
              <SortButton {...getSortProps("updatedAtSortValue")}>Cập nhật</SortButton>
            ) : (
              "Cập nhật"
            )}
          </TableHead>
          <TableHead className="w-24 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobDescriptions.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium">{job.id}</TableCell>
            <TableCell className="font-medium">{job.title || "-"}</TableCell>
            <TableCell>
              {job.level ? (
                <Badge variant="default" className={`text-white ${getLevelBadgeClass(job.level)}`}>
                  {job.level}
                </Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              <Badge variant="default" className={`text-white ${getStatusBadgeClass(job.status)}`}>
                {getStatusLabel(job.status)}
              </Badge>
            </TableCell>
            <TableCell>
              {formatSalaryRange(
                job.salaryMin ?? undefined,
                job.salaryMax ?? undefined,
                job.currency
              )}
            </TableCell>
            <TableCell>{formatDate(job.deadlineAt)}</TableCell>
            <TableCell>{formatDate(job.updatedAt)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(job)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title="Chỉnh sửa">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(job)}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  title="Đóng JD">
                  <Power className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
