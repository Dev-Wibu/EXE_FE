import { Check, Edit, Eye, Search, X, XCircle } from "lucide-react";

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

import type { Session } from "../types";

interface SortProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}

interface SessionTableProps {
  sessions: Session[];
  onView: (session: Session) => void;
  onEdit: (session: Session) => void;
  onCancel: (session: Session) => void;
  onApprove?: (session: Session) => void;
  onReject?: (session: Session) => void;
  getSortProps?: (key: keyof Session) => SortProps;
}

const getStatusBadgeClass = (status?: string): string => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-600 hover:bg-green-600 text-white";
    case "ONGOING":
      return "bg-blue-600 hover:bg-blue-600 text-white";
    case "DRAFT":
      return "bg-amber-500 hover:bg-amber-500 text-white";
    case "SCHEDULED":
      return "bg-yellow-500 hover:bg-yellow-500 text-white";
    case "REJECTED":
      return "bg-rose-600 hover:bg-rose-600 text-white";
    case "CANCELED":
      return "bg-red-600 hover:bg-red-600 text-white";
    default:
      return "";
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return "-";
  }
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}g ${minutes}p`;
  }
  return `${minutes}p`;
};

export function SessionTable({
  sessions,
  onView,
  onEdit,
  onCancel,
  onApprove,
  onReject,
  getSortProps,
}: SessionTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">Không tìm thấy buổi học nào</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Tên phòng</TableHead>
          <TableHead className="w-24">ID người dùng</TableHead>
          <TableHead className="w-24">ID Mentor</TableHead>
          <TableHead>
            {getSortProps ? (
              <SortButton {...getSortProps("startTime1")}>Thời gian bắt đầu</SortButton>
            ) : (
              "Thời gian bắt đầu"
            )}
          </TableHead>
          <TableHead>Giờ họp</TableHead>
          <TableHead className="w-24">Thời lượng</TableHead>
          <TableHead className="w-28">
            {getSortProps ? (
              <SortButton {...getSortProps("status")}>Trạng thái</SortButton>
            ) : (
              "Trạng thái"
            )}
          </TableHead>
          <TableHead className="w-28 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="font-medium">{session.id}</TableCell>
            <TableCell className="max-w-xs truncate font-medium">
              {session.roomName || "-"}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{session.userId || "-"}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{session.userId2 || "-"}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(session.startTime1)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(session.joinTime)}
            </TableCell>
            <TableCell>{formatDuration(session.durationSeconds1)}</TableCell>
            <TableCell>
              <Badge variant="default" className={getStatusBadgeClass(session.status)}>
                {session.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {session.status === "DRAFT" && onApprove && onReject && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApprove(session)}
                      className="h-8 w-8 p-0 hover:bg-emerald-50"
                      title="Duyệt phiên">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(session)}
                      className="h-8 w-8 p-0 hover:bg-rose-50"
                      title="Từ chối phiên">
                      <X className="h-4 w-4 text-rose-600" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(session)}
                  className="h-8 w-8 p-0 hover:bg-green-50"
                  title="Xem chi tiết">
                  <Eye className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(session)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 disabled:opacity-50"
                  disabled={session.status === "COMPLETED" || session.status === "CANCELED"}
                  title="Chỉnh sửa">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(session)}
                  className="h-8 w-8 p-0 hover:bg-red-50 disabled:opacity-50"
                  disabled={session.status === "COMPLETED" || session.status === "CANCELED"}
                  title="Hủy buổi học">
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
