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

import type { QuestionCategoryFormData } from "../types";

interface QuestionCategoryFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<QuestionCategoryFormData>;
  onFormChange: (data: Partial<QuestionCategoryFormData>) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
}

export function QuestionCategoryFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
}: QuestionCategoryFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="categoryName">Tên danh mục *</Label>
            <Input
              id="categoryName"
              value={formData.categoryName || ""}
              onChange={(e) => onFormChange({ ...formData, categoryName: e.target.value })}
              placeholder="Nhập tên danh mục"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="Nhập mô tả"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="urlTutorial">URL Hướng dẫn</Label>
            <Input
              id="urlTutorial"
              value={formData.urlTutorial || ""}
              onChange={(e) => onFormChange({ ...formData, urlTutorial: e.target.value })}
              placeholder="Nhập URL bài hướng dẫn (không bắt buộc)"
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
