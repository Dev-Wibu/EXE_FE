import { useTranslation } from "react-i18next";
/**
 * Admin Review Management Page
 * Allows admin to view and moderate all mentor reviews for candidates
 */

import { ReviewStats } from "@/components/review";
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
import type { MentorReview } from "@/hooks/useMentorReview";
import { useDeleteMentorReview, useMentorReviews } from "@/hooks/useMentorReview";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { Eye, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
export function ReviewManagementPage() {
  const { t } = useTranslation();
  const { data: reviews = [], isLoading, isRefetching, refetch } = useMentorReviews();
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteMentorReview();
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<MentorReview | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Convert rating filter once for efficiency
  const numericRatingFilter = ratingFilter !== "all" ? Number(ratingFilter) : null;

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review: MentorReview) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          review.mentor?.name?.toLowerCase().includes(query) ||
          review.user?.name?.toLowerCase().includes(query) ||
          review.session?.roomName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Rating filter
      if (numericRatingFilter !== null && review.rating !== numericRatingFilter) {
        return false;
      }
      return true;
    });
  }, [reviews, searchQuery, numericRatingFilter]);
  const hasActiveFilters = searchQuery.trim().length > 0 || ratingFilter !== "all";

  // Sorting
  const { sortedData, getSortProps } = useSortable(filteredReviews);

  // Pagination

  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_admin_reviewmanagement_reviewmanagementpage_tsx_pagesize",
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
    reviews.length > 0
      ? reviews.reduce((sum: number, r: MentorReview) => sum + (r.rating || 0), 0) / reviews.length
      : 0;
  const handleViewDetail = (review: MentorReview) => {
    setSelectedReview(review);
    setIsDetailOpen(true);
  };
  const handleDeleteClick = (review: MentorReview) => {
    setSelectedReview(review);
    setIsDeleteOpen(true);
  };
  const handleDeleteConfirm = () => {
    if (selectedReview?.id) {
      deleteReview(selectedReview.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedReview(null);
          toast.success(t("common.reviewRemoved"));
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
            {t("common.reviewsFromMentors")}
          </h1>
          <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
            {t("adminReviewmanagement.seeTheListOfMentor")}
          </p>
        </div>
        <ReloadButton
          onReload={async () => {
            await refetch();
          }}
          isLoading={isRefetching}
          tooltip={t("common.reloadReviewList")}
          showLabel
          hideTooltip
        />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.totalRating")}</CardDescription>
            <CardTitle className="text-2xl">{reviews.length}</CardTitle>
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
              {reviews.filter((r: MentorReview) => r.rating === 5).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.oneToTwoStars")}</CardDescription>
            <CardTitle className="text-2xl text-red-500">
              {reviews.filter((r: MentorReview) => (r.rating || 0) <= 2).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Stats Chart */}
      {reviews.length > 0 && <ReviewStats reviews={reviews} className="mb-6" />}

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
                placeholder={t("adminReviewmanagement.searchByMentorNameCandidate")}
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

      {/* Review List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-[#FFD700]" />
            <CardTitle>{t("common.reviewList")}</CardTitle>
          </div>
          <CardDescription>
            {t("common.show")} {filteredReviews.length} / {reviews.length}{" "}
            {t("compReview.evaluate")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCardList count={5} />
          ) : pageData.length === 0 ? (
            <EmptyState
              icon={Star}
              title={t("common.thereAreNoReviews")}
              description={t("adminReviewmanagement.noReviewsFoundMatchingThe")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.id")}</TableHead>
                    <TableHead>{t("common.mentorSent")}</TableHead>
                    <TableHead>{t("common.candidatesAreEvaluated")}</TableHead>
                    <TableHead>{t("common.session")}</TableHead>
                    <TableHead>
                      <SortButton {...getSortProps("rating" as keyof MentorReview)}>
                        {t("common.evaluate")}
                      </SortButton>
                    </TableHead>
                    <TableHead className="text-right">{t("common.operation")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map((review: MentorReview) => (
                    <TableRow key={review.id}>
                      <TableCell>#{review.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.mentor?.avatarUrl} />
                            <AvatarFallback>{review.mentor?.name?.charAt(0) || "M"}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {review.mentor?.name || t("common.noDataAvailable")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.user?.avatarUrl} />
                            <AvatarFallback>{review.user?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span>{review.user?.name || t("common.noDataAvailable")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">#{review.session?.id}</Badge>
                      </TableCell>
                      <TableCell>
                        <StarRating value={review.rating || 0} readOnly size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(review)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(review)}>
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
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("common.reviewDetails")}
              {selectedReview?.id}
            </DialogTitle>
            <DialogDescription>
              {t("common.reviewFromMentor")} {selectedReview?.mentor?.name}
              {" -> "}
              {t("common.candidate")} {selectedReview?.user?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <StarRating value={selectedReview.rating || 0} readOnly size="lg" />
              </div>

              {selectedReview.situationNote && (
                <div>
                  <h4 className="mb-1 font-medium text-emerald-600">{t("common.situation")}</h4>
                  <p className="rounded bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
                    {selectedReview.situationNote}
                  </p>
                </div>
              )}

              {selectedReview.taskNote && (
                <div>
                  <h4 className="mb-1 font-medium text-blue-600">{t("common.mission")}</h4>
                  <p className="rounded bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
                    {selectedReview.taskNote}
                  </p>
                </div>
              )}

              {selectedReview.actionNote && (
                <div>
                  <h4 className="mb-1 font-medium text-purple-600">{t("common.act")}</h4>
                  <p className="rounded bg-purple-50 p-3 text-sm dark:bg-purple-900/20">
                    {selectedReview.actionNote}
                  </p>
                </div>
              )}

              {selectedReview.resultNote && (
                <div>
                  <h4 className="mb-1 font-medium text-amber-600">{t("common.result")}</h4>
                  <p className="rounded bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                    {selectedReview.resultNote}
                  </p>
                </div>
              )}

              {selectedReview.strength && (
                <div>
                  <h4 className="mb-1 font-medium text-green-600">{t("common.strengths")}</h4>
                  <p className="rounded bg-green-50 p-3 text-sm dark:bg-green-900/20">
                    {selectedReview.strength}
                  </p>
                </div>
              )}

              {selectedReview.weakness && (
                <div>
                  <h4 className="mb-1 font-medium text-red-600">
                    {t("adminReviewmanagement.weakness")}
                  </h4>
                  <p className="rounded bg-red-50 p-3 text-sm dark:bg-red-900/20">
                    {selectedReview.weakness}
                  </p>
                </div>
              )}

              {selectedReview.improve && (
                <div>
                  <h4 className="mb-1 font-medium text-indigo-600">
                    {t("common.suggestedImprovements")}
                  </h4>
                  <p className="rounded bg-indigo-50 p-3 text-sm dark:bg-indigo-900/20">
                    {selectedReview.improve}
                  </p>
                </div>
              )}
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
              {t("adminReviewmanagement.areYouSureYouWant")}
              {selectedReview?.id}
              {t("adminReviewmanagement.thisActionCannotBeUndone")}
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
