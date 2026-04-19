import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { Calendar, Check, Clock, Eye, Search, Video, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PaginationControl, SortButton } from "@/components/shared";
import { ReloadButton } from "@/components/shared/ReloadButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerBlock } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useSessions, useUpdateSessionStatus } from "@/hooks/useSession";
import { useSortable } from "@/hooks/useSortable";
import type { Session, SessionStatus } from "@/interfaces";
import { formatDateTime, toTimestamp } from "@/lib/formatting";
import { openUrlInNewTab } from "@/lib/media-file-utils";
import { getSessionStatusBadge } from "@/lib/status-utils";

type StatusFilter = SessionStatus | "all";
type SortableSession = Session & {
  idSortValue: number;
  joinTimeSortValue: number;
  statusSortValue: string;
};

export function SessionProcessingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // View dialog
  const [viewSession, setViewSession] = useState<Session | null>(null);

  // Confirm dialog for approve/reject
  const [confirmAction, setConfirmAction] = useState<{
    session: Session;
    isApproved: boolean;
  } | null>(null);

  // Fetch all sessions
  const { data: sessions = [], isLoading, isError, isRefetching, refetch } = useSessions();

  // Mutation for approve/reject
  const updateStatusMutation = useUpdateSessionStatus();

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (statusFilter !== "all" && session.status !== statusFilter) {
        return false;
      }
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return (
          session.id?.toString().includes(lowerQuery) ||
          session.roomName?.toLowerCase().includes(lowerQuery) ||
          session.userId?.toString().includes(lowerQuery) ||
          session.userId2?.toString().includes(lowerQuery) ||
          session.roomUrl?.toLowerCase().includes(lowerQuery)
        );
      }
      return true;
    });
  }, [sessions, searchQuery, statusFilter]);

  const sortableSessions = useMemo<SortableSession[]>(() => {
    return filteredSessions.map((session) => ({
      ...session,
      idSortValue: typeof session.id === "number" ? session.id : 0,
      joinTimeSortValue: toTimestamp(session.joinTime) ?? 0,
      statusSortValue: session.status || "",
    }));
  }, [filteredSessions]);

  const { sortedData, getSortProps } = useSortable(sortableSessions, {
    defaultSort: {
      key: "idSortValue",
      direction: "desc",
    },
    noSortBehavior: "preserve",
    tieBreaker: {
      key: "idSortValue",
      direction: "desc",
    },
  });

  // Pagination
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_staff_sessionprocessing_sessionprocessingpage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [pagination.endIndex, pagination.startIndex, sortedData]);

  // Stats from real data
  const stats = useMemo(() => {
    return {
      ongoing: sessions.filter((s) => s.status === "ONGOING").length,
      scheduled: sessions.filter((s) => s.status === "SCHEDULED").length,
      draft: sessions.filter((s) => s.status === "DRAFT").length,
    };
  }, [sessions]);

  const handleApproveReject = useCallback((session: Session, isApproved: boolean) => {
    setConfirmAction({ session, isApproved });
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (!confirmAction?.session.id) return;
    updateStatusMutation.mutate(
      { sessionId: confirmAction.session.id, isApproved: confirmAction.isApproved },
      {
        onSettled: () => {
          setConfirmAction(null);
        },
      }
    );
  }, [confirmAction, updateStatusMutation]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-950">
        <SpinnerBlock fullScreen size="xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-slate-950">
        <p className="text-red-500">Không thể tải danh sách phiên phỏng vấn</p>
        <Button variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Quản Lý Phiên Phỏng Vấn
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Theo dõi và quản lý các phiên phỏng vấn giữa người dùng và mentor
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as StatusFilter);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="DRAFT">Chờ duyệt</SelectItem>
              <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
              <SelectItem value="PAID">Đã thanh toán</SelectItem>
              <SelectItem value="REJECTED">Bị từ chối</SelectItem>
              <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="CANCELED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
          <ReloadButton
            onReload={async () => {
              await refetch();
            }}
            isLoading={isRefetching}
            tooltip="Tải lại danh sách phiên"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {stats.draft > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 dark:bg-amber-900/30">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {stats.draft} chờ duyệt
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 dark:bg-green-900/30">
            <Video className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {stats.ongoing} đang diễn ra
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 dark:bg-blue-900/30">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {stats.scheduled} sắp tới
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                <SortButton {...getSortProps("idSortValue")}>ID</SortButton>
              </TableHead>
              <TableHead>Tên phòng</TableHead>
              <TableHead>Người dùng (ID)</TableHead>
              <TableHead>Mentor (ID)</TableHead>
              <TableHead>
                <SortButton {...getSortProps("joinTimeSortValue")}>Thời gian tham gia</SortButton>
              </TableHead>
              <TableHead>
                <SortButton {...getSortProps("statusSortValue")}>Trạng thái</SortButton>
              </TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-mono text-sm">{session.id}</TableCell>
                <TableCell className="max-w-[200px] truncate font-mono text-sm">
                  {session.roomName || "-"}
                </TableCell>
                <TableCell>{session.userId ?? "-"}</TableCell>
                <TableCell>{session.userId2 ?? "-"}</TableCell>
                <TableCell>{formatDateTime(session.joinTime)}</TableCell>
                <TableCell>
                  <StatusBadge {...getSessionStatusBadge(session.status)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewSession(session)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Xem chi tiết</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {session.status === "DRAFT" && (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                onClick={() => handleApproveReject(session, true)}>
                                <Check className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duyệt</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleApproveReject(session, false)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Từ chối</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pageData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                  Không có phiên phỏng vấn nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {sortedData.length > 0 && (
          <PaginationControl
            pagination={pagination}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              pagination.goToFirstPage();
            }}
          />
        )}

        {/* Clear Filters */}
        {sortedData.length === 0 && (searchQuery || statusFilter !== "all") && (
          <div className="flex justify-center pb-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                pagination.goToFirstPage();
              }}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* View Detail Dialog */}
      <Dialog open={!!viewSession} onOpenChange={() => setViewSession(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chi tiết phiên phỏng vấn</DialogTitle>
            <DialogDescription>Thông tin chi tiết về phiên #{viewSession?.id}</DialogDescription>
          </DialogHeader>
          {viewSession && (
            <div className="grid gap-3 py-4 text-sm">
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium text-gray-600">ID:</span>
                <span>{viewSession.id}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium text-gray-600">Tên phòng:</span>
                <span className="font-mono text-xs break-all">{viewSession.roomName || "-"}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium text-gray-600">Người dùng (ID):</span>
                <span>{viewSession.userId ?? "-"}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium text-gray-600">Mentor (ID):</span>
                <span>{viewSession.userId2 ?? "-"}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium text-gray-600">Thời gian tham gia:</span>
                <span>{formatDateTime(viewSession.joinTime)}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium text-gray-600">URL phòng:</span>
                <span className="text-xs break-all">
                  {viewSession.roomUrl ? (
                    <a
                      href={viewSession.roomUrl}
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        event.preventDefault();
                        openUrlInNewTab(viewSession.roomUrl || "");
                      }}
                      className="text-blue-600 hover:underline">
                      {viewSession.roomUrl}
                    </a>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              {viewSession.recordUrl && (
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium text-gray-600">Bản ghi:</span>
                  <span className="text-xs break-all">
                    <a
                      href={viewSession.recordUrl}
                      rel="noopener noreferrer"
                      onClick={(event) => {
                        event.preventDefault();
                        openUrlInNewTab(viewSession.recordUrl || "");
                      }}
                      className="text-blue-600 hover:underline">
                      {viewSession.recordUrl}
                    </a>
                  </span>
                </div>
              )}
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium text-gray-600">Trạng thái:</span>
                <span>
                  <StatusBadge {...getSessionStatusBadge(viewSession.status)} />
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            {viewSession?.status === "DRAFT" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setViewSession(null);
                    handleApproveReject(viewSession, false);
                  }}>
                  <X className="mr-1 h-4 w-4" />
                  Từ chối
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setViewSession(null);
                    handleApproveReject(viewSession, true);
                  }}>
                  <Check className="mr-1 h-4 w-4" />
                  Duyệt
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Approve/Reject Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.isApproved ? "Duyệt phiên phỏng vấn" : "Từ chối phiên phỏng vấn"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.isApproved
                ? `Bạn có chắc muốn duyệt phiên phỏng vấn #${confirmAction?.session.id}? Phiên sẽ chuyển sang trạng thái "Đã lên lịch".`
                : `Bạn có chắc muốn từ chối phiên phỏng vấn #${confirmAction?.session.id}? Hành động này không thể hoàn tác.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Hủy
            </Button>
            <Button
              variant={confirmAction?.isApproved ? "default" : "destructive"}
              onClick={handleConfirmAction}
              disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending
                ? "Đang xử lý..."
                : confirmAction?.isApproved
                  ? "Duyệt"
                  : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
