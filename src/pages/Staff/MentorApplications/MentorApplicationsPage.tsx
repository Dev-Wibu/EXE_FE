import { CheckCircle, Search, UserCheck, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PaginationControl } from "@/components/shared/PaginationControl";
import { ReloadButton } from "@/components/shared/ReloadButton";
import { SortButton } from "@/components/shared/SortButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import type { Mentor } from "@/interfaces";
import { getMentorApplicationBadge } from "@/lib/status-utils";
import { mentorManager } from "@/services/mentor.manager";

type ApplicationStatus = "pending" | "approved" | "rejected" | "all";

/**
 * Get application status from mentor active field
 * Mentors with active=true are approved, active=false are pending/rejected
 */
const getApplicationStatus = (mentor: Mentor): "pending" | "approved" => {
  return mentor.active ? "approved" : "pending";
};

export function MentorApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>("pending");
  const [pageSize, setPageSize] = useState(10);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const loadMentors = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await mentorManager.getAll();
      if (result.success && result.data) {
        // Handle both array and paginated response
        const mentorsList = Array.isArray(result.data) ? result.data : result.data.data || [];
        setMentors(mentorsList);
      }
    } catch (error) {
      console.error("Failed to load mentors:", error);
      toast.error("Không thể tải danh sách mentor");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load mentors from API
  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  // Filter mentors based on search and status
  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      // Filter by status
      const status = getApplicationStatus(mentor);
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return (
          mentor.name?.toLowerCase().includes(lowerQuery) ||
          mentor.email?.toLowerCase().includes(lowerQuery) ||
          mentor.expertise?.toLowerCase().includes(lowerQuery)
        );
      }

      return true;
    });
  }, [mentors, statusFilter, searchQuery]);

  // Apply sorting
  const { sortedData, getSortProps } = useSortable(filteredMentors);

  // Apply pagination
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  /**
   * Accept mentor application - toggle active status to true
   * Uses GET /api/mentors/toggle/{id} endpoint
   */
  const handleAcceptMentor = async (mentorId: number) => {
    setProcessingIds((prev) => new Set(prev).add(mentorId));
    try {
      const result = await mentorManager.toggleActive(mentorId);
      if (result.success) {
        // Update local state
        setMentors((prev) => prev.map((m) => (m.id === mentorId ? { ...m, active: true } : m)));
        toast.success("Đã duyệt mentor thành công");
      } else {
        toast.error(result.error || "Không thể duyệt mentor");
      }
    } catch (error) {
      console.error("Failed to accept mentor:", error);
      toast.error("Có lỗi xảy ra khi duyệt mentor");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(mentorId);
        return next;
      });
    }
  };

  /**
   * Reject mentor application - toggle active status to false
   * Uses GET /api/mentors/toggle/{id} endpoint
   */
  const handleRejectMentor = async (mentorId: number) => {
    setProcessingIds((prev) => new Set(prev).add(mentorId));
    try {
      const result = await mentorManager.toggleActive(mentorId);
      if (result.success) {
        // Update local state
        setMentors((prev) => prev.map((m) => (m.id === mentorId ? { ...m, active: false } : m)));
        toast.success("Đã từ chối mentor");
      } else {
        toast.error(result.error || "Không thể từ chối mentor");
      }
    } catch (error) {
      console.error("Failed to reject mentor:", error);
      toast.error("Có lỗi xảy ra khi từ chối mentor");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(mentorId);
        return next;
      });
    }
  };

  const pendingCount = mentors.filter((m) => !m.active).length;

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
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={loadMentors}
            isLoading={isLoading}
            tooltip="Tải lại danh sách đăng ký mentor"
          />
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 dark:bg-slate-800">
            <UserCheck className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">{pendingCount} đơn chờ duyệt</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton {...getSortProps("name")}>Họ tên</SortButton>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Chuyên môn</TableHead>
              <TableHead>
                <SortButton {...getSortProps("yearsOfExperience")}>Kinh nghiệm</SortButton>
              </TableHead>
              <TableHead>Công ty</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <div className="flex items-center justify-center text-gray-500">
                    <Spinner size="md" />
                  </div>
                </TableCell>
              </TableRow>
            ) : pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                  Không có đơn đăng ký nào
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((mentor) => {
                const mentorId = mentor.id;
                // Skip rendering if mentor has no ID
                if (mentorId === undefined || mentorId === null) {
                  return null;
                }
                const isProcessing = processingIds.has(mentorId);
                const status = getApplicationStatus(mentor);
                return (
                  <TableRow key={mentorId}>
                    <TableCell className="font-medium">{mentor.name}</TableCell>
                    <TableCell>{mentor.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{mentor.expertise}</TableCell>
                    <TableCell>{mentor.yearsOfExperience} năm</TableCell>
                    <TableCell>{mentor.currentCompany}</TableCell>
                    <TableCell>
                      <StatusBadge {...getMentorApplicationBadge(!!mentor.active)} />
                    </TableCell>
                    <TableCell className="text-right">
                      {status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:bg-green-50"
                            disabled={isProcessing}
                            onClick={() => handleAcceptMentor(mentorId)}>
                            {isProcessing ? (
                              <Spinner size="sm" className="mr-1" />
                            ) : (
                              <CheckCircle className="mr-1 h-4 w-4" />
                            )}
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            disabled={isProcessing}
                            onClick={() => handleRejectMentor(mentorId)}>
                            {isProcessing ? (
                              <Spinner size="sm" className="mr-1" />
                            ) : (
                              <XCircle className="mr-1 h-4 w-4" />
                            )}
                            Từ chối
                          </Button>
                        </div>
                      )}
                      {status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 hover:bg-orange-50"
                          disabled={isProcessing}
                          onClick={() => handleRejectMentor(mentorId)}>
                          {isProcessing ? (
                            <Spinner size="sm" className="mr-1" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4" />
                          )}
                          Vô hiệu hóa
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!isLoading && pageData.length > 0 && (
          <div className="border-t p-2">
            <PaginationControl
              pagination={pagination}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
