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
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
              <Label htmlFor="jd-title">{t("common.title1")}</Label>
              <Input
                id="jd-title"
                value={formData.title || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    title: e.target.value,
                  })
                }
                placeholder={t("adminCompanymanagement.enterJdTitle")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="jd-level">{t("general.level")}</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    onFormChange({
                      ...formData,
                      level: value as JobDescriptionLevel,
                    })
                  }>
                  <SelectTrigger id="jd-level">
                    <SelectValue placeholder={t("common.chooseLevel")} />
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
                <Label htmlFor="jd-status">{t("general.status")}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    onFormChange({
                      ...formData,
                      status: value as JobDescriptionStatus,
                    })
                  }>
                  <SelectTrigger id="jd-status">
                    <SelectValue placeholder={t("common.selectStatus")} />
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
            <Label htmlFor="jd-description">{t("common.describe")}</Label>
            <Textarea
              id="jd-description"
              value={formData.description || ""}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  description: e.target.value,
                })
              }
              placeholder={t("common.jobDescription")}
              rows={4}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jd-requirements">{t("adminCompanymanagement.request")}</Label>
              <Textarea
                id="jd-requirements"
                value={formData.requirements || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    requirements: e.target.value,
                  })
                }
                placeholder={t("common.candidateRequirements")}
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd-benefits">{t("common.welfare")}</Label>
              <Textarea
                id="jd-benefits"
                value={formData.benefits || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    benefits: e.target.value,
                  })
                }
                placeholder={t("adminCompanymanagement.welfareBenefits")}
                rows={4}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="jd-salary-min">{t("adminCompanymanagement.minimumWage")}</Label>
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
              <Label htmlFor="jd-salary-max">{t("adminCompanymanagement.maximumSalary")}</Label>
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
              <Label htmlFor="jd-currency">{t("adminCompanymanagement.currencyUnit")}</Label>
              <Input
                id="jd-currency"
                value={formData.currency || ""}
                onChange={(e) =>
                  onFormChange({
                    ...formData,
                    currency: e.target.value,
                  })
                }
                placeholder={t("common.currency")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jd-deadline">{t("adminCompanymanagement.applicationDeadline")}</Label>
            <DateTimePicker
              value={formData.deadlineAt ? new Date(formData.deadlineAt) : null}
              onChange={(date) =>
                onFormChange({
                  ...formData,
                  deadlineAt: date ? date.toISOString() : undefined,
                })
              }
              themeVariant="admin"
            />
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
