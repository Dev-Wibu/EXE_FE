import type {
  EducationEntry,
  InterviewConfigOptions,
  ProjectDetail,
  WorkExperience,
} from "@/interfaces/schema.types";
import type { TFunction } from "i18next";
import { BookOpen, Briefcase, Globe, Layers, Settings, Target, User } from "lucide-react";
import type { ElementType } from "react";

// ============================================================================
// Constants (non-translated)
// ============================================================================

export const buildSteps = (t: TFunction) =>
  [
    {
      id: 1,
      label: t("userAiinterview.configuration"),
      icon: Settings,
    },
    {
      id: 2,
      label: t("common.candidateProfile"),
      icon: User,
    },
    {
      id: 3,
      label: t("userAiinterview.jobRequirements"),
      icon: Briefcase,
    },
  ] as const;

// Store component references — rendered as <Icon className="h-5 w-5" /> at call site
export const CATEGORY_ICONS: Record<string, ElementType> = {
  interview_modes: Layers,
  difficulties: Target,
  languages: Globe,
  domains: BookOpen,
};
export const buildCategoryLabels = (t: TFunction): Record<string, string> => ({
  interview_modes: t("common.interviewMode"),
  difficulties: t("userAiinterview.difficultyLevel"),
  languages: t("common.language"),
  domains: t("userAiinterview.field"),
});
export const CATEGORY_COLORS: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    icon: string;
  }
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
  certifications: string[];
  achievements: string[];
  projects: ProjectDetail[];
  workExperiences: WorkExperience[];
  educations: EducationEntry[];
}
export const INITIAL_CANDIDATE_FORM: CandidateFormData = {
  targetRole: "",
  targetLevel: "",
  introduction: "",
  technicalSkills: [],
  softSkills: [],
  tools: [],
  certifications: [],
  achievements: [],
  projects: [],
  workExperiences: [],
  educations: [],
};
export const buildDurationOptions = (t: TFunction) =>
  [
    {
      value: 15,
      label: t("userAiinterview.15Minutes"),
    },
    {
      value: 30,
      label: t("userAiinterview.30Minutes"),
    },
    {
      value: 45,
      label: t("userAiinterview.45Minutes"),
    },
    {
      value: 60,
      label: t("userAiinterview.60Minutes"),
    },
  ] as const;
