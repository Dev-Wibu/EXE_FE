import { Edit, ExternalLink, Power, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { QuestionCategory } from "../types";

interface QuestionCategoryTableProps {
  categories: QuestionCategory[];
  onEdit: (category: QuestionCategory) => void;
  onDelete: (category: QuestionCategory) => void;
}

/**
 * Validate if a string is a valid HTTP/HTTPS URL
 */
function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function QuestionCategoryTable({
  categories,
  onEdit,
  onDelete,
}: QuestionCategoryTableProps) {
  if (categories.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">Không tìm thấy danh mục câu hỏi nào</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Tên danh mục</TableHead>
          <TableHead>Mô tả</TableHead>
          <TableHead>URL Hướng dẫn</TableHead>
          <TableHead className="w-24 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.id}</TableCell>
            <TableCell className="font-medium">{category.categoryName}</TableCell>
            <TableCell className="text-muted-foreground max-w-md truncate">
              {category.description || "-"}
            </TableCell>
            <TableCell>
              {category.urlTutorial && isValidHttpUrl(category.urlTutorial) ? (
                <a
                  href={category.urlTutorial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  Link
                </a>
              ) : category.urlTutorial ? (
                <span className="text-muted-foreground text-xs" title={category.urlTutorial}>
                  URL không hợp lệ
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(category)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title="Chỉnh sửa">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(category)}
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
