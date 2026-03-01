import { BookOpen, Briefcase, Globe, Layers, Settings, Target, User } from "lucide-react";
import type { ReactNode } from "react";

import type { InterviewConfigOptions } from "@/interfaces/schema.types";

// ============================================================================
// Constants
// ============================================================================

export const STEPS = [
  { id: 1, label: "Cấu hình", icon: Settings },
  { id: 2, label: "Hồ sơ ứng viên", icon: User },
  { id: 3, label: "Yêu cầu công việc", icon: Briefcase },
] as const;

export const CATEGORY_ICONS: Record<string, ReactNode> = {
  interview_modes: Layers({ className: "h-5 w-5" }),
  difficulties: Target({ className: "h-5 w-5" }),
  languages: Globe({ className: "h-5 w-5" }),
  domains: BookOpen({ className: "h-5 w-5" }),
};

export const CATEGORY_LABELS: Record<string, string> = {
  interview_modes: "Chế độ phỏng vấn",
  difficulties: "Độ khó",
  languages: "Ngôn ngữ",
  domains: "Lĩnh vực",
};

export const CATEGORY_COLORS: Record<
  string,
  { bg: string; border: string; text: string; icon: string }
> = {
  interview_modes: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-500",
    text: "text-violet-700 dark:text-violet-300",
    icon: "text-violet-600 dark:text-violet-400",
  },
  difficulties: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
  },
  languages: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-400",
  },
  domains: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
};

export type ConfigCategoryKey = keyof InterviewConfigOptions;

/** Candidate profile form state (for manual entry) */
export interface CandidateFormData {
  targetRole: string;
  targetLevel: string;
  introduction: string;
  technicalSkills: string[];
  softSkills: string[];
  tools: string[];
}

export const INITIAL_CANDIDATE_FORM: CandidateFormData = {
  targetRole: "",
  targetLevel: "",
  introduction: "",
  technicalSkills: [],
  softSkills: [],
  tools: [],
};

export const DURATION_OPTIONS = [
  { value: 15, label: "15 phút" },
  { value: 30, label: "30 phút" },
  { value: 45, label: "45 phút" },
  { value: 60, label: "60 phút" },
] as const;
