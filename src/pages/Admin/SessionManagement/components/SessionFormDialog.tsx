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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { datetimeLocalToVietnamISOString } from "@/lib/utils";

import type { SessionFormData, SessionStatus } from "../types";

interface SessionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<SessionFormData>;
  onFormChange: (data: Partial<SessionFormData>) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
}

const SESSION_STATUSES: SessionStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "PAID",
  "REJECTED",
  "ONGOING",
  "COMPLETED",
  "CANCELED",
];

export function SessionFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
}: SessionFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="userId">ID người dùng</Label>
            <Input
              id="userId"
              type="number"
              value={formData.userId || ""}
              onChange={(e) =>
                onFormChange({ ...formData, userId: parseInt(e.target.value) || undefined })
              }
              placeholder="Nhập ID người dùng"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="userId2">ID Mentor</Label>
            <Input
              id="userId2"
              type="number"
              value={formData.userId2 || ""}
              onChange={(e) =>
                onFormChange({ ...formData, userId2: parseInt(e.target.value) || undefined })
              }
              placeholder="Nhập ID mentor"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="joinTime">Thời gian bắt đầu cuộc họp</Label>
            <Input
              id="joinTime"
              type="datetime-local"
              value={formData.joinTime ? formData.joinTime.slice(0, 16) : ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  joinTime: e.target.value
                    ? datetimeLocalToVietnamISOString(e.target.value)
                    : undefined,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Thời lượng dự kiến (phút)</Label>
            <Input
              id="duration"
              type="number"
              min={0}
              value={formData.duration ?? ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  duration: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="Nhập thời lượng"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="totalPrice">Tổng giá (VND)</Label>
            <Input
              id="totalPrice"
              type="number"
              min={0}
              value={formData.totalPrice ?? ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  totalPrice: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="Nhập tổng giá"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transactionCode">Mã giao dịch</Label>
            <Input
              id="transactionCode"
              value={formData.transactionCode || ""}
              onChange={(e) => onFormChange({ ...formData, transactionCode: e.target.value })}
              placeholder="Nhập mã giao dịch"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="start_video_off">Tắt video khi bắt đầu</Label>
            <Switch
              id="start_video_off"
              checked={formData.start_video_off ?? true}
              onCheckedChange={(checked) => onFormChange({ ...formData, start_video_off: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="start_audio_off">Tắt audio khi bắt đầu</Label>
            <Switch
              id="start_audio_off"
              checked={formData.start_audio_off ?? true}
              onCheckedChange={(checked) => onFormChange({ ...formData, start_audio_off: checked })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="enable_recording">Ghi hình</Label>
            <Select
              value={formData.enable_recording || "cloud"}
              onValueChange={(value) => onFormChange({ ...formData, enable_recording: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chế độ ghi hình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cloud">Cloud (đám mây)</SelectItem>
                <SelectItem value="local">Local (máy tính)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={formData.status || "SCHEDULED"}
              onValueChange={(value) =>
                onFormChange({ ...formData, status: value as SessionStatus })
              }>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {SESSION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
