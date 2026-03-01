import { CheckCircle, Eye, Search, XCircle } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getContentStatusBadge } from "@/lib/status-utils";

/**
 * Mock data for content moderation
 * Staff reviews questions and content before publishing
 */
const mockContent = [
  {
    id: 1,
    type: "question",
    title: "Giải thích sự khác biệt giữa React và Vue",
    author: "Nguyễn Mentor A",
    category: "Frontend",
    status: "pending",
    createdAt: "2026-01-23 07:00",
  },
  {
    id: 2,
    type: "question",
    title: "Thiết kế database cho hệ thống e-commerce",
    author: "Trần Expert B",
    category: "System Design",
    status: "pending",
    createdAt: "2026-01-22 18:30",
  },
  {
    id: 3,
    type: "question",
    title: "Các câu hỏi về thuật toán sắp xếp",
    author: "Lê Mentor C",
    category: "Algorithms",
    status: "approved",
    createdAt: "2026-01-22 10:00",
  },
  {
    id: 4,
    type: "question",
    title: "Nội dung không phù hợp - đã từ chối",
    author: "Unknown",
    category: "General",
    status: "rejected",
    createdAt: "2026-01-21 15:00",
  },
];

type ContentStatus = "pending" | "approved" | "rejected" | "all";

export function ContentModerationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatus>("pending");

  const filteredContent = mockContent.filter((content) => {
    // Filter by status
    if (statusFilter !== "all" && content.status !== statusFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        content.title.toLowerCase().includes(lowerQuery) ||
        content.author.toLowerCase().includes(lowerQuery) ||
        content.category.toLowerCase().includes(lowerQuery)
      );
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Kiểm Duyệt Nội Dung
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Xem xét và phê duyệt câu hỏi, nội dung trước khi xuất bản
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative w-96">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, tác giả, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ContentStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2 dark:bg-yellow-900/30">
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
            {mockContent.filter((c) => c.status === "pending").length} nội dung chờ duyệt
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContent.map((content) => (
              <TableRow key={content.id}>
                <TableCell>
                  <Badge variant="outline">📝 Câu hỏi</Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate font-medium">
                  {content.title}
                </TableCell>
                <TableCell>{content.author}</TableCell>
                <TableCell>{content.category}</TableCell>
                <TableCell>{content.createdAt}</TableCell>
                <TableCell>
                  <StatusBadge {...getContentStatusBadge(content.status)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {content.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:bg-green-50 hover:text-green-700">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredContent.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                  Không có nội dung nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
