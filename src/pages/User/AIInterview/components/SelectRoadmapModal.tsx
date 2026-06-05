import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BookOpen, Calendar, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface RoadmapOption {
  days: number;
  label: string;
  tag: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  disabled: boolean;
  disabledReason?: string;
  recommended?: boolean;
}
interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (dateNumber: number) => void;
  loading?: boolean;
}
export function SelectRoadmapModal({ open, onClose, onConfirm, loading = false }: Props) {
  const { t } = useTranslation();

  const roadmapOptions: RoadmapOption[] = [
    {
      days: 7,
      label: t("userAiinterview.7Days"),
      tag: t("userAiinterview.express"),
      description: t("userAiinterview.highIntensityFocusingOnThe"),
      icon: <Zap className="h-8 w-8" />,
      iconBg: "bg-orange-100 dark:bg-orange-900/40",
      iconColor: "text-orange-500",
      disabled: false,
    },
    {
      days: 14,
      label: t("userAiinterview.14Days"),
      tag: t("userAiinterview.standard"),
      description: t("userAiinterview.balanceTheoryAndPracticeEvery"),
      icon: <Calendar className="h-8 w-8" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-[#0047AB]",
      disabled: false,
      recommended: true,
    },
    {
      days: 21,
      label: t("userAiinterview.21Days"),
      tag: t("userAiinterview.inDepth"),
      description: t("userAiinterview.perfectAllSkillsFromBasic"),
      icon: <BookOpen className="h-8 w-8" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600",
      disabled: true,
      disabledReason: t("userAiinterview.comingSoon"),
    },
  ];

  const [selected, setSelected] = useState<number>(14);
  const todayLabel = format(new Date(), "dd/MM/yyyy");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t("userAiinterview.chooseALearningPath")}
          </DialogTitle>
          <DialogDescription>{t("userAiinterview.pleaseChooseATimeThat")}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-3 gap-3">
          {roadmapOptions.map((option) => {
            const isSelected = selected === option.days;
            return (
              <div
                key={option.days}
                role={option.disabled ? undefined : "button"}
                tabIndex={option.disabled ? -1 : 0}
                onClick={() => !option.disabled && setSelected(option.days)}
                onKeyDown={(e) => !option.disabled && e.key === "Enter" && setSelected(option.days)}
                className={cn(
                  "relative rounded-xl border-2 p-4 text-center transition-all",
                  option.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:border-[#007BFF]/60 hover:shadow-sm",
                  isSelected && !option.disabled
                    ? "border-[#0047AB] bg-blue-50/60 shadow-md dark:bg-blue-950/30"
                    : "border-border"
                )}>
                {/* Recommended badge */}
                {option.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#0047AB] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      {t("userAiinterview.recommended")}
                    </Badge>
                  </div>
                )}

                {/* Coming soon badge for disabled */}
                {option.disabled && option.disabledReason && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-medium">
                      {option.disabledReason}
                    </Badge>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full",
                    option.iconBg,
                    option.iconColor
                  )}>
                  {option.icon}
                </div>

                {/* Label */}
                <p className="text-foreground text-base font-bold">{option.label}</p>

                {/* Tag */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "mt-1 text-xs",
                    !option.disabled && isSelected
                      ? "bg-blue-100 text-[#0047AB] dark:bg-blue-900/40"
                      : ""
                  )}>
                  {option.tag}
                </Badge>

                {/* Description */}
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  {option.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Start date note */}
        <p className="text-muted-foreground mt-1 text-center text-xs">
          {t("userAiinterview.theRouteWillStartFrom")}{" "}
          <span className="text-foreground font-medium">{todayLabel}</span>
        </p>

        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {t("userAiinterview.cancel")}
          </Button>
          <Button
            onClick={() => onConfirm(selected)}
            disabled={loading}
            className="bg-[#0047AB] text-white hover:bg-[#005B9A]">
            {loading ? t("common.creating") : t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
