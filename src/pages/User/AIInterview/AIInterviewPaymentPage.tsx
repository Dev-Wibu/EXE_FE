import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Target,
  Upload,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { InterviewConfigOptionItem, InterviewConfigOptions } from "@/interfaces/schema.types";
import { $api, fetchClient } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCandidateProfile } from "@/services/candidate-profile.manager";
import { usersAdminManager } from "@/services/users-admin.manager";
import { useAuthStore } from "@/stores/authStore";
// Mock data giữ lại để tham khảo khi cần thiết
// import { mockInterviewInfo, mockPaymentInfo, mockPaymentMethods } from "@/mocks/interviews.mock";
// const MOCK_PAYMENT_INFO = { interviewFee: 200000, serviceFee: 20000, total: 220000 };
// const MOCK_PAYMENT_METHODS = [
//   { id: "wallet", name: "Ví INTELITE", icon: "wallet", description: "...", balance: 1500000 },
//   { id: "bank", name: "Chuyển khoản ngân hàng", icon: "bank", description: "..." },
//   { id: "card", name: "Thẻ tín dụng/Ghi nợ", icon: "credit-card", description: "..." },
// ];

// ============================================================================
// Constants
// ============================================================================

const STEPS = [
  { id: 1, label: "Cấu hình", icon: Settings },
  { id: 2, label: "Hồ sơ ứng viên", icon: User },
  { id: 3, label: "Yêu cầu công việc", icon: Briefcase },
] as const;

