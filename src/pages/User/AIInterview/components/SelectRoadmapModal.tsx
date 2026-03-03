import { format } from "date-fns";
import { BookOpen, Calendar, Zap } from "lucide-react";
import { useState } from "react";

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

const roadmapOptions: RoadmapOption[] = [
  {
    days: 7,
    label: "7 Ngày",
    tag: "Cấp tốc",
    description: "Cường độ cao, tập trung các kỹ năng cốt lõi nhất.",
    icon: <Zap className="h-8 w-8" />,
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
    iconColor: "text-orange-500",
    disabled: false,
  },
  {
    days: 14,
    label: "14 Ngày",
    tag: "Tiêu chuẩn",
    description: "Cân bằng giữa lý thuyết và thực hành mỗi ngày.",
    icon: <Calendar className="h-8 w-8" />,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-[#0047AB]",
    disabled: false,
    recommended: true,
  },
  {
    days: 21,
    label: "21 Ngày",
    tag: "Chuyên sâu",
    description: "Hoàn thiện mọi kỹ năng từ cơ bản đến nâng cao.",
    icon: <BookOpen className="h-8 w-8" />,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600",
    disabled: true,
    disabledReason: "Sắp ra mắt",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (dateNumber: number) => void;
  loading?: boolean;
}

export function SelectRoadmapModal({ open, onClose, onConfirm, loading = false }: Props) {
  const [selected, setSelected] = useState<number>(14);
  const todayLabel = format(new Date(), "dd/MM/yyyy");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Chọn lộ trình học tập</DialogTitle>
          <DialogDescription>
            Vui lòng chọn thời gian phù hợp với mục tiêu và cường độ luyện tập của bạn
          </DialogDescription>
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
                      Khuyến dùng
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
          Lộ trình sẽ bắt đầu từ ngày{" "}
          <span className="text-foreground font-medium">{todayLabel}</span>
        </p>

        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            onClick={() => onConfirm(selected)}
            disabled={loading}
            className="bg-[#0047AB] text-white hover:bg-[#005B9A]">
            {loading ? "Đang tạo..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
