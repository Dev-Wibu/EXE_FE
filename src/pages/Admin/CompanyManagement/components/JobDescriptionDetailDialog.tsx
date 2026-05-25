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

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/formatting";
import {
  getJobDescriptionLevelBadge,
  getJobDescriptionStatusBadge,
} from "@/lib/status-utils";
import { cn } from "@/lib/utils";

import type { JobDescription } from "../types";

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
  if (salaryMin == null && salaryMax == null) return "Thỏa thuận";
  const currencyNote = currency && currency.toUpperCase() !== "VND" ? ` (${currency})` : "";
  if (salaryMin != null && salaryMax != null) {
    return `${formatCurrency(salaryMin)} - ${formatCurrency(salaryMax)}${currencyNote}`;
  }
  if (salaryMin != null) return `Từ ${formatCurrency(salaryMin)}${currencyNote}`;
  return `Đến ${formatCurrency(salaryMax ?? 0)}${currencyNote}`;
};

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
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
    <div className="rounded-xl border border-border/50 bg-card/30 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{content}</p>
    </div>
  );
}

export function JobDescriptionDetailDialog({
  isOpen,
  onOpenChange,
  jobDescription: job,
  onEdit,
}: JobDescriptionDetailDialogProps) {
  if (!job) return null;

  const statusConfig = getJobDescriptionStatusBadge(job.status);
  const levelConfig = getJobDescriptionLevelBadge(job.level);

  // Safely get rounds/appliedCount from backend response (may not be in types yet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobAny = job as any;
  const rounds: Array<{ id?: number; name?: string; description?: string; roundNumber?: number }> =
    Array.isArray(jobAny.rounds) ? jobAny.rounds : [];
  const appliedCount: number = typeof jobAny.appliedCount === "number" ? jobAny.appliedCount : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground pr-8">
              {job.title || "Chi tiết JD"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge {...statusConfig} />
            <StatusBadge {...levelConfig} />
            {appliedCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
                <Users className="h-3.5 w-3.5" />
                {appliedCount} lượt ứng tuyển
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
                label="Mức lương"
                value={formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Hạn nộp hồ sơ"
                value={formatDate(job.deadlineAt)}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Cập nhật lần cuối"
                value={formatDate(job.updatedAt)}
              />
              {appliedCount >= 0 && (
                <InfoRow
                  icon={<Users className="h-4 w-4" />}
                  label="Số ứng viên"
                  value={`${appliedCount} người đã ứng tuyển`}
                />
              )}
            </div>

            <Separator className="my-1" />

            {/* Text content sections */}
            <ContentSection
              icon={<FileText className="h-4 w-4" />}
              title="Mô tả công việc"
              content={job.description}
            />
            <ContentSection
              icon={<ListChecks className="h-4 w-4" />}
              title="Yêu cầu ứng viên"
              content={job.requirements}
            />
            <ContentSection
              icon={<Gift className="h-4 w-4" />}
              title="Quyền lợi"
              content={job.benefits}
            />

            {/* Rounds section */}
            {rounds.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card/30 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-bold text-foreground">
                    Vòng phỏng vấn ({rounds.length} vòng)
                  </h4>
                </div>
                <div className="flex flex-col gap-2">
                  {rounds.map((round, idx) => (
                    <div
                      key={round.id ?? idx}
                      className="flex items-start gap-3 rounded-lg bg-background/50 p-3"
                    >
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                          "bg-primary"
                        )}
                      >
                        {round.roundNumber ?? idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {round.name || `Vòng ${round.roundNumber ?? idx + 1}`}
                        </p>
                        {round.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{round.description}</p>
                        )}
                      </div>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        {onEdit && (
          <div className="flex justify-end gap-3 border-t border-border/50 bg-card/30 px-6 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button
              onClick={() => {
                onEdit(job);
                onOpenChange(false);
              }}
              className="gap-2"
            >
              Chỉnh sửa JD
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
