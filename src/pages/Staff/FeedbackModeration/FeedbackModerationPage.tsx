import { useTranslation } from "react-i18next";
/**
 * Staff Feedback Moderation Page
 * Allows staff to moderate feedback (focus on low ratings)
 */

import { PaginationControl, ReloadButton, SortButton } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useMentorFeedbacks, type MentorFeedback } from "@/hooks/useMentorFeedback";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { AlertTriangle, Eye, Flag, MessageSquare, Search } from "lucide-react";
import { useMemo, useState } from "react";

// Rating thresholds for moderation
const LOW_RATING_THRESHOLD = 2;
const HIGH_RATING_MIN = 4;
type SortableFeedback = MentorFeedback & {
  idSortValue: number;
  ratingSortValue: number;
  mentorNameSortValue: string;
  candidateNameSortValue: string;
};
export function FeedbackModerationPage() {
  const { t } = useTranslation();
  const { data: feedbacks = [], isLoading, isRefetching, refetch } = useMentorFeedbacks();
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("low"); // Default to low ratings

  const [selectedFeedback, setSelectedFeedback] = useState<MentorFeedback | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((feedback: MentorFeedback) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          feedback.mentor?.name?.toLowerCase().includes(query) ||
          feedback.user?.name?.toLowerCase().includes(query) ||
          feedback.comment?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (ratingFilter === "low" && (feedback.rating || 0) > LOW_RATING_THRESHOLD) return false;
      if (ratingFilter === "high" && (feedback.rating || 0) < HIGH_RATING_MIN) return false;
      return true;
    });
  }, [feedbacks, ratingFilter, searchQuery]);
  const sortableFeedbacks = useMemo<SortableFeedback[]>(() => {
    return filteredFeedbacks.map((feedback) => ({
      ...feedback,
      idSortValue: typeof feedback.id === "number" ? feedback.id : 0,
      ratingSortValue: feedback.rating || 0,
      mentorNameSortValue: feedback.mentor?.name?.toLowerCase() || "",
      candidateNameSortValue: feedback.user?.name?.toLowerCase() || "",
    }));
  }, [filteredFeedbacks]);
  const { sortedData, getSortProps } = useSortable(sortableFeedbacks, {
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
    key: "src_pages_staff_feedbackmoderation_feedbackmoderationpage_tsx_pagesize",
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

  // Calculate stats
  const lowRatingFeedbacks = feedbacks.filter(
    (f: MentorFeedback) => (f.rating || 0) <= LOW_RATING_THRESHOLD
  ).length;
  const handleViewDetail = (feedback: MentorFeedback) => {
    setSelectedFeedback(feedback);
    setIsDetailOpen(true);
  };
  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t("staffFeedbackmoderation.moderateResponsesSubmittedByCandidates")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t("staffFeedbackmoderation.reviewAndModerateResponsesCandidates")}
        </p>
      </div>

      {/* Alert for low ratings */}
      {lowRatingFeedbacks > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-700 dark:text-amber-400">
                {lowRatingFeedbacks} {t("staffFeedbackmoderation.lowResponseNeedsConsideration")}
              </CardTitle>
            </div>
            <CardDescription className="text-amber-600 dark:text-amber-400">
              {t("common.have")} {lowRatingFeedbacks}{" "}
              {t("staffFeedbackmoderation.feedbackWithARatingOf")}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.totalResponse")}</CardDescription>
            <CardTitle className="text-2xl">{feedbacks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-100 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-red-600">
              <Flag className="h-4 w-4" />
              {t("common.lowRatingLabel")}
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{lowRatingFeedbacks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.mediumRatingLabel")}</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {feedbacks.filter((f: MentorFeedback) => f.rating === 3).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.highRatingLabel")}</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {feedbacks.filter((f: MentorFeedback) => (f.rating || 0) >= HIGH_RATING_MIN).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t("common.filter")}</CardTitle>
            <ReloadButton
              onReload={async () => {
                await refetch();
              }}
              isLoading={isRefetching}
              tooltip={t("common.reloadTheResponseList")}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={t("staffFeedbackmoderation.searchByCandidateNameMentor")}
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("common.ratingLevel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("general.all")}</SelectItem>
                <SelectItem value="low">
                  ⚠️ 1-{LOW_RATING_THRESHOLD} {t("common.starsNeedToSee")}
                </SelectItem>
                <SelectItem value="high">
                  {HIGH_RATING_MIN}-5 {t("common.stars")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            <CardTitle>{t("common.censorshipList")}</CardTitle>
          </div>
          <CardDescription>
            {t("common.show")} {sortedData.length} / {feedbacks.length} {t("common.feedback")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingCardList count={5} />
          ) : sortedData.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={t("common.noResponse")}
              description={t("staffFeedbackmoderation.noCommentsFoundThatNeeded")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton {...getSortProps("idSortValue")}>{t("common.id")}</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton {...getSortProps("mentorNameSortValue")}>
                        {t("common.mentorAccepted")}
                      </SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton {...getSortProps("candidateNameSortValue")}>
                        {t("common.candidateSubmits")}
                      </SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton {...getSortProps("ratingSortValue")}>
                        {t("common.evaluate")}
                      </SortButton>
                    </TableHead>
                    <TableHead>{t("common.comment")}</TableHead>
                    <TableHead className="text-right">{t("common.operation")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map((feedback: MentorFeedback) => (
                    <TableRow
                      key={feedback.id}
                      className={
                        (feedback.rating || 0) <= LOW_RATING_THRESHOLD
                          ? "bg-red-50/50 dark:bg-red-900/10"
                          : ""
                      }>
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
                      <TableCell>{feedback.user?.name || t("common.noDataAvailable")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StarRating value={feedback.rating || 0} readOnly size="sm" />
                          {(feedback.rating || 0) <= LOW_RATING_THRESHOLD && (
                            <Badge variant="destructive" className="text-xs">
                              {t("common.short")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {feedback.comment || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(feedback)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(selectedFeedback?.rating || 0) <= LOW_RATING_THRESHOLD && (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
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
              {/* Mentor Info */}
              <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedFeedback.mentor?.avatarUrl} />
                  <AvatarFallback>{selectedFeedback.mentor?.name?.charAt(0) || "M"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedFeedback.mentor?.name}</p>
                  <p className="text-sm text-slate-500">{selectedFeedback.mentor?.expertise}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center py-4">
                <StarRating value={selectedFeedback.rating || 0} readOnly size="lg" />
              </div>

              {/* Comment */}
              <div>
                <h4 className="mb-2 font-medium text-slate-700 dark:text-slate-300">
                  {t("staffFeedbackmoderation.candidateComments")}
                </h4>
                <div
                  className={`rounded-lg p-4 ${(selectedFeedback.rating || 0) <= LOW_RATING_THRESHOLD ? "border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20" : "bg-slate-50 dark:bg-slate-800"}`}>
                  <p className="whitespace-pre-wrap">
                    {selectedFeedback.comment || t("common.thereAreNoDetailedComments")}
                  </p>
                </div>
              </div>

              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">
                    {t("staffFeedbackmoderation.interviewSession")}
                  </span>{" "}
                  <span className="font-medium">#{selectedFeedback.session?.id}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t("common.roomName")}</span>{" "}
                  <span className="font-medium">
                    {selectedFeedback.session?.roomName || t("common.noDataAvailable")}
                  </span>
                </div>
              </div>

              {/* Student Info */}
              <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedFeedback.user?.avatarUrl} />
                  <AvatarFallback>{selectedFeedback.user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedFeedback.user?.name}</p>
                  <p className="text-sm text-slate-500">
                    {selectedFeedback.user?.email || selectedFeedback.user?.university}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
