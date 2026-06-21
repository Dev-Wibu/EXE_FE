import { PaginationControl, ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpinnerBlock } from "@/components/ui/spinner";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { extractDataArray } from "@/lib/utils";
import { questionLessonManager } from "@/services/question-lesson.manager";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  DeleteQuestionCategoryDialog,
  QuestionCategoryFormDialog,
  QuestionCategoryTable,
} from "./components";
import type { QuestionCategory, QuestionCategoryFormData } from "./types";
type SortableQuestionCategory = QuestionCategory & {
  idSortValue: number;
  nameSortValue: string;
  descriptionSortValue: string;
};
export function QuestionCategoryManagementPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [formData, setFormData] = useState<Partial<QuestionCategoryFormData>>({});

  // Load categories using the question category manager service
  const loadCategories = useCallback(
    async (showReloading = false) => {
      if (showReloading) {
        setIsReloading(true);
      } else {
        setIsInitialLoading(true);
      }
      try {
        const response = await questionLessonManager.getAll();
        if (response.success) {
          setCategories(extractDataArray<QuestionCategory>(response));
        } else {
          toast.error(
            response.error || t("adminQuestioncategorymanagement.unableToLoadQuestionCategory")
          );
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error(t("adminQuestioncategorymanagement.unableToLoadQuestionCategory"));
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
    void loadCategories();
  }, [loadCategories]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      return (
        category.categoryName?.toLowerCase().includes(lowerQuery) ||
        category.description?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [categories, searchQuery]);
  const sortableCategories = useMemo<SortableQuestionCategory[]>(() => {
    return filteredCategories.map((category) => ({
      ...category,
      idSortValue: typeof category.id === "number" ? category.id : 0,
      nameSortValue: category.categoryName?.toLowerCase() || "",
      descriptionSortValue: category.description?.toLowerCase() || "",
    }));
  }, [filteredCategories]);
  const { sortedData, getSortProps } = useSortable(sortableCategories, {
    defaultSort: {
      key: "idSortValue",
      direction: "desc",
    },
    noSortBehavior: "preserve",
    tieBreaker: {
      key: "idSortValue",
      direction: "desc",
    },
  });
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_questioncategorymanagement_questioncategorymanagementpage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });
  const pageData = useMemo(
    () => sortedData.slice(pagination.startIndex, pagination.endIndex + 1),
    [pagination.endIndex, pagination.startIndex, sortedData]
  );
  const handleCreate = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };
  const handleEdit = (category: QuestionCategory) => {
    setSelectedCategory(category);
    setFormData({
      categoryName: category.categoryName || "",
      description: category.description,
      urlTutorial: category.urlTutorial,
    });
    setIsEditDialogOpen(true);
  };
  const handleDelete = (category: QuestionCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };
  const handleSubmitCreate = async () => {
    try {
      const response = await questionLessonManager.create(formData);
      if (response.success) {
        toast.success(t("adminQuestioncategorymanagement.questionListCreatedSuccessfully"));
        setIsCreateDialogOpen(false);
        void loadCategories(); // Refresh the list
      } else {
        toast.error(response.error || t("common.unableToCreateQuestionCategory"));
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error(t("common.unableToCreateQuestionCategory"));
    }
  };
  const handleSubmitEdit = async () => {
    if (!selectedCategory?.id) return;
    try {
      const response = await questionLessonManager.update(selectedCategory.id, formData);
      if (response.success) {
        toast.success(t("adminQuestioncategorymanagement.questionListHasBeenUpdated"));
        setIsEditDialogOpen(false);
        void loadCategories(); // Refresh the list
      } else {
        toast.error(response.error || t("common.unableToUpdateQuestionList"));
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error(t("common.unableToUpdateQuestionList"));
    }
  };
  const handleConfirmDelete = async () => {
    if (!selectedCategory?.id) return;
    try {
      const response = await questionLessonManager.delete(selectedCategory.id);
      if (response.success) {
        toast.success(t("adminQuestioncategorymanagement.questionCategoryHasBeenSuccessfully"));
        setIsDeleteDialogOpen(false);
        void loadCategories(); // Refresh the list
      } else {
        toast.error(response.error || t("common.cannotDeleteQuestionCategories"));
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(t("common.cannotDeleteQuestionCategories"));
    }
  };
  return (
    <div
      className={
        isEmbedded ? "flex h-full flex-col" : "min-h-screen bg-white p-8 dark:bg-slate-950"
      }>
      {/* Header */}
      {!isEmbedded && (
        <div className="mb-8">
          <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
            {t("adminQuestioncategorymanagement.questionListManagement")}
          </h1>
          <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
            {t("adminQuestioncategorymanagement.manageQuestionCategoriesForInterview")}
          </p>
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto]">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            type="text"
            placeholder={t("common.searchByNameOrDescription")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              pagination.goToFirstPage();
            }}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                pagination.goToFirstPage();
              }}>
              {t("common.clearFilter")}
            </Button>
          )}
          <ReloadButton
            onReload={() => loadCategories(true)}
            isLoading={isReloading}
            tooltip={t("adminQuestioncategorymanagement.reloadCategoryList")}
            showLabel
            hideTooltip
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("adminQuestioncategorymanagement.addCategory")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isInitialLoading ? (
          <SpinnerBlock
            size="lg"
            label={t("adminQuestioncategorymanagement.loadingQuestionList")}
          />
        ) : (
          <>
            <QuestionCategoryTable
              categories={pageData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getSortProps={getSortProps}
            />

            {sortedData.length > 0 && (
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  pagination.goToFirstPage();
                }}
              />
            )}

            {/* Empty State with Clear Search */}
            {sortedData.length === 0 && searchQuery && (
              <div className="flex justify-center pb-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
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
      <QuestionCategoryFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title={t("adminQuestioncategorymanagement.addNewQuestionCategory")}
        description={t("adminQuestioncategorymanagement.fillInTheInformationTo")}
        submitLabel={t("adminQuestioncategorymanagement.createCategories")}
      />

      {/* Edit Dialog */}
      <QuestionCategoryFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title={t("adminQuestioncategorymanagement.editQuestionList")}
        description={t("adminQuestioncategorymanagement.updateQuestionListInformation")}
        submitLabel={t("common.saveChanges")}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteQuestionCategoryDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={selectedCategory}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
