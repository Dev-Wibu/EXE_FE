import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { questionBankManager } from "@/services/question-bank.manager";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("manual");

  // AI Generator State
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
      onFormChange({ ...formData, questionCategory: { id: newId } });
      setIsCreatingCategory(false);
      setNewCategoryName("");
    }
  };

  const handleGenerate = async () => {
    const categoryName = categories.find(
      (c) => c.id === formData.questionCategory?.id
    )?.categoryName;
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
      setActiveTab("manual");
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
    opts[index] = value;
    onFormChange({ ...formData, options: opts });
  };

  const removeOption = (index: number) => {
    const opts = [...(formData.options || [])];
    opts.splice(index, 1);
    onFormChange({ ...formData, options: opts });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t("general.category")}</Label>
              {onCreateCategory && !isCreatingCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-indigo-600"
                  onClick={() => setIsCreatingCategory(true)}>
                  <Plus className="mr-1 h-3 w-3" /> {t("general.quickAdd")}
                </Button>
              )}
              {isCreatingCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-slate-500"
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
                />
                <Button
                  type="button"
                  size="sm"
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
                value={formData.questionCategory?.id?.toString() || ""}
                onValueChange={(val) =>
                  onFormChange({ ...formData, questionCategory: { id: parseInt(val) } })
                }>
                <SelectTrigger>
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
          <div className="space-y-1.5">
            <Label>{t("common.difficulty")}</Label>
            <Select
              value={formData.questionLevel || ""}
              onValueChange={(val: "EASY" | "MEDIUM" | "HARD") =>
                onFormChange({ ...formData, questionLevel: val })
              }>
              <SelectTrigger>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">{t("userAiinterview.enterManually")}</TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              {t("adminCodeReviewProblem.generateAI")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>{t("common.questionText")}</Label>
              <Textarea
                placeholder={t("adminPracticequestionmanagement.enterQuestionContent")}
                rows={3}
                value={formData.questionText || ""}
                onChange={(e) => onFormChange({ ...formData, questionText: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("question.answers")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="h-7 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> {t("question.addAnswer")}
                </Button>
              </div>
              {(formData.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Đáp án ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => removeOption(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <Label>{t("question.correctAnswerInstruction")}</Label>
              <Input
                placeholder={t("question.exampleAbc")}
                value={formData.correctAnswer || ""}
                onChange={(e) => onFormChange({ ...formData, correctAnswer: e.target.value })}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="ai"
            className="mt-4 space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
            <div className="space-y-1.5">
              <Label>{t("question.relatedTopics")}</Label>
              <Input
                placeholder="VD: Spring Boot, AOP, Transactional..."
                value={aiTopics}
                onChange={(e) => setAiTopics(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("question.additionalPrompt")}</Label>
              <Textarea
                placeholder={t("question.promptExample")}
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={handleGenerate}
              disabled={aiLoading}>
              {aiLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {aiLoading ? t("ai.generatingQuestion") : t("ai.startGenerating")}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("general.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={aiLoading || !formData.questionCategory?.id}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
