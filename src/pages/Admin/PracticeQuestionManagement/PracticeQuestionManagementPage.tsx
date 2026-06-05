import { PaginationControl, ReloadButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
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
import { SpinnerBlock } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import i18n from "@/lib/i18n";
import { questionManager } from "@/services";
import {
  questionCategoryManager,
  type QuestionCategory,
} from "@/services/question-category.manager";
import type { PracticeQuestion } from "@/services/question.manager";
import { Plus, Search, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
const t = i18n.t.bind(i18n);
const levelBadgeMap: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 hover:bg-green-100",
  MEDIUM: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  HARD: "bg-red-100 text-red-700 hover:bg-red-100",
};
interface QuestionFormData {
  title: string;
  content: string;
  level: "EASY" | "MEDIUM" | "HARD";
  answer: string;
  hint: string;
  categoryId: string;
}
const emptyFormData: QuestionFormData = {
  title: "",
  content: "",
  level: "EASY",
  answer: "",
  hint: "",
  categoryId: "",
};
export function PracticeQuestionManagementPage() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestion | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(emptyFormData);
  const loadData = useCallback(
    async (showReloading = false) => {
      if (showReloading) {
        setIsReloading(true);
      } else {
        setIsInitialLoading(true);
      }
      try {
        const [questionsRes, categoriesRes] = await Promise.all([
          questionManager.getAll(),
          questionCategoryManager.getAll(),
        ]);
        if (questionsRes.success && questionsRes.data) {
          const raw = questionsRes.data;
          const arr = Array.isArray(raw) ? raw : "data" in raw ? raw.data : [];
          setQuestions(arr as unknown as PracticeQuestion[]);
        } else {
          toast.error(questionsRes.error || t("common.unableToLoadQuestionList"));
        }
        if (categoriesRes.success && categoriesRes.data) {
          const raw = categoriesRes.data;
          const arr = Array.isArray(raw) ? raw : "data" in raw ? raw.data : [];
          setCategories(arr as QuestionCategory[]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(t("common.unableToDownloadData"));
      } finally {
        if (showReloading) {
          setIsReloading(false);
        } else {
          setIsInitialLoading(false);
        }
      }
    },
    [t]
  );
  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
          q.title?.toLowerCase().includes(lowerQuery) ||
          q.content?.toLowerCase().includes(lowerQuery) ||
          q.lesson?.lessonName?.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }
      if (levelFilter !== "all" && q.level !== levelFilter) {
        return false;
      }
      return true;
    });
  }, [questions, searchQuery, levelFilter]);

  // Sorting
  const { sortedData, toggleSort } = useSortable(filteredQuestions);

  // Pagination

  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_practicequestionmanagement_practicequestionmanagementpage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);
  const handleCreate = () => {
    setFormData(emptyFormData);
    setIsCreateDialogOpen(true);
  };
  const handleEdit = (question: PracticeQuestion) => {
    setSelectedQuestion(question);
    setFormData({
      title: question.title || "",
      content: question.content || "",
      level: question.level || "EASY",
      answer: question.answer || "",
      hint: question.hint || "",
      categoryId: question.lesson?.id?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };
  const handleDelete = (question: PracticeQuestion) => {
    setSelectedQuestion(question);
    setIsDeleteDialogOpen(true);
  };
  const handleSubmitCreate = async () => {
    try {
      const selectedCategory = formData.categoryId
        ? categories.find((c) => c.id?.toString() === formData.categoryId)
        : undefined;
      const createData: Partial<PracticeQuestion> = {
        title: formData.title,
        content: formData.content,
        level: formData.level,
        answer: formData.answer,
        hint: formData.hint,
        ...(selectedCategory && {
          lesson: {
            id: selectedCategory.id,
            lessonName: selectedCategory.categoryName,
          },
        }),
      };
      const response = await questionManager.create(createData as never);
      if (response.success) {
        toast.success(t("adminPracticequestionmanagement.questionCreatedSuccessfully"));
        setIsCreateDialogOpen(false);
        void loadData();
      } else {
        toast.error(response.error || t("common.cannotCreateQuestion"));
      }
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error(t("common.cannotCreateQuestion"));
    }
  };
  const handleSubmitEdit = async () => {
    if (!selectedQuestion?.questionId) return;
    try {
      const selectedCategory = formData.categoryId
        ? categories.find((c) => c.id?.toString() === formData.categoryId)
        : undefined;
      const updateData: Partial<PracticeQuestion> = {
        title: formData.title,
        content: formData.content,
        level: formData.level,
        answer: formData.answer,
        hint: formData.hint,
        ...(selectedCategory && {
          lesson: {
            id: selectedCategory.id,
            lessonName: selectedCategory.categoryName,
          },
        }),
      };
      const response = await questionManager.update(
        selectedQuestion.questionId,
        updateData as never
      );
      if (response.success) {
        toast.success(t("adminPracticequestionmanagement.questionUpdatedSuccessfully"));
        setIsEditDialogOpen(false);
        void loadData();
      } else {
        toast.error(response.error || t("common.unableToUpdateQuestion"));
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error(t("common.unableToUpdateQuestion"));
    }
  };
  const handleConfirmDelete = async () => {
    if (!selectedQuestion?.questionId) return;
    try {
      const response = await questionManager.delete(selectedQuestion.questionId);
      if (response.success) {
        toast.success(t("adminPracticequestionmanagement.questionDeletedSuccessfully"));
        setIsDeleteDialogOpen(false);
        void loadData();
      } else {
        toast.error(response.error || t("common.questionCannotBeDeleted"));
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error(t("common.questionCannotBeDeleted"));
    }
  };
  const handleBulkImport = async () => {
    // Placeholder for bulk import - would typically open a file picker
    toast.info(t("adminPracticequestionmanagement.bulkImportFunctionalityIsUnder"));
  };
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          {t("adminPracticequestionmanagement.managingPracticeQuestions")}
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          {t("adminPracticequestionmanagement.manageBanksOfPracticeQuestions")}
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder={t("adminPracticequestionmanagement.searchByTitleOrContent")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
              className="pl-10"
            />
          </div>

          <Select
            value={levelFilter}
            onValueChange={(value) => {
              setLevelFilter(value);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder={t("common.filterByLevel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allLevels")}</SelectItem>
              <SelectItem value="EASY">{t("common.easy")}</SelectItem>
              <SelectItem value="MEDIUM">{t("common.mediumLevel")}</SelectItem>
              <SelectItem value="HARD">{t("common.hard")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {(searchQuery || levelFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setLevelFilter("all");
                pagination.goToFirstPage();
              }}>
              {t("common.clearFilter")}
            </Button>
          )}
          <ReloadButton
            onReload={() => loadData(true)}
            isLoading={isReloading}
            tooltip={t("common.reloadQuestionList")}
            showLabel
            hideTooltip
          />
          <Button variant="outline" onClick={handleBulkImport} className="gap-2">
            <Upload className="h-4 w-4" />
            {t("adminPracticequestionmanagement.batchImport")}
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("adminPracticequestionmanagement.moreQuestions")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isInitialLoading ? (
          <SpinnerBlock
            size="lg"
            label={t("adminPracticequestionmanagement.loadingListOfQuestions")}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("title" as keyof PracticeQuestion)}>
                    {t("common.title")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("level" as keyof PracticeQuestion)}>
                    {t("common.level")}
                  </TableHead>
                  <TableHead>{t("common.lesson")}</TableHead>
                  <TableHead className="text-right">{t("common.act")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center">
                      <p className="text-gray-500 dark:text-slate-400">
                        {t("common.noQuestionsAsked")}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageData.map((question) => (
                    <TableRow key={question.questionId}>
                      <TableCell className="font-medium">{question.title}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            levelBadgeMap[question.level || ""] || "bg-gray-100 text-gray-700"
                          }>
                          {question.level}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.lesson?.lessonName || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(question)}>
                            {t("adminPracticequestionmanagement.fix")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(question)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {sortedData.length > 0 && (
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  pagination.goToFirstPage();
                }}
              />
            )}

            {sortedData.length === 0 && (searchQuery || levelFilter !== "all") && (
              <div className="flex justify-center pb-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setLevelFilter("all");
                    pagination.goToFirstPage();
                  }}>
                  {t("common.clearFilter")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Dialog */}
      <QuestionFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title={t("adminPracticequestionmanagement.addNewQuestion")}
        description={t("adminPracticequestionmanagement.fillInTheInformationTo")}
        submitLabel={t("adminPracticequestionmanagement.createQuestions")}
        categories={categories}
      />

      {/* Edit Dialog */}
      <QuestionFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title={t("adminPracticequestionmanagement.editQuestion")}
        description={t("adminPracticequestionmanagement.updateQuestionInformation")}
        submitLabel={t("common.saveChanges")}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirmDeletion1")}</DialogTitle>
            <DialogDescription>
              {t("adminPracticequestionmanagement.areYouSureYouWant")}
              {selectedQuestion?.title}
              {t("common.quotThisActionCannotBeUndone")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("general.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t("general.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form Dialog Component
interface QuestionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: QuestionFormData;
  onFormChange: (data: QuestionFormData) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
  categories: QuestionCategory[];
}
function QuestionFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
  categories,
}: QuestionFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">{t("common.title")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  title: e.target.value,
                })
              }
              placeholder={t("adminPracticequestionmanagement.enterQuestionTitle")}
            />
          </div>
          <div>
            <Label htmlFor="content">{t("common.content")}</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  content: e.target.value,
                })
              }
              placeholder={t("adminPracticequestionmanagement.enterQuestionContent")}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="level">{t("common.level")}</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  onFormChange({
                    ...formData,
                    level: value as "EASY" | "MEDIUM" | "HARD",
                  })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">{t("common.easy")}</SelectItem>
                  <SelectItem value="MEDIUM">{t("common.mediumLevel")}</SelectItem>
                  <SelectItem value="HARD">{t("common.hard")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="categoryId">{t("common.category")}</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  onFormChange({
                    ...formData,
                    categoryId: value,
                  })
                }>
                <SelectTrigger>
                  <SelectValue placeholder={t("adminPracticequestionmanagement.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id?.toString() || ""}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="answer">{t("adminPracticequestionmanagement.answer")}</Label>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  answer: e.target.value,
                })
              }
              placeholder={t("adminPracticequestionmanagement.enterTheAnswer")}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="hint">{t("adminPracticequestionmanagement.suggest")}</Label>
            <Input
              id="hint"
              value={formData.hint}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  hint: e.target.value,
                })
              }
              placeholder={t("adminPracticequestionmanagement.enterASuggestionOptional")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("general.cancel")}
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
