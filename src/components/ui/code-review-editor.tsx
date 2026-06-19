"use client";

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bug,
  Check,
  ChevronDown,
  Code2,
  Eye,
  EyeOff,
  FileCode2,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Timer,
  Trash,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreInput } from "@/components/ui/score-input";
import { cn } from "@/lib/utils";
import {
  codeReviewProblemManager,
  type CodeFile,
  type CodeReviewProblem,
  type ExpectedIssue,
} from "@/services/code-review-problem.manager";
import { toast } from "sonner";

interface CodeReviewEditorProps {
  codeReviewProblemsId?: number[];
  codeReviewProblems?: {
    problemId?: number;
    title?: string;
    difficulty?: string;
    language?: string;
  }[];
  onChange: (
    _ids: number[],
    _problems: { problemId?: number; title?: string; difficulty?: string; language?: string }[]
  ) => void;
  disabled?: boolean;
  maxScore: number;
  onMaxScoreChange: (_val: number) => void;
  passThreshold: number;
  onPassThresholdChange: (_val: number) => void;
  timeLimitMinutes: number;
  onTimeLimitMinutesChange: (_val: number) => void;
}

type RightPaneView = "idle" | "view" | "bank" | "create";

// Reusable styled select
function StyledSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (_v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white py-1 pr-8 pl-3 text-xs shadow-sm transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 text-slate-400" />
    </div>
  );
}

export const CodeReviewEditor = React.forwardRef<
  {
    saveCurrentProblem: () => Promise<
      | boolean
      | {
          ids: number[];
          problems: {
            problemId?: number;
            title?: string;
            difficulty?: string;
            language?: string;
          }[];
        }
    >;
  },
  CodeReviewEditorProps
