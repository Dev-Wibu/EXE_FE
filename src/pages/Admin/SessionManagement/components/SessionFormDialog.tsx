import { DateTimePicker } from "@/components/shared";
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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="userId">{t("general.userId1")}</Label>
            <Input
              id="userId"
              type="number"
              value={formData.userId || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  userId: parseInt(e.target.value) || undefined,
                })
              }
              placeholder={t("adminSessionmanagement.enterUserId")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="userId2">{t("common.idMentor")}</Label>
            <Input
              id="userId2"
              type="number"
              value={formData.userId2 || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  userId2: parseInt(e.target.value) || undefined,
                })
              }
              placeholder={t("adminSessionmanagement.enterMentorId")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="joinTime">{t("adminSessionmanagement.meetingStartTime")}</Label>
            <DateTimePicker
              value={formData.joinTime ? new Date(formData.joinTime) : null}
              onChange={(date) =>
                onFormChange({
                  ...formData,
                  joinTime: date ? date.toISOString() : undefined,
                })
              }
              themeVariant="admin"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">{t("adminSessionmanagement.estimatedTimeMinutes")}</Label>
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
              placeholder={t("adminSessionmanagement.enterDuration")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="totalPrice">{t("adminSessionmanagement.totalPriceVnd")}</Label>
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
              placeholder={t("adminSessionmanagement.enterTotalPrice")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transactionCode">{t("common.transactionCode")}</Label>
            <Input
              id="transactionCode"
              value={formData.transactionCode || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  transactionCode: e.target.value,
                })
              }
              placeholder={t("adminSessionmanagement.enterTransactionCode")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="start_video_off">
              {t("adminSessionmanagement.turnOffVideoWhenStarting")}
            </Label>
            <Switch
              id="start_video_off"
              checked={formData.start_video_off ?? true}
              onCheckedChange={(checked) =>
                onFormChange({
                  ...formData,
                  start_video_off: checked,
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="start_audio_off">
              {t("adminSessionmanagement.turnOffAudioWhenStarting")}
            </Label>
            <Switch
              id="start_audio_off"
              checked={formData.start_audio_off ?? true}
              onCheckedChange={(checked) =>
                onFormChange({
                  ...formData,
                  start_audio_off: checked,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="enable_recording">{t("common.videoRecording")}</Label>
            <Select
              value={formData.enable_recording || "cloud"}
              onValueChange={(value) =>
                onFormChange({
                  ...formData,
                  enable_recording: value,
                })
              }>
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectRecordingMode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cloud">{t("common.cloudCloud")}</SelectItem>
                <SelectItem value="local">{t("common.localComputer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">{t("common.status")}</Label>
            <Select
              value={formData.status || "SCHEDULED"}
              onValueChange={(value) =>
                onFormChange({
                  ...formData,
                  status: value as SessionStatus,
                })
              }>
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectStatus")} />
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
            {t("general.cancel")}
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
