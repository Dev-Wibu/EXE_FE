import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { extractDataArray } from "@/lib/utils";
import { questionCategoryManager } from "@/services/question-category.manager";
import { ArrowLeft, Edit2, Folder, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { QuestionBank, QuestionCategory } from "../types";
import { QuestionBankGrid } from "./QuestionBankGrid";

interface QuestionBankCategoryTabProps {
  questions?: QuestionBank[];
  onEditQuestion?: (q: QuestionBank) => void;
  onDeleteQuestion?: (q: QuestionBank) => void;
}

export function QuestionBankCategoryTab({
  questions = [],
  onEditQuestion,
  onDeleteQuestion,
}: QuestionBankCategoryTabProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drill-down state
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);

  // Inline Edit states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [createValue, setCreateValue] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<QuestionCategory | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreating]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await questionCategoryManager.getAll();
      if (res.success) {
        setCategories(extractDataArray(res));
      }
    } catch {
      toast.error(t("category.loadListFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (cat: QuestionCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(cat.id!);
    setEditValue(cat.categoryName || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editValue.trim()) {
      handleCancelEdit();
      return;
    }

    // Optimistic update check
    const currentCat = categories.find((c) => c.id === editingId);
    if (currentCat?.categoryName === editValue.trim()) {
      handleCancelEdit();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await questionCategoryManager.update(editingId, {
        categoryName: editValue.trim(),
      });
      if (res.success) {
        toast.success(t("general.updateSuccess"));
        handleCancelEdit();
        fetchCategories();
      } else {
        toast.error(res.error || t("general.updateFailed"));
      }
    } catch {
      toast.error(t("compCodingSubmissionModal.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setCreateValue("");
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setCreateValue("");
  };

  const handleSaveCreate = async () => {
    if (!createValue.trim()) {
      handleCancelCreate();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await questionCategoryManager.create({
        categoryName: createValue.trim(),
      });
      if (res.success) {
        toast.success(t("general.addSuccess"));
        handleCancelCreate();
        fetchCategories();
      } else {
        toast.error(res.error || t("general.addFailed"));
      }
    } catch {
      toast.error(t("compCodingSubmissionModal.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (cat: QuestionCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCategory(cat);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory?.id) return;
    setIsSubmitting(true);
    try {
      const res = await questionCategoryManager.delete(deletingCategory.id);
      if (res.success) {
        toast.success(t("general.deleteSuccess"));
        setIsDeleteDialogOpen(false);
        fetchCategories();
      } else {
        toast.error(res.error || t("general.deleteFailed"));
      }
    } catch {
      toast.error(t("compCodingSubmissionModal.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveEdit();
    if (e.key === "Escape") handleCancelEdit();
  };

  const onCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveCreate();
    if (e.key === "Escape") handleCancelCreate();
  };

  const handleCardClick = (cat: QuestionCategory) => {
    if (editingId === cat.id) return;
    setSelectedCategory(cat);
  };

  // --- Render Drill-down View ---
  if (selectedCategory) {
    const categoryQuestions = questions.filter(
      (q) => q.questionCategory?.id === selectedCategory.id
    );

    return (
      <div className="flex h-full flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setSelectedCategory(null)}
            className="h-9 gap-2 px-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back", "Quay lại")}
          </Button>
          <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Folder className="h-4 w-4" />
            {selectedCategory.categoryName}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">
              {categoryQuestions.length} {t("question.questions", "Câu hỏi")}
            </span>
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-slate-200 bg-white/50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          {categoryQuestions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center">
              <Folder className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                Chưa có câu hỏi nào trong chuyên mục này.
              </p>
            </div>
          ) : (
            <QuestionBankGrid
              questions={categoryQuestions}
              onEdit={onEditQuestion || (() => {})}
              onDelete={onDeleteQuestion || (() => {})}
            />
          )}
        </div>
      </div>
    );
  }

  // --- Render Folders Grid View ---
  return (
    <div className="flex h-full flex-col space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {categories.length} {t("adminQuestionbankmanagement.categoryName").toLowerCase()}
          </h2>
        </div>
        <Button
          onClick={handleStartCreate}
          disabled={isCreating}
          className="bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow">
          <Plus className="mr-2 h-4 w-4" />
          {t("adminQuestionbankmanagement.addCategory")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Ghost Card for Creating */}
          {isCreating && (
            <div className="group relative flex h-[100px] flex-col justify-between overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm ring-4 ring-indigo-500/10 dark:border-indigo-900 dark:bg-indigo-950/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                  <Folder className="h-5 w-5 fill-current opacity-80" />
                </div>
                <div className="flex-1">
                  <Input
                    ref={createInputRef}
                    value={createValue}
                    onChange={(e) => setCreateValue(e.target.value)}
                    onKeyDown={onCreateKeyDown}
                    onBlur={handleSaveCreate}
                    disabled={isSubmitting}
                    placeholder="Enter name..."
                    className="h-8 border-none bg-transparent px-1 text-sm font-semibold shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actual Category Cards */}
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCardClick(cat)}
              className={`group relative flex h-[100px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/50 ${editingId === cat.id ? "border-indigo-200 ring-4 ring-indigo-500/10 dark:border-indigo-900" : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-400">
                  <Folder className="h-5 w-5 fill-current opacity-80" />
                </div>

                <div className="flex-1 overflow-hidden pt-1">
                  {editingId === cat.id ? (
                    <Input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={onEditKeyDown}
                      onBlur={handleSaveEdit}
                      disabled={isSubmitting}
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 border-none bg-indigo-50 px-1 text-[15px] font-semibold text-indigo-900 shadow-none focus-visible:ring-0 dark:bg-indigo-950 dark:text-indigo-100"
                    />
                  ) : (
                    <h3
                      onClick={(e) => handleStartEdit(cat, e)}
                      className="truncate px-1 text-[15px] font-semibold text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                      title={t("question.editInfoInstructions", "Bấm để sửa tên")}>
                      {cat.categoryName}
                    </h3>
                  )}
                  <p className="mt-1 px-1 text-xs text-slate-500 dark:text-slate-400">
                    ID: {cat.id}
                  </p>
                </div>
              </div>

              {/* Action Buttons (Visible on Hover) */}
              {editingId !== cat.id && (
                <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleStartEdit(cat, e)}
                    className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleOpenDelete(cat, e)}
                    className="h-7 w-7 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && !isCreating && (
            <div className="col-span-full flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/20">
              <Folder className="mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm font-medium text-slate-500">
                {t("adminQuestionbankmanagement.noDataFound")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              {t("adminQuestionbankmanagement.deleteCategory")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 dark:text-slate-300">
              {t("adminQuestionbankmanagement.areYouSureDeleteCategory")}{" "}
              <strong className="text-slate-900 dark:text-white">
                {deletingCategory?.categoryName}
              </strong>
              ?
              <br />
              <span className="mt-2 block text-sm text-slate-500">
                {t("adminQuestionbankmanagement.actionCannotBeUndone")}
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("adminQuestionbankmanagement.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="shadow-sm">
              {isSubmitting
                ? t("adminQuestionbankmanagement.deleting")
                : t("adminQuestionbankmanagement.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
