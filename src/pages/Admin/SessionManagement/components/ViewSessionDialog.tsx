import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateTime, treatZuluAsVietnamLocal } from "@/lib/formatting";
import { openUrlInNewTab } from "@/lib/media-file-utils";
import { getSessionStatusBadge } from "@/lib/status-utils";

import type { Session } from "../types";

interface ViewSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  session: Session | null;
}

const formatDuration = (seconds?: number, minutes?: number) => {
  if (typeof minutes === "number" && minutes > 0) {
    return `${minutes}p`;
  }

  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutesFromSeconds = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}g ${minutesFromSeconds}p ${secs}s`;
  }
  return `${minutesFromSeconds}p ${secs}s`;
};

export function ViewSessionDialog({ isOpen, onOpenChange, session }: ViewSessionDialogProps) {
  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chi Tiết Buổi Học</DialogTitle>
          <DialogDescription>Thông tin chi tiết về buổi học này</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">ID Buổi học</p>
              <p className="text-sm">{session.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Trạng thái</p>
              {(() => {
                const statusConfig = getSessionStatusBadge(session.status);
                return (
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                );
              })()}
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-500">Tên phòng</p>
              <p className="text-sm">{session.roomName || "-"}</p>
            </div>
          </div>

          <Separator />

          {/* Participant 1 (User) */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Thông Tin Người Dùng</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">ID Người dùng</p>
                <p className="text-sm">{session.userId || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ID Người tham gia</p>
                <p className="text-sm">{session.participantId1 || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Thời gian bắt đầu</p>
                <p className="text-sm">
                  {formatDateTime(treatZuluAsVietnamLocal(session.startTime1))}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Thời gian kết thúc</p>
                <p className="text-sm">
                  {formatDateTime(treatZuluAsVietnamLocal(session.endTime1))}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Thời lượng</p>
                <p className="text-sm">
                  {formatDuration(session.durationSeconds1, session.duration)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Participant 2 (Mentor) */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Thông Tin Mentor</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">ID Mentor</p>
                <p className="text-sm">{session.userId2 || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ID Người tham gia</p>
                <p className="text-sm">{session.participantId2 || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Thời gian bắt đầu</p>
                <p className="text-sm">
                  {formatDateTime(treatZuluAsVietnamLocal(session.startTime2))}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Thời gian kết thúc</p>
                <p className="text-sm">
                  {formatDateTime(treatZuluAsVietnamLocal(session.endTime2))}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Thời lượng</p>
                <p className="text-sm">{formatDuration(session.durationSeconds2)}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold">Thông Tin Thanh Toán</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Thời lượng dự kiến</p>
                <p className="text-sm">{session.duration ? `${session.duration} phút` : "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tổng giá</p>
                <p className="text-sm">
                  {session.totalPrice != null ? formatCurrency(session.totalPrice) : "-"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Mã giao dịch</p>
                <p className="font-mono text-sm">{session.transactionCode || "-"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* URLs */}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Liên Kết Buổi Học</h4>
            <div className="space-y-2">
              {session.joinTime && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Thời gian bắt đầu cuộc họp</p>
                  <p className="text-sm">{formatDateTime(session.joinTime)}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">URL Phòng</p>
                {session.roomUrl ? (
                  <a
                    href={session.roomUrl}
                    rel="noopener noreferrer"
                    onClick={(event) => {
                      event.preventDefault();
                      openUrlInNewTab(session.roomUrl || "");
                    }}
                    className="text-sm text-blue-600 hover:underline">
                    {session.roomUrl}
                  </a>
                ) : (
                  <p className="text-sm">-</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">URL Bản ghi</p>
                {session.recordUrl ? (
                  <a
                    href={session.recordUrl}
                    rel="noopener noreferrer"
                    onClick={(event) => {
                      event.preventDefault();
                      openUrlInNewTab(session.recordUrl || "");
                    }}
                    className="text-sm text-blue-600 hover:underline">
                    {session.recordUrl}
                  </a>
                ) : (
                  <p className="text-sm">-</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
