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

import type { Major, QuestionSetFormData, QuestionSetLevel } from "../types";

interface QuestionSetFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<QuestionSetFormData>;
  onFormChange: (data: Partial<QuestionSetFormData>) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
  majors: Major[];
}

export function QuestionSetFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
  majors,
}: QuestionSetFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="questionSetName">Question Set Name *</Label>
            <Input
              id="questionSetName"
              value={formData.questionSetName || ""}
              onChange={(e) => onFormChange({ ...formData, questionSetName: e.target.value })}
              placeholder="Enter question set name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="level">Level *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  onFormChange({ ...formData, level: value as QuestionSetLevel })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERN">Intern</SelectItem>
                  <SelectItem value="FRESHER">Fresher</SelectItem>
                  <SelectItem value="JUNIOR">Junior</SelectItem>
                  <SelectItem value="MIDDLE">Middle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="majorId">Major</Label>
              <Select
                value={formData.majorId?.toString()}
                onValueChange={(value) =>
                  onFormChange({ ...formData, majorId: value ? Number(value) : undefined })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select major" />
                </SelectTrigger>
                <SelectContent>
                  {majors
                    .filter((major) => major.id !== undefined)
                    .map((major) => (
                      <SelectItem key={major.id} value={String(major.id)}>
                        {major.majorName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="objective">Objective</Label>
            <Textarea
              id="objective"
              value={formData.objective || ""}
              onChange={(e) => onFormChange({ ...formData, objective: e.target.value })}
              placeholder="Enter objective"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
