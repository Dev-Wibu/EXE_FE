import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/formatting";
import i18n from "@/lib/i18n";
import { getJobDescriptionLevelBadge, getJobDescriptionStatusBadge } from "@/lib/status-utils";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Gift,
  ListChecks,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { JobDescription } from "../types";
const t = i18n.t.bind(i18n);
interface JobDescriptionDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  jobDescription: JobDescription | null;
  onEdit?: (job: JobDescription) => void;
}
const formatSalaryRange = (
  salaryMin?: number | null,
  salaryMax?: number | null,
  currency?: string | null
): string => {
  if (salaryMin == null && salaryMax == null) return t("common.agree");
  const currencyNote = currency && currency.toUpperCase() !== "VND" ? ` (${currency})` : "";
  if (salaryMin != null && salaryMax != null) {
    return `${formatCurrency(salaryMin)} - ${formatCurrency(salaryMax)}${currencyNote}`;
  }
  if (salaryMin != null)
    return t("general.from2", {
      var_0: formatCurrency(salaryMin),
      var_1: currencyNote,
    });
  return t("general.to2", {
    var_0: formatCurrency(salaryMax ?? 0),
    var_1: currencyNote,
  });
};
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}
function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-primary/10 text-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {label}
        </p>
        <div className="text-foreground mt-0.5 text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
interface ContentSectionProps {
  icon: React.ReactNode;
  title: string;
  content?: string | null;
}
function ContentSection({ icon, title, content }: ContentSectionProps) {
  if (!content) return null;
  return (
    <div className="border-border/50 bg-card/30 rounded-xl border p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h4 className="text-foreground text-sm font-bold">{title}</h4>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}
export function JobDescriptionDetailDialog({
  isOpen,
  onOpenChange,
  jobDescription: job,
  onEdit,
}: JobDescriptionDetailDialogProps) {
  const { t } = useTranslation();
  if (!job) return null;
  const statusConfig = getJobDescriptionStatusBadge(job.status);
  const levelConfig = getJobDescriptionLevelBadge(job.level);

  // Safely get rounds/appliedCount from backend response (may not be in types yet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobAny = job as any;
  const rounds: Array<{
    id?: number;
    name?: string;
    description?: string;
    roundNumber?: number;
  }> = Array.isArray(jobAny.rounds) ? jobAny.rounds : [];
  const appliedCount: number = typeof jobAny.appliedCount === "number" ? jobAny.appliedCount : 0;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        {/* Header with gradient */}
        <div className="from-primary/10 via-primary/5 to-background relative bg-gradient-to-br px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-foreground pr-8 text-xl font-bold">
              {job.title || t("adminCompanymanagement.jdDetails")}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge {...statusConfig} />
            <StatusBadge {...levelConfig} />
            {appliedCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                <Users className="h-3.5 w-3.5" />
                {appliedCount} {t("adminCompanymanagement.numberOfApplications")}
              </span>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="flex flex-col gap-4 pb-6">
            {/* Key info grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow
                icon={<Banknote className="h-4 w-4" />}
                label={t("common.salary")}
                value={formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label={t("adminCompanymanagement.applicationDeadline")}
                value={formatDate(job.deadlineAt)}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label={t("adminCompanymanagement.lastUpdated")}
                value={formatDate(job.updatedAt)}
              />
              {appliedCount >= 0 && (
                <InfoRow
                  icon={<Users className="h-4 w-4" />}
                  label={t("adminCompanymanagement.numberOfCandidates")}
                  value={t("general.peopleHaveApplied", {
                    var_0: appliedCount,
                  })}
                />
              )}
            </div>

            <Separator className="my-1" />

            {/* Text content sections */}
            <ContentSection
              icon={<FileText className="h-4 w-4" />}
              title={t("common.jobDescription")}
              content={job.description}
            />
            <ContentSection
              icon={<ListChecks className="h-4 w-4" />}
              title={t("common.candidateRequirements")}
              content={job.requirements}
            />
            <ContentSection
              icon={<Gift className="h-4 w-4" />}
              title={t("adminCompanymanagement.interest")}
              content={job.benefits}
            />

            {/* Rounds section */}
            {rounds.length > 0 && (
              <div className="border-border/50 bg-card/30 rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="text-primary h-4 w-4" />
                  <h4 className="text-foreground text-sm font-bold">
                    {t("adminCompanymanagement.interviewRound")}
                    {rounds.length} {t("common.ring")}
                  </h4>
                </div>
                <div className="flex flex-col gap-2">
                  {rounds.map((round, idx) => (
                    <div
                      key={round.id ?? idx}
                      className="bg-background/50 flex items-start gap-3 rounded-lg p-3">
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                          "bg-primary"
                        )}>
                        {round.roundNumber ?? idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground text-sm font-semibold">
                          {round.name ||
                            t("common.roundVar0", {
                              var_0: round.roundNumber ?? idx + 1,
                            })}
                        </p>
                        {round.description && (
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {round.description}
                          </p>
                        )}
                      </div>
                      <CheckCircle2 className="text-muted-foreground/40 h-4 w-4 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        {onEdit && (
          <div className="border-border/50 bg-card/30 flex justify-end gap-3 border-t px-6 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("general.close")}
            </Button>
            <Button
              onClick={() => {
                onEdit(job);
                onOpenChange(false);
              }}
              className="gap-2">
              {t("adminCompanymanagement.editJd")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
