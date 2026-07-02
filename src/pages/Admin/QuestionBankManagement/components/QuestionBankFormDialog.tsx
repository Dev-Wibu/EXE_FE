import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { questionBankManager } from "@/services/question-bank.manager";
import { Loader2, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { QuestionBankFormData, QuestionCategory, QuestionGenerateRequest } from "../types";

interface QuestionBankFormDialogProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  formData: Partial<QuestionBankFormData>;
  onFormChange: (_data: Partial<QuestionBankFormData>) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
  categories: QuestionCategory[];
  onCreateCategory?: (name: string) => Promise<number | undefined>;
}

export function QuestionBankFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
  categories,
  onCreateCategory,
}: QuestionBankFormDialogProps) {
  const { t } = useTranslation();

  // AI Generator State
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopics, setAiTopics] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const handleCreateCategorySubmit = async () => {
    if (!newCategoryName.trim() || !onCreateCategory) return;
    setIsSubmittingCategory(true);
    const newId = await onCreateCategory(newCategoryName.trim());
    setIsSubmittingCategory(false);
    if (newId) {
      onFormChange({ ...formData, questionCategoryId: newId });
      setIsCreatingCategory(false);
      setNewCategoryName("");
    }
  };

  const handleGenerate = async () => {
    const categoryName = categories.find((c) => c.id === formData.questionCategoryId)?.categoryName;
    if (!categoryName) {
      toast.error(t("ai.selectCategoryFirst"));
      return;
    }
    if (!formData.questionLevel) {
      toast.error(t("ai.selectDifficultyFirst"));
      return;
    }

    setAiLoading(true);
    const req: QuestionGenerateRequest = {
      categoryName: categoryName,
      difficulty: formData.questionLevel,
      topics: aiTopics
        ? aiTopics
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      additionalPrompt: aiPrompt,
    };

    const res = await questionBankManager.generateByAI(req);
    setAiLoading(false);

    if (res.success && res.data) {
      onFormChange({
        ...formData,
        questionText: res.data.questionText,
        options: res.data.options,
        correctAnswer: res.data.correctAnswer,
      });
      toast.success(t("ai.generateQuestionSuccess"));
      setShowAI(false);
    } else {
      toast.error(res.error || t("ai.generateQuestionError"));
    }
  };

  const addOption = () => {
    const opts = formData.options || [];
    onFormChange({ ...formData, options: [...opts, ""] });
  };

  const updateOption = (index: number, value: string) => {
    const opts = [...(formData.options || [])];
    const oldValue = opts[index];
    opts[index] = value;
    
    // Sync correct answer if the edited option is the currently selected correct answer
    if (formData.correctAnswer && formData.correctAnswer === oldValue && oldValue !== "") {
      onFormChange({ ...formData, options: opts, correctAnswer: value });
    } else {
      onFormChange({ ...formData, options: opts });
    }
  };

  const toggleCorrectAnswer = (value: string) => {
    if (!value.trim()) return; // Don't allow empty string as correct answer
    if (formData.correctAnswer === value) {
      onFormChange({ ...formData, correctAnswer: "" });
    } else {
      onFormChange({ ...formData, correctAnswer: value });
    }
  };

  const removeOption = (index: number) => {
    const opts = [...(formData.options || [])];
    opts.splice(index, 1);
    onFormChange({ ...formData, options: opts });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto border-l border-slate-200 bg-slate-50 p-0 dark:border-slate-800 dark:bg-[#0F172A] sm:max-w-xl md:max-w-2xl">
        <div className="flex-1 space-y-8 p-6 md:p-8">
          <SheetHeader className="space-y-2">
            <SheetTitle className="text-xl font-semibold tracking-tight">{title}</SheetTitle>
            <SheetDescription className="text-slate-500">{description}</SheetDescription>
          </SheetHeader>

          {/* Form Content */}
          <div className="space-y-8">
            {/* Meta row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    {t("general.category")}
                  </Label>
                  {onCreateCategory && !isCreatingCategory && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] text-indigo-600 hover:bg-transparent dark:text-indigo-400"
                      onClick={() => setIsCreatingCategory(true)}>
                      <Plus className="mr-1 h-3 w-3" /> {t("general.quickAdd")}
                    </Button>
                  )}
                  {isCreatingCategory && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] text-slate-500 hover:bg-transparent"
                      onClick={() => setIsCreatingCategory(false)}>
                      {t("common.cancel")}
                    </Button>
                  )}
                </div>
                {isCreatingCategory ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      placeholder={t("category.enterCategoryName2")}
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateCategorySubmit();
                        }
                      }}
                      className="h-9 focus-visible:ring-indigo-500"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-9"
                      onClick={handleCreateCategorySubmit}
                      disabled={!newCategoryName.trim() || isSubmittingCategory}>
                      {isSubmittingCategory ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("general.save")
                      )}
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={formData.questionCategoryId?.toString() || ""}
                    onValueChange={(val) =>
                      onFormChange({ ...formData, questionCategoryId: parseInt(val) })
                    }>
                    <SelectTrigger className="h-9 focus:ring-indigo-500">
                      <SelectValue placeholder={t("category.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id!.toString()}>
                          {c.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  {t("common.difficulty")}
                </Label>
                <Select
                  value={formData.questionLevel || ""}
                  onValueChange={(val: "EASY" | "MEDIUM" | "HARD") =>
                    onFormChange({ ...formData, questionLevel: val })
                  }>
                  <SelectTrigger className="h-9 focus:ring-indigo-500">
                    <SelectValue placeholder={t("general.selectDifficulty")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">{t("common.easy")} (EASY)</SelectItem>
                    <SelectItem value="MEDIUM">{t("common.mediumLevel")} (MEDIUM)</SelectItem>
                    <SelectItem value="HARD">{t("common.hard")} (HARD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* AI Magic Header */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {t("common.questionText")}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAI(!showAI)}
                className={`h-7 px-2 text-[11px] font-medium transition-colors ${showAI ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" : "text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"}`}>
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                AI Magic
              </Button>
            </div>

            {/* AI Magic Panel */}
            {showAI && (
              <div className="animate-in slide-in-from-top-2 fade-in rounded-xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">{t("question.relatedTopics")}</Label>
                    <Input
                      placeholder="VD: Spring Boot, AOP, Transactional..."
                      value={aiTopics}
                      onChange={(e) => setAiTopics(e.target.value)}
                      className="h-9 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t("question.additionalPrompt")}</Label>
                    <Textarea
                      placeholder={t("question.promptExample")}
                      rows={2}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="resize-none focus-visible:ring-indigo-500"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                    onClick={handleGenerate}
                    disabled={aiLoading}>
                    {aiLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {aiLoading ? t("ai.generatingQuestion") : t("ai.startGenerating")}
                  </Button>
                </div>
              </div>
            )}

            {/* Manual Fields (Hidden when AI Panel is active) */}
            {!showAI && (
              <div className="space-y-8 animate-in fade-in">
                <Textarea
                  placeholder={t("adminPracticequestionmanagement.enterQuestionContent")}
                  rows={4}
                  value={formData.questionText || ""}
                  onChange={(e) => onFormChange({ ...formData, questionText: e.target.value })}
                  className="resize-none text-[15px] focus-visible:ring-indigo-500"
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                    <Label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      {t("question.answers")}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addOption}
                      className="h-6 px-2 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                      <Plus className="mr-1 h-3 w-3" /> {t("question.addAnswer")}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {(formData.options || []).map((opt, idx) => {
                      const optLetter = String.fromCharCode(65 + idx);
                      const isCorrect = 
                        (formData.correctAnswer === opt && opt.trim() !== "") ||
                        (formData.correctAnswer?.trim().toUpperCase() === optLetter);
                        
                      return (
                        <div key={idx} className="group relative">
                          <button
                            type="button"
                            onClick={() => toggleCorrectAnswer(opt)}
                            title={t("question.markAsCorrect")}
                            className={`absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                              isCorrect
                                ? "bg-emerald-500 text-white shadow-md ring-4 ring-emerald-500/20"
                                : "bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-emerald-900/30"
                            }`}>
                            {String.fromCharCode(65 + idx)}
                          </button>
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(idx, e.target.value)}
                            placeholder={`Nhập đáp án...`}
                            className={`h-11 pl-11 pr-9 transition-colors focus-visible:ring-indigo-500 ${
                              isCorrect ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                            }`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-slate-400 opacity-0 transition-opacity hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100"
                            onClick={() => removeOption(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50/80 p-6 backdrop-blur-md dark:border-slate-800 dark:bg-[#0F172A]/80">
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("general.cancel")}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={aiLoading || !formData.questionCategoryId}
              className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700">
              {submitLabel}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
