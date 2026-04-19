import { Edit, Search, Trash2 } from "lucide-react";

import { SortButton, type SortDirection } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Major } from "../types";

type QuestionMajorSortKey = "idSortValue" | "nameSortValue" | "descriptionSortValue";

interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}

interface QuestionMajorTableProps {
  majors: Major[];
  onEdit: (major: Major) => void;
  onDelete: (major: Major) => void;
  getSortProps?: (key: QuestionMajorSortKey) => SortProps;
}

export function QuestionMajorTable({
  majors,
  onEdit,
  onDelete,
  getSortProps,
}: QuestionMajorTableProps) {
  if (majors.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">Không tìm thấy chuyên ngành nào</p>
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
              <SortButton {...getSortProps("nameSortValue")}>Tên Chuyên Ngành</SortButton>
            ) : (
              "Tên Chuyên Ngành"
            )}
          </TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("descriptionSortValue")}>Mô Tả</SortButton>
            ) : (
              "Mô Tả"
            )}
          </TableHead>
          <TableHead className="w-24 text-right">Thao Tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {majors.map((major) => (
          <TableRow key={major.id}>
            <TableCell className="font-medium">{major.id}</TableCell>
            <TableCell className="font-medium">{major.majorName}</TableCell>
            <TableCell className="text-muted-foreground max-w-md truncate">
              {major.description || "-"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(major)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title="Chỉnh sửa">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(major)}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  title="Xóa">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
