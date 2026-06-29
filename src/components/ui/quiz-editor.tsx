"use client";

import {
  Check,
  Edit2,
  FolderOpen,
  HelpCircle,
  Plus,
  Search,
  Sparkles,
  Timer,
  Trash2,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreInput } from "@/components/ui/score-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface QuizQuestion {
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  points?: number;
}

interface QuizEditorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  disabled?: boolean;
  // General Settings Props
  maxScore: number;
  onMaxScoreChange: (val: number) => void;
  passThreshold: number;
  onPassThresholdChange: (val: number) => void;
  timeLimitMinutes: number;
  onTimeLimitMinutesChange: (val: number) => void;
}

const getMockQuestionBank = (t: (key: string) => string) => [
  {
    questionText: t("compQuizEditor.mockQ1"),
    options: ['"number"', '"NaN"', '"undefined"', '"object"'],
    correctAnswer: '"number"',
    points: 10,
    category: "JavaScript",
    difficulty: t("common.difficultyEasy"),
  },
  {
    questionText: t("compQuizEditor.mockQ2"),
    options: ["3", "4", "5", "Undefined"],
    correctAnswer: "4",
    points: 10,
    category: "JavaScript",
    difficulty: t("common.difficultyMedium"),
  },
  {
    questionText: t("compQuizEditor.mockQ3"),
    options: [
      "top: 50%; left: 50%; transform: translate(-50%, -50%);",
      "align-items: center; justify-content: center;",
      "margin: auto;",
      "vertical-align: middle;",
    ],
    correctAnswer: "top: 50%; left: 50%; transform: translate(-50%, -50%);",
    points: 15,
    category: "CSS",
    difficulty: t("common.difficultyMedium"),
  },
  {
    questionText: t("compQuizEditor.mockQ4"),
    options: [
      t("compQuizEditor.mockQ4A"),
      t("compQuizEditor.mockQ4B"),
      t("compQuizEditor.mockQ4C"),
      t("compQuizEditor.mockQ4D"),
    ],
    correctAnswer: t("compQuizEditor.mockQ4A"),
    points: 10,
    category: "React",
    difficulty: t("common.difficultyEasy"),
  },
  {
    questionText: t("compQuizEditor.mockQ5"),
    options: ["COUNT(column_name)", "COUNT(*)", "SUM(column_name)", "TOTAL(column_name)"],
    correctAnswer: "COUNT(column_name)",
    points: 10,
    category: "SQL",
    difficulty: t("common.difficultyEasy"),
  },
  {
    questionText: t("compQuizEditor.mockQ6"),
    options: [
      t("compQuizEditor.mockQ6A"),
      t("compQuizEditor.mockQ6B"),
      t("compQuizEditor.mockQ6C"),
      "Recursive CTE",
    ],
    correctAnswer: t("compQuizEditor.mockQ6A"),
    points: 20,
    category: "SQL",
    difficulty: t("common.difficultyHard"),
  },
  {
    questionText: t("compQuizEditor.mockQ7"),
    options: [
      t("compQuizEditor.mockQ7A"),
      t("compQuizEditor.mockQ7B"),
      t("compQuizEditor.mockQ7C"),
      t("compQuizEditor.mockQ7D"),
    ],
    correctAnswer: t("compQuizEditor.mockQ7A"),
    points: 10,
    category: "OOP",
    difficulty: t("common.difficultyEasy"),
  },
];

type RightPaneView = "idle" | "view" | "edit" | "bank";

