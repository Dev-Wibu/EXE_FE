import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PaginationControl, ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerBlock } from "@/components/ui/spinner";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { sessionManager } from "@/services";
import { toast } from "sonner";

import {
  CancelSessionDialog,
  SessionFormDialog,
  SessionTable,
  ViewSessionDialog,
} from "./components";
import type { Session, SessionFormData } from "./types";

export function SessionManagementPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState<Partial<SessionFormData>>({});

  // Load sessions using the session manager service
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sessionManager.getAll();
      if (response.success && response.data) {
        // Handle both paginated and array responses
        const sessionData = Array.isArray(response.data) ? response.data : response.data.data;
        setSessions(sessionData as Session[]);
      } else {
        toast.error(response.error || "Không thể tải danh sách buổi học");
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Không thể tải danh sách buổi học");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Filter sessions based on search query and status filter
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Filter by search query
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
          session.id?.toString().includes(lowerQuery) ||
          session.userId?.toString().includes(lowerQuery) ||
          session.userId2?.toString().includes(lowerQuery) ||
          session.roomUrl?.toLowerCase().includes(lowerQuery) ||
          session.transactionCode?.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }

      // Filter by status
      if (statusFilter !== "all" && session.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [sessions, searchQuery, statusFilter]);

  // Sorting
  const { sortedData, getSortProps } = useSortable(filteredSessions);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);

  const handleCreate = () => {
    setFormData({
      status: "SCHEDULED",
      start_video_off: true,
      start_audio_off: true,
      duration: undefined,
      totalPrice: undefined,
      transactionCode: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleView = (session: Session) => {
    setSelectedSession(session);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setFormData({
      userId: session.userId,
      userId2: session.userId2,
      status: session.status,
      joinTime: session.joinTime,
      duration: session.duration,
      totalPrice: session.totalPrice,
      transactionCode: session.transactionCode,
      start_video_off: true,
      start_audio_off: true,
    });
    setIsEditDialogOpen(true);
  };

  const handleCancel = (session: Session) => {
    setSelectedSession(session);
    setIsCancelDialogOpen(true);
  };

  const handleApprove = async (session: Session) => {
    if (!session.id) return;
    try {
      const response = await sessionManager.updateStatus(session.id, true);
      if (response.success) {
        toast.success("Đã duyệt phiên phỏng vấn");
        loadSessions();
      } else {
        toast.error(response.error || "Không thể duyệt phiên");
      }
    } catch (error) {
      console.error("Error approving session:", error);
      toast.error("Không thể duyệt phiên");
    }
  };

  const handleReject = async (session: Session) => {
    if (!session.id) return;
    try {
      const response = await sessionManager.updateStatus(session.id, false);
      if (response.success) {
        toast.success("Đã từ chối phiên phỏng vấn");
        loadSessions();
      } else {
        toast.error(response.error || "Không thể từ chối phiên");
      }
    } catch (error) {
      console.error("Error rejecting session:", error);
      toast.error("Không thể từ chối phiên");
    }
  };

  const handleSubmitCreate = async () => {
    try {
      const response = await sessionManager.create(formData);
      if (response.success) {
        toast.success("Đã tạo buổi học thành công");
        setIsCreateDialogOpen(false);
        loadSessions(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể tạo buổi học");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Không thể tạo buổi học");
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedSession?.id) return;

    try {
      // Merge full session data with form changes to prevent PUT from nulling fields
      const mergedData: Partial<Session> = {
        ...selectedSession,
        userId: formData.userId,
        userId2: formData.userId2,
        status: formData.status,
        joinTime: formData.joinTime,
        duration: formData.duration,
        totalPrice: formData.totalPrice,
        transactionCode: formData.transactionCode,
      };
      const response = await sessionManager.update(selectedSession.id, mergedData);
      if (response.success) {
        toast.success("Đã cập nhật buổi học thành công");
        setIsEditDialogOpen(false);
        loadSessions(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể cập nhật buổi học");
      }
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Không thể cập nhật buổi học");
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedSession?.id) return;

    try {
      // Use update with full session data + CANCELED status to prevent PUT from nulling fields
      const response = await sessionManager.update(selectedSession.id, {
        ...selectedSession,
        status: "CANCELED",
      });
      if (response.success) {
        toast.success("Đã hủy buổi học thành công");
        setIsCancelDialogOpen(false);
        loadSessions(); // Refresh the list
      } else {
        toast.error(response.error || "Không thể hủy buổi học");
      }
    } catch (error) {
      console.error("Error canceling session:", error);
      toast.error("Không thể hủy buổi học");
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-950">
        <SpinnerBlock fullScreen size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Quản Lý Buổi Học
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý các buổi phỏng vấn, xem bản ghi và theo dõi trạng thái
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
              placeholder="Tìm kiếm theo ID, ID người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="DRAFT">Chờ duyệt</SelectItem>
              <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
              <SelectItem value="PAID">Đã thanh toán</SelectItem>
              <SelectItem value="REJECTED">Bị từ chối</SelectItem>
              <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
              <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
              <SelectItem value="CANCELED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={loadSessions}
            isLoading={loading}
            tooltip="Tải lại danh sách phiên"
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo Buổi Học
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SessionTable
          sessions={pageData}
          onView={handleView}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onApprove={handleApprove}
          onReject={handleReject}
          getSortProps={getSortProps}
        />

        {/* Pagination */}
        {sortedData.length > 0 && (
          <PaginationControl pagination={pagination} onPageSizeChange={setPageSize} />
        )}

        {/* Empty State with Clear Filters */}
        {sortedData.length === 0 && (searchQuery || statusFilter !== "all") && (
          <div className="flex justify-center pb-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* View Dialog */}
      <ViewSessionDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        session={selectedSession}
      />

      {/* Create Dialog */}
      <SessionFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title="Tạo Buổi Học Mới"
        description="Điền thông tin để tạo buổi học mới."
        submitLabel="Tạo buổi học"
      />

      {/* Edit Dialog */}
      <SessionFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title="Chỉnh Sửa Buổi Học"
        description="Cập nhật thông tin buổi học."
        submitLabel="Lưu thay đổi"
      />

      {/* Cancel Confirmation Dialog */}
      <CancelSessionDialog
        isOpen={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        session={selectedSession}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
