import { useTranslation } from "react-i18next";
/**
 * Admin Feedback Management Page
 * Allows admin to view and moderate all candidate feedbacks for mentors
 */

import { FeedbackStats } from "@/components/feedback";
import { PaginationControl, ReloadButton, SortButton } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingCardList } from "@/components/ui/loading-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/ui/star-rating";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteMentorFeedback,
  useMentorFeedbacks,
  type MentorFeedback,
} from "@/hooks/useMentorFeedback";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { Eye, MessageSquare, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
export function FeedbackManagementPage() {
  const { t } = useTranslation();
  const { data: feedbacks = [], isLoading, isRefetching, refetch } = useMentorFeedbacks();
  const { mutate: deleteFeedback, isPending: isDeleting } = useDeleteMentorFeedback();
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<MentorFeedback | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Convert rating filter once for efficiency
  const numericRatingFilter = ratingFilter !== "all" ? Number(ratingFilter) : null;

  // Filter feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((feedback: MentorFeedback) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          feedback.mentor?.name?.toLowerCase().includes(query) ||
          feedback.user?.name?.toLowerCase().includes(query) ||
          feedback.comment?.toLowerCase().includes(query) ||
          feedback.session?.roomName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Rating filter
      if (numericRatingFilter !== null && feedback.rating !== numericRatingFilter) {
        return false;
      }
      return true;
    });
  }, [feedbacks, searchQuery, numericRatingFilter]);
  const hasActiveFilters = searchQuery.trim().length > 0 || ratingFilter !== "all";

  // Sorting
  const { sortedData, getSortProps } = useSortable(filteredFeedbacks);

  // Pagination

  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_feedbackmanagement_feedbackmanagementpage_tsx_pagesize",
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

  // Calculate stats
  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum: number, f: MentorFeedback) => sum + (f.rating || 0), 0) /
        feedbacks.length
      : 0;
  const handleViewDetail = (feedback: MentorFeedback) => {
    setSelectedFeedback(feedback);
    setIsDetailOpen(true);
  };
  const handleDeleteClick = (feedback: MentorFeedback) => {
    setSelectedFeedback(feedback);
    setIsDeleteOpen(true);
  };
  const handleDeleteConfirm = () => {
    if (selectedFeedback?.id) {
      deleteFeedback(selectedFeedback.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedFeedback(null);
          toast.success(t("common.responseRemoved"));
        },
      });
    }
  };
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
            {t("adminFeedbackmanagement.candidateResponse")}
          </h1>
          <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
            {t("adminFeedbackmanagement.seeTheListOfResponses")}
          </p>
        </div>
        <ReloadButton
          onReload={async () => {
            await refetch();
          }}
          isLoading={isRefetching}
          tooltip={t("common.reloadTheResponseList")}
          showLabel
          hideTooltip
        />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.totalResponse")}</CardDescription>
            <CardTitle className="text-2xl">{feedbacks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.averageScore")}</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{avgRating.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.fiveStars")}</CardDescription>
            <CardTitle className="text-2xl text-[#FFD700]">
              {feedbacks.filter((f: MentorFeedback) => f.rating === 5).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.oneToTwoStars")}</CardDescription>
            <CardTitle className="text-2xl text-red-500">
              {feedbacks.filter((f: MentorFeedback) => (f.rating || 0) <= 2).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Stats Chart */}
      {feedbacks.length > 0 && <FeedbackStats feedbacks={feedbacks} className="mb-6" />}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("common.filter")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative w-full min-w-0">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={t("adminFeedbackmanagement.searchByCandidateNameMentor")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  pagination.goToFirstPage();
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={ratingFilter}
              onValueChange={(value) => {
                setRatingFilter(value);
                pagination.goToFirstPage();
              }}>
              <SelectTrigger className="w-full lg:w-[170px]">
                <SelectValue placeholder={t("common.numberOfStars")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("general.all")}</SelectItem>
                <SelectItem value="5">{t("common.fiveStars")}</SelectItem>
                <SelectItem value="4">{t("common.fourStars")}</SelectItem>
                <SelectItem value="3">{t("common.threeStars")}</SelectItem>
                <SelectItem value="2">{t("common.twoStars")}</SelectItem>
                <SelectItem value="1">{t("common.oneStar")}</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <div className="flex items-center justify-start lg:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setRatingFilter("all");
                    pagination.goToFirstPage();
                  }}>
                  {t("common.clearFilter")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <CardTitle>{t("common.responseList")}</CardTitle>
          </div>
          <CardDescription>
            {t("common.show")} {filteredFeedbacks.length} / {feedbacks.length}{" "}
            {t("common.feedback")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCardList count={5} />
          ) : pageData.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={t("common.noResponse")}
              description={t("adminFeedbackmanagement.noResponsesFoundMatchingThe")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.id")}</TableHead>
                    <TableHead>{t("common.mentorAccepted")}</TableHead>
                    <TableHead>{t("common.candidateSubmits")}</TableHead>
                    <TableHead>{t("common.session")}</TableHead>
                    <TableHead>
                      <SortButton {...getSortProps("rating" as keyof MentorFeedback)}>
                        {t("common.evaluate")}
                      </SortButton>
                    </TableHead>
                    <TableHead>{t("common.comment")}</TableHead>
                    <TableHead className="text-right">{t("common.operation")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map((feedback: MentorFeedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>#{feedback.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={feedback.mentor?.avatarUrl} />
                            <AvatarFallback>
                              {feedback.mentor?.name?.charAt(0) || "M"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {feedback.mentor?.name || t("common.noDataAvailable")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={feedback.user?.avatarUrl} />
                            <AvatarFallback>{feedback.user?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span>{feedback.user?.name || t("common.noDataAvailable")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">#{feedback.session?.id}</Badge>
                      </TableCell>
                      <TableCell>
                        <StarRating value={feedback.rating || 0} readOnly size="sm" />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {feedback.comment || t("common.noComments")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(feedback)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(feedback)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
            </>
          )}
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("common.feedbackDetails")}
              {selectedFeedback?.id}
            </DialogTitle>
            <DialogDescription>
              {t("common.feedbackFromCandidates")} {selectedFeedback?.user?.name}
              {" -> "}
              mentor {selectedFeedback?.mentor?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              {/* Rating */}
              <div className="flex items-center justify-center">
                <StarRating value={selectedFeedback.rating || 0} readOnly size="lg" />
              </div>

              {/* Comment */}
              <div>
                <h4 className="mb-2 font-medium text-slate-700 dark:text-slate-300">
                  {t("common.comment")}
                </h4>
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="whitespace-pre-wrap">
                    {selectedFeedback.comment || t("common.thereAreNoDetailedComments")}
                  </p>
                </div>
              </div>

              {/* Session Info */}
              <div>
                <h4 className="mb-2 font-medium text-slate-700 dark:text-slate-300">
                  {t("common.sessionInformation")}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">{t("common.sessionCode")}</span>{" "}
                    <span className="font-medium">#{selectedFeedback.session?.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{t("common.roomName")}</span>{" "}
                    <span className="font-medium">
                      {selectedFeedback.session?.roomName || t("common.noDataAvailable")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirmDeletion")}</DialogTitle>
            <DialogDescription>
              {t("adminFeedbackmanagement.areYouSureYouWant")}
              {selectedFeedback?.id}
              {t("adminFeedbackmanagement.thisActionIsImpossibleUndo")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              {t("general.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? t("common.deleting") : t("general.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
