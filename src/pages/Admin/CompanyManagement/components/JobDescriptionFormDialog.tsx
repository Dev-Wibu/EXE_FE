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
import { Textarea } from "@/components/ui/textarea";
import { datetimeLocalToVietnamISOString } from "@/lib/utils";

import type { JobDescriptionFormData, JobDescriptionLevel, JobDescriptionStatus } from "../types";

interface JobDescriptionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<JobDescriptionFormData>;
  onFormChange: (data: Partial<JobDescriptionFormData>) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
}

const LEVEL_OPTIONS: JobDescriptionLevel[] = ["INTERN", "FRESHER", "JUNIOR", "MIDDLE"];
const STATUS_OPTIONS: JobDescriptionStatus[] = ["OPEN", "CLOSED", "DRAFT"];

export function JobDescriptionFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
}: JobDescriptionFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jd-title">Tiêu đề *</Label>
              <Input
                id="jd-title"
                value={formData.title || ""}
                onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề JD"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="jd-level">Cấp độ *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    onFormChange({ ...formData, level: value as JobDescriptionLevel })
                  }>
                  <SelectTrigger id="jd-level">
                    <SelectValue placeholder="Chọn cấp độ" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jd-status">Trạng thái *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    onFormChange({ ...formData, status: value as JobDescriptionStatus })
                  }>
                  <SelectTrigger id="jd-status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jd-description">Mô tả</Label>
            <Textarea
              id="jd-description"
              value={formData.description || ""}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="Mô tả công việc"
              rows={4}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jd-requirements">Yêu cầu</Label>
              <Textarea
                id="jd-requirements"
                value={formData.requirements || ""}
                onChange={(e) => onFormChange({ ...formData, requirements: e.target.value })}
                placeholder="Yêu cầu ứng viên"
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-benefits">Phúc lợi</Label>
              <Textarea
                id="jd-benefits"
                value={formData.benefits || ""}
                onChange={(e) => onFormChange({ ...formData, benefits: e.target.value })}
                placeholder="Phúc lợi/Quyền lợi"
                rows={4}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="jd-salary-min">Lương tối thiểu</Label>
              <Input
                id="jd-salary-min"
                type="number"
                min={0}
                value={formData.salaryMin ?? ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    salaryMin: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-salary-max">Lương tối đa</Label>
              <Input
                id="jd-salary-max"
                type="number"
                min={0}
                value={formData.salaryMax ?? ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    salaryMax: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-currency">Đơn vị tiền tệ</Label>
              <Input
                id="jd-currency"
                value={formData.currency || ""}
                onChange={(e) => onFormChange({ ...formData, currency: e.target.value })}
                placeholder="VND"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jd-deadline">Hạn nộp hồ sơ</Label>
            <Input
              id="jd-deadline"
              type="datetime-local"
              value={formData.deadlineAt ? formData.deadlineAt.slice(0, 16) : ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  deadlineAt: e.target.value
                    ? datetimeLocalToVietnamISOString(e.target.value)
                    : undefined,
                })
              }
            />
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
