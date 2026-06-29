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
import { useTranslation } from "react-i18next";
import type { Major, PracticeSetFormData, PracticeSetLevel } from "../types";
interface PracticeSetFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<PracticeSetFormData>;
  onFormChange: (data: Partial<PracticeSetFormData>) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
  majors: Major[];
  isSubmitting?: boolean;
}
export function PracticeSetFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
  majors,
  isSubmitting,
}: PracticeSetFormDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="practiceSetName">
              {t("adminPracticesetmanagement.questionSetName")}
            </Label>
            <Input
              id="practiceSetName"
              value={formData.practiceSetName || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  practiceSetName: e.target.value,
                })
              }
              placeholder={t("adminPracticesetmanagement.enterTheNameOfThe")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="level">{t("general.level")}</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  onFormChange({
                    ...formData,
                    level: value as PracticeSetLevel,
                  })
                }>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.chooseLevel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERN">{"Intern"}</SelectItem>
                  <SelectItem value="FRESHER">Fresher</SelectItem>
                  <SelectItem value="JUNIOR">{"Junior"}</SelectItem>
                  <SelectItem value="MIDDLE">{"Middle"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="majorId">{t("common.specialized")}</Label>
              <Select
                value={formData.majorId?.toString()}
                onValueChange={(value) =>
                  onFormChange({
                    ...formData,
                    majorId: value ? Number(value) : undefined,
                  })
                }>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.chooseAMajor")} />
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
            <Label htmlFor="objective">{t("adminPracticesetmanagement.target")}</Label>
            <Textarea
              id="objective"
              value={formData.objective || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  objective: e.target.value,
                })
              }
              placeholder={t("adminPracticesetmanagement.enterTarget")}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("general.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("common.processing") : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
