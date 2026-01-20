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
import { Textarea } from "@/components/ui/textarea";

import type { MajorFormData } from "../types";

interface QuestionMajorFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<MajorFormData>;
  onFormChange: (data: Partial<MajorFormData>) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
}

export function QuestionMajorFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
}: QuestionMajorFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="majorName">
              Tên Chuyên Ngành <span className="text-red-500">*</span>
            </Label>
            <Input
              id="majorName"
              value={formData.majorName || ""}
              onChange={(e) => onFormChange({ ...formData, majorName: e.target.value })}
              placeholder="VD: Công nghệ thông tin, Kinh tế, Marketing..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Mô Tả</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="Mô tả ngắn về chuyên ngành này..."
              rows={3}
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