>(
  (
    {
      codeReviewProblemsId = [],
      codeReviewProblems = [],
      onChange,
      disabled = false,
      maxScore,
      onMaxScoreChange,
      passThreshold,
      onPassThresholdChange,
      timeLimitMinutes,
      onTimeLimitMinutesChange,
    },
    ref
  ) => {
    const [rightView, setRightView] = React.useState<RightPaneView>("idle");
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

    // Active file tab states
    const [viewActiveFileIdx, setViewActiveFileIdx] = React.useState<number>(0);
    const [createActiveFileIdx, setCreateActiveFileIdx] = React.useState<number>(0);
    const [createTabMode, setCreateTabMode] = React.useState<"code" | "issues">("code");
    const [activeFileEditMode, setActiveFileEditMode] = React.useState<"bugs" | "text">("bugs");

    // Toggle states for viewing bugs (both in view mode and create/edit bugs mode)
    const [expandedIssues, setExpandedIssues] = React.useState<Record<string, boolean>>({});

    // System problem bank states
    const [bankProblems, setBankProblems] = React.useState<CodeReviewProblem[]>([]);
    const [isLoadingBank, setIsLoadingBank] = React.useState(false);
    const [selectedBankIds, setSelectedBankIds] = React.useState<number[]>([]);
    const [bankSearch, setBankSearch] = React.useState("");
    const [bankDifficulty, setBankDifficulty] = React.useState<"ALL" | "EASY" | "MEDIUM" | "HARD">(
      "ALL"
    );
    const [bankLanguage, setBankLanguage] = React.useState<string>("ALL");

    // Create problem form states
    const [newProblem, setNewProblem] = React.useState<{
      id?: number;
      title: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      language: string;
      problemStatement: string;
      files: CodeFile[];
      expectedIssues: ExpectedIssue[];
    }>({
      title: "",
      difficulty: "EASY",
      language: "Java",
      problemStatement: "",
      files: [{ filename: "Solution.java", content: "", language: "java" }],
      expectedIssues: [
        { filename: "Solution.java", lineNumber: 1, severity: "CRITICAL", description: "" },
      ],
    });

    // AI generation states
    const [aiTopic, setAiTopic] = React.useState("");
    const [aiLevel, setAiLevel] = React.useState("Junior");
    const [aiDifficulty, setAiDifficulty] = React.useState<"EASY" | "MEDIUM" | "HARD">("EASY");
    const [aiLanguage, setAiLanguage] = React.useState("Java");
    const [aiRequirement, setAiRequirement] = React.useState("");
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [creationMode, setCreationMode] = React.useState<"ai" | "manual">("ai");
    const [aiGeneratedLoaded, setAiGeneratedLoaded] = React.useState(false);

    // Edit states
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

    React.useImperativeHandle(ref, () => ({
      saveCurrentProblem: async () => {
        if (rightView === "create") {
          return await handleSaveProblem();
        }
        return true;
      },
    }));

    // Reset expanded issues when active problem changes
    React.useEffect(() => {
      setExpandedIssues({});
    }, [selectedIndex, rightView]);

    const handleAddFile = () => {
      const ext = newProblem.language === "Java" ? "java" : newProblem.language.toLowerCase();
      const filename = `File${newProblem.files.length + 1}.${ext}`;
      setNewProblem((prev) => ({
        ...prev,
        files: [...prev.files, { filename, content: "", language: ext }],
      }));
      setCreateActiveFileIdx(newProblem.files.length);
    };

    const handleRemoveFile = (index: number) => {
      if (newProblem.files.length <= 1) return;
      const targetFilename = newProblem.files[index].filename;
      setNewProblem((prev) => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index),
        expectedIssues: prev.expectedIssues.filter((iss) => iss.filename !== targetFilename),
      }));
      setCreateActiveFileIdx((prev) => Math.max(0, prev - 1));
    };

    const handleRemoveExpectedIssue = (index: number) => {
      setNewProblem((prev) => ({
        ...prev,
        expectedIssues: prev.expectedIssues.filter((_, i) => i !== index),
      }));
    };

    const openCreate = () => {
      setRightView("create");
      setSelectedIndex(null);
      setCreationMode("ai");
      setAiGeneratedLoaded(false);
      setCreateActiveFileIdx(0);
      setCreateTabMode("code");
      setActiveFileEditMode("bugs");
      setNewProblem({
        title: "",
        difficulty: "EASY",
        language: "Java",
        problemStatement: "",
        files: [{ filename: "Solution.java", content: "", language: "java" }],
        expectedIssues: [
          { filename: "Solution.java", lineNumber: 1, severity: "CRITICAL", description: "" },
        ],
      });
      setAiTopic("");
      setAiRequirement("");
    };

    const handleAiGenerate = async () => {
      if (!aiTopic.trim()) {
        toast.warning("Vui lòng nhập chủ đề bài toán để AI sinh đề");
        return;
      }
      setIsGenerating(true);
      try {
        const res = await codeReviewProblemManager.generate({
          topic: aiTopic,
          difficulty: aiDifficulty,
          targetLevel: aiLevel,
          programmingLanguage: aiLanguage,
          context: {
            jobTitle: "",
            requirement: aiRequirement.trim() || "Cơ bản và thực tế",
            prompting: "",
          },
        });
        if (res.success && res.data) {
          const gen = res.data;
          setNewProblem({
            title: gen.title || "",
            difficulty: (gen.difficulty as "EASY" | "MEDIUM" | "HARD") || aiDifficulty,
            language: gen.language || aiLanguage,
            problemStatement: gen.problemStatement || "",
            files: gen.files?.map((f) => ({
              filename: f.filename || "",
              content: f.content || "",
              language: f.language || aiLanguage.toLowerCase(),
            })) || [{ filename: "Solution.java", content: "", language: "java" }],
            expectedIssues: gen.expectedIssues?.map((iss) => ({
              filename: iss.filename || "",
              lineNumber: iss.lineNumber || 1,
              severity: iss.severity || "CRITICAL",
              description: iss.description || "",
            })) || [
              { filename: "Solution.java", lineNumber: 1, severity: "CRITICAL", description: "" },
            ],
          });
          toast.success("AI đã sinh đề bài thành công! Hãy kiểm tra và lưu lại.");
          setCreationMode("manual");
          setAiGeneratedLoaded(true);
          setCreateActiveFileIdx(0);
          setCreateTabMode("code");
          setActiveFileEditMode("bugs");
        } else {
          toast.error(res.error || "Không thể sinh đề bài tự động");
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi khi sinh đề bằng AI");
      } finally {
        setIsGenerating(false);
      }
    };

    const handleSaveProblem = async (): Promise<
      | boolean
      | {
          ids: number[];
          problems: {
            problemId?: number;
            title?: string;
            difficulty?: string;
            language?: string;
          }[];
        }
    > => {
      if (!newProblem.title.trim()) {
        toast.warning("Vui lòng nhập tiêu đề bài tập");
        return false;
      }
      if (!newProblem.problemStatement.trim()) {
        toast.warning("Vui lòng nhập mô tả bài tập");
        return false;
      }
      if (newProblem.files.some((f) => !f.filename?.trim() || !f.content?.trim())) {
        toast.warning("Vui lòng điền đầy đủ tên file và nội dung code");
        return false;
      }

      try {
        const res = await codeReviewProblemManager.create(newProblem);
        if (res.success && res.data) {
          await fetchProblemBank();
          const createdId = res.data.id;

          const newIds = [...codeReviewProblemsId];
          const newProblems = [...codeReviewProblems];

          const mappedProblem = {
            problemId: createdId,
            title: res.data.title,
            difficulty: res.data.difficulty,
            language: res.data.language,
          };

          if (editingIndex !== null) {
            newIds[editingIndex] = createdId;
            newProblems[editingIndex] = mappedProblem;
          } else {
            newIds.push(createdId);
            newProblems.push(mappedProblem);
          }

          onChange(newIds, newProblems);
          if (editingIndex !== null) {
            setSelectedIndex(editingIndex);
          } else {
            setSelectedIndex(newIds.length - 1);
          }
          setEditingIndex(null);
          setViewActiveFileIdx(0);
          setRightView("view");
          return { ids: newIds, problems: newProblems };
        } else {
          toast.error(res.error || "Không thể lưu bài tập");
          return false;
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi khi lưu bài tập");
        return false;
      }
    };

    const [editingTime, setEditingTime] = React.useState(false);

    const fetchProblemBank = async () => {
      setIsLoadingBank(true);
      try {
        const res = await codeReviewProblemManager.getAll();
        if (res.success && res.data) {
          setBankProblems(res.data);
        } else {
          toast.error(res.error || "Không thể tải danh sách đề code review");
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi khi tải danh sách đề");
      } finally {
        setIsLoadingBank(false);
      }
    };

    React.useEffect(() => {
      fetchProblemBank();
    }, []);

    const handleSelectProblem = (index: number) => {
      setSelectedIndex(index);
      setViewActiveFileIdx(0);
      setRightView("view");
    };

    const openBank = () => {
      setSelectedBankIds([]);
      setBankSearch("");
      setBankDifficulty("ALL");
      setBankLanguage("ALL");
      setRightView("bank");
    };

    const handleDeleteProblem = (index: number) => {
      const newIds = codeReviewProblemsId.filter((_, idx) => idx !== index);
      const newProblems = codeReviewProblems.filter((_, idx) => idx !== index);
      onChange(newIds, newProblems);

      if (selectedIndex === index) {
        setRightView("idle");
        setSelectedIndex(null);
      } else if (selectedIndex !== null && selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1);
      }
    };

    const handleAddSelectedFromBank = () => {
      const newIds = [...codeReviewProblemsId];
      const newProblems = [...codeReviewProblems];

      selectedBankIds.forEach((id) => {
        if (!newIds.includes(id)) {
          newIds.push(id);
          const systemProblem = bankProblems.find((p) => p.id === id);
          newProblems.push({
            problemId: id,
            title: systemProblem?.title || `Bài tập #${id}`,
            difficulty: systemProblem?.difficulty || "EASY",
            language: systemProblem?.language || "Java",
          });
        }
      });

      onChange(newIds, newProblems);
      setRightView("idle");
      setSelectedBankIds([]);
      toast.success(`Đã thêm ${selectedBankIds.length} bài tập Code Review vào vòng thi`);
    };

    const toggleBankSelection = (id: number) => {
      setSelectedBankIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    };

    const filteredBank = bankProblems.filter((p) => {
      const matchesSearch =
        (p.title || "").toLowerCase().includes(bankSearch.toLowerCase()) ||
        (p.problemStatement || "").toLowerCase().includes(bankSearch.toLowerCase());
      const matchesDifficulty = bankDifficulty === "ALL" || p.difficulty === bankDifficulty;
      const matchesLanguage = bankLanguage === "ALL" || p.language === bankLanguage;
      return matchesSearch && matchesDifficulty && matchesLanguage;
    });

    const availableLanguages = React.useMemo(() => {
      const langs = new Set<string>();
      bankProblems.forEach((p) => {
        if (p.language) langs.add(p.language);
      });
      return Array.from(langs);
    }, [bankProblems]);

    const passScore = Math.round(passThreshold * maxScore);
    const selectedProblemDetails =
      selectedIndex !== null
        ? bankProblems.find((p) => p.id === codeReviewProblemsId[selectedIndex])
        : null;

    const difficultyBadge = (diff?: string) => {
      const map: Record<string, string> = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" };
      const colorMap: Record<string, string> = {
        EASY: "bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-950/20 dark:text-green-400",
        MEDIUM:
          "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/20 dark:text-amber-400",
        HARD: "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-950/20 dark:text-red-400",
      };
      return (
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset",
            colorMap[diff || "EASY"]
          )}>
          {map[diff || "EASY"] || diff}
        </span>
      );
    };

    return (
      <div className="grid h-full grid-cols-12 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* ==================== LEFT COLUMN (SIDEBAR) ==================== */}
        <div className="col-span-3 flex h-full flex-col overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {/* --- Configuration Settings --- */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <Settings className="h-3.5 w-3.5" />
                Cấu hình vòng thi
              </div>
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                      Điểm tối đa
                    </Label>
                    <ScoreInput
                      value={maxScore}
                      min={1}
                      max={500}
                      step={5}
                      accent="indigo"
                      variant="simple"
                      onChange={onMaxScoreChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                      Thời gian
                    </Label>
                    {editingTime ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          autoFocus
                          value={timeLimitMinutes}
                          onChange={(e) => onTimeLimitMinutesChange(Number(e.target.value))}
                          onBlur={() => setEditingTime(false)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingTime(false)}
                          className="h-11 w-full [appearance:textfield] border-slate-200 bg-white text-center text-xs font-bold dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                        <span className="shrink-0 text-[9px] text-slate-400">phút</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingTime(true)}
                        className="text-slate-650 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold transition-all hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800">
                        <Timer className="h-4 w-4 text-slate-400" />
                        {timeLimitMinutes > 0 ? `${timeLimitMinutes}m` : "∞"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Điểm đạt: {passScore}/{maxScore} ({Math.round(passThreshold * 100)}%)
                  </Label>
                  <div className="flex justify-center">
                    <ScoreInput
                      value={passScore}
                      min={0}
                      max={maxScore}
                      step={1}
                      accent="emerald"
                      variant="circular"
                      size="sm"
                      onChange={(val) => {
                        onPassThresholdChange(maxScore > 0 ? val / maxScore : 0.8);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="dark:border-slate-850 border-t border-slate-200" />

            {/* --- Problems Mappings --- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Danh sách đề bài ({codeReviewProblemsId.length})
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={openBank}
                  className={cn(
                    "h-8 border-slate-200 text-[10px] font-bold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
                    rightView === "bank" &&
                      "border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20"
                  )}>
                  <FolderOpen className="mr-1 h-3.5 w-3.5 text-indigo-500" />
                  Kho đề
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={openCreate}
                  className={cn(
                    "h-8 border-slate-200 text-[10px] font-bold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
                    rightView === "create" &&
                      "border-emerald-500 bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20"
                  )}>
                  <Plus className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                  Tạo đề
                </Button>
              </div>

              <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto pr-1">
                {codeReviewProblemsId.map((id, idx) => {
                  const isActive = selectedIndex === idx && rightView === "view";
                  const problem = codeReviewProblems[idx] || {};
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectProblem(idx)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-all",
                        isActive
                          ? "border-indigo-500 bg-indigo-50/40 shadow-sm dark:border-indigo-600 dark:bg-indigo-950/20"
                          : "hover:border-slate-350 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/30"
                      )}>
                      <span
                        className={cn(
                          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-bold ring-1 ring-inset",
                          isActive
                            ? "bg-indigo-600 text-white ring-indigo-600"
                            : "dark:bg-slate-855 bg-slate-100 text-slate-500 ring-slate-200 dark:text-slate-400"
                        )}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {problem.title || `Bài tập #${id}`}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {difficultyBadge(problem.difficulty)}
                          {problem.language && (
                            <span className="rounded bg-slate-100 px-1 py-0.5 text-[8px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {problem.language}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {codeReviewProblemsId.length === 0 && (
                <div className="py-6 text-center">
                  <BookOpen className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-700" />
                  <p className="mt-2 text-[10px] text-slate-400">
                    Chưa có bài tập nào được chọn cho vòng thi.
                  </p>
                </div>
              )}
            </div>

            {/* --- VIEW MODE: Read-only problem description context --- */}
            {rightView === "view" && selectedProblemDetails && (
              <div className="space-y-2 border-t border-slate-100 pt-3 font-sans dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  Mục tiêu Review
                </div>
                <div className="text-slate-605 max-h-[220px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs leading-relaxed whitespace-pre-wrap dark:border-slate-800/60 dark:bg-slate-900/30 dark:text-slate-300">
                  {selectedProblemDetails.problemStatement}
                </div>
              </div>
            )}

            {/* --- CREATE / EDIT MODE: Metadata builder form --- */}
            {rightView === "create" && (
              <>
                {/* Manual mode or AI generated mode (Manual editor metadata) */}
                {(creationMode === "manual" || (creationMode === "ai" && aiGeneratedLoaded)) && (
                  <div className="space-y-3.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-sans text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      <Settings className="h-3.5 w-3.5 text-emerald-500" />
                      Thiết lập bài toán
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                          Tiêu đề bài
                        </Label>
                        <Input
                          value={newProblem.title}
                          onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                          placeholder="Ví dụ: Rò rỉ API Token"
                          className="mt-1 h-8 border-slate-200 bg-white text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                            Ngôn ngữ
                          </Label>
                          <StyledSelect
                            value={newProblem.language}
                            className="mt-1"
                            onChange={(v) => setNewProblem({ ...newProblem, language: v })}>
                            <option value="Java">Java</option>
                            <option value="Javascript">Javascript</option>
                            <option value="TypeScript">TypeScript</option>
                            <option value="Python">Python</option>
                            <option value="C#">C#</option>
                            <option value="SQL">SQL</option>
                            <option value="Go">Go</option>
                          </StyledSelect>
                        </div>
                        <div>
                          <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                            Độ khó
                          </Label>
                          <StyledSelect
                            value={newProblem.difficulty}
                            className="mt-1"
                            onChange={(v) =>
                              setNewProblem({
                                ...newProblem,
                                difficulty: v as "EASY" | "MEDIUM" | "HARD",
                              })
                            }>
                            <option value="EASY">Dễ</option>
                            <option value="MEDIUM">Trung bình</option>
                            <option value="HARD">Khó</option>
                          </StyledSelect>
                        </div>
                      </div>

                      <div>
                        <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                          Yêu cầu / Ngữ cảnh
                        </Label>
                        <textarea
                          value={newProblem.problemStatement}
                          onChange={(e) =>
                            setNewProblem({ ...newProblem, problemStatement: e.target.value })
                          }
                          rows={5}
                          placeholder="Mô tả ngữ cảnh và mục tiêu đề..."
                          className="mt-1 flex max-h-[140px] w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ==================== RIGHT COLUMN (IDE WORKSPACE) ==================== */}
        <div className="col-span-9 flex flex-col overflow-hidden bg-slate-900 text-slate-100">
          {/* --- IDLE STATE --- */}
          {rightView === "idle" && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="max-w-md p-6">
                <Code2 className="text-slate-650 mx-auto mb-4 h-12 w-12 dark:text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-300">Không có file nào đang mở</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Chọn một bài tập từ cột danh sách bên trái hoặc nhấn vào "Kho đề", "Tạo đề" để bắt
                  đầu thiết kế.
                </p>
              </div>
            </div>
          )}

          {/* --- VIEW STATE (IDE & ANNOTATED CODE VIEW) --- */}
          {rightView === "view" && selectedIndex !== null && selectedProblemDetails && (
            <div className="flex h-full flex-col overflow-hidden">
              {/* Workspace Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-lg bg-indigo-900/60 px-2 py-1 text-xs font-bold text-indigo-400 ring-1 ring-indigo-500/20">
                    #{selectedIndex + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white">{selectedProblemDetails.title}</h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      {difficultyBadge(selectedProblemDetails.difficulty)}
                      <span className="text-[10px] font-semibold text-slate-400">
                        {selectedProblemDetails.language}
                      </span>
                    </div>
                  </div>
                </div>

                {!disabled && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewProblem({
                          id: selectedProblemDetails.id,
                          title: selectedProblemDetails.title || "",
                          difficulty: selectedProblemDetails.difficulty || "EASY",
                          language: selectedProblemDetails.language || "Java",
                          problemStatement: selectedProblemDetails.problemStatement || "",
                          files: (selectedProblemDetails.files || []).map((f) => ({
                            filename: f.filename || "",
                            content: f.content || "",
                            language: f.language || "java",
                          })),
                          expectedIssues: (selectedProblemDetails.expectedIssues || []).map(
                            (iss) => ({
                              filename: iss.filename || "",
                              lineNumber: iss.lineNumber || 1,
                              severity: iss.severity || "CRITICAL",
                              description: iss.description || "",
                            })
                          ),
                        });
                        setEditingIndex(selectedIndex);
                        setRightView("create");
                        setCreationMode("manual");
                        setCreateActiveFileIdx(0);
                        setCreateTabMode("code");
                        setActiveFileEditMode("bugs");
                      }}
                      className="hover:bg-slate-750 h-8 border-slate-700 bg-slate-800 text-xs text-indigo-400 hover:text-indigo-300">
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Chỉnh sửa
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProblem(selectedIndex)}
                      className="h-8 border-red-950 bg-red-950/20 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300">
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Xóa
                    </Button>
                  </div>
                )}
              </div>

              {/* Editor Right-Panel (takes up full width) */}
              <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/50">
                {/* File Tabs */}
                <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-900/60">
                  {(selectedProblemDetails.files || []).map((f, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => setViewActiveFileIdx(fIdx)}
                      className={cn(
                        "flex items-center gap-2 border-r border-slate-800 px-4 py-2.5 text-xs font-semibold transition-all",
                        viewActiveFileIdx === fIdx
                          ? "bg-slate-955 border-b-2 border-b-indigo-500 bg-slate-950 text-indigo-400"
                          : "hover:bg-slate-850 text-slate-400 hover:text-slate-200"
                      )}>
                      <FileCode2 className="h-3.5 w-3.5 text-indigo-500" />
                      {f.filename || "Untitled"}
                    </button>
                  ))}
                </div>

                {/* Code Workspace view with annotations */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed select-text">
                  {(() => {
                    const file = (selectedProblemDetails.files || [])[viewActiveFileIdx];
                    if (!file) return <div className="p-4 text-slate-500 italic">File trống</div>;
                    const lines = (file.content || "").split("\n");
                    return (
                      <div className="w-full">
                        {lines.map((lineText, lineIdx) => {
                          const currentLineNum = lineIdx + 1;
                          const lineIssues = (selectedProblemDetails.expectedIssues || []).filter(
                            (iss) =>
                              iss.filename === file.filename &&
                              Number(iss.lineNumber) === currentLineNum
                          );

                          const toggleKey = `view-${file.filename}-${currentLineNum}`;
                          const isExpanded = !!expandedIssues[toggleKey];

                          return (
                            <React.Fragment key={lineIdx}>
                              <div
                                className={cn(
                                  "group relative flex items-center rounded-sm px-1 py-0.5 hover:bg-slate-800/40",
                                  lineIssues.length > 0 &&
                                    "border-l-2 border-l-red-500 bg-red-950/10"
                                )}>
                                {/* Gutter Gutter on the LEFT side */}
                                <div className="flex w-20 shrink-0 items-center justify-end gap-1.5 pr-2.5 select-none">
                                  {lineIssues.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExpandedIssues((prev) => ({
                                          ...prev,
                                          [toggleKey]: !prev[toggleKey],
                                        }));
                                      }}
                                      className={cn(
                                        "rounded p-0.5 text-indigo-400 transition-colors hover:bg-slate-800"
                                      )}>
                                      {isExpanded ? (
                                        <EyeOff className="h-3.5 w-3.5" />
                                      ) : (
                                        <Eye className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  )}
                                  <span className="w-6 text-right font-semibold text-slate-600">
                                    {currentLineNum}
                                  </span>
                                </div>

                                <span className="flex-1 font-mono break-all whitespace-pre-wrap text-slate-200">
                                  {lineText || " "}
                                </span>
                              </div>

                              {isExpanded &&
                                lineIssues.map((issue, issueIdx) => (
                                  <div
                                    key={issueIdx}
                                    className={cn(
                                      "my-1.5 mr-2 ml-20 flex items-start gap-2.5 rounded-lg border p-3 font-sans text-xs shadow-sm",
                                      issue.severity === "CRITICAL"
                                        ? "border-red-900 bg-red-950/40 text-red-200"
                                        : issue.severity === "WARNING"
                                          ? "border-amber-900 bg-amber-950/40 text-amber-200"
                                          : "border-blue-900 bg-blue-950/40 text-blue-200"
                                    )}>
                                    <Bug
                                      className={cn(
                                        "mt-0.5 h-4 w-4 shrink-0",
                                        issue.severity === "CRITICAL"
                                          ? "text-red-400"
                                          : issue.severity === "WARNING"
                                            ? "text-amber-400"
                                            : "text-blue-400"
                                      )}
                                    />
                                    <div className="flex-1">
                                      <div className="mb-1 flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-100">
                                          Lỗi mẫu phát hiện:
                                        </span>
                                        <span
                                          className={cn(
                                            "rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase",
                                            issue.severity === "CRITICAL"
                                              ? "bg-red-900/60 text-red-300 ring-1 ring-red-500/20"
                                              : issue.severity === "WARNING"
                                                ? "bg-amber-900/60 text-amber-300 ring-1 ring-amber-500/20"
                                                : "bg-blue-900/60 text-blue-300 ring-1 ring-blue-500/20"
                                          )}>
                                          {issue.severity}
                                        </span>
                                      </div>
                                      <p className="leading-relaxed text-slate-300">
                                        {issue.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* --- BANK STATE --- */}
          {rightView === "bank" && (
            <div className="flex h-full flex-col overflow-hidden bg-slate-950/30 p-5">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <FolderOpen className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Ngân hàng bài tập Code Review</h3>
                <span className="ml-auto text-xs font-semibold text-slate-400">
                  Đã chọn <strong className="text-indigo-400">{selectedBankIds.length}</strong>
                </span>
              </div>

              {/* Filters */}
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3.5 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-500" />
                  <Input
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    placeholder="Tìm kiếm bài tập..."
                    className="bg-slate-955 h-9 border-slate-800 bg-slate-950 pl-8 text-xs text-white"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setBankDifficulty(diff)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[10px] font-bold transition-all",
                        bankDifficulty === diff
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "hover:bg-slate-850 border-slate-800 bg-slate-950 text-slate-400"
                      )}>
                      {diff === "ALL"
                        ? "Tất cả"
                        : diff === "EASY"
                          ? "Dễ"
                          : diff === "MEDIUM"
                            ? "T.Bình"
                            : "Khó"}
                    </button>
                  ))}

                  <div className="w-28">
                    <StyledSelect value={bankLanguage} onChange={setBankLanguage}>
                      <option value="ALL">Mọi ngôn ngữ</option>
                      {availableLanguages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                </div>
              </div>

              {/* Problems list */}
              <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
                {isLoadingBank ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-500" />
                    <p className="mt-2">Đang tải danh sách bài tập...</p>
                  </div>
                ) : (
                  filteredBank.map((p, idx) => {
                    const isSelected = selectedBankIds.includes(p.id);
                    const isAdded = codeReviewProblemsId.includes(p.id);

                    return (
                      <div
                        key={idx}
                        onClick={() => !isAdded && toggleBankSelection(p.id)}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all",
                          isAdded
                            ? "cursor-not-allowed border-slate-800/40 bg-slate-900/40 opacity-40"
                            : isSelected
                              ? "border-indigo-500 bg-indigo-950/20"
                              : "border-slate-855 bg-slate-900 hover:border-slate-700"
                        )}>
                        <div className="mt-0.5">
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                              isAdded
                                ? "border-slate-700 bg-slate-800 text-white"
                                : isSelected
                                  ? "border-indigo-500 bg-indigo-500 text-white"
                                  : "border-slate-700 bg-slate-950"
                            )}>
                            {(isSelected || isAdded) && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {difficultyBadge(p.difficulty)}
                            {p.language && (
                              <span className="bg-slate-855 text-slate-305 rounded px-1 py-0.5 text-[9px] font-bold text-slate-300">
                                {p.language}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-white">{p.title}</span>
                            {isAdded && (
                              <span className="ml-auto text-[10px] text-slate-500 italic">
                                Đã thêm
                              </span>
                            )}
                          </div>
                          <p className="line-clamp-2 text-xs text-slate-400">
                            {p.problemStatement}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                {!isLoadingBank && filteredBank.length === 0 && (
                  <div className="py-10 text-center text-xs text-slate-500">
                    Không tìm thấy bài tập phù hợp.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/20 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRightView("idle");
                    setSelectedIndex(null);
                  }}
                  className="hover:bg-slate-805 h-8 border-slate-800 bg-slate-900 text-xs hover:bg-slate-800">
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedBankIds.length === 0}
                  onClick={handleAddSelectedFromBank}
                  className="h-8 bg-indigo-600 px-4 text-xs text-white hover:bg-indigo-700">
                  Thêm{selectedBankIds.length > 0 ? ` (${selectedBankIds.length})` : ""} đề đã chọn
                </Button>
              </div>
            </div>
          )}

          {/* --- CREATE / EDIT STATE (MODERN CODE BUILDER) --- */}
          {rightView === "create" && (
            <div className="bg-slate-955 relative flex h-full flex-col overflow-hidden bg-slate-950/20">
              {isGenerating && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-300">
                      AI đang sinh đề bài Code Review, vui lòng chờ trong giây lát...
                    </span>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Plus className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white">
                    {editingIndex !== null ? "Chỉnh sửa đề bài" : "Thiết kế đề Code Review mới"}
                  </h3>
                  <div className="rounded-lg bg-slate-900 p-0.5">
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCreationMode("ai");
                          setAiGeneratedLoaded(false);
                        }}
                        className={cn(
                          "rounded px-2.5 py-1 text-[10px] font-bold transition-all",
                          creationMode === "ai" ? "bg-slate-800 text-indigo-400" : "text-slate-400"
                        )}>
                        ✨ Sinh bằng AI
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreationMode("manual");
                          setAiGeneratedLoaded(true);
                        }}
                        className={cn(
                          "rounded px-2.5 py-1 text-[10px] font-bold transition-all",
                          creationMode === "manual"
                            ? "bg-slate-800 text-indigo-400"
                            : "text-slate-400"
                        )}>
                        ✏️ Thủ công
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Panel */}
              <div className="flex flex-1 overflow-hidden">
                {/* Mode AI View */}
                {creationMode === "ai" && !aiGeneratedLoaded ? (
                  <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-slate-900 p-6 font-sans text-slate-100">
                    <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-sm">
                      <div className="mb-8 flex flex-col items-center space-y-4 text-center">
                        <div className="relative inline-flex items-center justify-center rounded-2xl border border-indigo-800/40 bg-indigo-950/40 p-4 text-indigo-400 shadow-inner">
                          <Sparkles className="h-10 w-10 animate-pulse text-indigo-400" />
                          <Wand2 className="absolute -top-1 -right-1 h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold tracking-wide text-white">
                            Thiết Kế Đề Bài Bằng Trí Tuệ Nhân Tạo (AI)
                          </h3>
                          <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
                            Nhập các tham số thiết kế bên dưới. AI sẽ tự động tạo cấu trúc các file
                            source code chứa lỗi logic/bảo mật, đồng thời thiết lập các bình luận
                            chỉ định lỗi review mẫu.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 text-left">
                        <div>
                          <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                            Chủ đề / Lỗi bảo mật cần review *
                          </Label>
                          <Input
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                            placeholder="Ví dụ: Rò rỉ thông tin qua log, SQL Injection, N+1 Query..."
                            className="mt-1.5 h-10 border-slate-800 bg-slate-950/60 px-3 text-xs text-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                              Độ khó bài tập
                            </Label>
                            <StyledSelect
                              value={aiDifficulty}
                              className="border-slate-850 mt-1.5 h-10 bg-slate-950/60 text-xs"
                              onChange={(v) => setAiDifficulty(v as "EASY" | "MEDIUM" | "HARD")}>
                              <option value="EASY">Dễ</option>
                              <option value="MEDIUM">Trung bình</option>
                              <option value="HARD">Khó</option>
                            </StyledSelect>
                          </div>
                          <div>
                            <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                              Ngôn ngữ
                            </Label>
                            <StyledSelect
                              value={aiLanguage}
                              className="border-slate-850 mt-1.5 h-10 bg-slate-950/60 text-xs"
                              onChange={setAiLanguage}>
                              <option value="Java">Java</option>
                              <option value="Javascript">Javascript</option>
                              <option value="TypeScript">TypeScript</option>
                              <option value="Python">Python</option>
                              <option value="C#">C#</option>
                              <option value="SQL">SQL</option>
                              <option value="Go">Go</option>
                            </StyledSelect>
                          </div>
                          <div>
                            <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                              Cấp độ ứng viên
                            </Label>
                            <StyledSelect
                              value={aiLevel}
                              className="border-slate-850 mt-1.5 h-10 bg-slate-950/60 text-xs"
                              onChange={setAiLevel}>
                              <option value="Intern">Intern</option>
                              <option value="Junior">Junior</option>
                              <option value="Senior">Senior</option>
                            </StyledSelect>
                          </div>
                        </div>

                        <div>
                          <Label className="font-sans text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                            Ngữ cảnh đặc biệt / Yêu cầu bổ sung
                          </Label>
                          <textarea
                            value={aiRequirement}
                            onChange={(e) => setAiRequirement(e.target.value)}
                            rows={4}
                            placeholder="Mô tả context dự án hoặc hướng dẫn đặc biệt cho AI..."
                            className="border-slate-850 mt-1.5 flex w-full rounded-md border bg-slate-950/60 px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                          />
                        </div>

                        <Button
                          type="button"
                          disabled={isGenerating || !aiTopic}
                          onClick={handleAiGenerate}
                          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 font-sans text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <Sparkles className="h-4 w-4" />
                          Bắt đầu sinh đề bài với AI
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Manual Form Editor (Full Width) */
                  <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/60">
                    {/* Sub tab mode */}
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-3">
                      <div className="flex gap-1.5 font-sans">
                        <button
                          type="button"
                          onClick={() => setCreateTabMode("code")}
                          className={cn(
                            "px-3 py-2 text-xs font-bold transition-all",
                            createTabMode === "code"
                              ? "border-b-2 border-b-indigo-500 text-indigo-400"
                              : "text-slate-400 hover:text-slate-200"
                          )}>
                          <Code2 className="mr-1 inline-block h-3.5 w-3.5" /> Code Files (
                          {newProblem.files.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateTabMode("issues")}
                          className={cn(
                            "px-3 py-2 text-xs font-bold transition-all",
                            createTabMode === "issues"
                              ? "border-b-2 border-b-indigo-500 text-indigo-400"
                              : "text-slate-400 hover:text-slate-200"
                          )}>
                          <Bug className="mr-1 inline-block h-3.5 w-3.5" /> Lỗi cần bắt (
                          {newProblem.expectedIssues.length})
                        </button>
                      </div>

                      {createTabMode === "code" && (
                        <div className="flex items-center gap-2 font-sans">
                          <div className="bg-slate-955 rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                            <button
                              type="button"
                              onClick={() => setActiveFileEditMode("bugs")}
                              className={cn(
                                "rounded px-2.5 py-1 text-[10px] font-bold transition-all",
                                activeFileEditMode === "bugs"
                                  ? "bg-slate-800 text-indigo-400"
                                  : "text-slate-400"
                              )}>
                              🐛 Design Lỗi
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveFileEditMode("text")}
                              className={cn(
                                "rounded px-2.5 py-1 text-[10px] font-bold transition-all",
                                activeFileEditMode === "text"
                                  ? "bg-slate-800 text-indigo-400"
                                  : "text-slate-400"
                              )}>
                              ✏️ Viết Code
                            </button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleAddFile}
                            className="h-7 text-[10px] font-bold text-indigo-400 hover:bg-slate-800">
                            <Plus className="mr-1 h-3.5 w-3.5" /> Thêm File
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Sub views */}
                    <div className="flex flex-1 flex-col overflow-hidden">
                      {createTabMode === "code" ? (
                        <div className="flex flex-1 flex-col overflow-hidden">
                          {/* File tabs row */}
                          <div className="border-slate-850 flex overflow-x-auto border-b bg-slate-950/25">
                            {newProblem.files.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                className={cn(
                                  "flex items-center gap-1.5 border-r border-slate-800/80 px-3.5 py-2 font-sans text-xs transition-all",
                                  createActiveFileIdx === fIdx
                                    ? "bg-slate-900 font-bold text-white"
                                    : "bg-slate-950/50 text-slate-400 hover:bg-slate-900/30"
                                )}>
                                <button
                                  type="button"
                                  onClick={() => setCreateActiveFileIdx(fIdx)}
                                  className="flex items-center gap-1">
                                  <FileCode2 className="h-3.5 w-3.5 text-indigo-500" />
                                  <span>{file.filename || "Untitled"}</span>
                                </button>
                                {newProblem.files.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(fIdx)}
                                    className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-red-400">
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Active file settings and text code editor */}
                          {(() => {
                            const activeFile = newProblem.files[createActiveFileIdx];
                            if (!activeFile) return null;

                            return (
                              <div className="flex flex-1 flex-col overflow-hidden">
                                {/* Config panel */}
                                <div className="flex items-center gap-4 border-b border-slate-800 bg-slate-900/30 px-4 py-2 font-sans text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-slate-400">Tên file:</span>
                                    <input
                                      type="text"
                                      value={activeFile.filename}
                                      onChange={(e) => {
                                        const files = [...newProblem.files];
                                        const oldName = files[createActiveFileIdx].filename;
                                        const newName = e.target.value;
                                        files[createActiveFileIdx].filename = newName;

                                        // Update expected issues filename reference
                                        const expectedIssues = newProblem.expectedIssues.map(
                                          (iss) => {
                                            if (iss.filename === oldName) {
                                              return { ...iss, filename: newName };
                                            }
                                            return iss;
                                          }
                                        );

                                        setNewProblem({ ...newProblem, files, expectedIssues });
                                      }}
                                      className="h-7 w-48 rounded border border-slate-800 bg-slate-900 px-2 font-mono text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-slate-400">Highlight:</span>
                                    <select
                                      value={activeFile.language || "java"}
                                      onChange={(e) => {
                                        const files = [...newProblem.files];
                                        files[createActiveFileIdx].language = e.target.value;
                                        setNewProblem({ ...newProblem, files });
                                      }}
                                      className="h-7 rounded border border-slate-800 bg-slate-900 px-2 text-white focus:border-indigo-500 focus:outline-none">
                                      <option value="java">java</option>
                                      <option value="javascript">javascript</option>
                                      <option value="typescript">typescript</option>
                                      <option value="python">python</option>
                                      <option value="csharp">csharp</option>
                                      <option value="sql">sql</option>
                                      <option value="xml">xml</option>
                                      <option value="go">go</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Code Space depending on Sub Edit Mode */}
                                {activeFileEditMode === "text" ? (
                                  <div className="flex flex-1 flex-col space-y-2 p-4">
                                    <Label className="font-sans text-[10px] font-bold text-slate-400 uppercase">
                                      Nhập mã nguồn của file
                                    </Label>
                                    <textarea
                                      value={activeFile.content}
                                      onChange={(e) => {
                                        const files = [...newProblem.files];
                                        files[createActiveFileIdx].content = e.target.value;
                                        setNewProblem({ ...newProblem, files });
                                      }}
                                      className="w-full flex-1 rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-200 focus:outline-none"
                                      placeholder="Hãy viết hoặc dán mã nguồn chứa bug tại đây..."
                                    />
                                  </div>
                                ) : (
                                  /* BUGS DESIGN INLINE MODE (PR-Review style code list with toggles to edit bugs) */
                                  <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed select-text">
                                    {(() => {
                                      const lines = (activeFile.content || "").split("\n");
                                      return (
                                        <div className="w-full">
                                          <div className="mb-3 rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3 font-sans text-xs text-indigo-300">
                                            📍 <strong>Chế độ Design Lỗi:</strong> Di chuột vào dòng
                                            code, bấm nút <strong>+ Lỗi</strong> hoặc{" "}
                                            <strong>Sửa lỗi</strong> ở bên trái để thiết lập.
                                          </div>
                                          {lines.map((lineText, lineIdx) => {
                                            const currentLineNum = lineIdx + 1;
                                            const lineIssues = newProblem.expectedIssues.filter(
                                              (iss) =>
                                                iss.filename === activeFile.filename &&
                                                Number(iss.lineNumber) === currentLineNum
                                            );

                                            const toggleKey = `edit-${activeFile.filename}-${currentLineNum}`;
                                            const isExpanded = !!expandedIssues[toggleKey];

                                            return (
                                              <React.Fragment key={lineIdx}>
                                                {/* Code Row */}
                                                <div
                                                  className={cn(
                                                    "group relative flex items-center rounded-sm px-1 py-0.5 hover:bg-slate-800/40",
                                                    lineIssues.length > 0 &&
                                                      "border-l-2 border-l-red-500 bg-red-950/10"
                                                  )}>
                                                  {/* Left Gutter: contains Toggle Add/Sửa Bug Button and Line Number */}
                                                  <div className="flex w-20 shrink-0 items-center justify-end gap-1.5 pr-2.5 select-none">
                                                    {lineIssues.length > 0 ? (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setExpandedIssues((prev) => ({
                                                            ...prev,
                                                            [toggleKey]: !prev[toggleKey],
                                                          }));
                                                        }}
                                                        className={cn(
                                                          "rounded p-0.5 text-indigo-400 transition-colors hover:bg-slate-800"
                                                        )}>
                                                        {isExpanded ? (
                                                          <EyeOff className="h-3.5 w-3.5" />
                                                        ) : (
                                                          <Eye className="h-3.5 w-3.5" />
                                                        )}
                                                      </button>
                                                    ) : (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          // Add new issue to this line
                                                          const newIssue: ExpectedIssue = {
                                                            filename: activeFile.filename,
                                                            lineNumber: currentLineNum,
                                                            severity: "CRITICAL",
                                                            description: "",
                                                          };
                                                          setNewProblem((prev) => ({
                                                            ...prev,
                                                            expectedIssues: [
                                                              ...prev.expectedIssues,
                                                              newIssue,
                                                            ],
                                                          }));
                                                          setExpandedIssues((prev) => ({
                                                            ...prev,
                                                            [toggleKey]: true,
                                                          }));
                                                        }}
                                                        className="rounded p-0.5 text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-800">
                                                        <Plus className="h-3.5 w-3.5" />
                                                      </button>
                                                    )}
                                                    <span className="text-slate-655 w-6 text-right font-semibold text-slate-600">
                                                      {currentLineNum}
                                                    </span>
                                                  </div>

                                                  <span className="flex-1 font-mono break-all whitespace-pre text-slate-200">
                                                    {lineText || " "}
                                                  </span>
                                                </div>

                                                {/* Inline Edit Card for Line Issues (Clean GitHub style layout) */}
                                                {isExpanded &&
                                                  lineIssues.map((issue, lineIssueIdx) => {
                                                    // Find absolute index inside newProblem.expectedIssues
                                                    const absoluteIdx =
                                                      newProblem.expectedIssues.findIndex(
                                                        (x) =>
                                                          x.filename === issue.filename &&
                                                          x.lineNumber === issue.lineNumber &&
                                                          x.description === issue.description
                                                      );
                                                    const targetIdx =
                                                      absoluteIdx !== -1
                                                        ? absoluteIdx
                                                        : lineIssueIdx;

                                                    return (
                                                      <div
                                                        key={lineIssueIdx}
                                                        className={cn(
                                                          "my-1.5 mr-2 ml-20 flex flex-col gap-3 rounded-lg border p-3.5 font-sans text-xs shadow-sm",
                                                          issue.severity === "CRITICAL"
                                                            ? "border-red-900 bg-red-950/40 text-red-200"
                                                            : issue.severity === "WARNING"
                                                              ? "border-amber-900 bg-amber-950/40 text-amber-200"
                                                              : "border-blue-900 bg-blue-950/40 text-blue-200"
                                                        )}>
                                                        {/* Header of the bug card */}
                                                        <div className="border-slate-850 flex items-center justify-between border-b pb-2">
                                                          <div className="flex items-center gap-3">
                                                            <Bug className="h-4.5 w-4.5 text-slate-400" />
                                                            <span className="font-bold text-slate-200">
                                                              Cấu hình lỗi
                                                            </span>

                                                            {/* Severity Select directly at the top header */}
                                                            <select
                                                              value={issue.severity || "CRITICAL"}
                                                              onChange={(e) => {
                                                                const expectedIssues = [
                                                                  ...newProblem.expectedIssues,
                                                                ];
                                                                expectedIssues[targetIdx].severity =
                                                                  e.target.value as
                                                                    | "CRITICAL"
                                                                    | "WARNING"
                                                                    | "INFO";
                                                                setNewProblem({
                                                                  ...newProblem,
                                                                  expectedIssues,
                                                                });
                                                              }}
                                                              className="border-slate-850 h-7 rounded border bg-slate-900 px-2 text-xs font-semibold text-white focus:outline-none">
                                                              <option value="CRITICAL">
                                                                🔴 Critical
                                                              </option>
                                                              <option value="WARNING">
                                                                🟡 Warning
                                                              </option>
                                                              <option value="INFO">🔵 Info</option>
                                                            </select>
                                                          </div>
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              handleRemoveExpectedIssue(targetIdx)
                                                            }
                                                            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300">
                                                            <Trash className="h-3.5 w-3.5" />
                                                            <span>Xóa lỗi</span>
                                                          </button>
                                                        </div>

                                                        {/* Description Field */}
                                                        <div className="space-y-1">
                                                          <textarea
                                                            value={issue.description}
                                                            onChange={(e) => {
                                                              const expectedIssues = [
                                                                ...newProblem.expectedIssues,
                                                              ];
                                                              expectedIssues[
                                                                targetIdx
                                                              ].description = e.target.value;
                                                              setNewProblem({
                                                                ...newProblem,
                                                                expectedIssues,
                                                              });
                                                            }}
                                                            rows={3}
                                                            placeholder="Mô tả lỗi tại đây (AI sẽ đối chiếu mô tả này để tự động chấm điểm)..."
                                                            className="border-slate-850 w-full rounded border bg-slate-950 px-2.5 py-1.5 font-sans text-xs text-white focus:outline-none"
                                                          />
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                              </React.Fragment>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        /* Summary of Expected Issues list only */
                        <div className="flex-1 space-y-3 overflow-y-auto p-4 font-sans">
                          <div className="mb-2 text-xs font-medium text-slate-400">
                            Nhấp vào bất kỳ lỗi nào dưới đây để tự động chuyển đến file và dòng
                            tương ứng chứa lỗi đó để chỉnh sửa.
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            {newProblem.expectedIssues.map((issue, issIdx) => (
                              <div
                                key={issIdx}
                                onClick={() => {
                                  // Jump to file tab
                                  const fileIdx = newProblem.files.findIndex(
                                    (f) => f.filename === issue.filename
                                  );
                                  if (fileIdx !== -1) {
                                    setCreateActiveFileIdx(fileIdx);
                                    setCreateTabMode("code");
                                    setActiveFileEditMode("bugs");
                                    // Toggle open specifically for this issue line
                                    const toggleKey = `edit-${issue.filename}-${issue.lineNumber}`;
                                    setExpandedIssues((prev) => ({
                                      ...prev,
                                      [toggleKey]: true,
                                    }));
                                  }
                                }}
                                className="group hover:bg-slate-850 flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm transition-all hover:border-indigo-500">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                                    <Bug
                                      className={cn(
                                        "h-4.5 w-4.5",
                                        issue.severity === "CRITICAL"
                                          ? "text-red-400"
                                          : issue.severity === "WARNING"
                                            ? "text-amber-400"
                                            : "text-blue-400"
                                      )}
                                    />
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-mono text-xs font-semibold text-white">
                                        {issue.filename || "Solution.java"}
                                      </span>
                                      <span className="rounded bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                                        Dòng {issue.lineNumber}
                                      </span>
                                      <span
                                        className={cn(
                                          "rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase",
                                          issue.severity === "CRITICAL"
                                            ? "bg-red-955 border border-red-900/60 bg-red-950/80 text-red-400"
                                            : issue.severity === "WARNING"
                                              ? "bg-amber-955 border border-amber-900/60 bg-amber-950/80 text-amber-400"
                                              : "bg-blue-955 border border-blue-900/60 bg-blue-950/80 text-blue-400"
                                        )}>
                                        {issue.severity}
                                      </span>
                                    </div>
                                    <p className="mt-1 line-clamp-1 text-xs text-slate-400 group-hover:text-slate-300">
                                      {issue.description || "(Chưa có mô tả chi tiết)"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 transition-colors group-hover:text-indigo-400">
                                  <span>Sửa trong Code</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            ))}
                          </div>

                          {newProblem.expectedIssues.length === 0 && (
                            <div className="py-10 text-center">
                              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-500/80" />
                              <p className="text-xs text-slate-400">
                                Chưa có lỗi mẫu nào được thiết lập. Hãy chuyển sang tab Code Files
                                để thêm.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CodeReviewEditor.displayName = "CodeReviewEditor";
