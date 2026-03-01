import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import type { InterviewConfigOptionItem, InterviewConfigOptions } from "@/interfaces/schema.types";
import { $api, fetchClient } from "@/lib/api";
import { useCandidateProfile } from "@/services/candidate-profile.manager";
import { usersAdminManager } from "@/services/users-admin.manager";
import { useAuthStore } from "@/stores/authStore";

import {
  INITIAL_CANDIDATE_FORM,
  type CandidateFormData,
  type ConfigCategoryKey,
} from "./constants";

export function useAIInterviewSetup() {
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
  const [profileMode, setProfileMode] = useState<"existing" | "manual" | "upload">("existing");
  const [candidateForm, setCandidateForm] = useState<CandidateFormData>(INITIAL_CANDIDATE_FORM);
  const [softSkillInput, setSoftSkillInput] = useState("");
  const [toolInput, setToolInput] = useState("");
  const [techSkillInput, setTechSkillInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedProfile, setUploadedProfile] = useState<Record<string, unknown> | null>(null);
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

  // ---- Step validation ----
  const isStep1Complete =
    selectedMode !== null &&
    selectedDifficulty !== null &&
    selectedLanguage !== null &&
    selectedDomain !== null;

  const isStep2Complete = (() => {
    if (profileMode === "existing") return !!hasExistingProfile;
    if (profileMode === "upload") return !!uploadedProfile;
    if (profileMode === "manual")
      return candidateForm.targetRole.trim() !== "" && candidateForm.introduction.trim() !== "";
    return false;
  })();

  const isStep3Complete = !!generatedJR;

  // ---- Helpers ----
  const getSelectedLabel = (categoryKey: ConfigCategoryKey, selectedKey: string | null): string => {
    if (!configOptions || !selectedKey) return "Chưa chọn";
    const items = configOptions[categoryKey];
    const found = items?.find((item: InterviewConfigOptionItem) => item.key === selectedKey);
    return found?.label ?? "Chưa chọn";
  };

  const updateCandidateForm = (field: keyof CandidateFormData, value: string | string[]) => {
    setCandidateForm((prev) => ({ ...prev, [field]: value }));
  };

  const addTechSkill = () => {
    const value = techSkillInput.trim();
    if (!value) return;
    if (candidateForm.technicalSkills.some((s) => s.toLowerCase() === value.toLowerCase())) return;
    setCandidateForm((prev) => ({ ...prev, technicalSkills: [...prev.technicalSkills, value] }));
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
    setCandidateForm((prev) => ({ ...prev, softSkills: [...prev.softSkills, value] }));
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
    setCandidateForm((prev) => ({ ...prev, tools: [...prev.tools, value] }));
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
    });
    setTechSkillInput("");
    setSoftSkillInput("");
    setToolInput("");
    setProfileMode("manual");
  };

  // ---- Actions ----
  const handleUploadCV = async (file: File) => {
    if (!userId) return;
    setIsUploading(true);
    try {
      const response = await usersAdminManager.uploadCv(userId, file);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Tải CV lên thất bại");
      }
      setUploadedProfile(response.data as unknown as Record<string, unknown>);
      setProfileMode("upload");
      toast.success("Tải CV lên thành công! Hồ sơ đã được tạo từ CV.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Tải CV lên thất bại. Vui lòng thử lại."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateJR = async () => {
    if (!jobDescription.trim()) {
      toast.error("Vui lòng nhập mô tả công việc.");
      return;
    }
    setIsGeneratingJR(true);
    try {
      const result = await generateJRMutation.mutateAsync({
        body: jobDescription as unknown as never,
      });
      setGeneratedJR(result as unknown as Record<string, unknown>);
      setIsEditingJR(false);
      toast.success("Đã tạo yêu cầu công việc thành công!");
    } catch {
      toast.error("Không thể tạo yêu cầu công việc. Vui lòng thử lại.");
    } finally {
      setIsGeneratingJR(false);
    }
  };

  const updateJRBasicInfo = (field: string, value: string) => {
    setGeneratedJR((prev) =>
      prev
        ? {
            ...prev,
            basic_info: { ...(prev.basic_info as Record<string, string>), [field]: value },
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
        competencies: { ...competencies, [type]: [...current, value.trim()] },
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
        competencies: { ...competencies, [type]: current.filter((_, i) => i !== index) },
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
      return { ...prev, responsibilities: [...current, value.trim()] };
    });
  };

  const removeJRResponsibility = (index: number) => {
    setGeneratedJR((prev) => {
      if (!prev) return prev;
      const current = Array.isArray(prev.responsibilities)
        ? (prev.responsibilities as string[])
        : [];
      return { ...prev, responsibilities: current.filter((_, i) => i !== index) };
    });
  };

  const updateJRResponsibility = (index: number, value: string) => {
    setGeneratedJR((prev) => {
      if (!prev) return prev;
      const current = Array.isArray(prev.responsibilities)
        ? [...(prev.responsibilities as string[])]
        : [];
      current[index] = value;
      return { ...prev, responsibilities: current };
    });
  };

  const buildCandidateProfile = () => {
    if (profileMode === "existing" && hasExistingProfile) return existingProfile;
    if (profileMode === "upload" && uploadedProfile) return uploadedProfile;
    return {
      targetRole: candidateForm.targetRole,
      targetLevel: candidateForm.targetLevel,
      introduction: candidateForm.introduction,
      technicalSkills: candidateForm.technicalSkills.filter(Boolean),
      softSkills: candidateForm.softSkills.filter(Boolean),
      tools: candidateForm.tools.filter(Boolean),
    };
  };

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
        throw new Error("Create session failed");
      }

      const rawKey = (data as string).trim().replace(/^"|"$/g, "");

      // Đảm bảo nhận đúng UUID (8-4-4-4-12) từ backend
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawKey)) {
        throw new Error(`Phản hồi không hợp lệ từ server: "${rawKey.slice(0, 100)}"`);
      }

      const key = rawKey;

      // Lưu vào interview-session-keys để khôi phục lịch sử chat khi tải lại trang
      try {
        const stored = JSON.parse(localStorage.getItem("interview-session-keys") ?? "{}");
        stored[key] = { createdAt: new Date().toISOString() };
        localStorage.setItem("interview-session-keys", JSON.stringify(stored));
      } catch {
        /* ignore */
      }

      toast.success("Đã tạo phiên phỏng vấn thành công!");
      navigate(`/dashboard/ai-interview/session?sessionKey=${key}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể tạo phiên phỏng vấn. Vui lòng thử lại."
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
    profileMode,
    setProfileMode,
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
    isUploading,
    uploadedProfile,
    setUploadedProfile,
    fileInputRef,
    handleUploadCV,
    populateFormFromProfile,
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