export function QuizEditor({
  questions = [],
  onChange,
  disabled = false,
  maxScore,
  onMaxScoreChange,
  passThreshold,
  onPassThresholdChange,
  timeLimitMinutes,
  onTimeLimitMinutesChange,
}: QuizEditorProps) {
  const { t } = useTranslation();
  const MOCK_QUESTION_BANK = React.useMemo(() => getMockQuestionBank(t), [t]);
  // Right pane state
  const [rightView, setRightView] = React.useState<RightPaneView>("idle");
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  // Edit form states
  const [editForm, setEditForm] = React.useState<QuizQuestion>({
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10,
  });

  // Question Bank states
  const [selectedBankIndexes, setSelectedBankIndexes] = React.useState<number[]>([]);
  const [bankSearch, setBankSearch] = React.useState("");
  const [bankCategory, setBankCategory] = React.useState("All");

  // Time edit inline
  const [editingTime, setEditingTime] = React.useState(false);

  const categories = ["All", "JavaScript", "CSS", "React", "SQL", "OOP"];

  // --- Left column actions ---

  const handleSelectQuestion = (index: number) => {
    setSelectedIndex(index);
    setRightView("view");
  };

  const handleAddNew = () => {
    setSelectedIndex(-1);
    setEditForm({
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 10,
    });
    setRightView("edit");
  };

  const handleEditQuestion = (index: number) => {
    const q = questions[index];
    setSelectedIndex(index);
    setEditForm({
      questionText: q.questionText || "",
      options: [...(q.options || ["", "", "", ""])],
      correctAnswer: q.correctAnswer || "",
      points: q.points ?? 10,
    });
    setRightView("edit");
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = questions.filter((_, idx) => idx !== index);
    onChange(updated);
    if (selectedIndex === index) {
      setRightView("idle");
      setSelectedIndex(null);
    } else if (selectedIndex !== null && selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleSaveQuestion = () => {
    if (!editForm.questionText?.trim()) return;

    const updated = [...questions];
    const finalForm: QuizQuestion = {
      questionText: editForm.questionText || "",
      options: editForm.options || ["", "", "", ""],
      correctAnswer: editForm.correctAnswer || (editForm.options && editForm.options[0]) || "",
      points: editForm.points ?? 10,
    };

    if (selectedIndex === -1) {
      updated.push(finalForm);
      setSelectedIndex(updated.length - 1);
    } else if (selectedIndex !== null) {
      updated[selectedIndex] = finalForm;
    }

    onChange(updated);
    setRightView("view");
  };

  const openBank = () => {
    setSelectedBankIndexes([]);
    setBankSearch("");
    setBankCategory("All");
    setRightView("bank");
  };

  // Question bank filters
  const filteredBank = MOCK_QUESTION_BANK.filter((q) => {
    const matchesSearch = (q.questionText || "").toLowerCase().includes(bankSearch.toLowerCase());
    const matchesCategory = bankCategory === "All" || q.category === bankCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleBankSelection = (index: number) => {
    setSelectedBankIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const addSelectedFromBank = () => {
    const selectedQuestions = selectedBankIndexes.map((idx) => {
      const q = MOCK_QUESTION_BANK[idx];
      return {
        questionText: q.questionText,
        options: [...q.options],
        correctAnswer: q.correctAnswer,
        points: q.points,
      };
    });
    onChange([...questions, ...selectedQuestions]);
    setRightView("idle");
    setSelectedBankIndexes([]);
  };

  const passScore = Math.round(passThreshold * maxScore);

  // ========================== RENDER ==========================
  return (
    <div className="grid h-full grid-cols-12 gap-0">
      {/* ==================== LEFT COLUMN ==================== */}
      <div className="col-span-4 flex flex-col border-r border-slate-100 dark:border-slate-800/60">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {/* --- Score Settings Compact --- */}
          <div className="space-y-3">
            {/* Max Score + Time in one row */}
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

              {/* Time - compact badge style */}
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
                    <span className="shrink-0 text-[9px] text-slate-400">{t("common.minute")}</span>
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

            {/* Pass Score - circular */}
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

          {/* --- Divider --- */}
          <div className="border-t border-slate-100 dark:border-slate-800/60" />

          {/* --- Questions Navigation --- */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                {t("adminQuizProblem.questionWithParen")}
                {questions.length})
              </h4>
              <span className="text-[10px] font-medium text-slate-400">
                {questions.reduce((s, q) => s + (q.points || 0), 0)} đ
              </span>
            </div>

            {/* Question Bank Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={openBank}
              className={cn(
                "h-7 w-full justify-start border-slate-200 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900",
                rightView === "bank" &&
                  "border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:border-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
              )}>
              <FolderOpen className="mr-1.5 h-3 w-3 text-indigo-500" />
              {t("adminQuizProblem.questionBank")}
            </Button>

            {/* Question Number Boxes Grid */}
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isActive =
                  selectedIndex === idx && (rightView === "view" || rightView === "edit");
                const hasCode = (q.questionText || "").includes("```");
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuestion(idx)}
                    className={cn(
                      "group relative flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-bold transition-all",
                      isActive
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                    )}>
                    {idx + 1}
                    {hasCode && (
                      <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}

              {/* Add Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-400 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-800 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400">
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {questions.length === 0 && (
              <p className="text-[10px] leading-relaxed text-slate-400">
                {t("adminQuizProblem.noQuestionPress")}
                <strong>[ + ]</strong> {t("common.orOpen")}{" "}
                <strong>{t("adminQuizProblem.questionBank")}</strong>.
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
                <HelpCircle className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {t("adminQuizProblem.selectQuestionToViewDetails")}
                </p>
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  {t("adminQuizProblem.pressLeftBoxOrPress")}
                  <strong>[ + ]</strong> {t("adminQuizProblem.toCreateNew")}
                  <br />
                  {t("common.orOpen")}
                  <strong>{t("adminQuizProblem.questionBank")}</strong>{" "}
                  {t("adminQuizProblem.toGetExistingQuestion")}
                </p>
              </div>
            </div>
          )}

          {/* --- VIEW STATE: Question detail --- */}
          {rightView === "view" &&
            selectedIndex !== null &&
            selectedIndex >= 0 &&
            questions[selectedIndex] && (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                      {selectedIndex + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {t("adminQuizProblem.questionNumber")}
                        {selectedIndex + 1}
                      </h3>
                      <p className="text-[10px] font-medium text-slate-400">
                        {questions[selectedIndex].points ?? 10} {t("common.score")}
                        {(questions[selectedIndex].questionText || "").includes("```") &&
                          t("adminQuizProblem.containsCode")}
                      </p>
                    </div>
                  </div>

                  {!disabled && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuestion(selectedIndex)}
                        className="h-8 border-slate-200 text-xs dark:border-slate-800">
                        <Edit2 className="mr-1 h-3.5 w-3.5" />
                        {t("common.editShort")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuestion(selectedIndex)}
                        className="h-8 border-red-200 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30">
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {t("common.delete")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Question content */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/20">
                  <p className="font-mono text-sm leading-relaxed font-semibold whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                    {questions[selectedIndex].questionText || ""}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                    {t("adminQuizProblem.options")}
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {(questions[selectedIndex].options || []).map((opt, oIdx) => {
                      const isCorrect = opt === questions[selectedIndex].correctAnswer;
                      return (
                        <div
                          key={oIdx}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
                            isCorrect
                              ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/20"
                              : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950/30"
                          )}>
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span
                            className={cn(
                              "text-sm",
                              isCorrect
                                ? "font-semibold text-emerald-700 dark:text-emerald-400"
                                : "text-slate-600 dark:text-slate-300"
                            )}>
                            {opt}
                          </span>
                          {isCorrect && (
                            <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          {/* --- EDIT STATE: Add/Edit question form --- */}
          {rightView === "edit" && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800/60">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedIndex === -1
                    ? t("adminQuizProblem.addNewQuestion")
                    : `Chỉnh sửa câu hỏi #${(selectedIndex || 0) + 1}`}
                </h3>
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("adminQuizProblem.questionContent")}
                </Label>
                <textarea
                  value={editForm.questionText || ""}
                  onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                  placeholder={t("compQuizEditor.placeholderQuestionText")}
                  className="min-h-[160px] w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("adminQuizProblem.optionsABCD")}
                </Label>
                {(editForm.options || ["", "", "", ""]).map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(editForm.options || ["", "", "", ""])];
                        newOpts[oIdx] = e.target.value;
                        setEditForm({ ...editForm, options: newOpts });
                      }}
                      placeholder={`Phương án ${String.fromCharCode(65 + oIdx)}`}
                      className="h-10 border-slate-200 bg-white text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                ))}
              </div>

              {/* Correct Answer & Score */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("adminQuizProblem.correctAnswer")}
                  </Label>
                  <Select
                    value={editForm.correctAnswer || ""}
                    onValueChange={(val) => setEditForm({ ...editForm, correctAnswer: val })}>
                    <SelectTrigger className="h-10 border-slate-200 bg-white text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                      <SelectValue placeholder={t("adminQuizProblem.selectAnswer")} />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                      {(editForm.options || ["", "", "", ""]).map((opt, oIdx) => (
                        <SelectItem
                          key={oIdx}
                          value={opt || `Option-${oIdx}`}
                          disabled={!opt.trim()}>
                          {String.fromCharCode(65 + oIdx)}.{" "}
                          {opt || t("adminQuizProblem.notEntered")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("adminQuizProblem.scoreValue")}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={editForm.points ?? 10}
                    onChange={(e) => setEditForm({ ...editForm, points: Number(e.target.value) })}
                    className="h-10 border-slate-200 bg-white text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedIndex !== null && selectedIndex >= 0) {
                      setRightView("view");
                    } else {
                      setRightView("idle");
                      setSelectedIndex(null);
                    }
                  }}
                  className="h-8 border-slate-200 text-xs dark:border-slate-800">
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveQuestion}
                  className="h-8 bg-emerald-600 px-4 text-xs text-white hover:bg-emerald-700">
                  {t("adminQuizProblem.saveQuestion")}
                </Button>
              </div>
            </div>
          )}

          {/* --- BANK STATE: Question Bank Browser --- */}
          {rightView === "bank" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800/60">
                <FolderOpen className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t("adminQuizProblem.questionBank")}
                </h3>
                <span className="ml-auto text-xs font-medium text-slate-400">
                  {t("common.selected")}{" "}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {selectedBankIndexes.length}
                  </strong>
                </span>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 md:flex-row dark:border-slate-800 dark:bg-slate-950">
                <div className="relative flex-1">
                  <Search className="absolute top-2 left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    placeholder={t("adminQuizProblem.searchQuestion")}
                    className="h-8 border-slate-200 bg-white pl-8 text-xs dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setBankCategory(cat)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[9px] font-bold transition-all",
                        bankCategory === cat
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                      )}>
                      {cat === "All" ? t("common.all") : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions list */}
              <div className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
                {filteredBank.map((q, idx) => {
                  const originalIndex = MOCK_QUESTION_BANK.findIndex(
                    (bq) => bq.questionText === q.questionText
                  );
                  const isSelected = selectedBankIndexes.includes(originalIndex);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleBankSelection(originalIndex)}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all",
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/[0.04] dark:bg-indigo-950/15"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:border-slate-700"
                      )}>
                      <div className="mt-0.5">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                          )}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 ring-1 ring-indigo-600/10 ring-inset dark:bg-indigo-950/30 dark:text-indigo-400">
                            {q.category}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset",
                              q.difficulty === t("common.difficultyEasy") &&
                                "bg-green-50 text-green-700 ring-green-600/10 dark:bg-green-950/20 dark:text-green-400",
                              q.difficulty === t("common.difficultyMedium") &&
                                "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/20 dark:text-amber-400",
                              q.difficulty === t("common.difficultyHard") &&
                                "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-950/20 dark:text-red-400"
                            )}>
                            {q.difficulty}
                          </span>
                          <span className="ml-auto text-[10px] font-semibold text-slate-400">
                            {q.points} {t("common.score")}
                          </span>
                        </div>
                        <p className="rounded-lg border border-slate-100 bg-slate-50 p-2 font-mono text-xs leading-relaxed font-semibold whitespace-pre-wrap dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                          {q.questionText.length > 120
                            ? q.questionText.substring(0, 120) + "..."
                            : q.questionText}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {filteredBank.length === 0 && (
                  <div className="py-10 text-center text-xs text-slate-500">
                    {t("adminQuizProblem.noMatchingQuestion")}
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
                  disabled={selectedBankIndexes.length === 0}
                  onClick={addSelectedFromBank}
                  className="h-8 bg-indigo-600 px-4 text-xs text-white hover:bg-indigo-700">
                  {t("common.add")}
                  {selectedBankIndexes.length > 0 ? ` (${selectedBankIndexes.length})` : ""}{" "}
                  {t("adminQuizProblem.intoRound")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
