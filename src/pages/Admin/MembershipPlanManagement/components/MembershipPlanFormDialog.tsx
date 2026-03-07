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

import type { MemberShipPlanFormData } from "../types";

interface MembershipPlanFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<MemberShipPlanFormData>;
  onFormChange: (data: Partial<MemberShipPlanFormData>) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
}

const PLAN_NAMES = ["NEW", "FREE", "BASIC", "PREMIUM", "TEST"] as const;

export function MembershipPlanFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
}: MembershipPlanFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="planName">Tên gói *</Label>
            <Select
              value={formData.name ?? ""}
              onValueChange={(v) =>
                onFormChange({
                  ...formData,
                  name: v as MemberShipPlanFormData["name"],
                })
              }>
              <SelectTrigger>
                <SelectValue placeholder="Chọn tên gói" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_NAMES.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Giá (VNĐ) *</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={formData.price ?? ""}
              onChange={(e) => onFormChange({ ...formData, price: Number(e.target.value) })}
              placeholder="Nhập giá gói"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="maxAiInterview">Max AI Interview</Label>
              <Input
                id="maxAiInterview"
                type="number"
                min={0}
                value={formData.max_ai_interview ?? ""}
                onChange={(e) =>
                  onFormChange({ ...formData, max_ai_interview: Number(e.target.value) })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxPracticeSets">Max Practice Sets</Label>
              <Input
                id="maxPracticeSets"
                type="number"
                min={0}
                value={formData.max_practice_sets ?? ""}
                onChange={(e) =>
                  onFormChange({ ...formData, max_practice_sets: Number(e.target.value) })
                }
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="maxQuizSets">Max Quiz Sets</Label>
              <Input
                id="maxQuizSets"
                type="number"
                min={0}
                value={formData.max_quiz_sets ?? ""}
                onChange={(e) =>
                  onFormChange({ ...formData, max_quiz_sets: Number(e.target.value) })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationDays">Thời hạn (ngày) *</Label>
              <Input
                id="durationDays"
                type="number"
                min={1}
                value={formData.durationDays ?? ""}
                onChange={(e) =>
                  onFormChange({ ...formData, durationDays: Number(e.target.value) })
                }
                placeholder="30"
              />
            </div>
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
