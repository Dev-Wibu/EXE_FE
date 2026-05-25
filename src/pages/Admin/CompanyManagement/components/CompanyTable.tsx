import { Edit, Eye, ImageIcon, Power, Search } from "lucide-react";

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
import { formatDate } from "@/lib/formatting";

import type { Company } from "../types";

type CompanySortKey =
  | "idSortValue"
  | "nameSortValue"
  | "statusSortValue"
  | "createdAtSortValue"
  | "updatedAtSortValue";

interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}

interface CompanyTableProps {
  companies: Company[];
  onView: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  getSortProps?: (key: CompanySortKey) => SortProps;
}

const isCompanyActive = (company: Company) =>
  (company.status ?? "ACTIVE").toUpperCase() !== "INACTIVE";

export function CompanyTable({
  companies,
  onView,
  onEdit,
  onDelete,
  getSortProps,
}: CompanyTableProps) {
  if (companies.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">Không tìm thấy công ty nào</p>
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
          <TableHead className="w-20">Logo</TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("nameSortValue")}>Tên công ty</SortButton>
            ) : (
              "Tên công ty"
            )}
          </TableHead>
          <TableHead className="w-28">
            {getSortProps ? (
              <SortButton {...getSortProps("statusSortValue")}>Trạng thái</SortButton>
            ) : (
              "Trạng thái"
            )}
          </TableHead>
          <TableHead className="w-36">
            {getSortProps ? (
              <SortButton {...getSortProps("createdAtSortValue")}>Ngày tạo</SortButton>
            ) : (
              "Ngày tạo"
            )}
          </TableHead>
          <TableHead className="w-36">
            {getSortProps ? (
              <SortButton {...getSortProps("updatedAtSortValue")}>Cập nhật</SortButton>
            ) : (
              "Cập nhật"
            )}
          </TableHead>
          <TableHead className="w-28 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company) => {
          const active = isCompanyActive(company);
          return (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.id}</TableCell>
              <TableCell>
                {company.logoUrl ? (
                  <div className="h-10 w-10 overflow-hidden rounded-full border bg-white">
                    <img
                      src={company.logoUrl}
                      alt={company.name || "Logo"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{company.name || "-"}</TableCell>
              <TableCell>
                <Badge variant={active ? "default" : "destructive"}>
                  {active ? "Hoạt động" : "Ngưng hoạt động"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(company.createdAt)}</TableCell>
              <TableCell>{formatDate(company.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(company)}
                    className="h-8 w-8 p-0 hover:bg-green-50"
                    title="Xem chi tiết">
                    <Eye className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(company)}
                    className="h-8 w-8 p-0 hover:bg-blue-50"
                    title="Chỉnh sửa">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(company)}
                    className={`h-8 w-8 p-0 ${active ? "hover:bg-red-50" : "hover:bg-green-50"}`}
                    title={active ? "Vô hiệu hóa" : "Kích hoạt"}>
                    <Power className={`h-4 w-4 ${active ? "text-red-600" : "text-green-600"}`} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
