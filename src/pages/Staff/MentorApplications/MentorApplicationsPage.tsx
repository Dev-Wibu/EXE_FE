import { CheckCircle, Clock, Search, UserCheck, XCircle } from "lucide-react";
import { useState } from "react";

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

/**
 * Mock data for mentor applications
 * In production, this would come from the mentorManager service
 */
const mockApplications = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    expertise: "React, Node.js",
    yearsOfExperience: 5,
    currentCompany: "FPT Software",
    submittedAt: "2026-01-20",
    status: "pending",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "tranthib@example.com",
    expertise: "Java, Spring Boot",
    yearsOfExperience: 8,
    currentCompany: "VNG",
    submittedAt: "2026-01-19",
    status: "pending",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "levanc@example.com",
    expertise: "Python, Machine Learning",
    yearsOfExperience: 6,
    currentCompany: "VinAI",
    submittedAt: "2026-01-18",
    status: "approved",
  },
];

type ApplicationStatus = "pending" | "approved" | "rejected" | "all";

export function MentorApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>("pending");

  const filteredApplications = mockApplications.filter((app) => {
    // Filter by status
    if (statusFilter !== "all" && app.status !== statusFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(lowerQuery) ||
        app.email.toLowerCase().includes(lowerQuery) ||
        app.expertise.toLowerCase().includes(lowerQuery)
      );
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Chờ duyệt
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            Đã duyệt
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Duyệt Đơn Đăng Ký Mentor
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Xem xét và phê duyệt đơn đăng ký từ các ứng viên mentor mới
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
              placeholder="Tìm kiếm theo tên, email, chuyên môn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ApplicationStatus)}>
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
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 dark:bg-slate-800">
          <UserCheck className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">
            {mockApplications.filter((a) => a.status === "pending").length} đơn chờ duyệt
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Chuyên môn</TableHead>
              <TableHead>Kinh nghiệm</TableHead>
              <TableHead>Công ty</TableHead>
              <TableHead>Ngày nộp</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell>{app.email}</TableCell>
                <TableCell className="max-w-[200px] truncate">{app.expertise}</TableCell>
                <TableCell>{app.yearsOfExperience} năm</TableCell>
                <TableCell>{app.currentCompany}</TableCell>
                <TableCell>{app.submittedAt}</TableCell>
                <TableCell>{getStatusBadge(app.status)}</TableCell>
                <TableCell className="text-right">
                  {app.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Duyệt
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                        <XCircle className="mr-1 h-4 w-4" />
                        Từ chối
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredApplications.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                  Không có đơn đăng ký nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
