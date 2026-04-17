/**
 * Admin Notification Management Page
 * Allows admin to view all notifications and send system notifications
 */

import { Bell, Eye, Plus, Search, Send, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PaginationControl, ReloadButton, SortButton } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingCardList } from "@/components/ui/loading-card";
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
import { Textarea } from "@/components/ui/textarea";
import { TimeAgo } from "@/components/ui/time-ago";
import { useCreateNotification, type Notification } from "@/hooks/useNotification";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { notificationManager } from "@/services/notification.manager";
import { usersAdminManager } from "@/services/users-admin.manager";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function NotificationManagementPage() {
  const queryClient = useQueryClient();

  // Fetch all notifications
  const {
    data: allNotifications = [],
    isLoading: notificationsLoading,
    isRefetching: notificationsRefetching,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["admin", "notifications", "all"],
    queryFn: async (): Promise<Notification[]> => {
      const response = await notificationManager.getAll();
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          return response.data as Notification[];
        }
        if ("items" in response.data) {
          return (response.data.items || []) as Notification[];
        }
      }
      return [];
    },
  });

  // Fetch all users for sending notifications
  const {
    data: users = [],
    isLoading: usersLoading,
    isRefetching: usersRefetching,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin", "users", "all"],
    queryFn: async () => {
      const response = await usersAdminManager.getAll();
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if ("data" in response.data) {
          return response.data.data || [];
        }
      }
      return [];
    },
  });

  const { mutate: createNotification, isPending: isCreating } = useCreateNotification();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    userId: "",
    title: "",
    message: "",
  });

  const isLoading = notificationsLoading || usersLoading;
  const isReloading = notificationsRefetching || usersRefetching;

  const handleReload = useCallback(async () => {
    await Promise.all([refetchNotifications(), refetchUsers()]);
  }, [refetchNotifications, refetchUsers]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((notification: Notification) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          notification.title?.toLowerCase().includes(query) ||
          notification.message?.toLowerCase().includes(query) ||
          notification.user?.name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === "read" && !notification.isRead) return false;
      if (statusFilter === "unread" && notification.isRead) return false;

      return true;
    });
  }, [allNotifications, searchQuery, statusFilter]);

  // Sorting
  const { sortedData, getSortProps } = useSortable(filteredNotifications);

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

  // Calculate stats
  const totalNotifications = allNotifications.length;
  const unreadNotifications = allNotifications.filter((n: Notification) => !n.isRead).length;
  const todayNotifications = allNotifications.filter((n: Notification) => {
    if (!n.createAt) return false;
    const today = new Date();
    const notifDate = new Date(n.createAt);
    return notifDate.toDateString() === today.toDateString();
  }).length;

  const handleViewDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
  };

  const handleCreateOpen = () => {
    setCreateForm({ userId: "", title: "", message: "" });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = () => {
    if (!createForm.userId || !createForm.title || !createForm.message) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    createNotification(
      {
        userId: Number(createForm.userId),
        title: createForm.title,
        message: createForm.message,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          queryClient.invalidateQueries({ queryKey: ["admin", "notifications", "all"] });
        },
      }
    );
  };

  const handleDelete = async (notification: Notification) => {
    if (!notification.id) return;

    try {
      const response = await notificationManager.delete(notification.id);
      if (response.success) {
        toast.success("Đã xóa thông báo");
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications", "all"] });
      } else {
        toast.error(response.error || "Không thể xóa thông báo");
      }
    } catch {
      toast.error("Không thể xóa thông báo");
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Quản Lý Thông Báo
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Xem tất cả thông báo và gửi thông báo hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={handleReload}
            isLoading={isReloading}
            tooltip="Tải lại dữ liệu thông báo"
            showLabel
            hideTooltip
          />
          <Button onClick={handleCreateOpen} className="gap-2">
            <Plus className="h-4 w-4" />
            Gửi thông báo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng thông báo</CardDescription>
            <CardTitle className="text-2xl">{totalNotifications}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chưa đọc</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{unreadNotifications}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đã đọc</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {totalNotifications - unreadNotifications}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hôm nay</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{todayNotifications}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tiêu đề, nội dung, người nhận..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="unread">Chưa đọc</SelectItem>
                <SelectItem value="read">Đã đọc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600" />
            <CardTitle>Danh Sách Thông Báo</CardTitle>
          </div>
          <CardDescription>
            Hiển thị {filteredNotifications.length} / {allNotifications.length} thông báo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCardList count={5} />
          ) : pageData.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Không có thông báo"
              description="Không tìm thấy thông báo nào phù hợp với bộ lọc."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Người nhận</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>
                      <SortButton {...getSortProps("isRead" as keyof Notification)}>
                        Trạng thái
                      </SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton {...getSortProps("createAt" as keyof Notification)}>
                        Thời gian
                      </SortButton>
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map((notification: Notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>#{notification.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={notification.user?.avatarUrl} />
                            <AvatarFallback>
                              {notification.user?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{notification.user?.name || "Không có dữ liệu"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {notification.message}
                      </TableCell>
                      <TableCell>
                        <Badge variant={notification.isRead ? "secondary" : "default"}>
                          {notification.isRead ? "Đã đọc" : "Chưa đọc"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TimeAgo date={notification.createAt || new Date()} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(notification)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {sortedData.length > 0 && (
                <PaginationControl pagination={pagination} onPageSizeChange={setPageSize} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi Tiết Thông Báo #{selectedNotification?.id}</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-500">Người nhận</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedNotification.user?.avatarUrl} />
                    <AvatarFallback>
                      {selectedNotification.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{selectedNotification.user?.name}</span>
                </div>
              </div>
              <div>
                <Label className="text-slate-500">Tiêu đề</Label>
                <p className="font-medium">{selectedNotification.title}</p>
              </div>
              <div>
                <Label className="text-slate-500">Nội dung</Label>
                <p className="whitespace-pre-wrap">{selectedNotification.message}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-slate-500">Trạng thái</Label>
                  <Badge variant={selectedNotification.isRead ? "secondary" : "default"}>
                    {selectedNotification.isRead ? "Đã đọc" : "Chưa đọc"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-500">Thời gian</Label>
                  <p>
                    <TimeAgo date={selectedNotification.createAt || new Date()} />
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Gửi Thông Báo Mới
            </DialogTitle>
            <DialogDescription>Gửi thông báo đến người dùng cụ thể</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">Người nhận</Label>
              <Select
                value={createForm.userId}
                onValueChange={(value) => setCreateForm({ ...createForm, userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn người nhận" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: { id?: number; name?: string; email?: string }) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                placeholder="Nhập tiêu đề thông báo"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="message">Nội dung</Label>
              <Textarea
                id="message"
                placeholder="Nhập nội dung thông báo"
                rows={4}
                value={createForm.message}
                onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Hủy
            </Button>
            <Button onClick={handleCreateSubmit} disabled={isCreating}>
              {isCreating ? "Đang gửi..." : "Gửi thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
