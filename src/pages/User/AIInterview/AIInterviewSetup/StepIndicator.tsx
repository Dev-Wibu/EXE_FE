import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { buildSteps } from "./constants";

export function StepIndicator({ currentStep }: { currentStep: number }) {
  const { t } = useTranslation();
  const steps = buildSteps(t);
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive && "bg-[#0047AB] text-white",
                isCompleted &&
                  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}>
              {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.id}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn("h-0.5 w-8", isCompleted ? "bg-green-400" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
