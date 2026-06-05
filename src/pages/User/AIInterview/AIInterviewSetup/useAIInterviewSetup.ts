import type {
  EducationEntry,
  InterviewConfigOptionItem,
  InterviewConfigOptions,
  ProjectDetail,
  WorkExperience,
} from "@/interfaces/schema.types";
import { $api, fetchClient } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import {
  useCandidateProfile,
  useCreateCandidateProfile,
  useUpdateCandidateProfile,
} from "@/services/candidate-profile.manager";
import { usersAdminManager } from "@/services/users-admin.manager";
import { useAuthStore } from "@/stores/authStore";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  INITIAL_CANDIDATE_FORM,
  type CandidateFormData,
  type ConfigCategoryKey,
} from "./constants";
export function useAIInterviewSetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  // Step navigation
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Config state
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Step 1: Duration state
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  // Step 2: Candidate profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  // Stores the profile id returned by uploadCv (backend saves automatically on upload)
  const [uploadedProfileId, setUploadedProfileId] = useState<number | null>(null);
  const [candidateForm, setCandidateForm] = useState<CandidateFormData>(INITIAL_CANDIDATE_FORM);
  const [softSkillInput, setSoftSkillInput] = useState("");
  const [toolInput, setToolInput] = useState("");
  const [techSkillInput, setTechSkillInput] = useState("");
  const [certificationInput, setCertificationInput] = useState("");
  const [achievementInput, setAchievementInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Job requirement state
  const [jobDescription, setJobDescription] = useState("");
  const [isGeneratingJR, setIsGeneratingJR] = useState(false);
  const [generatedJR, setGeneratedJR] = useState<Record<string, unknown> | null>(null);
  const [isEditingJR, setIsEditingJR] = useState(false);
  const [hardSkillInputJR, setHardSkillInputJR] = useState("");
  const [softSkillInputJR, setSoftSkillInputJR] = useState("");
  const [toolInputJR, setToolInputJR] = useState("");
  const [responsibilityInputJR, setResponsibilityInputJR] = useState("");

  // Creating session state
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const isCreatingRef = useRef(false);

  // API: config options
  const {
    data: configData,
    isLoading: configLoading,
    isError: configError,
  } = $api.useQuery("get", "/api/interview-sessions/config-options");
  const configOptions = configData as InterviewConfigOptions | undefined;

  // API: existing candidate profile
  const { data: existingProfile, isLoading: profileLoading } = useCandidateProfile(userId ?? 0);
  const hasExistingProfile =
    existingProfile && typeof existingProfile === "object" && "id" in existingProfile;

  // API mutations
  const generateJRMutation = $api.useMutation(
    "post",
    "/api/interview-sessions/generate-job-requirement"
  );
  const createProfileMutation = useCreateCandidateProfile();
  const updateProfileMutation = useUpdateCandidateProfile();

  // ---- Step validation ----
  const isStep1Complete =
    selectedMode !== null &&
    selectedDifficulty !== null &&
    selectedLanguage !== null &&
    selectedDomain !== null;
  const isStep2Complete = !!hasExistingProfile && !isEditingProfile;
  const isStep3Complete = !!generatedJR;

  // ---- Helpers ----
  const getSelectedLabel = (categoryKey: ConfigCategoryKey, selectedKey: string | null): string => {
    if (!configOptions || !selectedKey) return t("common.notSelectedYet");
    const items = configOptions[categoryKey];
    const found = items?.find((item: InterviewConfigOptionItem) => item.key === selectedKey);
    return found?.label ?? t("common.notSelectedYet");
  };
  const updateCandidateForm = (field: keyof CandidateFormData, value: string | string[]) => {
    setCandidateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const addTechSkill = () => {
    const value = techSkillInput.trim();
    if (!value) return;
    if (candidateForm.technicalSkills.some((s) => s.toLowerCase() === value.toLowerCase())) return;
    setCandidateForm((prev) => ({
      ...prev,
      technicalSkills: [...prev.technicalSkills, value],
    }));
    setTechSkillInput("");
  };
  const removeTechSkill = (index: number) => {
    setCandidateForm((prev) => ({
      ...prev,
      technicalSkills: prev.technicalSkills.filter((_, i) => i !== index),
    }));
  };
  const addSoftSkill = () => {
    const value = softSkillInput.trim();
    if (!value) return;
    if (candidateForm.softSkills.some((s) => s.toLowerCase() === value.toLowerCase())) return;
    setCandidateForm((prev) => ({
      ...prev,
      softSkills: [...prev.softSkills, value],
    }));
    setSoftSkillInput("");
  };
  const removeSoftSkill = (index: number) => {
    setCandidateForm((prev) => ({
      ...prev,
      softSkills: prev.softSkills.filter((_, i) => i !== index),
    }));
  };
  const addTool = () => {
    const value = toolInput.trim();
    if (!value) return;
    if (candidateForm.tools.some((t) => t.toLowerCase() === value.toLowerCase())) return;
    setCandidateForm((prev) => ({
      ...prev,
      tools: [...prev.tools, value],
    }));
    setToolInput("");
  };
  const removeTool = (index: number) => {
    setCandidateForm((prev) => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index),
    }));
  };
  const populateFormFromProfile = (source: Record<string, unknown>) => {
    setCandidateForm({
      targetRole: String(source.targetRole ?? ""),
      targetLevel: String(source.targetLevel ?? ""),
      introduction: String(source.introduction ?? ""),
      technicalSkills: Array.isArray(source.technicalSkills)
        ? (source.technicalSkills as string[])
        : [],
      softSkills: Array.isArray(source.softSkills) ? (source.softSkills as string[]) : [],
      tools: Array.isArray(source.tools) ? (source.tools as string[]) : [],
      certifications: Array.isArray(source.certifications)
        ? (source.certifications as string[])
        : [],
      achievements: Array.isArray(source.achievements) ? (source.achievements as string[]) : [],
      projects: Array.isArray(source.projects) ? (source.projects as ProjectDetail[]) : [],
      workExperiences: Array.isArray(source.workExperiences)
        ? (source.workExperiences as WorkExperience[])
        : [],
      educations: Array.isArray(source.educations) ? (source.educations as EducationEntry[]) : [],
    });
    setTechSkillInput("");
    setSoftSkillInput("");
    setToolInput("");
    setCertificationInput("");
    setAchievementInput("");
    setIsEditingProfile(true);
  };

  // ---- Actions ----
  const handleStartEditing = () => {
    if (existingProfile) {
      populateFormFromProfile(existingProfile as unknown as Record<string, unknown>);
    }
    setIsEditingProfile(true);
  };
  const handleCancelEditing = () => {
    setCandidateForm(INITIAL_CANDIDATE_FORM);
    setTechSkillInput("");
    setSoftSkillInput("");
    setToolInput("");
    setCertificationInput("");
    setAchievementInput("");
    setUploadedProfileId(null);
    setIsEditingProfile(false);
  };
  const handleSaveProfile = async () => {
    if (!userId || !candidateForm.targetRole.trim() || !candidateForm.introduction.trim()) return;
    setIsSavingProfile(true);

    // Determine the profile id: prefer the fetched profile id, then the id returned after CV upload
    const fetchedId = hasExistingProfile
      ? ((existingProfile as Record<string, unknown>).id as number | undefined)
      : undefined;
    const resolvedId = fetchedId ?? uploadedProfileId ?? undefined;
    const isUpdate = resolvedId !== undefined;
    const body = {
      // PUT requires existing id; POST requires id: 0 (backend contract)
      id: isUpdate ? resolvedId : 0,
      user: {
        id: userId,
      },
      targetRole: candidateForm.targetRole,
      targetLevel: candidateForm.targetLevel,
      introduction: candidateForm.introduction,
      technicalSkills: candidateForm.technicalSkills.filter(Boolean),
      softSkills: candidateForm.softSkills.filter(Boolean),
      tools: candidateForm.tools.filter(Boolean),
      certifications: candidateForm.certifications.filter(Boolean),
      achievements: candidateForm.achievements.filter(Boolean),
      projects: candidateForm.projects,
      workExperiences: candidateForm.workExperiences,
      educations: candidateForm.educations,
    };
    try {
      if (isUpdate) {
        await updateProfileMutation.mutateAsync({
          body: body as never,
        });
      } else {
        await createProfileMutation.mutateAsync({
          body: body as never,
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ["get", "/api/candidate-profiles/{userId}"],
      });
      setCandidateForm(INITIAL_CANDIDATE_FORM);
      setCertificationInput("");
      setAchievementInput("");
      setUploadedProfileId(null);
      setIsEditingProfile(false);
      toast.success(t("userAiinterview.candidateProfileSavedSuccessfully"));
    } catch {
      toast.error(t("userAiinterview.unableToSaveProfilePlease"));
    } finally {
      setIsSavingProfile(false);
    }
  };
  const handleUploadCV = async (file: File) => {
    if (!userId) return;
    setIsUploading(true);
    try {
      const response = await usersAdminManager.uploadCv(userId, file);
      if (!response.success || !response.data) {
        throw new Error(response.error || t("userAiinterview.cvUploadFailed"));
      }
      const cvProfile = response.data as unknown as Record<string, unknown>;
      // Tự động điền form từ kết quả CV — người dùng xem lại rồi nhấn Lưu
      populateFormFromProfile(cvProfile);
      // Backend lưu profile ngay khi upload CV -> dùng PUT khi người dùng nhấn Lưu
      if (typeof cvProfile.id === "number" && cvProfile.id > 0) {
        setUploadedProfileId(cvProfile.id);
      }
      setIsEditingProfile(true);
      toast.success(t("userAiinterview.cvUploadedSuccessfullyCheckThe"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("userAiinterview.cvUploadFailedPleaseTry")
      );
    } finally {
      setIsUploading(false);
    }
  };

  // ---- Certification / Achievement helpers (tag-style) ----
  const addCertification = () => {
    const value = certificationInput.trim();
    if (!value) return;
    if (candidateForm.certifications.some((c) => c.toLowerCase() === value.toLowerCase())) return;
    setCandidateForm((prev) => ({
      ...prev,
      certifications: [...prev.certifications, value],
    }));
    setCertificationInput("");
  };
  const removeCertification = (index: number) => {
    setCandidateForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };
  const addAchievement = () => {
    const value = achievementInput.trim();
    if (!value) return;
    if (candidateForm.achievements.some((a) => a.toLowerCase() === value.toLowerCase())) return;
    setCandidateForm((prev) => ({
      ...prev,
      achievements: [...prev.achievements, value],
    }));
    setAchievementInput("");
  };
  const removeAchievement = (index: number) => {
    setCandidateForm((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
  };

  // ---- Project helpers ----
  const addProject = () => {
    setCandidateForm((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
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
    setCandidateForm((prev) => {
      const projects = [...prev.projects];
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
    setCandidateForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  // ---- Work Experience helpers ----
  const addWorkExperience = () => {
    setCandidateForm((prev) => ({
      ...prev,
      workExperiences: [
        ...prev.workExperiences,
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
    setCandidateForm((prev) => {
      const workExperiences = [...prev.workExperiences];
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
    setCandidateForm((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, i) => i !== index),
    }));
  };

  // ---- Education helpers ----
  const addEducation = () => {
    setCandidateForm((prev) => ({
      ...prev,
      educations: [
        ...prev.educations,
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
    setCandidateForm((prev) => {
      const educations = [...prev.educations];
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
    setCandidateForm((prev) => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index),
    }));
  };
  const handleGenerateJR = async () => {
    if (!jobDescription.trim()) {
      toast.error(t("userAiinterview.pleaseEnterJobDescription"));
      return;
    }
    setIsGeneratingJR(true);
    try {
      const result = await generateJRMutation.mutateAsync({
        body: jobDescription as unknown as never,
      });
      setGeneratedJR(result as unknown as Record<string, unknown>);
      setIsEditingJR(false);
      toast.success(t("userAiinterview.jobRequestCreatedSuccessfully"));
    } catch {
      toast.error(t("userAiinterview.unableToCreateWorkRequest"));
    } finally {
      setIsGeneratingJR(false);
    }
  };
  const updateJRBasicInfo = (field: string, value: string) => {
    setGeneratedJR((prev) =>
      prev
        ? {
            ...prev,
            basic_info: {
              ...(prev.basic_info as Record<string, string>),
              [field]: value,
            },
          }
        : prev
    );
  };
  const addJRCompetency = (
    type: "hard_skills" | "soft_skills" | "tools_and_platforms",
    value: string
  ) => {
    if (!value.trim()) return;
    setGeneratedJR((prev) => {
      if (!prev) return prev;
      const competencies = (prev.competencies as Record<string, unknown>) ?? {};
      const current = Array.isArray(competencies[type]) ? (competencies[type] as string[]) : [];
      if (current.some((s) => s.toLowerCase() === value.trim().toLowerCase())) return prev;
      return {
        ...prev,
        competencies: {
          ...competencies,
          [type]: [...current, value.trim()],
        },
      };
    });
  };
  const removeJRCompetency = (
    type: "hard_skills" | "soft_skills" | "tools_and_platforms",
    index: number
  ) => {
    setGeneratedJR((prev) => {
      if (!prev) return prev;
      const competencies = (prev.competencies as Record<string, unknown>) ?? {};
      const current = Array.isArray(competencies[type]) ? (competencies[type] as string[]) : [];
      return {
        ...prev,
        competencies: {
          ...competencies,
          [type]: current.filter((_, i) => i !== index),
        },
      };
    });
  };
  const addJRResponsibility = (value: string) => {
    if (!value.trim()) return;
    setGeneratedJR((prev) => {
      if (!prev) return prev;
      const current = Array.isArray(prev.responsibilities)
        ? (prev.responsibilities as string[])
        : [];
      return {
        ...prev,
        responsibilities: [...current, value.trim()],
      };
    });
  };
  const removeJRResponsibility = (index: number) => {
    setGeneratedJR((prev) => {
      if (!prev) return prev;
      const current = Array.isArray(prev.responsibilities)
        ? (prev.responsibilities as string[])
        : [];
      return {
        ...prev,
        responsibilities: current.filter((_, i) => i !== index),
      };
    });
  };
  const updateJRResponsibility = (index: number, value: string) => {
    setGeneratedJR((prev) => {
      if (!prev) return prev;
      const current = Array.isArray(prev.responsibilities)
        ? [...(prev.responsibilities as string[])]
        : [];
      current[index] = value;
      return {
        ...prev,
        responsibilities: current,
      };
    });
  };

  // Hồ sơ luôn được lấy từ DB sau bước lưu — đảm bảo dữ liệu nhất quán với backend
  const buildCandidateProfile = () => existingProfile;
  const handleCreateSession = async () => {
    if (
      isCreatingRef.current ||
      !isStep1Complete ||
      !isStep2Complete ||
      !isStep3Complete ||
      !userId
    )
      return;
    isCreatingRef.current = true;
    setIsCreatingSession(true);
    try {
      const body = {
        user_id: userId,
        candidate_profile: buildCandidateProfile(),
        job_requirement: generatedJR,
        session_config: {
          duration_minutes: selectedDuration,
          interview_mode: selectedMode,
          difficulty: selectedDifficulty,
          language: selectedLanguage,
          domain: selectedDomain,
        },
      };

      // parseAs: "text" vì endpoint trả về plain text UUID, không phải JSON
      const { data, error } = await fetchClient.POST("/api/interview-sessions/create-session", {
        body: body as never,
        parseAs: "text",
      });
      if (error || !data) {
        throw new Error(t("userAiinterview.unableToCreateInterviewSession"));
      }
      const rawKey = (data as string).trim().replace(/^"|"$/g, "");

      // Đảm bảo nhận đúng UUID (8-4-4-4-12) từ backend
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawKey)) {
        throw new Error(
          t("general.invalidResponseFromServer", {
            var_0: rawKey.slice(0, 100),
          })
        );
      }
      const key = rawKey;

      // Lưu vào interview-session-keys để khôi phục lịch sử chat khi tải lại trang
      try {
        const stored = JSON.parse(localStorage.getItem("interview-session-keys") ?? "{}");
        stored[key] = {
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("interview-session-keys", JSON.stringify(stored));
      } catch {
        /* ignore */
      }
      toast.success(t("userAiinterview.successfullyCreatedInterviewSession"));
      navigate(`/user/ai-interview/session?sessionKey=${key}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("userAiinterview.unableToCreateInterviewSession")
      );
    } finally {
      isCreatingRef.current = false;
      setIsCreatingSession(false);
    }
  };
  const handleNext = () => {
    if (currentStep === 1 && isStep1Complete) setCurrentStep(2);
    else if (currentStep === 2 && isStep2Complete) setCurrentStep(3);
    else if (currentStep === 3 && isStep3Complete) handleCreateSession();
  };
  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else navigate("/user?tab=aiInterview");
  };
  const canProceed =
    (currentStep === 1 && isStep1Complete) ||
    (currentStep === 2 && isStep2Complete) ||
    (currentStep === 3 && isStep3Complete);
  return {
    // Navigation
    currentStep,
    handleNext,
    handleBack,
    canProceed,
    isCreatingSession,
    // Step 1
    configOptions,
    configLoading,
    configError,
    selectedMode,
    setSelectedMode,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedLanguage,
    setSelectedLanguage,
    selectedDomain,
    setSelectedDomain,
    selectedDuration,
    setSelectedDuration,
    isStep1Complete,
    getSelectedLabel,
    // Step 2
    isEditingProfile,
    setIsEditingProfile,
    isSavingProfile,
    candidateForm,
    updateCandidateForm,
    techSkillInput,
    setTechSkillInput,
    addTechSkill,
    removeTechSkill,
    softSkillInput,
    setSoftSkillInput,
    addSoftSkill,
    removeSoftSkill,
    toolInput,
    setToolInput,
    addTool,
    removeTool,
    certificationInput,
    setCertificationInput,
    addCertification,
    removeCertification,
    achievementInput,
    setAchievementInput,
    addAchievement,
    removeAchievement,
    addProject,
    updateProject,
    removeProject,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    addEducation,
    updateEducation,
    removeEducation,
    isUploading,
    fileInputRef,
    handleUploadCV,
    handleStartEditing,
    handleCancelEditing,
    handleSaveProfile,
    existingProfile,
    profileLoading,
    hasExistingProfile,
    isStep2Complete,
    // Step 3
    jobDescription,
    setJobDescription,
    isGeneratingJR,
    handleGenerateJR,
    generatedJR,
    setGeneratedJR,
    isEditingJR,
    setIsEditingJR,
    hardSkillInputJR,
    setHardSkillInputJR,
    softSkillInputJR,
    setSoftSkillInputJR,
    toolInputJR,
    setToolInputJR,
    responsibilityInputJR,
    setResponsibilityInputJR,
    updateJRBasicInfo,
    addJRCompetency,
    removeJRCompetency,
    addJRResponsibility,
    removeJRResponsibility,
    updateJRResponsibility,
    isStep3Complete,
  };
}
export type AIInterviewSetupHook = ReturnType<typeof useAIInterviewSetup>;
