import type {
  CandidateProfile,
  EducationEntry,
  ProjectDetail,
  WorkExperience,
} from "@/interfaces/schema.types";
import { queryClient } from "@/lib/queryClient";
import {
  useCandidateProfile,
  useCreateCandidateProfile,
  useUpdateCandidateProfile,
} from "@/services/candidate-profile.manager";
import { useAuthStore } from "@/stores/authStore";
import type { TFunction } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
export type SkillField = "technicalSkills" | "softSkills" | "tools";
export type ListField = SkillField | "certifications" | "achievements";
export const buildSkillTabs = (t: TFunction) => [
  {
    key: "technicalSkills" as SkillField,
    label: t("common.technicalSkills"),
  },
  {
    key: "softSkills" as SkillField,
    label: t("common.softSkills"),
  },
  {
    key: "tools" as SkillField,
    label: t("common.tools"),
  },
];
export function useCandidateProfileForm() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? 0;
  const { data: profileData, isLoading, error, refetch } = useCandidateProfile(userId);
  const profile = (profileData as unknown as CandidateProfile) ?? null;
  const createMutation = useCreateCandidateProfile();
  const updateMutation = useUpdateCandidateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CandidateProfile>>({});
  const [activeSkillTab, setActiveSkillTab] = useState<SkillField>("technicalSkills");
  const [newSkillValue, setNewSkillValue] = useState<Record<SkillField, string>>({
    technicalSkills: "",
    softSkills: "",
    tools: "",
  });
  const [techSkillsInput, setTechSkillsInput] = useState<string[]>([]);
  const [softSkillsInput, setSoftSkillsInput] = useState<string[]>([]);
  const [toolsInput, setToolsInput] = useState<string[]>([]);
  const [certificationsInput, setCertificationsInput] = useState<string[]>([]);
  const [achievementsInput, setAchievementsInput] = useState<string[]>([]);
  const hasProfile = !!profile?.id;
  const startEditing = () => {
    if (hasProfile) {
      setFormData({
        targetRole: profile.targetRole ?? "",
        targetLevel: profile.targetLevel ?? "",
        introduction: profile.introduction ?? "",
        projects: profile.projects ?? [],
        workExperiences: profile.workExperiences ?? [],
        educations: profile.educations ?? [],
      });
      setTechSkillsInput(profile.technicalSkills ?? []);
      setSoftSkillsInput(profile.softSkills ?? []);
      setToolsInput(profile.tools ?? []);
      setCertificationsInput(profile.certifications ?? [""]);
      setAchievementsInput(profile.achievements ?? [""]);
    } else {
      setFormData({
        targetRole: "",
        targetLevel: "",
        introduction: "",
        projects: [],
        workExperiences: [],
        educations: [],
      });
      setTechSkillsInput([]);
      setSoftSkillsInput([]);
      setToolsInput([]);
      setCertificationsInput([""]);
      setAchievementsInput([""]);
    }
    setActiveSkillTab("technicalSkills");
    setNewSkillValue({
      technicalSkills: "",
      softSkills: "",
      tools: "",
    });
    setIsEditing(true);
  };
  const cancelEditing = () => {
    setIsEditing(false);
  };
  const handleSave = async () => {
    const payload: Partial<CandidateProfile> = {
      ...formData,
      technicalSkills: techSkillsInput.map((s) => s.trim()).filter(Boolean),
      softSkills: softSkillsInput.map((s) => s.trim()).filter(Boolean),
      tools: toolsInput.map((s) => s.trim()).filter(Boolean),
      certifications: certificationsInput.map((s) => s.trim()).filter(Boolean),
      achievements: achievementsInput.map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (hasProfile) {
        await updateMutation.mutateAsync({
          body: {
            id: profile.id,
            user: profile.user,
            ...payload,
          } as never,
        });
        toast.success(t("userAccount.profileUpdatedSuccessfully"));
      } else {
        await createMutation.mutateAsync({
          body: {
            user: {
              id: userId,
            },
            ...payload,
          } as never,
        });
        toast.success(t("userAccount.profileCreatedSuccessfully"));
      }
      await queryClient.invalidateQueries({
        queryKey: ["get", "/api/candidate-profiles/{userId}"],
      });
      await refetch();
      setIsEditing(false);
    } catch {
      toast.error(t("userAccount.anErrorOccurredPleaseTry"));
    }
  };
  const getSkillList = (field: SkillField): string[] => {
    switch (field) {
      case "technicalSkills":
        return techSkillsInput;
      case "softSkills":
        return softSkillsInput;
      case "tools":
        return toolsInput;
    }
  };
  const setSkillList = (field: SkillField, updater: (_prev: string[]) => string[]) => {
    switch (field) {
      case "technicalSkills":
        setTechSkillsInput(updater);
        break;
      case "softSkills":
        setSoftSkillsInput(updater);
        break;
      case "tools":
        setToolsInput(updater);
        break;
    }
  };
  const addSkillBadge = (field: SkillField) => {
    const value = newSkillValue[field].trim();
    if (!value) return;
    setSkillList(field, (prev) => {
      if (prev.some((item) => item.toLowerCase() === value.toLowerCase())) return prev;
      return [...prev, value];
    });
    setNewSkillValue((prev) => ({
      ...prev,
      [field]: "",
    }));
  };
  const removeSkillBadge = (field: SkillField, index: number) => {
    setSkillList(field, (prev) => prev.filter((_, i) => i !== index));
  };
  const addListItem = (field: Exclude<ListField, SkillField>) => {
    if (field === "certifications") {
      setCertificationsInput((prev) => [...prev, ""]);
      return;
    }
    setAchievementsInput((prev) => [...prev, ""]);
  };
  const updateListItem = (field: Exclude<ListField, SkillField>, index: number, value: string) => {
    if (field === "certifications") {
      setCertificationsInput((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
      return;
    }
    setAchievementsInput((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const removeListItem = (field: Exclude<ListField, SkillField>, index: number) => {
    if (field === "certifications") {
      setCertificationsInput((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setAchievementsInput((prev) => prev.filter((_, i) => i !== index));
  };
  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects ?? []),
        {
          name: "",
          description: "",
          role: "",
          teamSize: 1,
          usedTools: [],
          outcome: "",
        },
      ],
    }));
  };
  const updateProject = (
    index: number,
    field: keyof ProjectDetail,
    value: string | number | string[]
  ) => {
    setFormData((prev) => {
      const projects = [...(prev.projects ?? [])];
      projects[index] = {
        ...projects[index],
        [field]: value,
      };
      return {
        ...prev,
        projects,
      };
    });
  };
  const removeProject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: (prev.projects ?? []).filter((_, i) => i !== index),
    }));
  };
  const addWorkExperience = () => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: [
        ...(prev.workExperiences ?? []),
        {
          company: "",
          position: "",
          description: "",
          start_date: "",
          end_date: "",
        },
      ],
    }));
  };
  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string) => {
    setFormData((prev) => {
      const workExperiences = [...(prev.workExperiences ?? [])];
      workExperiences[index] = {
        ...workExperiences[index],
        [field]: value,
      };
      return {
        ...prev,
        workExperiences,
      };
    });
  };
  const removeWorkExperience = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: (prev.workExperiences ?? []).filter((_, i) => i !== index),
    }));
  };
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      educations: [
        ...(prev.educations ?? []),
        {
          school: "",
          major: "",
          degree: "",
          gpa: "",
          start_date: "",
          end_date: "",
        },
      ],
    }));
  };
  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setFormData((prev) => {
      const educations = [...(prev.educations ?? [])];
      educations[index] = {
        ...educations[index],
        [field]: value,
      };
      return {
        ...prev,
        educations,
      };
    });
  };
  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      educations: (prev.educations ?? []).filter((_, i) => i !== index),
    }));
  };
  return {
    profile,
    isLoading,
    error,
    isEditing,
    hasProfile,
    formData,
    setFormData,
    activeSkillTab,
    setActiveSkillTab,
    newSkillValue,
    setNewSkillValue,
    techSkillsInput,
    softSkillsInput,
    toolsInput,
    certificationsInput,
    achievementsInput,
    createMutation,
    updateMutation,
    startEditing,
    cancelEditing,
    handleSave,
    getSkillList,
    addSkillBadge,
    removeSkillBadge,
    addListItem,
    updateListItem,
    removeListItem,
    addProject,
    updateProject,
    removeProject,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    addEducation,
    updateEducation,
    removeEducation,
  };
}
