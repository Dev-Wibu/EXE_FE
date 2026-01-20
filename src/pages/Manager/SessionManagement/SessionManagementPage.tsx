import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const filteredSessions = sessions.filter((session) => {
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch =
        session.roomName?.toLowerCase().includes(lowerQuery) ||
        session.id?.toString().includes(lowerQuery) ||
        session.userId?.toString().includes(lowerQuery) ||
        session.userId2?.toString().includes(lowerQuery);
      if (!matchesSearch) return false;
    }

    // Filter by status
    if (statusFilter !== "all" && session.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const handleCreate = () => {
    setFormData({ status: "SCHEDULED" });
    setIsCreateDialogOpen(true);
  };

  const handleView = (session: Session) => {
    setSelectedSession(session);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setFormData({
      roomName: session.roomName,
      userId: session.userId,
      userId2: session.userId2,
      status: session.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleCancel = (session: Session) => {
    setSelectedSession(session);
    setIsCancelDialogOpen(true);
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
      const response = await sessionManager.update(selectedSession.id, formData);
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
      const response = await sessionManager.delete(selectedSession.id);
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
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="font-['Inter'] text-lg text-gray-500 dark:text-slate-400">Đang tải...</div>
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
              placeholder="Tìm kiếm theo ID, tên phòng, ID người dùng..."
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
              <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
              <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
              <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
              <SelectItem value="CANCELED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Button */}
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo Buổi Học
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <SessionTable
          sessions={filteredSessions.slice().reverse()}
          onView={handleView}
          onEdit={handleEdit}
          onCancel={handleCancel}
        />

        {/* Empty State with Clear Filters */}
        {filteredSessions.length === 0 && (searchQuery || statusFilter !== "all") && (
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
