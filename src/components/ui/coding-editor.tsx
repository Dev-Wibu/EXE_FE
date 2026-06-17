"use client";

import {
  Check,
  Code2,
  FolderOpen,
  Loader2,
  Plus,
  Search,
  Timer,
  Trash2,
  Wand2,
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

export function CodingEditor({
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
}: CodingEditorProps) {
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
  const [showAiGen, setShowAiGen] = React.useState(false);
  const [aiTopic, setAiTopic] = React.useState("");
  const [aiLevel, setAiLevel] = React.useState("Junior");
  const [aiDifficulty, setAiDifficulty] = React.useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const openCreate = () => {
    setRightView("create");
    setSelectedIndex(null);
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
    setShowAiGen(false);
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.warning("Vui lòng nhập chủ đề bài toán để AI sinh đề");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await codingProblemManager.generate({
        topic: aiTopic,
        difficulty: aiDifficulty,
        targetLevel: aiLevel,
        context: {
          jobTitle: "Software Engineer",
          requirement: "Cơ bản và thực tế",
        },
      });
      if (res.success && res.data) {
        const gen = res.data;
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
          hiddenTestCases: gen.hiddenTestCases?.map((tc) => ({
            inputs: tc.inputs || [],
            expectedOutput: tc.expectedOutput || "",
            weightPoints: tc.weightPoints || 10,
          })) || [{ inputs: [""], expectedOutput: "", weightPoints: 10 }],
          codeStubs: gen.codeStubs || { java: "", python: "" },
        });
        toast.success("AI đã sinh đề bài thành công!");
        setShowAiGen(false);
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

  const handleSaveProblem = async () => {
    if (!newProblem.title.trim()) {
      toast.warning("Vui lòng nhập tiêu đề bài tập");
      return;
    }
    if (!newProblem.problemStatement.trim()) {
      toast.warning("Vui lòng nhập mô tả bài tập");
      return;
    }

    try {
      const res = await codingProblemManager.create(newProblem);
      if (res.success && res.data) {
        toast.success("Tạo bài tập lập trình thành công!");
        await fetchProblemBank();
        const createdId = res.data.id;
        const newIds = [...codingProblemsId, createdId];
        const newProblems = [
          ...codingProblems,
          {
            problemId: createdId,
            title: res.data.title,
            difficulty: res.data.difficulty,
          },
        ];
        onChange(newIds, newProblems);
        setSelectedIndex(newIds.length - 1);
        setRightView("view");
      } else {
        toast.error(res.error || "Không thể lưu bài tập mới");
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi lưu bài tập");
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
        toast.error(res.error || "Không thể tải danh sách đề lập trình");
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

              <div className="w-[45%] space-y-1">
                <Label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
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
                      className="h-11 w-full [appearance:textfield] border-slate-200 bg-white text-center text-xs font-bold dark:border-slate-800 dark:bg-slate-950 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="shrink-0 text-[9px] text-slate-400">phút</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingTime(true)}
                    className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400">
                    <Timer className="h-4 w-4 text-slate-400" />
                    {timeLimitMinutes > 0 ? `${timeLimitMinutes} phút` : "Không hạn chế"}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                Điểm đạt tối thiểu
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
                Bài tập ({codingProblemsId.length})
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
                Ngân hàng đề
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
                Tạo đề bài
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
                        <span
                          className={cn(
                            "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset",
                            problem.difficulty === "EASY" &&
                              "bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-950/20 dark:text-green-400",
                            problem.difficulty === "MEDIUM" &&
                              "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/20 dark:text-amber-400",
                            problem.difficulty === "HARD" &&
                              "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-950/20 dark:text-red-400"
                          )}>
                          {problem.difficulty === "EASY"
                            ? "Dễ"
                            : problem.difficulty === "MEDIUM"
                              ? "Trung bình"
                              : "Khó"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {codingProblemsId.length === 0 && (
              <p className="text-[10px] leading-relaxed text-slate-400">
                Chưa chọn bài tập. Nhấn <strong>Ngân hàng bài tập</strong> để lựa chọn bài tập hệ
                thống.
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
                  Chọn bài tập để xem chi tiết
                </p>
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Nhấn vào ô số bên trái hoặc mở <strong>Ngân hàng bài tập</strong>.
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
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset",
                          codingProblems[selectedIndex]?.difficulty === "EASY" &&
                            "bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-950/20 dark:text-green-400",
                          codingProblems[selectedIndex]?.difficulty === "MEDIUM" &&
                            "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/20 dark:text-amber-400",
                          codingProblems[selectedIndex]?.difficulty === "HARD" &&
                            "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-950/20 dark:text-red-400"
                        )}>
                        {codingProblems[selectedIndex]?.difficulty === "EASY"
                          ? "Dễ"
                          : codingProblems[selectedIndex]?.difficulty === "MEDIUM"
                            ? "Trung bình"
                            : "Khó"}
                      </span>
                    </div>
                  </div>
                </div>

                {!disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProblem(selectedIndex)}
                    className="h-8 border-red-200 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30">
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Xóa khỏi vòng
                  </Button>
                )}
              </div>

              {selectedProblemDetails ? (
                <div className="space-y-4">
                  {/* Problem Statement */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/20">
                    <h4 className="mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mô tả bài toán
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
                          Ràng buộc & Quy tắc
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
                          Ví dụ mẫu
                        </Label>
                        <div className="space-y-2">
                          {selectedProblemDetails.visibleExamples.map((ex, idx) => (
                            <div
                              key={idx}
                              className="space-y-1 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/30">
                              <div className="text-xs font-bold text-slate-500">
                                Ví dụ {idx + 1}:
                              </div>
                              <div className="font-mono text-xs text-slate-600 dark:text-slate-300">
                                <strong>Đầu vào:</strong> {ex.inputs?.join(", ")}
                              </div>
                              <div className="font-mono text-xs text-slate-600 dark:text-slate-300">
                                <strong>Đầu ra:</strong> {ex.output}
                              </div>
                              {ex.explanation && (
                                <div className="text-xs text-slate-500 italic">
                                  <strong>Giải thích:</strong> {ex.explanation}
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
                      Giới hạn thời gian chạy:{" "}
                      <strong>{selectedProblemDetails.executionTimeLimitMs} ms</strong>
                    </div>
                    <div>
                      Giới hạn bộ nhớ: <strong>{selectedProblemDetails.memoryLimitMb} MB</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 italic">
                  Đang tải thông tin chi tiết của bài tập...
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
                  Ngân hàng bài tập lập trình
                </h3>
                <span className="ml-auto text-xs font-medium text-slate-400">
                  Đã chọn{" "}
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
                    placeholder="Tìm kiếm bài tập..."
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
                        ? "Tất cả"
                        : diff === "EASY"
                          ? "Dễ"
                          : diff === "MEDIUM"
                            ? "Trung bình"
                            : "Khó"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem list */}
              <div className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
                {isLoadingBank ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Đang tải danh sách bài tập...
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
                            <span
                              className={cn(
                                "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset",
                                p.difficulty === "EASY" &&
                                  "bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-950/20 dark:text-green-400",
                                p.difficulty === "MEDIUM" &&
                                  "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/20 dark:text-amber-400",
                                p.difficulty === "HARD" &&
                                  "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-950/20 dark:text-red-400"
                              )}>
                              {p.difficulty === "EASY"
                                ? "Dễ"
                                : p.difficulty === "MEDIUM"
                                  ? "Trung bình"
                                  : "Khó"}
                            </span>
                            <span className="text-slate-850 text-xs font-semibold dark:text-slate-200">
                              {p.title}
                            </span>
                            {isAdded && (
                              <span className="ml-auto text-[10px] text-slate-400 italic">
                                Đã có trong vòng
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
                    Không tìm thấy bài tập phù hợp.
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
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedBankIds.length === 0}
                  onClick={handleAddSelectedFromBank}
                  className="h-8 bg-indigo-600 px-4 text-xs text-white hover:bg-indigo-700">
                  Thêm{selectedBankIds.length > 0 ? ` (${selectedBankIds.length})` : ""} vào vòng
                  thi
                </Button>
              </div>
            </div>
          )}

          {/* --- CREATE STATE --- */}
          {rightView === "create" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tạo đề bài lập trình mới
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiGen(!showAiGen)}
                  className="h-8 border-indigo-200 text-xs text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/30">
                  <Wand2 className="mr-1.5 h-3.5 w-3.5 animate-pulse text-indigo-500" />
                  Tự động sinh bằng AI
                </Button>
              </div>

              {/* AI generator block */}
              {showAiGen && (
                <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 dark:border-indigo-950/20 dark:bg-indigo-950/5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    <Wand2 className="h-4 w-4" />
                    AI Assistant: Sinh đề bài tự động
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">
                        Chủ đề bài tập
                      </Label>
                      <Input
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="Ví dụ: Two sum, tìm kiếm nhị phân, cây nhị phân..."
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">
                        Độ khó
                      </Label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) =>
                          setAiDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")
                        }
                        className="dark:border-slate-850 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none dark:bg-slate-950 dark:text-slate-200">
                        <option value="EASY">Dễ</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HARD">Khó</option>
                      </select>
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">
                        Cấp độ ứng viên
                      </Label>
                      <select
                        value={aiLevel}
                        onChange={(e) => setAiLevel(e.target.value)}
                        className="dark:border-slate-850 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none dark:bg-slate-950 dark:text-slate-200">
                        <option value="Intern">Intern</option>
                        <option value="Junior">Junior</option>
                        <option value="Senior">Senior</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isGenerating}
                      onClick={handleAiGenerate}
                      className="h-8 bg-indigo-600 px-4 text-xs text-white hover:bg-indigo-700 disabled:opacity-60">
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Đang sinh đề...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                          Sinh đề với AI
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Form fields */}
              <div className="max-h-[380px] space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8 space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">
                      Tiêu đề bài tập
                    </Label>
                    <Input
                      value={newProblem.title}
                      onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                      placeholder="Nhập tiêu đề bài toán"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Độ khó</Label>
                    <select
                      value={newProblem.difficulty}
                      onChange={(e) =>
                        setNewProblem({
                          ...newProblem,
                          difficulty: e.target.value as "EASY" | "MEDIUM" | "HARD",
                        })
                      }
                      className="dark:border-slate-850 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none dark:bg-slate-950 dark:text-slate-200">
                      <option value="EASY">Dễ</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HARD">Khó</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">
                    Mô tả chi tiết đề bài
                  </Label>
                  <textarea
                    value={newProblem.problemStatement}
                    onChange={(e) =>
                      setNewProblem({ ...newProblem, problemStatement: e.target.value })
                    }
                    rows={4}
                    placeholder="Mô tả bài toán, các ví dụ và hướng dẫn giải..."
                    className="dark:border-slate-850 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">
                      Giới hạn thời gian (ms)
                    </Label>
                    <Input
                      type="number"
                      value={newProblem.executionTimeLimitMs}
                      onChange={(e) =>
                        setNewProblem({
                          ...newProblem,
                          executionTimeLimitMs: Number(e.target.value),
                        })
                      }
                      placeholder="1000"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">
                      Giới hạn bộ nhớ (MB)
                    </Label>
                    <Input
                      type="number"
                      value={newProblem.memoryLimitMb}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, memoryLimitMb: Number(e.target.value) })
                      }
                      placeholder="256"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Param Types & Return Type */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8 space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">
                      Kiểu dữ liệu tham số (Param Types - e.g. int[], int)
                    </Label>
                    <Input
                      value={newProblem.paramTypes.join(", ")}
                      onChange={(e) =>
                        setNewProblem({
                          ...newProblem,
                          paramTypes: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Ví dụ: int[], int"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">
                      Kiểu trả về (Return Type)
                    </Label>
                    <Input
                      value={newProblem.returnType}
                      onChange={(e) => setNewProblem({ ...newProblem, returnType: e.target.value })}
                      placeholder="Ví dụ: int"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Rules & Constraints */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">
                    Ràng buộc (Constraints)
                  </Label>
                  <Input
                    value={newProblem.rulesAndConstraints.join("; ")}
                    onChange={(e) =>
                      setNewProblem({
                        ...newProblem,
                        rulesAndConstraints: e.target.value
                          .split(";")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Ví dụ: nums.length <= 1000; Mỗi số nằm trong khoảng [-10^9, 10^9]"
                    className="h-9 text-xs"
                  />
                  <p className="text-[9px] text-slate-400 italic">
                    Các ràng buộc cách nhau bằng dấu chấm phẩy (;)
                  </p>
                </div>

                {/* Visible Examples */}
                <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800/40">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">
                    Ví dụ mẫu (Visible Example)
                  </Label>
                  <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500">
                          Đầu vào (cách nhau bởi dấu phẩy)
                        </Label>
                        <Input
                          value={newProblem.visibleExamples[0]?.inputs?.join(", ") || ""}
                          onChange={(e) => {
                            const list = [...newProblem.visibleExamples];
                            list[0] = {
                              ...list[0],
                              inputs: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            };
                            setNewProblem({ ...newProblem, visibleExamples: list });
                          }}
                          placeholder="Ví dụ: [2, 7, 11, 15], 9"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500">Đầu ra mong đợi</Label>
                        <Input
                          value={newProblem.visibleExamples[0]?.output || ""}
                          onChange={(e) => {
                            const list = [...newProblem.visibleExamples];
                            list[0] = { ...list[0], output: e.target.value };
                            setNewProblem({ ...newProblem, visibleExamples: list });
                          }}
                          placeholder="Ví dụ: [0, 1]"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-slate-500">Giải thích ví dụ</Label>
                      <Input
                        value={newProblem.visibleExamples[0]?.explanation || ""}
                        onChange={(e) => {
                          const list = [...newProblem.visibleExamples];
                          list[0] = { ...list[0], explanation: e.target.value };
                          setNewProblem({ ...newProblem, visibleExamples: list });
                        }}
                        placeholder="Giải thích vì sao có kết quả này..."
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Hidden Testcases */}
                <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800/40">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">
                    Test Case ẩn để chấm điểm (Hidden Test Case)
                  </Label>
                  <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500">Đầu vào ẩn</Label>
                        <Input
                          value={newProblem.hiddenTestCases[0]?.inputs?.join(", ") || ""}
                          onChange={(e) => {
                            const list = [...newProblem.hiddenTestCases];
                            list[0] = {
                              ...list[0],
                              inputs: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            };
                            setNewProblem({ ...newProblem, hiddenTestCases: list });
                          }}
                          placeholder="Ví dụ: [3, 2, 4], 6"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-slate-500">Đầu ra ẩn</Label>
                        <Input
                          value={newProblem.hiddenTestCases[0]?.expectedOutput || ""}
                          onChange={(e) => {
                            const list = [...newProblem.hiddenTestCases];
                            list[0] = { ...list[0], expectedOutput: e.target.value };
                            setNewProblem({ ...newProblem, hiddenTestCases: list });
                          }}
                          placeholder="Ví dụ: [1, 2]"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
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
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveProblem}
                  className="h-8 bg-emerald-600 px-4 text-xs text-white hover:bg-emerald-700">
                  Lưu & Thêm vào vòng thi
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