const CATEGORY_ICONS = {
  interview_modes: <Layers className="h-5 w-5" />,
  difficulties: <Target className="h-5 w-5" />,
  languages: <Globe className="h-5 w-5" />,
  domains: <BookOpen className="h-5 w-5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  interview_modes: "Chế độ phỏng vấn",
  difficulties: "Độ khó",
  languages: "Ngôn ngữ",
  domains: "Lĩnh vực",
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> =
  {
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

type ConfigCategoryKey = keyof InterviewConfigOptions;

/** Candidate profile form state (for manual entry) */
interface CandidateFormData {
  targetRole: string;
  targetLevel: string;
  introduction: string;
  technicalSkills: string[];
  softSkills: string[];
  tools: string[];
}

const INITIAL_CANDIDATE_FORM: CandidateFormData = {
  targetRole: "",
  targetLevel: "",
  introduction: "",
  technicalSkills: [],
  softSkills: [],
  tools: [],
};

const DURATION_OPTIONS = [
  { value: 15, label: "15 phút" },
  { value: 30, label: "30 phút" },
  { value: 45, label: "45 phút" },
  { value: 60, label: "60 phút" },
] as const;

// ============================================================================
// Sub-components
// ============================================================================

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => {
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
            {index < STEPS.length - 1 && (
              <div className={cn("h-0.5 w-8", isCompleted ? "bg-green-400" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfigOptionCard({
  item,
  isSelected,
  onSelect,
  categoryKey,
}: {
  item: InterviewConfigOptionItem;
  isSelected: boolean;
  onSelect: () => void;
  categoryKey: ConfigCategoryKey;
}) {
  const colors = CATEGORY_COLORS[categoryKey];
  return (
    <button
      onClick={onSelect}
      className={`relative flex w-full flex-col gap-1.5 rounded-lg border-2 p-4 text-left transition-all ${
        isSelected
          ? `${colors.bg} ${colors.border} shadow-sm`
          : "border-border bg-card hover:border-border/80 hover:bg-accent/50"
      }`}>
      {isSelected && (
        <CheckCircle2
          className={`absolute top-3 right-3 h-5 w-5 ${colors.text}`}
          fill="currentColor"
          strokeWidth={0}
        />
      )}
      <span className={`text-sm font-semibold ${isSelected ? colors.text : "text-foreground"}`}>
        {item.label}
      </span>
      <span className="text-muted-foreground pr-6 text-xs leading-relaxed">{item.description}</span>
    </button>
  );
}

function ConfigSection({
  categoryKey,
  items,
  selectedKey,
  onSelect,
}: {
  categoryKey: ConfigCategoryKey;
  items: InterviewConfigOptionItem[];
  selectedKey: string | null;
  onSelect: (_key: string) => void;
}) {
  const colors = CATEGORY_COLORS[categoryKey];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg} ${colors.icon}`}>
          {CATEGORY_ICONS[categoryKey]}
        </div>
        <h4 className="text-foreground text-sm font-semibold">{CATEGORY_LABELS[categoryKey]}</h4>
      </div>
      <div
        className={`grid gap-3 ${
          items.length <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
        {items.map((item) => (
          <ConfigOptionCard
            key={item.key}
            item={item}
            isSelected={selectedKey === item.key}
            onSelect={() => onSelect(item.key)}
            categoryKey={categoryKey}
          />
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AIInterviewPaymentPage() {
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
    else navigate("/dashboard/ai-interview");
  };

  const canProceed =
    (currentStep === 1 && isStep1Complete) ||
    (currentStep === 2 && isStep2Complete) ||
    (currentStep === 3 && isStep3Complete);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="bg-background min-h-screen p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-foreground text-2xl font-bold">Thiết lập phỏng vấn mới</h1>
          <p className="text-muted-foreground text-sm">
            Hoàn thành 3 bước để bắt đầu buổi phỏng vấn AI
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator currentStep={currentStep} />
      </div>

      <div className="flex gap-6">
        {/* Left Column - Step Content */}
        <div className="flex flex-1 flex-col gap-6">
          {/* ======================== STEP 1: Config ======================== */}
          {currentStep === 1 && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  <CardTitle className="text-lg">Cấu hình buổi phỏng vấn</CardTitle>
                </div>
                <CardDescription>
                  Chọn chế độ, độ khó, ngôn ngữ và lĩnh vực cho buổi phỏng vấn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {configLoading && <LoadingSkeleton />}

                {configError && (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="font-medium text-red-700 dark:text-red-300">
                      Không thể tải cấu hình phỏng vấn
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">Vui lòng thử lại sau</p>
                  </div>
                )}

                {configOptions && !configLoading && !configError && (
                  <>
                    {configOptions.interview_modes && (
                      <ConfigSection
                        categoryKey="interview_modes"
                        items={configOptions.interview_modes}
                        selectedKey={selectedMode}
                        onSelect={setSelectedMode}
                      />
                    )}
                    {configOptions.difficulties && (
                      <ConfigSection
                        categoryKey="difficulties"
                        items={configOptions.difficulties}
                        selectedKey={selectedDifficulty}
                        onSelect={setSelectedDifficulty}
                      />
                    )}
                    {configOptions.languages && (
                      <ConfigSection
                        categoryKey="languages"
                        items={configOptions.languages}
                        selectedKey={selectedLanguage}
                        onSelect={setSelectedLanguage}
                      />
                    )}
                    {configOptions.domains && (
                      <ConfigSection
                        categoryKey="domains"
                        items={configOptions.domains}
                        selectedKey={selectedDomain}
                        onSelect={setSelectedDomain}
                      />
                    )}

                    {/* Duration config */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                          <Clock className="h-5 w-5" />
                        </div>
                        <h4 className="text-foreground text-sm font-semibold">
                          Thời lượng phỏng vấn
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {DURATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setSelectedDuration(opt.value)}
                            className={`relative flex w-full flex-col items-center gap-1 rounded-lg border-2 p-4 transition-all ${
                              selectedDuration === opt.value
                                ? "border-rose-500 bg-rose-50 shadow-sm dark:bg-rose-950/40"
                                : "border-border bg-card hover:border-border/80 hover:bg-accent/50"
                            }`}>
                            {selectedDuration === opt.value && (
                              <CheckCircle2
                                className="absolute top-2 right-2 h-4 w-4 text-rose-600 dark:text-rose-400"
                                fill="currentColor"
                                strokeWidth={0}
                              />
                            )}
                            <span
                              className={`text-lg font-bold ${
                                selectedDuration === opt.value
                                  ? "text-rose-700 dark:text-rose-300"
                                  : "text-foreground"
                              }`}>
                              {opt.value}
                            </span>
                            <span className="text-muted-foreground text-xs">phút</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ======================== STEP 2: Candidate Profile ======================== */}
          {currentStep === 2 && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Hồ sơ ứng viên</CardTitle>
                </div>
                <CardDescription>
                  Chọn hồ sơ có sẵn, tải CV lên hoặc nhập thông tin thủ công
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile mode selector */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Existing profile option */}
                  <button
                    onClick={() => setProfileMode("existing")}
                    disabled={!hasExistingProfile && !profileLoading}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      profileMode === "existing"
                        ? "border-blue-500 bg-blue-50 shadow-sm dark:bg-blue-950/40"
                        : "border-border bg-card hover:border-border/80",
                      !hasExistingProfile && !profileLoading && "cursor-not-allowed opacity-50"
                    )}>
                    {profileMode === "existing" && (
                      <CheckCircle2
                        className="absolute top-2 right-2 h-4 w-4 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    )}
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <span className="text-foreground text-sm font-semibold">Hồ sơ có sẵn</span>
                    <span className="text-muted-foreground text-xs">
                      {profileLoading
                        ? "Đang tải..."
                        : hasExistingProfile
                          ? "Sử dụng hồ sơ đã lưu"
                          : "Chưa có hồ sơ"}
                    </span>
                  </button>

                  {/* Upload CV option */}
                  <button
                    onClick={() => {
                      setProfileMode("upload");
                      if (!uploadedProfile) fileInputRef.current?.click();
                    }}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      profileMode === "upload"
                        ? "border-emerald-500 bg-emerald-50 shadow-sm dark:bg-emerald-950/40"
                        : "border-border bg-card hover:border-border/80"
                    )}>
                    {profileMode === "upload" && (
                      <CheckCircle2
                        className="absolute top-2 right-2 h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    )}
                    <Upload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-foreground text-sm font-semibold">Tải CV lên</span>
                    <span className="text-muted-foreground text-xs">Tạo hồ sơ từ CV</span>
                  </button>

                  {/* Manual entry option */}
                  <button
                    onClick={() => setProfileMode("manual")}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      profileMode === "manual"
                        ? "border-violet-500 bg-violet-50 shadow-sm dark:bg-violet-950/40"
                        : "border-border bg-card hover:border-border/80"
                    )}>
                    {profileMode === "manual" && (
                      <CheckCircle2
                        className="absolute top-2 right-2 h-4 w-4 text-violet-600 dark:text-violet-400"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    )}
                    <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    <span className="text-foreground text-sm font-semibold">Nhập thủ công</span>
                    <span className="text-muted-foreground text-xs">Tự điền thông tin</span>
                  </button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadCV(file);
                  }}
                />

                {/* Existing profile display */}
                {profileMode === "existing" && hasExistingProfile && (
                  <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        Hồ sơ hiện tại của bạn
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          populateFormFromProfile(
                            existingProfile as unknown as Record<string, unknown>
                          )
                        }
                        className="gap-1.5 text-xs">
                        <Pencil className="h-3.5 w-3.5" />
                        Chỉnh sửa
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Vị trí mục tiêu: </span>
                        <span className="text-foreground font-medium">
                          {((existingProfile as Record<string, unknown>).targetRole as string) ||
                            "Chưa cập nhật"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cấp độ: </span>
                        <span className="text-foreground font-medium">
                          {((existingProfile as Record<string, unknown>).targetLevel as string) ||
                            "Chưa cập nhật"}
                        </span>
                      </div>
                    </div>
                    {Boolean((existingProfile as Record<string, unknown>).introduction) && (
                      <p className="text-muted-foreground text-sm">
                        {String((existingProfile as Record<string, unknown>).introduction)}
                      </p>
                    )}
                    {Array.isArray((existingProfile as Record<string, unknown>).technicalSkills) &&
                      ((existingProfile as Record<string, unknown>).technicalSkills as string[])
                        .length > 0 && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Kỹ năng kỹ thuật:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(
                              (existingProfile as Record<string, unknown>)
                                .technicalSkills as string[]
                            ).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {Array.isArray((existingProfile as Record<string, unknown>).softSkills) &&
                      ((existingProfile as Record<string, unknown>).softSkills as string[]).length >
                        0 && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Kỹ năng mềm:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(
                              (existingProfile as Record<string, unknown>).softSkills as string[]
                            ).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {Array.isArray((existingProfile as Record<string, unknown>).tools) &&
                      ((existingProfile as Record<string, unknown>).tools as string[]).length >
                        0 && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-xs">Công cụ:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {((existingProfile as Record<string, unknown>).tools as string[]).map(
                              (tool) => (
                                <Badge key={tool} variant="secondary" className="text-xs">
                                  {tool}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {profileMode === "existing" && !hasExistingProfile && !profileLoading && (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/30">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Bạn chưa có hồ sơ ứng viên. Vui lòng tải CV lên hoặc nhập thủ công.
                    </p>
                  </div>
                )}

                {/* Upload CV result or uploading state */}
                {profileMode === "upload" && (
                  <div className="space-y-3">
                    {isUploading && (
                      <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Đang tải và phân tích CV...
                        </p>
                      </div>
                    )}
                    {!isUploading && !uploadedProfile && (
                      <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-8 dark:border-emerald-700 dark:bg-emerald-950/20">
                        <Upload className="h-10 w-10 text-emerald-400" />
                        <p className="text-muted-foreground text-sm">
                          Kéo thả hoặc bấm để chọn file CV (.pdf, .doc, .docx)
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}>
                          Chọn file
                        </Button>
                      </div>
                    )}
                    {uploadedProfile !== null && (
                      <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                            Hồ sơ đã được tạo từ CV
                          </h4>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Vị trí: {(uploadedProfile.targetRole as string) || "Không có"} • Cấp độ:{" "}
                          {(uploadedProfile.targetLevel as string) || "Không có"}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadedProfile(null);
                            fileInputRef.current?.click();
                          }}>
                          Tải lại CV
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual entry form */}
                {profileMode === "manual" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="targetRole">
                          Vị trí mục tiêu <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="targetRole"
                          placeholder="VD: Lập trình viên Backend"
                          value={candidateForm.targetRole}
                          onChange={(e) => updateCandidateForm("targetRole", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="targetLevel">Cấp độ</Label>
                        <Input
                          id="targetLevel"
                          placeholder="VD: Intern, Fresher, Junior, Middle"
                          value={candidateForm.targetLevel}
                          onChange={(e) => updateCandidateForm("targetLevel", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="introduction">
                        Giới thiệu bản thân <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="introduction"
                        placeholder="Mô tả ngắn về bản thân, kinh nghiệm..."
                        value={candidateForm.introduction}
                        onChange={(e) => updateCandidateForm("introduction", e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Kỹ năng kỹ thuật</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {candidateForm.technicalSkills.map((skill, i) => (
                          <Badge
                            key={`tech-${skill}-${i}`}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1">
                            <span>{skill}</span>
                            <button
                              type="button"
                              className="rounded-full p-0.5 hover:bg-black/10"
                              onClick={() => removeTechSkill(i)}
                              aria-label={`Xóa ${skill}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập kỹ năng kỹ thuật và nhấn Thêm"
                          value={techSkillInput}
                          onChange={(e) => setTechSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTechSkill();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addTechSkill}>
                          <Plus className="mr-1 h-4 w-4" />
                          Thêm
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Kỹ năng mềm</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {candidateForm.softSkills.map((skill, i) => (
                          <Badge
                            key={`soft-${skill}-${i}`}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1">
                            <span>{skill}</span>
                            <button
                              type="button"
                              className="rounded-full p-0.5 hover:bg-black/10"
                              onClick={() => removeSoftSkill(i)}
                              aria-label={`Xóa ${skill}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập kỹ năng mềm và nhấn Thêm"
                          value={softSkillInput}
                          onChange={(e) => setSoftSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSoftSkill();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addSoftSkill}>
                          <Plus className="mr-1 h-4 w-4" />
                          Thêm
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Công cụ</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {candidateForm.tools.map((tool, i) => (
                          <Badge
                            key={`tool-${tool}-${i}`}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1">
                            <span>{tool}</span>
                            <button
                              type="button"
                              className="rounded-full p-0.5 hover:bg-black/10"
                              onClick={() => removeTool(i)}
                              aria-label={`Xóa ${tool}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập công cụ và nhấn Thêm"
                          value={toolInput}
                          onChange={(e) => setToolInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTool();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addTool}>
                          <Plus className="mr-1 h-4 w-4" />
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ======================== STEP 3: Job Requirement ======================== */}
          {currentStep === 3 && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg">Yêu cầu công việc</CardTitle>
                </div>
                <CardDescription>
                  Nhập mô tả công việc để hệ thống tạo yêu cầu phỏng vấn phù hợp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="jobDescription">
                    Mô tả công việc <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Dán hoặc nhập mô tả công việc bạn muốn phỏng vấn. VD: Tuyển lập trình viên Backend có kinh nghiệm Java, Spring Boot, microservices..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    className="resize-y"
                  />
                  <p className="text-muted-foreground text-xs">
                    Hệ thống sẽ phân tích mô tả công việc và tạo yêu cầu phỏng vấn chi tiết (kỹ
                    năng, công cụ, trách nhiệm...) để AI đặt câu hỏi chính xác hơn.
                  </p>
                </div>

                <Button
                  onClick={handleGenerateJR}
                  disabled={!jobDescription.trim() || isGeneratingJR}
                  className="bg-amber-600 text-white hover:bg-amber-700">
                  {isGeneratingJR ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang phân tích mô tả công việc...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Tạo yêu cầu công việc
                    </>
                  )}
                </Button>

                {/* Generated JR result */}
                {generatedJR !== null && (
                  <div className="space-y-4 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/30">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">
                          Yêu cầu công việc đã được tạo
                        </h4>
                      </div>
                      {!isEditingJR && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingJR(true)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Chỉnh sửa
                        </Button>
                      )}
                    </div>

                    {/* ── VIEW MODE ── */}
                    {!isEditingJR && (
                      <>
                        {Boolean(generatedJR.basic_info) &&
                          typeof generatedJR.basic_info === "object" && (
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-muted-foreground">Vị trí: </span>
                                <span className="text-foreground font-medium">
                                  {String(
                                    (generatedJR.basic_info as Record<string, string>).job_title ||
                                      "Không có"
                                  )}
                                </span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Lĩnh vực: </span>
                                <span className="text-foreground font-medium">
                                  {String(
                                    (generatedJR.basic_info as Record<string, string>)
                                      .industry_domain || "Không có"
                                  )}
                                </span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Cấp độ: </span>
                                <span className="text-foreground font-medium">
                                  {String(
                                    (generatedJR.basic_info as Record<string, string>)
                                      .seniority_level || "Không có"
                                  )}
                                </span>
                              </p>
                            </div>
                          )}

                        {Boolean(generatedJR.competencies) &&
                          typeof generatedJR.competencies === "object" && (
                            <div className="space-y-2">
                              {Array.isArray(
                                (generatedJR.competencies as Record<string, unknown>).hard_skills
                              ) && (
                                <div>
                                  <span className="text-muted-foreground text-xs font-medium">
                                    Kỹ năng cứng:
                                  </span>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {(
                                      (generatedJR.competencies as Record<string, unknown>)
                                        .hard_skills as string[]
                                    ).map((s) => (
                                      <Badge key={s} variant="secondary" className="text-xs">
                                        {s}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {Array.isArray(
                                (generatedJR.competencies as Record<string, unknown>).soft_skills
                              ) && (
                                <div>
                                  <span className="text-muted-foreground text-xs font-medium">
                                    Kỹ năng mềm:
                                  </span>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {(
                                      (generatedJR.competencies as Record<string, unknown>)
                                        .soft_skills as string[]
                                    ).map((s) => (
                                      <Badge key={s} variant="outline" className="text-xs">
                                        {s}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {Array.isArray(
                                (generatedJR.competencies as Record<string, unknown>)
                                  .tools_and_platforms
                              ) && (
                                <div>
                                  <span className="text-muted-foreground text-xs font-medium">
                                    Công cụ và nền tảng:
                                  </span>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {(
                                      (generatedJR.competencies as Record<string, unknown>)
                                        .tools_and_platforms as string[]
                                    ).map((s) => (
                                      <Badge key={s} variant="secondary" className="text-xs">
                                        {s}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        {Array.isArray(generatedJR.responsibilities) && (
                          <div>
                            <span className="text-muted-foreground text-xs font-medium">
                              Trách nhiệm chính:
                            </span>
                            <ul className="text-muted-foreground mt-1 list-inside list-disc space-y-0.5 text-sm">
                              {(generatedJR.responsibilities as string[]).map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Button variant="outline" size="sm" onClick={() => setGeneratedJR(null)}>
                          Tạo lại
                        </Button>
                      </>
                    )}

                    {/* ── EDIT MODE ── */}
                    {isEditingJR && (
                      <div className="space-y-4">
                        {/* Basic info editable */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Vị trí</Label>
                            <Input
                              value={String(
                                (generatedJR.basic_info as Record<string, string>)?.job_title ?? ""
                              )}
                              onChange={(e) => updateJRBasicInfo("job_title", e.target.value)}
                              placeholder="Vị trí công việc"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Lĩnh vực</Label>
                            <Input
                              value={String(
                                (generatedJR.basic_info as Record<string, string>)
                                  ?.industry_domain ?? ""
                              )}
                              onChange={(e) => updateJRBasicInfo("industry_domain", e.target.value)}
                              placeholder="Lĩnh vực"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Cấp độ</Label>
                            <Input
                              value={String(
                                (generatedJR.basic_info as Record<string, string>)
                                  ?.seniority_level ?? ""
                              )}
                              onChange={(e) => updateJRBasicInfo("seniority_level", e.target.value)}
                              placeholder="Cấp độ"
                            />
                          </div>
                        </div>

                        {/* Competencies editable */}
                        {[
                          {
                            type: "hard_skills" as const,
                            label: "Kỹ năng cứng",
                            inputVal: hardSkillInputJR,
                            setInputVal: setHardSkillInputJR,
                          },
                          {
                            type: "soft_skills" as const,
                            label: "Kỹ năng mềm",
                            inputVal: softSkillInputJR,
                            setInputVal: setSoftSkillInputJR,
                          },
                          {
                            type: "tools_and_platforms" as const,
                            label: "Công cụ và nền tảng",
                            inputVal: toolInputJR,
                            setInputVal: setToolInputJR,
                          },
                        ].map(({ type, label, inputVal, setInputVal }) => {
                          const items = Array.isArray(
                            (generatedJR.competencies as Record<string, unknown>)?.[type]
                          )
                            ? ((generatedJR.competencies as Record<string, unknown>)[
                                type
                              ] as string[])
                            : [];
                          return (
                            <div key={type} className="space-y-1.5">
                              <Label className="text-xs">{label}</Label>
                              <div className="flex flex-wrap gap-1.5">
                                {items.map((s, i) => (
                                  <Badge
                                    key={`${type}-${s}-${i}`}
                                    variant="secondary"
                                    className="flex items-center gap-1 pr-1 text-xs">
                                    <span>{s}</span>
                                    <button
                                      type="button"
                                      className="rounded-full p-0.5 hover:bg-black/10"
                                      onClick={() => removeJRCompetency(type, i)}
                                      aria-label={`Xóa ${s}`}>
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  className="h-8 text-xs"
                                  placeholder={`Thêm ${label.toLowerCase()}`}
                                  value={inputVal}
                                  onChange={(e) => setInputVal(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addJRCompetency(type, inputVal);
                                      setInputVal("");
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => {
                                    addJRCompetency(type, inputVal);
                                    setInputVal("");
                                  }}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Responsibilities editable */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Trách nhiệm chính</Label>
                          <div className="space-y-1.5">
                            {(Array.isArray(generatedJR.responsibilities)
                              ? (generatedJR.responsibilities as string[])
                              : []
                            ).map((r, i) => (
                              <div key={i} className="flex gap-2">
                                <Input
                                  className="h-8 text-xs"
                                  value={r}
                                  onChange={(e) => updateJRResponsibility(i, e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-red-500 hover:text-red-600"
                                  onClick={() => removeJRResponsibility(i)}
                                  aria-label="Xóa trách nhiệm">
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              className="h-8 text-xs"
                              placeholder="Thêm trách nhiệm mới"
                              value={responsibilityInputJR}
                              onChange={(e) => setResponsibilityInputJR(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addJRResponsibility(responsibilityInputJR);
                                  setResponsibilityInputJR("");
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                addJRResponsibility(responsibilityInputJR);
                                setResponsibilityInputJR("");
                              }}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-[#0047AB] text-white hover:bg-[#005B9A]"
                            onClick={() => setIsEditingJR(false)}>
                            Lưu thay đổi
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="w-96 shrink-0">
          <Card className="sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tóm tắt thiết lập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Step 1 summary */}
              <div className="space-y-2">
                <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  {isStep1Complete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Settings className="text-muted-foreground h-4 w-4" />
                  )}
                  Bước 1: Cấu hình
                </div>
                <div className="space-y-1.5 pl-6">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Chế độ</span>
                    <Badge
                      variant={selectedMode ? "default" : "secondary"}
                      className="max-w-40 truncate text-xs">
                      {getSelectedLabel("interview_modes", selectedMode)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Độ khó</span>
                    <Badge
                      variant={selectedDifficulty ? "default" : "secondary"}
                      className="max-w-40 truncate text-xs">
                      {getSelectedLabel("difficulties", selectedDifficulty)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Ngôn ngữ</span>
                    <Badge
                      variant={selectedLanguage ? "default" : "secondary"}
                      className="max-w-40 truncate text-xs">
                      {getSelectedLabel("languages", selectedLanguage)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Lĩnh vực</span>
                    <Badge
                      variant={selectedDomain ? "default" : "secondary"}
                      className="max-w-40 truncate text-xs">
                      {getSelectedLabel("domains", selectedDomain)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Thời lượng</span>
                    <Badge variant="default" className="max-w-40 truncate text-xs">
                      {selectedDuration} phút
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-border border-t" />

              {/* Step 2 summary */}
              <div className="space-y-2">
                <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  {isStep2Complete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <User className="text-muted-foreground h-4 w-4" />
                  )}
                  Bước 2: Hồ sơ ứng viên
                </div>
                <div className="pl-6">
                  {isStep2Complete ? (
                    <Badge variant="default" className="text-xs">
                      {profileMode === "existing"
                        ? "Hồ sơ có sẵn"
                        : profileMode === "upload"
                          ? "Từ CV đã tải lên"
                          : "Nhập thủ công"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Chưa hoàn thành</span>
                  )}
                </div>
              </div>

              <div className="border-border border-t" />

              {/* Step 3 summary */}
              <div className="space-y-2">
                <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  {isStep3Complete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Briefcase className="text-muted-foreground h-4 w-4" />
                  )}
                  Bước 3: Yêu cầu công việc
                </div>
                <div className="pl-6">
                  {isStep3Complete ? (
                    <Badge variant="default" className="text-xs">
                      Đã tạo yêu cầu
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Chưa hoàn thành</span>
                  )}
                </div>
              </div>

              <div className="border-border border-t" />

              {/* Navigation buttons */}
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button variant="outline" className="flex-1" onClick={handleBack}>
                    Quay lại
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!canProceed || isCreatingSession}
                  className="flex-1 bg-[#0047AB] text-white hover:bg-[#005B9A] disabled:bg-slate-300"
                  size="lg">
                  {isCreatingSession ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : currentStep === 3 ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Bắt đầu phỏng vấn
                    </>
                  ) : (
                    "Tiếp theo"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
