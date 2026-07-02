"use client";
import { useTranslation } from "react-i18next";

import {
  Check,
  ChevronDown,
  Code2,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Search,
  Timer,
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
import { codingProblemManager, type CodingProblem } from "@/services/coding-problem.manager";
import { toast } from "sonner";

interface CodingEditorProps {
  codingProblemsId: number[];
  codingProblems: { problemId?: number; title?: string; difficulty?: string }[];
  onChange: (
    _ids: number[],
    _problems: { problemId?: number; title?: string; difficulty?: string }[]
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

// Common Java/Python primitive types for dropdowns
const PARAM_TYPE_OPTIONS = [
  "int",
  "int[]",
  "int[][]",
  "long",
  "long[]",
  "double",
  "double[]",
  "String",
  "String[]",
  "boolean",
  "boolean[]",
  "char",
  "char[]",
  "List<Integer>",
  "List<String>",
  "List<List<Integer>>",
  "TreeNode",
  "ListNode",
];

const RETURN_TYPE_OPTIONS = [
  "int",
  "int[]",
  "int[][]",
  "long",
  "double",
  "String",
  "String[]",
  "boolean",
  "boolean[]",
  "char",
  "List<Integer>",
  "List<String>",
  "List<List<Integer>>",
  "TreeNode",
  "ListNode",
  "void",
];

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

export const CodingEditor = React.forwardRef<
  {
    saveCurrentProblem: () => Promise<
      | boolean
      | { ids: number[]; problems: { problemId?: number; title?: string; difficulty?: string }[] }
    >;
  },
  CodingEditorProps
>(
  (
    {
      codingProblemsId = [],
      codingProblems = [],
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
    const { t } = useTranslation();
    const [rightView, setRightView] = React.useState<RightPaneView>("idle");
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

    // System problem bank states
    const [bankProblems, setBankProblems] = React.useState<CodingProblem[]>([]);
    const [isLoadingBank, setIsLoadingBank] = React.useState(false);
    const [selectedBankIds, setSelectedBankIds] = React.useState<number[]>([]);
    const [bankSearch, setBankSearch] = React.useState("");
    const [bankDifficulty, setBankDifficulty] = React.useState<"ALL" | "EASY" | "MEDIUM" | "HARD">(
      "ALL"
    );

    // Create problem form states
    const [newProblem, setNewProblem] = React.useState<{
      id?: number;
      title: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      problemStatement: string;
      rulesAndConstraints: string[];
      paramTypes: string[];
      returnType: string;
      executionTimeLimitMs: number;
      memoryLimitMb: number;
      visibleExamples: { inputs: string[]; output: string; explanation: string }[];
      hiddenTestCases: { inputs: string[]; expectedOutput: string; weightPoints: number }[];
      codeStubs: Record<string, string>;
    }>({
      title: "",
      difficulty: "EASY",
      problemStatement: "",
      rulesAndConstraints: [],
      paramTypes: [],
      returnType: "",
      executionTimeLimitMs: 1000,
      memoryLimitMb: 256,
      visibleExamples: [{ inputs: [""], output: "", explanation: "" }],
      hiddenTestCases: [{ inputs: [""], expectedOutput: "", weightPoints: 10 }],
      codeStubs: { java: "", python: "" },
    });

    // AI generation states
    const [aiTopic, setAiTopic] = React.useState("");
    const [aiLevel, setAiLevel] = React.useState("Junior");
    const [aiDifficulty, setAiDifficulty] = React.useState<"EASY" | "MEDIUM" | "HARD">("EASY");
    const [aiRequirement, setAiRequirement] = React.useState("");
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [creationMode, setCreationMode] = React.useState<"ai" | "manual">("ai");
    const [aiGeneratedLoaded, setAiGeneratedLoaded] = React.useState(false);

    // Constraint input state
    const [constraintInput, setConstraintInput] = React.useState("");
    const [, setCustomParamType] = React.useState("");
    const [, setCustomReturnType] = React.useState("");

    // Edit and Custom Dropdown states
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
    const [isReturnDropdownOpen, setIsReturnDropdownOpen] = React.useState(false);
    const returnDropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          returnDropdownRef.current &&
          !returnDropdownRef.current.contains(event.target as Node)
        ) {
          setIsReturnDropdownOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    React.useImperativeHandle(ref, () => ({
      saveCurrentProblem: async () => {
        if (rightView === "create") {
          return await handleSaveProblem();
        }
        // In "bank" or "idle" mode, return current selections so parent updates state
        return {
          ids: codingProblemsId,
          problems: codingProblems,
        };
      },
    }));

    const handleAddExample = () => {
      setNewProblem((prev) => ({
        ...prev,
        visibleExamples: [...prev.visibleExamples, { inputs: [""], output: "", explanation: "" }],
      }));
    };

    const handleRemoveExample = (index: number) => {
      setNewProblem((prev) => ({
        ...prev,
        visibleExamples: prev.visibleExamples.filter((_, i) => i !== index),
      }));
    };

    const handleAddTestCase = () => {
      setNewProblem((prev) => ({
        ...prev,
        hiddenTestCases: [
          ...prev.hiddenTestCases,
          { inputs: [""], expectedOutput: "", weightPoints: 10 },
        ],
      }));
    };

    const handleRemoveTestCase = (index: number) => {
      setNewProblem((prev) => ({
        ...prev,
        hiddenTestCases: prev.hiddenTestCases.filter((_, i) => i !== index),
      }));
    };

    const handleAddConstraint = (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !newProblem.rulesAndConstraints.includes(trimmed)) {
        setNewProblem((prev) => ({
          ...prev,
          rulesAndConstraints: [...prev.rulesAndConstraints, trimmed],
        }));
      }
      setConstraintInput("");
    };

    const handleRemoveConstraint = (index: number) => {
      setNewProblem((prev) => ({
        ...prev,
        rulesAndConstraints: prev.rulesAndConstraints.filter((_, i) => i !== index),
      }));
    };

    const handleAddParamType = (type: string) => {
      const trimmed = type.trim();
      if (trimmed && !newProblem.paramTypes.includes(trimmed)) {
        setNewProblem((prev) => ({ ...prev, paramTypes: [...prev.paramTypes, trimmed] }));
      }
      setCustomParamType("");
    };

    const handleRemoveParamType = (index: number) => {
      setNewProblem((prev) => ({
        ...prev,
        paramTypes: prev.paramTypes.filter((_, i) => i !== index),
      }));
    };

    const openCreate = () => {
      setRightView("create");
      setSelectedIndex(null);
      setCreationMode("ai");
      setAiGeneratedLoaded(false);
      setNewProblem({
        title: "",
        difficulty: "EASY",
        problemStatement: "",
        rulesAndConstraints: [],
        paramTypes: [],
        returnType: "",
        executionTimeLimitMs: 1000,
        memoryLimitMb: 256,
        visibleExamples: [{ inputs: [""], output: "", explanation: "" }],
        hiddenTestCases: [{ inputs: [""], expectedOutput: "", weightPoints: 10 }],
        codeStubs: { java: "", python: "" },
      });
      setAiTopic("");
      setAiRequirement("");
      setConstraintInput("");
      setCustomParamType("");
      setCustomReturnType("");
    };

    const handleAiGenerate = async () => {
      if (!aiTopic.trim()) {
        toast.warning(t("adminCodeReviewProblem.pleaseEnterTopicForAi"));
        return;
      }
      setIsGenerating(true);
      try {
        const res = await codingProblemManager.generate({
          topic: aiTopic,
          difficulty: aiDifficulty,
          targetLevel: aiLevel,
          context: {
            jobTitle: "",
            requirement: aiRequirement.trim() || t("adminCodeReviewProblem.basicAndPractical"),
            prompting: "",
          },
        });
        if (res.success && res.data) {
          const gen = res.data;
          const rawHidden =
            gen.hiddenTestCases || (gen as Record<string, unknown>).hiddenTestcases || [];
          const mappedHidden =
            Array.isArray(rawHidden) && rawHidden.length > 0
              ? (
                  rawHidden as Array<{
                    inputs?: string[];
                    expectedOutput?: string;
                    output?: string;
                    weightPoints?: number;
                  }>
                ).map((tc) => ({
                  inputs: tc.inputs || [],
                  expectedOutput: tc.expectedOutput || tc.output || "",
                  weightPoints: tc.weightPoints || 10,
                }))
              : [{ inputs: [""], expectedOutput: "", weightPoints: 10 }];

          setNewProblem({
            title: gen.title || "",
            difficulty: (gen.difficulty as "EASY" | "MEDIUM" | "HARD") || aiDifficulty,
            problemStatement: gen.problemStatement || "",
            rulesAndConstraints: gen.rulesAndConstraints || [],
            paramTypes: gen.paramTypes || [],
            returnType: gen.returnType || "",
            executionTimeLimitMs: gen.executionTimeLimitMs || 1000,
            memoryLimitMb: gen.memoryLimitMb || 256,
            visibleExamples: gen.visibleExamples?.map((ex) => ({
              inputs: ex.inputs || [],
              output: ex.output || "",
              explanation: ex.explanation || "",
            })) || [{ inputs: [""], output: "", explanation: "" }],
            hiddenTestCases: mappedHidden,
            codeStubs: gen.codeStubs || { java: "", python: "" },
          });
          toast.success(t("adminCodeReviewProblem.aiGenerateSuccessEditMode"));
          setCreationMode("manual");
          setAiGeneratedLoaded(false);
        } else {
          toast.error(res.error || t("adminCodeReviewProblem.cannotGenerateAutomatically"));
        }
      } catch (e) {
        console.error(e);
        toast.error(t("adminCodeReviewProblem.errorGenerateByAi"));
      } finally {
        setIsGenerating(false);
      }
    };

    const handleSaveProblem = async (): Promise<
      | boolean
      | { ids: number[]; problems: { problemId?: number; title?: string; difficulty?: string }[] }
    > => {
      if (!newProblem.title.trim()) {
        toast.warning(t("adminCodeReviewProblem.pleaseEnterTitle"));
        return false;
      }
      if (!newProblem.problemStatement.trim()) {
        toast.warning(t("adminCodeReviewProblem.pleaseEnterDescription"));
        return false;
      }

      try {
        const res = await codingProblemManager.create(newProblem);
        if (res.success && res.data) {
          toast.success(
            editingIndex !== null
              ? t("adminCodingProblem.updateSuccess")
              : t("adminCodingProblem.createSuccess")
          );
          await fetchProblemBank();
          const createdId = res.data.id;

          const newIds = [...codingProblemsId];
          const newProblems = [...codingProblems];

          if (editingIndex !== null) {
            newIds[editingIndex] = createdId;
            newProblems[editingIndex] = {
              problemId: createdId,
              title: res.data.title,
              difficulty: res.data.difficulty,
            };
          } else {
            newIds.push(createdId);
            newProblems.push({
              problemId: createdId,
              title: res.data.title,
              difficulty: res.data.difficulty,
            });
          }

          onChange(newIds, newProblems);
          if (editingIndex !== null) {
            setSelectedIndex(editingIndex);
          } else {
            setSelectedIndex(newIds.length - 1);
          }
          setEditingIndex(null);
          setRightView("view");
          return { ids: newIds, problems: newProblems };
        } else {
          toast.error(res.error || t("adminCodeReviewProblem.cannotSaveProblem"));
          return false;
        }
      } catch (e) {
        console.error(e);
        toast.error(t("adminCodeReviewProblem.errorSaveProblem"));
        return false;
      }
    };

    // Inline editing for time
    const [editingTime, setEditingTime] = React.useState(false);

    // Load problem bank from GET /api/coding-problems
    const fetchProblemBank = async () => {
      setIsLoadingBank(true);
      try {
        const res = await codingProblemManager.getAll();
        if (res.success && res.data) {
          setBankProblems(res.data);
        } else {
          toast.error(res.error || t("adminCodingProblem.cannotLoadList"));
        }
      } catch (e) {
        console.error(e);
        toast.error(t("adminCodeReviewProblem.errorLoadList"));
      } finally {
        setIsLoadingBank(false);
      }
    };

    React.useEffect(() => {
      fetchProblemBank();
    }, []);

    const handleSelectProblem = (index: number) => {
      setSelectedIndex(index);
      setRightView("view");
    };

    const openBank = () => {
      setSelectedBankIds([]);
      setBankSearch("");
      setBankDifficulty("ALL");
      setRightView("bank");
    };

    const handleDeleteProblem = (index: number) => {
      const newIds = codingProblemsId.filter((_, idx) => idx !== index);
      const newProblems = codingProblems.filter((_, idx) => idx !== index);
      onChange(newIds, newProblems);

      if (selectedIndex === index) {
        setRightView("idle");
        setSelectedIndex(null);
      } else if (selectedIndex !== null && selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1);
      }
    };

    const handleAddSelectedFromBank = () => {
      const newIds = [...codingProblemsId];
      const newProblems = [...codingProblems];

      selectedBankIds.forEach((id) => {
        if (!newIds.includes(id)) {
          newIds.push(id);
          const systemProblem = bankProblems.find((p) => p.id === id);
          newProblems.push({
            problemId: id,
            title: systemProblem?.title || `Bài tập #${id}`,
            difficulty: systemProblem?.difficulty || "EASY",
          });
        }
      });

      onChange(newIds, newProblems);
      setRightView("idle");
      setSelectedBankIds([]);
      toast.success(`Đã thêm ${selectedBankIds.length} bài tập vào vòng thi`);
    };

    const toggleBankSelection = (id: number) => {
      setSelectedBankIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    };

    // Filter bank problems
    const filteredBank = bankProblems.filter((p) => {
      const matchesSearch =
        (p.title || "").toLowerCase().includes(bankSearch.toLowerCase()) ||
        (p.problemStatement || "").toLowerCase().includes(bankSearch.toLowerCase());
      const matchesDifficulty = bankDifficulty === "ALL" || p.difficulty === bankDifficulty;
      return matchesSearch && matchesDifficulty;
    });

    const passScore = Math.round(passThreshold * maxScore);
    const selectedProblemDetails =
      selectedIndex !== null
        ? bankProblems.find((p) => p.id === codingProblemsId[selectedIndex])
        : null;

    const difficultyBadge = (diff?: string) => {
      const map: Record<string, string> = {
        EASY: t("common.difficultyEasy"),
        MEDIUM: t("common.difficultyMedium"),
        HARD: t("common.difficultyHard"),
      };
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
      <div className="grid h-full grid-cols-12 gap-0">
        {/* ==================== LEFT COLUMN ==================== */}
        <div className="col-span-4 flex flex-col border-r border-slate-100 dark:border-slate-800/60">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {/* --- Score Settings --- */}
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-[55%] space-y-1">
                  <Label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                    {t("adminCodeReviewProblem.maxScore")}
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

                <div className="w-[45%] space-y-1">
                  <Label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                    {t("common.time")}
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
                        className="h-11 w-full [appearance:textfield] border-slate-200 bg-white text-center text-xs font-bold dark:border-slate-800 dark:bg-slate-950 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="shrink-0 text-[9px] text-slate-400">
                        {t("common.minute")}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingTime(true)}
                      className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400">
                      <Timer className="h-4 w-4 text-slate-400" />
                      {timeLimitMinutes > 0 ? `${timeLimitMinutes} phút` : t("common.unlimited")}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                  {t("adminCodingProblem.minimumPassingScore")}
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

            <div className="border-t border-slate-100 dark:border-slate-800/60" />

            {/* --- Coding Problems Navigation --- */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                  {t("adminCodingProblem.problemWithParen")}
                  {codingProblemsId.length})
                </h4>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={openBank}
                  className={cn(
                    "h-7 flex-1 justify-start border-slate-200 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900",
                    rightView === "bank" &&
                      "border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:border-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                  )}>
                  <FolderOpen className="mr-1.5 h-3 w-3 text-indigo-500" />
                  {t("adminCodingProblem.problemBank")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={openCreate}
                  className={cn(
                    "h-7 flex-1 justify-start border-slate-200 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900",
                    rightView === "create" &&
                      "border-emerald-500 bg-emerald-50/50 text-emerald-600 dark:border-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                  )}>
                  <Plus className="mr-1.5 h-3 w-3 text-emerald-500" />
                  {t("adminCodingProblem.createProblem")}
                </Button>
              </div>

              {/* Horizontal Cards list */}
              <div className="flex flex-col gap-2">
                {codingProblemsId.map((id, idx) => {
                  const isActive = selectedIndex === idx && rightView === "view";
                  const problem = codingProblems[idx] || {};
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectProblem(idx)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                        isActive
                          ? "border-indigo-500 bg-indigo-50/50 shadow-sm dark:border-indigo-600 dark:bg-indigo-950/20"
                          : "hover:border-slate-350 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/20 dark:hover:border-slate-700"
                      )}>
                      <span
                        className={cn(
                          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ring-1 ring-inset",
                          isActive
                            ? "bg-indigo-600 text-white ring-indigo-600"
                            : "bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800"
                        )}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="dark:text-slate-250 truncate text-xs font-semibold text-slate-800">
                          {problem.title || `Bài tập #${id}`}
                        </div>
                        <div className="flex items-center gap-2">
                          {difficultyBadge(problem.difficulty)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {codingProblemsId.length === 0 && (
                <p className="text-[10px] leading-relaxed text-slate-400">
                  {t("adminCodingProblem.noProblemSelectedPress")}
                  <strong>{t("adminCodingProblem.problemBankFull")}</strong>{" "}
                  {t("adminCodingProblem.toSelectSystemProblem")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN ==================== */}
        <div className="col-span-8 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            {/* --- IDLE STATE --- */}
            {rightView === "idle" && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="rounded-2xl border-2 border-dashed border-slate-200 px-10 py-12 dark:border-slate-800">
                  <Code2 className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t("adminCodingProblem.selectProblemToViewDetail")}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                    {t("adminCodingProblem.pressLeftBoxOrOpen")}
                    <strong>{t("adminCodingProblem.problemBankFull")}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* --- VIEW STATE --- */}
            {rightView === "view" && selectedIndex !== null && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                      {selectedIndex + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {codingProblems[selectedIndex]?.title ||
                          `Bài tập #${codingProblemsId[selectedIndex]}`}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-2">
                        {difficultyBadge(codingProblems[selectedIndex]?.difficulty)}
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
                          if (selectedProblemDetails) {
                            setNewProblem({
                              id: selectedProblemDetails.id,
                              title: selectedProblemDetails.title || "",
                              difficulty: selectedProblemDetails.difficulty || "EASY",
                              problemStatement: selectedProblemDetails.problemStatement || "",
                              rulesAndConstraints: selectedProblemDetails.rulesAndConstraints || [],
                              paramTypes: selectedProblemDetails.paramTypes || [],
                              returnType: selectedProblemDetails.returnType || "",
                              executionTimeLimitMs:
                                selectedProblemDetails.executionTimeLimitMs || 1000,
                              memoryLimitMb: selectedProblemDetails.memoryLimitMb || 256,
                              visibleExamples: (selectedProblemDetails.visibleExamples || []).map(
                                (ex) => ({
                                  inputs: ex.inputs || [""],
                                  output: ex.output || "",
                                  explanation: ex.explanation || "",
                                })
                              ),
                              hiddenTestCases: (selectedProblemDetails.hiddenTestCases || []).map(
                                (tc) => ({
                                  inputs: tc.inputs || [""],
                                  expectedOutput: tc.expectedOutput || "",
                                  weightPoints: tc.weightPoints || 10,
                                })
                              ),
                              codeStubs: selectedProblemDetails.codeStubs || {
                                java: "",
                                python: "",
                              },
                            });
                            setEditingIndex(selectedIndex);
                            setRightView("create");
                            setCreationMode("manual");
                          }
                        }}
                        className="text-indigo-650 h-8 border-indigo-200 text-xs hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/30">
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        {t("common.edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProblem(selectedIndex)}
                        className="h-8 border-red-200 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30">
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {t("adminCodingProblem.removeFromRound")}
                      </Button>
                    </div>
                  )}
                </div>

                {selectedProblemDetails ? (
                  <div className="space-y-4">
                    {/* Problem Statement */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/20">
                      <h4 className="mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t("adminCodingProblem.problemDescription")}
                      </h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                        {selectedProblemDetails.problemStatement}
                      </p>
                    </div>

                    {/* Constraints */}
                    {selectedProblemDetails.rulesAndConstraints &&
                      selectedProblemDetails.rulesAndConstraints.length > 0 && (
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                            {t("adminCodingProblem.constraintsAndRules")}
                          </Label>
                          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-400">
                            {selectedProblemDetails.rulesAndConstraints.map((rule, idx) => (
                              <li key={idx}>{rule}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Examples */}
                    {selectedProblemDetails.visibleExamples &&
                      selectedProblemDetails.visibleExamples.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                            {t("adminCodingProblem.sampleExamples")}
                          </Label>
                          <div className="space-y-2">
                            {selectedProblemDetails.visibleExamples.map((ex, idx) => (
                              <div
                                key={idx}
                                className="space-y-1 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/30">
                                <div className="text-xs font-bold text-slate-500">
                                  {t("common.example")}
                                  {idx + 1}:
                                </div>
                                <div className="font-mono text-xs text-slate-600 dark:text-slate-300">
                                  <strong>{t("common.input")}</strong> {ex.inputs?.join(", ")}
                                </div>
                                <div className="font-mono text-xs text-slate-600 dark:text-slate-300">
                                  <strong>{t("common.output")}</strong> {ex.output}
                                </div>
                                {ex.explanation && (
                                  <div className="text-xs text-slate-500 italic">
                                    <strong>{t("common.explanation")}</strong> {ex.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Resource Limits */}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/40">
                      <div>
                        {t("adminCodingProblem.runtimeLimit")}{" "}
                        <strong>{selectedProblemDetails.executionTimeLimitMs} ms</strong>
                      </div>
                      <div>
                        {t("adminCodingProblem.memoryLimit")}
                        <strong>{selectedProblemDetails.memoryLimitMb} MB</strong>
                      </div>
                    </div>

                    {/* Hidden Test Cases */}
                    {selectedProblemDetails.hiddenTestCases &&
                      selectedProblemDetails.hiddenTestCases.length > 0 && (
                        <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800/40">
                          <Label className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                            {t("adminCodingProblem.hiddenTestCasesWithParen")}
                            {selectedProblemDetails.hiddenTestCases.length})
                          </Label>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedProblemDetails.hiddenTestCases.map((tc, idx) => (
                              <div
                                key={idx}
                                className="flex flex-wrap items-center justify-between rounded-lg border border-slate-100 bg-slate-50/40 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/20">
                                <div className="font-mono text-slate-600 dark:text-slate-300">
                                  <strong>TC {idx + 1}:</strong> {tc.inputs?.join(", ")} &rarr;{" "}
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    {tc.expectedOutput}
                                  </span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                  {t("common.scoreColon")}{" "}
                                  <span className="font-semibold text-emerald-600">
                                    {tc.weightPoints}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-slate-400 italic">
                    {t("adminCodingProblem.loadingProblemDetails")}
                  </div>
                )}
              </div>
            )}

            {/* --- BANK STATE --- */}
            {rightView === "bank" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800/60">
                  <FolderOpen className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t("adminCodingProblem.codingProblemBank")}
                  </h3>
                  <span className="ml-auto text-xs font-medium text-slate-400">
                    {t("common.selected")}{" "}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {selectedBankIds.length}
                    </strong>
                  </span>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 md:flex-row dark:border-slate-800 dark:bg-slate-950">
                  <div className="relative flex-1">
                    <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder={t("adminCodeReviewProblem.searchProblem")}
                      className="h-9 border-slate-200 bg-white pl-8 text-xs dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setBankDifficulty(diff)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[10px] font-bold transition-all",
                          bankDifficulty === diff
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                        )}>
                        {diff === "ALL"
                          ? t("common.all")
                          : diff === "EASY"
                            ? t("common.difficultyEasy")
                            : diff === "MEDIUM"
                              ? t("common.difficultyMedium")
                              : t("common.difficultyHard")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problem list */}
                <div className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
                  {isLoadingBank ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      {t("adminCodeReviewProblem.loadingProblemList")}
                    </div>
                  ) : (
                    filteredBank.map((p, idx) => {
                      const isSelected = selectedBankIds.includes(p.id);
                      const isAdded = codingProblemsId.includes(p.id);

                      return (
                        <div
                          key={idx}
                          onClick={() => !isAdded && toggleBankSelection(p.id)}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-3 transition-all",
                            isAdded
                              ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/10"
                              : isSelected
                                ? "cursor-pointer border-indigo-500 bg-indigo-500/[0.04] dark:bg-indigo-950/15"
                                : "cursor-pointer border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:border-slate-700"
                          )}>
                          <div className="mt-0.5">
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                                isAdded
                                  ? "border-slate-350 bg-slate-300 text-white dark:bg-slate-700"
                                  : isSelected
                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                    : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                              )}>
                              {(isSelected || isAdded) && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {difficultyBadge(p.difficulty)}
                              <span className="text-slate-850 text-xs font-semibold dark:text-slate-200">
                                {p.title}
                              </span>
                              {isAdded && (
                                <span className="ml-auto text-[10px] text-slate-400 italic">
                                  {t("adminCodingProblem.alreadyInRound")}
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                              {p.problemStatement}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {!isLoadingBank && filteredBank.length === 0 && (
                    <div className="py-10 text-center text-xs text-slate-500">
                      {t("adminCodeReviewProblem.noMatchingProblem")}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRightView("idle");
                      setSelectedIndex(null);
                    }}
                    className="h-8 border-slate-200 text-xs dark:border-slate-800">
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={selectedBankIds.length === 0}
                    onClick={handleAddSelectedFromBank}
                    className="h-8 bg-indigo-600 px-4 text-xs text-white hover:bg-indigo-700">
                    {t("common.add")}
                    {selectedBankIds.length > 0 ? ` (${selectedBankIds.length})` : ""}{" "}
                    {t("adminCodingProblem.intoRound")}
                  </Button>
                </div>
              </div>
            )}

            {/* --- CREATE STATE --- */}
            {rightView === "create" && (
              <div className="relative flex h-full flex-col space-y-4">
                {isGenerating && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-xl bg-slate-50/85 backdrop-blur-[2px] dark:bg-slate-950/85">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                      <span className="dark:text-slate-350 text-xs font-semibold text-slate-600">
                        {t("adminCodingProblem.aiGeneratingWait")}
                      </span>
                    </div>
                  </div>
                )}
                {/* Header & Mode Select */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-emerald-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {t("adminCodingProblem.createNewCodingProblem")}
                      </h3>
                    </div>

                    {/* Tabs to switch mode */}
                    <div className="w-fit rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900">
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          onClick={() => setCreationMode("ai")}
                          className={cn(
                            "rounded px-3 py-1.5 text-xs font-semibold transition-all",
                            creationMode === "ai"
                              ? "text-indigo-650 bg-white shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                          )}>
                          {t("adminCodeReviewProblem.generateByAi")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreationMode("manual");
                            setAiGeneratedLoaded(false);
                          }}
                          className={cn(
                            "rounded px-3 py-1.5 text-xs font-semibold transition-all",
                            creationMode === "manual"
                              ? "text-indigo-650 bg-white shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                          )}>
                          {t("adminCodeReviewProblem.manual")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Generate button top-right (only in AI mode and not loaded) */}
                  {creationMode === "ai" && !aiGeneratedLoaded && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isGenerating}
                      onClick={handleAiGenerate}
                      className="bg-indigo-650 h-8 px-4 text-xs text-white hover:bg-indigo-700 disabled:opacity-60">
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          {t("common.generating")}
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                          {t("adminCodingProblem.generateWithAi")}
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* View 1: AI Input — No scroll, compact, fits in one view */}
                {creationMode === "ai" && !aiGeneratedLoaded && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-5 dark:border-indigo-950/30 dark:from-indigo-950/10 dark:to-violet-950/10">
                      <div className="mb-4 flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                        <Wand2 className="h-4 w-4 animate-pulse" />
                        {t("adminCodingProblem.enterInfoForAiGenerate")}
                      </div>

                      {/* Row 1: Topic full width */}
                      <div className="mb-4 space-y-1.5">
                        <Label className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                          {t("adminCodingProblem.problemTopic")}
                          <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                          placeholder={t("compCodingEditor.exampleTitle")}
                          className="h-10 bg-white text-xs dark:bg-slate-950"
                        />
                      </div>

                      {/* Row 2: Difficulty + Level */}
                      <div className="mb-4 grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                            {t("common.difficulty")}
                          </Label>
                          <StyledSelect
                            value={aiDifficulty}
                            onChange={(v) => setAiDifficulty(v as "EASY" | "MEDIUM" | "HARD")}>
                            <option value="EASY">{t("compCodingEditor.easy")}</option>
                            <option value="MEDIUM">{t("compCodingEditor.medium")}</option>
                            <option value="HARD">{t("compCodingEditor.hard")}</option>
                          </StyledSelect>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                            {t("adminCodeReviewProblem.candidateLevel")}
                          </Label>
                          <StyledSelect value={aiLevel} onChange={setAiLevel}>
                            <option value="Intern">🌱 Intern</option>
                            <option value="Junior">⚡ Junior</option>
                            <option value="Senior">🔥 Senior</option>
                          </StyledSelect>
                        </div>
                      </div>

                      {/* Row 3: Requirement */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                          {t("adminCodingProblem.specialRequirementsOptional")}
                        </Label>
                        <Input
                          value={aiRequirement}
                          onChange={(e) => setAiRequirement(e.target.value)}
                          placeholder={t("compCodingEditor.exampleHint")}
                          className="h-9 bg-white text-xs dark:bg-slate-950"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRightView("idle")}
                        className="h-8 text-xs text-slate-400 hover:text-slate-600">
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* View 2: Redesigned Grouped Form */}
                {(creationMode === "manual" || (creationMode === "ai" && aiGeneratedLoaded)) && (
                  <div className="flex min-h-0 flex-1 flex-col space-y-4">
                    {creationMode === "ai" && aiGeneratedLoaded && (
                      <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <span>{t("adminCodingProblem.aiGenerateSuccessEdit")}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAiGeneratedLoaded(false);
                          }}
                          className="text-[10px] underline hover:text-emerald-900 dark:hover:text-emerald-300">
                          {t("adminCodingProblem.generateAnotherProblem")}
                        </button>
                      </div>
                    )}

                    {/* Form Scroll Area */}
                    <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                      {/* SECTION 1: THÔNG TIN CHUNG */}
                      <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/20">
                        <h4 className="border-b border-slate-100 pb-2 text-[11px] font-bold tracking-wider text-indigo-600 uppercase dark:border-slate-800 dark:text-indigo-400">
                          {t("adminCodingProblem.step1GeneralInfo")}
                        </h4>

                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-8 space-y-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">
                              {t("adminCodingProblem.problemTitle")}
                            </Label>
                            <Input
                              value={newProblem.title}
                              onChange={(e) =>
                                setNewProblem({ ...newProblem, title: e.target.value })
                              }
                              placeholder={t("compCodingEditor.exampleDescription")}
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="col-span-4 space-y-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">
                              {t("common.difficulty")}
                            </Label>
                            <StyledSelect
                              value={newProblem.difficulty}
                              onChange={(v) =>
                                setNewProblem({
                                  ...newProblem,
                                  difficulty: v as "EASY" | "MEDIUM" | "HARD",
                                })
                              }>
                              <option value="EASY">{t("common.difficultyEasyEmoji")}</option>
                              <option value="MEDIUM">{t("common.difficultyMediumEmoji")}</option>
                              <option value="HARD">{t("common.difficultyHardEmoji")}</option>
                            </StyledSelect>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase">
                            {t("adminCodingProblem.detailedProblemDescription")}
                          </Label>
                          <textarea
                            value={newProblem.problemStatement}
                            onChange={(e) =>
                              setNewProblem({ ...newProblem, problemStatement: e.target.value })
                            }
                            rows={4}
                            placeholder={t("compCodingEditor.problemDescriptionPlaceholder")}
                            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-sans text-xs shadow-sm transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                          />
                        </div>
                      </div>

                      {/* SECTION 2: CẤU HÌNH & GIỚI HẠN */}
                      <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/20">
                        <h4 className="border-b border-slate-100 pb-2 text-[11px] font-bold tracking-wider text-indigo-600 uppercase dark:border-slate-800 dark:text-indigo-400">
                          {t("adminCodingProblem.step2ConfigAndLimits")}
                        </h4>

                        {/* Param types — pill toggle grid */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">
                              {t("adminCodingProblem.inputParamTypes")}
                            </Label>
                            {newProblem.paramTypes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setNewProblem({ ...newProblem, paramTypes: [] })}
                                className="text-[9px] text-slate-400 transition-colors hover:text-red-400">
                                {t("common.deleteAll")}
                              </button>
                            )}
                          </div>

                          {/* Selected params display */}
                          {newProblem.paramTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 rounded-lg bg-indigo-50/60 px-3 py-2 dark:bg-indigo-950/20">
                              <span className="mr-1 self-center text-[9px] font-bold tracking-wider text-indigo-400 uppercase">
                                {t("common.selectedColon")}
                              </span>
                              {newProblem.paramTypes.map((pt, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                                  {pt}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveParamType(i)}
                                    className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-indigo-700">
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Pill grid to pick types */}
                          <div className="flex flex-wrap gap-1.5">
                            {PARAM_TYPE_OPTIONS.map((t) => {
                              const selected = newProblem.paramTypes.includes(t);
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() =>
                                    selected
                                      ? handleRemoveParamType(newProblem.paramTypes.indexOf(t))
                                      : handleAddParamType(t)
                                  }
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                                    selected
                                      ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400"
                                  )}>
                                  {selected && <Check className="mr-1 inline h-2.5 w-2.5" />}
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Return type — custom dropdown */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase">
                            {t("adminCodingProblem.returnType")}
                          </Label>

                          <div ref={returnDropdownRef} className="relative">
                            <button
                              type="button"
                              onClick={() => setIsReturnDropdownOpen(!isReturnDropdownOpen)}
                              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-emerald-700">
                              <span className="flex items-center gap-2">
                                <span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
                                  {t("adminCodingProblem.resultReturns")}
                                </span>
                                {newProblem.returnType ? (
                                  <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                                    {newProblem.returnType}
                                  </span>
                                ) : (
                                  <span className="font-normal text-slate-400">
                                    {t("adminCodingProblem.noReturnTypeSelected")}
                                  </span>
                                )}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 text-slate-400 transition-transform duration-200",
                                  isReturnDropdownOpen && "rotate-180"
                                )}
                              />
                            </button>

                            {isReturnDropdownOpen && (
                              <div className="animate-in fade-in-50 slide-in-from-top-1 absolute top-full right-0 left-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-950">
                                <div className="grid grid-cols-2 gap-1">
                                  {RETURN_TYPE_OPTIONS.map((t) => {
                                    const selected = newProblem.returnType === t;
                                    return (
                                      <button
                                        key={t}
                                        type="button"
                                        onClick={() => {
                                          setNewProblem({ ...newProblem, returnType: t });
                                          setIsReturnDropdownOpen(false);
                                        }}
                                        className={cn(
                                          "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition-all",
                                          selected
                                            ? "bg-emerald-500 text-white shadow-sm"
                                            : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900/60"
                                        )}>
                                        <span>{t}</span>
                                        {selected && <Check className="h-3 w-3" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Execution limits */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">
                              {t("adminCodingProblem.timeLimitEmoji")}
                            </Label>
                            <div className="flex flex-wrap gap-1.5">
                              {[500, 1000, 2000, 3000, 5000].map((ms) => (
                                <button
                                  key={ms}
                                  type="button"
                                  onClick={() =>
                                    setNewProblem({ ...newProblem, executionTimeLimitMs: ms })
                                  }
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                                    newProblem.executionTimeLimitMs === ms
                                      ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                                  )}>
                                  {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase">
                              {t("adminCodingProblem.memoryLimitEmoji")}
                            </Label>
                            <div className="flex flex-wrap gap-1.5">
                              {[128, 256, 512, 1024].map((mb) => (
                                <button
                                  key={mb}
                                  type="button"
                                  onClick={() =>
                                    setNewProblem({ ...newProblem, memoryLimitMb: mb })
                                  }
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                                    newProblem.memoryLimitMb === mb
                                      ? "border-violet-500 bg-violet-500 text-white shadow-sm"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                                  )}>
                                  {mb >= 1024 ? `${mb / 1024}GB` : `${mb}MB`}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Constraints as tags */}
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase">
                            {t("adminCodingProblem.constraintsAndRules")}
                          </Label>
                          {newProblem.rulesAndConstraints.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {newProblem.rulesAndConstraints.map((c, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200 ring-inset dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                                  {c}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveConstraint(i)}
                                    className="rounded hover:text-red-500">
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              value={constraintInput}
                              onChange={(e) => setConstraintInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddConstraint(constraintInput);
                                }
                              }}
                              placeholder={t("compCodingEditor.exampleConstraint")}
                              className="h-9 flex-1 text-xs"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddConstraint(constraintInput)}
                              className="h-9 px-3 text-xs">
                              <Plus className="mr-1 h-3 w-3" />
                              {t("common.add")}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: VÍ DỤ MẪU */}
                      <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/20">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                          <h4 className="text-[11px] font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                            {t("adminCodingProblem.step3SampleExamplesWithParen")}
                            {newProblem.visibleExamples.length})
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleAddExample}
                            className="h-6 text-[10px] text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400">
                            <Plus className="mr-1 h-3 w-3" />
                            {t("adminCodingProblem.addExample")}
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {newProblem.visibleExamples.map((ex, idx) => (
                            <div
                              key={idx}
                              className="relative rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/20">
                              <div className="mb-2.5 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  {t("adminCodingProblem.exampleNumber")}
                                  {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExample(idx)}
                                  className="rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:text-slate-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[9px] font-bold text-slate-400 uppercase">
                                    Input
                                  </Label>
                                  <Input
                                    value={ex.inputs?.join(", ") || ""}
                                    onChange={(e) => {
                                      const list = [...newProblem.visibleExamples];
                                      list[idx] = {
                                        ...list[idx],
                                        inputs: e.target.value
                                          .split(",")
                                          .map((s) => s.trim())
                                          .filter(Boolean),
                                      };
                                      setNewProblem({ ...newProblem, visibleExamples: list });
                                    }}
                                    placeholder="[2, 7], 9"
                                    className="h-8 bg-white font-mono text-xs dark:bg-slate-950"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[9px] font-bold text-slate-400 uppercase">
                                    Output
                                  </Label>
                                  <Input
                                    value={ex.output}
                                    onChange={(e) => {
                                      const list = [...newProblem.visibleExamples];
                                      list[idx] = { ...list[idx], output: e.target.value };
                                      setNewProblem({ ...newProblem, visibleExamples: list });
                                    }}
                                    placeholder="[0, 1]"
                                    className="h-8 bg-white font-mono text-xs dark:bg-slate-950"
                                  />
                                </div>
                              </div>
                              <div className="mt-2 space-y-1">
                                <Label className="text-[9px] font-bold text-slate-400 uppercase">
                                  {t("common.explanationShort")}
                                </Label>
                                <Input
                                  value={ex.explanation}
                                  onChange={(e) => {
                                    const list = [...newProblem.visibleExamples];
                                    list[idx] = { ...list[idx], explanation: e.target.value };
                                    setNewProblem({ ...newProblem, visibleExamples: list });
                                  }}
                                  placeholder={t("compCodingEditor.explainLogicPlaceholder")}
                                  className="h-8 bg-white text-xs dark:bg-slate-950"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SECTION 4: TEST CASES ẨN */}
                      <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/20">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                          <h4 className="text-[11px] font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
                            {t("adminCodingProblem.step4HiddenTestCasesWithParen")}
                            {newProblem.hiddenTestCases.length})
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleAddTestCase}
                            className="h-6 text-[10px] text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400">
                            <Plus className="mr-1 h-3 w-3" />
                            {t("adminCodingProblem.addTc")}
                          </Button>
                        </div>

                        {/* Compact table-like layout */}
                        <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
                          {/* Header */}
                          <div className="grid grid-cols-12 gap-0 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-900">
                            <div className="col-span-1">#</div>
                            <div className="col-span-5">Input</div>
                            <div className="col-span-4">Expected Output</div>
                            <div className="col-span-1 text-center">Pts</div>
                            <div className="col-span-1"></div>
                          </div>

                          {newProblem.hiddenTestCases.map((tc, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "grid grid-cols-12 items-center gap-0 px-3 py-2",
                                idx % 2 === 0
                                  ? "bg-white dark:bg-slate-950/20"
                                  : "bg-slate-50/60 dark:bg-slate-900/20"
                              )}>
                              <div className="col-span-1 text-[10px] font-bold text-slate-400">
                                {idx + 1}
                              </div>
                              <div className="col-span-5 pr-2">
                                <Input
                                  value={tc.inputs?.join(", ") || ""}
                                  onChange={(e) => {
                                    const list = [...newProblem.hiddenTestCases];
                                    list[idx] = {
                                      ...list[idx],
                                      inputs: e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    };
                                    setNewProblem({ ...newProblem, hiddenTestCases: list });
                                  }}
                                  placeholder="[3, 2, 4], 6"
                                  className="h-7 bg-white font-mono text-[11px] dark:bg-slate-950"
                                />
                              </div>
                              <div className="col-span-4 pr-2">
                                <Input
                                  value={tc.expectedOutput}
                                  onChange={(e) => {
                                    const list = [...newProblem.hiddenTestCases];
                                    list[idx] = { ...list[idx], expectedOutput: e.target.value };
                                    setNewProblem({ ...newProblem, hiddenTestCases: list });
                                  }}
                                  placeholder="[1, 2]"
                                  className="h-7 bg-white font-mono text-[11px] dark:bg-slate-950"
                                />
                              </div>
                              <div className="col-span-1 pr-1">
                                <Input
                                  type="number"
                                  value={tc.weightPoints}
                                  onChange={(e) => {
                                    const list = [...newProblem.hiddenTestCases];
                                    list[idx] = {
                                      ...list[idx],
                                      weightPoints: Number(e.target.value),
                                    };
                                    setNewProblem({ ...newProblem, hiddenTestCases: list });
                                  }}
                                  className="h-7 [appearance:textfield] bg-white text-center text-[11px] dark:bg-slate-950 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTestCase(idx)}
                                  className="rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:text-slate-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {newProblem.hiddenTestCases.length === 0 && (
                            <div className="py-6 text-center text-[11px] text-slate-400 italic">
                              {t("adminCodingProblem.noTestCasePressAdd")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Form Actions Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/60">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRightView("idle");
                          setSelectedIndex(null);
                          setEditingIndex(null);
                        }}
                        className="h-9 border-slate-200 text-xs dark:border-slate-800">
                        {t("common.backToList")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
