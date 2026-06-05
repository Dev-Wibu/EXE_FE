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
import { Spinner, SpinnerBlock } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { formatDate } from "@/lib/formatting";
import { quizSetManager } from "@/services";
import type { QuizItem, QuizSet } from "@/services/quiz-set.manager";
import { Eye, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
export function QuizSetManagementPage() {
  const { t } = useTranslation();
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [selectedQuizSet, setSelectedQuizSet] = useState<QuizSet | null>(null);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const loadData = useCallback(
    async (showReloading = false) => {
      if (showReloading) {
        setIsReloading(true);
      } else {
        setIsInitialLoading(true);
      }
      try {
        const response = await quizSetManager.getAll();
        if (response.success && response.data) {
          setQuizSets(response.data);
        } else {
          toast.error(response.error || t("adminQuizsetmanagement.unableToLoadQuizList"));
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

  // Filter quiz sets
  const filteredQuizSets = useMemo(() => {
    if (!searchQuery) return quizSets;
    const lowerQuery = searchQuery.toLowerCase();
    return quizSets.filter((qs) => {
      return (
        qs.quizName?.toLowerCase().includes(lowerQuery) ||
        qs.practiceSet?.practiceSetName?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [quizSets, searchQuery]);

  // Sorting
  const { sortedData, toggleSort } = useSortable(filteredQuizSets);

  // Pagination

  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_quizsetmanagement_quizsetmanagementpage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });
  const pageData = useMemo(() => {
    return sortedData.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [sortedData, pagination.startIndex, pagination.endIndex]);
  const handleDelete = (quizSet: QuizSet) => {
    setSelectedQuizSet(quizSet);
    setIsDeleteDialogOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!selectedQuizSet?.quizId) return;
    try {
      const response = await quizSetManager.delete(selectedQuizSet.quizId);
      if (response.success) {
        toast.success(t("adminQuizsetmanagement.quizSuccessfullyDeleted"));
        setIsDeleteDialogOpen(false);
        void loadData();
      } else {
        toast.error(response.error || t("adminQuizsetmanagement.cannotDeleteQuiz"));
      }
    } catch (error) {
      console.error("Error deleting quiz set:", error);
      toast.error(t("adminQuizsetmanagement.cannotDeleteQuiz"));
    }
  };
  const handleViewItems = async (quizSet: QuizSet) => {
    if (!quizSet.quizId) return;
    setSelectedQuizSet(quizSet);
    setIsItemsDialogOpen(true);
    setLoadingItems(true);
    try {
      const response = await quizSetManager.getQuizItems(quizSet.quizId);
      if (response.success && response.data) {
        setQuizItems(response.data);
      } else {
        toast.error(response.error || t("adminQuizsetmanagement.unableToDownloadQuizQuestions"));
      }
    } catch (error) {
      console.error("Error loading quiz items:", error);
      toast.error(t("adminQuizsetmanagement.unableToDownloadQuizQuestions"));
    } finally {
      setLoadingItems(false);
    }
  };
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          {t("adminQuizsetmanagement.quizManagement")}
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          {t("adminQuizsetmanagement.manageQuizSetsAndExam")}
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            type="text"
            placeholder={t("adminQuizsetmanagement.searchByQuizNameOr")}
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
            onReload={() => loadData(true)}
            isLoading={isReloading}
            tooltip={t("adminQuizsetmanagement.reloadQuizList")}
            showLabel
            hideTooltip
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isInitialLoading ? (
          <SpinnerBlock size="lg" label={t("adminQuizsetmanagement.loadingQuizList")} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("quizName" as keyof QuizSet)}>
                    {t("adminQuizsetmanagement.nameQuiz")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("score" as keyof QuizSet)}>
                    {t("adminQuizsetmanagement.point")}
                  </TableHead>
                  <TableHead>{t("common.practiceSet")}</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("createdAt" as keyof QuizSet)}>
                    {t("common.creationDate")}
                  </TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.act")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      <p className="text-gray-500 dark:text-slate-400">
                        {t("adminQuizsetmanagement.thereAreNoQuizzes")}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageData.map((quizSet) => (
                    <TableRow key={quizSet.quizId}>
                      <TableCell className="font-medium">{quizSet.quizName}</TableCell>
                      <TableCell>{quizSet.score !== undefined ? quizSet.score : "—"}</TableCell>
                      <TableCell>{quizSet.practiceSet?.practiceSetName || "—"}</TableCell>
                      <TableCell>{formatDate(quizSet.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={quizSet.submitted ? "default" : "secondary"}>
                          {quizSet.submitted
                            ? t("adminQuizsetmanagement.submitted")
                            : t("common.notYetSubmitted")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleViewItems(quizSet)}>
                            <Eye className="h-4 w-4" />
                            {t("common.view")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(quizSet)}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirmDeletion1")}</DialogTitle>
            <DialogDescription>
              {t("adminQuizsetmanagement.areYouSureYouWant")}
              {selectedQuizSet?.quizName}
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

      {/* View Quiz Items Dialog */}
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("adminQuizsetmanagement.questionsInQuiz")} {selectedQuizSet?.quizName}
            </DialogTitle>
            <DialogDescription>
              {t("adminQuizsetmanagement.listOfQuestionsInThis")}
            </DialogDescription>
          </DialogHeader>
          {loadingItems ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : quizItems.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("common.noQuestionsAsked")}</p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {quizItems.map((item, index) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">
                    {index + 1}. {item.question}
                  </p>
                  <div className="mt-1 text-xs text-gray-500">
                    {item.correctAnswer && (
                      <span>
                        {t("common.answer")} {item.correctAnswer}
                      </span>
                    )}
                    {item.userResponse && (
                      <span className="ml-4">
                        {t("adminQuizsetmanagement.reply")} {item.userResponse}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemsDialogOpen(false)}>
              {t("general.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
