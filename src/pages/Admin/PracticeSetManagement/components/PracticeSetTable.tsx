import { Edit, Eye, Power, Search } from "lucide-react";

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

import type { PracticeSet, PracticeSetLevel } from "../types";

interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}

interface PracticeSetTableProps {
  practiceSets: PracticeSet[];
  onEdit: (practiceSet: PracticeSet) => void;
  onDelete: (practiceSet: PracticeSet) => void;
  onViewItems: (practiceSet: PracticeSet) => void;
  getSortProps?: (key: keyof PracticeSet) => SortProps;
}

const getLevelBadgeClass = (level?: PracticeSetLevel): string => {
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

export function PracticeSetTable({
  practiceSets,
  onEdit,
  onDelete,
  onViewItems,
  getSortProps,
}: PracticeSetTableProps) {
  if (practiceSets.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">Không tìm thấy bộ câu hỏi nào</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("practiceSetName")}>Tên</SortButton>
            ) : (
              "Tên"
            )}
          </TableHead>
          <TableHead>Mục tiêu</TableHead>
          <TableHead className="w-24">
            {getSortProps ? <SortButton {...getSortProps("level")}>Cấp độ</SortButton> : "Cấp độ"}
          </TableHead>
          <TableHead>Chuyên ngành</TableHead>
          <TableHead className="w-24 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {practiceSets.map((ps) => (
          <TableRow key={ps.id}>
            <TableCell className="font-medium">{ps.id}</TableCell>
            <TableCell className="font-medium">{ps.practiceSetName}</TableCell>
            <TableCell className="text-muted-foreground max-w-xs truncate">
              {ps.objective || "-"}
            </TableCell>
            <TableCell>
              {ps.level && (
                <Badge variant="default" className={`text-white ${getLevelBadgeClass(ps.level)}`}>
                  {ps.level}
                </Badge>
              )}
            </TableCell>
            <TableCell>{ps.major?.majorName || "-"}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewItems(ps)}
                  className="h-8 w-8 p-0 hover:bg-green-50"
                  title="Xem câu hỏi">
                  <Eye className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(ps)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title="Chỉnh sửa">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(ps)}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  title="Xóa">
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
