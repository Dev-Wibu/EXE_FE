import { PaginationControl, ReloadButton, SortButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import { questionManager } from "@/services";
import type { PracticeQuestion } from "@/services/question.manager";
import { ChevronDown, ChevronUp, Filter, Search, Shuffle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
const levelBadgeMap: Record<string, string> = {
  EASY: "bg-green-100 text-green-700 hover:bg-green-100",
  MEDIUM: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  HARD: "bg-red-100 text-red-700 hover:bg-red-100",
};
const levelSortMap: Record<string, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};
type SortablePracticeQuestion = PracticeQuestion & {
  idSortValue: number;
  titleSortValue: string;
  levelSortValue: number;
};
export function PracticeQuestionsPage() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);
  const loadData = useCallback(
    async (isReload = false) => {
      const shouldShowInitialLoading = !hasLoadedRef.current && !isReload;
      if (shouldShowInitialLoading) {
        setIsInitialLoading(true);
      } else {
        setIsReloading(true);
      }
      try {
        const response = await questionManager.getAll();
        if (response.success && response.data) {
          const raw = response.data;
          const arr = Array.isArray(raw) ? raw : "data" in raw ? raw.data : [];
          setQuestions(arr as unknown as PracticeQuestion[]);
        } else {
          toast.error(response.error || t("common.unableToLoadQuestionList"));
        }
      } catch (error) {
        console.error("Error loading questions:", error);
        toast.error(t("common.unableToDownloadData"));
      } finally {
        hasLoadedRef.current = true;
        setIsInitialLoading(false);
        setIsReloading(false);
      }
    },
    [t]
  );
  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleRandomQuestions = async () => {
    if (levelFilter === "all") {
      toast.error(t("userPractice.pleaseSelectALevelBefore"));
      return;
    }
    setIsReloading(true);
    try {
      const response = await questionManager.getRandomByLevel(levelFilter, 10);
      if (response.success && response.data) {
        setQuestions(response.data);
        pagination.goToFirstPage();
        toast.success(t("userPractice.loadedRandomQuestions"));
      } else {
        toast.error(response.error || t("common.unableToLoadRandomQuestions"));
      }
    } catch (error) {
      console.error("Error fetching random questions:", error);
      toast.error(t("common.unableToLoadRandomQuestions"));
    } finally {
      hasLoadedRef.current = true;
      setIsInitialLoading(false);
      setIsReloading(false);
    }
  };
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
  const sortableQuestions = useMemo<SortablePracticeQuestion[]>(() => {
    return filteredQuestions.map((question) => ({
      ...question,
      idSortValue: typeof question.questionId === "number" ? question.questionId : 0,
      titleSortValue: question.title?.toLowerCase() || "",
      levelSortValue: levelSortMap[question.level || ""] || 0,
    }));
  }, [filteredQuestions]);
  const { sortedData, getSortProps } = useSortable(sortableQuestions, {
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
    key: "src_pages_user_practice_practicequestionspage_tsx_pagesize",
    defaultPageSize: 12,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });
  const pageData = useMemo(
    () => sortedData.slice(pagination.startIndex, pagination.endIndex + 1),
    [pagination.endIndex, pagination.startIndex, sortedData]
  );
  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Banner */}
      <Card className="mb-8 overflow-hidden border-0 bg-linear-to-r from-[#0047AB] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-white">
              {t("userPractice.practiceQuestionBank")}
            </h1>
            <p className="max-w-lg text-lg text-white/90">
              {t("userPractice.practiceWithLeveledQuestionsTo")}
            </p>
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Search className="h-14 w-14 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[300px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder={t("common.searchQuestions")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
              {t("mentorStudents.level")}
            </span>
            <Select
              value={levelFilter}
              onValueChange={(value) => {
                setLevelFilter(value);
                pagination.goToFirstPage();
              }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("general.all")}</SelectItem>
                <SelectItem value="EASY">{t("common.easy")}</SelectItem>
                <SelectItem value="MEDIUM">{t("common.mediumLevel")}</SelectItem>
                <SelectItem value="HARD">{t("common.hard")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleRandomQuestions} variant="outline" className="gap-2">
            <Shuffle className="h-4 w-4" />
            {t("userPractice.randomQuestion")}
          </Button>

          <ReloadButton
            onReload={async () => {
              await loadData(true);
              pagination.goToFirstPage();
            }}
            isLoading={isReloading}
            tooltip={t("common.reloadQuestionList")}
          />
        </div>

        {sortedData.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-3">
            <span className="text-muted-foreground text-sm font-medium">{t("common.sortBy")}</span>
            <SortButton {...getSortProps("idSortValue")}>{t("common.latest")}</SortButton>
            <SortButton {...getSortProps("titleSortValue")}>{t("common.title")}</SortButton>
            <SortButton {...getSortProps("levelSortValue")}>{t("common.level")}</SortButton>
          </div>
        )}
      </Card>

      {/* Questions Grid */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pageData.map((question) => (
            <Card
              key={question.questionId}
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() =>
                setExpandedId(
                  expandedId === question.questionId ? null : (question.questionId ?? null)
                )
              }>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-primary text-base">{question.title}</CardTitle>
                  {expandedId === question.questionId ? (
                    <ChevronUp className="text-muted-foreground h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={levelBadgeMap[question.level || ""] || "bg-gray-100 text-gray-700"}>
                    {question.level}
                  </Badge>
                  {question.lesson?.lessonName && (
                    <Badge variant="secondary" className="text-xs">
                      {question.lesson.lessonName}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2">{question.content}</CardDescription>
                {expandedId === question.questionId && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {question.answer && (
                      <div>
                        <p className="text-sm font-semibold text-green-700">{t("common.answer")}</p>
                        <p className="text-muted-foreground text-sm">{question.answer}</p>
                      </div>
                    )}
                    {question.hint && (
                      <div>
                        <p className="text-sm font-semibold text-blue-700">
                          {t("userPractice.suggest")}
                        </p>
                        <p className="text-muted-foreground text-sm">{question.hint}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isInitialLoading && sortedData.length > 0 && (
        <div className="mt-6">
          <PaginationControl
            pagination={pagination}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              pagination.goToFirstPage();
            }}
            pageSizeOptions={[6, 12, 24, 48]}
          />
        </div>
      )}

      {/* Empty State */}
      {!isInitialLoading && sortedData.length === 0 && (
        <Card className="flex h-64 flex-col items-center justify-center gap-4">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">
              {t("userPractice.noMatchingQuestionsWereFound")}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("userPractice.tryAdjustingTheFilterTo")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setLevelFilter("all");
              pagination.goToFirstPage();
            }}>
            <Filter className="mr-2 h-4 w-4" />
            {t("common.clearFilter")}
          </Button>
        </Card>
      )}
    </div>
  );
}
