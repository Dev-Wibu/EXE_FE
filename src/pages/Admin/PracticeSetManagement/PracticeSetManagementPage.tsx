import { PaginationControl, ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerBlock } from "@/components/ui/spinner";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { extractDataArray } from "@/lib/utils";
import { practiceSetManager, questionMajorManager } from "@/services";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  DeletePracticeSetDialog,
  PracticeSetFormDialog,
  PracticeSetTable,
  ViewPracticeSetItemsDialog,
} from "./components";
import type { Major, PracticeSet, PracticeSetFormData } from "./types";
export function PracticeSetManagementPage() {
  const { t } = useTranslation();
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewItemsDialogOpen, setIsViewItemsDialogOpen] = useState(false);
  const [selectedPracticeSet, setSelectedPracticeSet] = useState<PracticeSet | null>(null);
  const [formData, setFormData] = useState<Partial<PracticeSetFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load practice sets and majors
  const loadData = useCallback(
    async (showReloading = false) => {
      if (showReloading) {
        setIsReloading(true);
      } else {
        setIsInitialLoading(true);
      }
      try {
        const [practiceSetsResponse, majorsResponse] = await Promise.all([
          practiceSetManager.getAll(),
          questionMajorManager.getAll(),
        ]);
        if (practiceSetsResponse.success) {
          setPracticeSets(extractDataArray<PracticeSet>(practiceSetsResponse));
        } else {
          toast.error(
            practiceSetsResponse.error || t("adminPracticesetmanagement.unableToLoadQuestionList1")
          );
        }
        if (majorsResponse.success) {
          setMajors(extractDataArray<Major>(majorsResponse));
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

  // Filter practice sets based on search query and level filter
  const filteredPracticeSets = useMemo(() => {
    return practiceSets.filter((ps) => {
      // Filter by search query
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
          ps.practiceSetName?.toLowerCase().includes(lowerQuery) ||
          ps.objective?.toLowerCase().includes(lowerQuery) ||
          ps.major?.majorName?.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }

      // Filter by level
      if (levelFilter !== "all" && ps.level !== levelFilter) {
        return false;
      }
      return true;
    });
  }, [practiceSets, searchQuery, levelFilter]);

  // Sorting
  const { sortedData, getSortProps } = useSortable(filteredPracticeSets);

  // Pagination

  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_practicesetmanagement_practicesetmanagementpage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });

  // Get current page data
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);
  const handleCreate = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };
  const handleEdit = (practiceSet: PracticeSet) => {
    setSelectedPracticeSet(practiceSet);
    setFormData({
      practiceSetName: practiceSet.practiceSetName || "",
      objective: practiceSet.objective,
      level: practiceSet.level,
      majorId: practiceSet.major?.id,
    });
    setIsEditDialogOpen(true);
  };
  const handleDelete = (practiceSet: PracticeSet) => {
    setSelectedPracticeSet(practiceSet);
    setIsDeleteDialogOpen(true);
  };
  const handleViewItems = (practiceSet: PracticeSet) => {
    setSelectedPracticeSet(practiceSet);
    setIsViewItemsDialogOpen(true);
  };
  const handleSubmitCreate = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const createData: Partial<PracticeSet> = {
        practiceSetName: formData.practiceSetName,
        objective: formData.objective,
        level: formData.level,
        major: formData.majorId
          ? {
              id: formData.majorId,
            }
          : undefined,
      };
      const response = await practiceSetManager.create(createData);
      if (response.success) {
        toast.success(t("adminPracticesetmanagement.questionnaireCreatedSuccessfully"));
        setIsCreateDialogOpen(false);
        void loadData(); // Refresh the list
      } else {
        toast.error(response.error || t("adminPracticesetmanagement.unableToCreateQuestionSet"));
      }
    } catch (error) {
      console.error("Error creating practice set:", error);
      toast.error(t("adminPracticesetmanagement.unableToCreateQuestionSet"));
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSubmitEdit = async () => {
    if (!selectedPracticeSet?.id) return;
    try {
      const updateData: Partial<PracticeSet> = {
        practiceSetName: formData.practiceSetName,
        objective: formData.objective,
        level: formData.level,
        major: formData.majorId
          ? {
              id: formData.majorId,
            }
          : undefined,
      };
      const response = await practiceSetManager.update(selectedPracticeSet.id, updateData);
      if (response.success) {
        toast.success(t("adminPracticesetmanagement.theQuestionSetHasBeen"));
        setIsEditDialogOpen(false);
        void loadData(); // Refresh the list
      } else {
        toast.error(response.error || t("adminPracticesetmanagement.unableToUpdateQuestionSet"));
      }
    } catch (error) {
      console.error("Error updating practice set:", error);
      toast.error(t("adminPracticesetmanagement.unableToUpdateQuestionSet"));
    }
  };
  const handleConfirmDelete = async () => {
    if (!selectedPracticeSet?.id) return;
    try {
      const response = await practiceSetManager.delete(selectedPracticeSet.id);
      if (response.success) {
        toast.success(t("adminPracticesetmanagement.questionSetSuccessfullyDeleted"));
        setIsDeleteDialogOpen(false);
        void loadData(); // Refresh the list
      } else {
        toast.error(response.error || t("adminPracticesetmanagement.cannotDeleteQuestionSet"));
      }
    } catch (error) {
      console.error("Error deleting practice set:", error);
      toast.error(t("adminPracticesetmanagement.cannotDeleteQuestionSet"));
    }
  };
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          {t("adminPracticesetmanagement.questionnaireManagement")}
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          {t("adminPracticesetmanagement.manageQuestionSetsForDifferent")}
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder={t("common.searchByNameOrTarget")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
              className="pl-10"
            />
          </div>

          {/* Level Filter */}
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
              <SelectItem value="INTERN">{"Intern"}</SelectItem>
              <SelectItem value="FRESHER">Fresher</SelectItem>
              <SelectItem value="JUNIOR">{"Junior"}</SelectItem>
              <SelectItem value="MIDDLE">{"Middle"}</SelectItem>
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
            tooltip={t("adminPracticesetmanagement.reloadTheListOfQuestion")}
            showLabel
            hideTooltip
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("adminPracticesetmanagement.moreQuestionSets")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isInitialLoading ? (
          <SpinnerBlock
            size="lg"
            label={t("adminPracticesetmanagement.loadingListOfQuestionSets")}
          />
        ) : (
          <>
            <PracticeSetTable
              practiceSets={pageData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewItems={handleViewItems}
              getSortProps={getSortProps}
            />

            {/* Pagination */}
            {sortedData.length > 0 && (
              <PaginationControl
                pagination={pagination}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  pagination.goToFirstPage();
                }}
              />
            )}

            {/* Empty State with Clear Filters */}
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
      <PracticeSetFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitCreate}
        title={t("adminPracticesetmanagement.addNewQuestionSet")}
        description={t("adminPracticesetmanagement.fillInTheInformationTo")}
        submitLabel={t("adminPracticesetmanagement.createAQuestionSet")}
        majors={majors}
        isSubmitting={isSubmitting}
      />

      {/* Edit Dialog */}
      <PracticeSetFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleSubmitEdit}
        title={t("adminPracticesetmanagement.editQuestionSet")}
        description={t("adminPracticesetmanagement.updateQuestionSetInformation")}
        submitLabel={t("common.saveChanges")}
        majors={majors}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePracticeSetDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        practiceSet={selectedPracticeSet}
        onConfirm={handleConfirmDelete}
      />

      {/* View Items Dialog */}
      <ViewPracticeSetItemsDialog
        isOpen={isViewItemsDialogOpen}
        onOpenChange={setIsViewItemsDialogOpen}
        practiceSet={selectedPracticeSet}
        onItemsChanged={() => loadData(true)}
      />
    </div>
  );
}
