import { PaginationControl, ReloadButton, SortButton } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
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
import { formatDate, toTimestamp } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { practiceSetManager } from "@/services";
import type { PracticeSetResponse } from "@/services/practice-set.manager";
import { useAuthStore } from "@/stores";
import { BookOpen, Calendar, ExternalLink, Filter, Plus, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
const levelBadgeMap: Record<string, string> = {
  INTERN: "bg-blue-100 text-blue-700",
  FRESHER: "bg-green-100 text-green-700",
  JUNIOR: "bg-yellow-100 text-yellow-700",
  MIDDLE: "bg-red-100 text-red-700",
};
const levelSortMap: Record<string, number> = {
  INTERN: 1,
  FRESHER: 2,
  JUNIOR: 3,
  MIDDLE: 4,
};
type SortableSessionGroup = {
  idSortValue: number;
  sessionIdSortValue: number;
  dayCountSortValue: number;
  startDateSortValue: number;
  levelSortValue: number;
  sets: PracticeSetResponse[];
};
type SortableStandaloneSet = PracticeSetResponse & {
  idSortValue: number;
  nameSortValue: string;
  levelSortValue: number;
  startDateSortValue: number;
};
function PracticeSetCard({
  ps,
  index,
  navigate,
  allSets,
}: {
  ps: PracticeSetResponse;
  index: number;
  navigate: ReturnType<typeof useNavigate>;
  allSets: PracticeSetResponse[];
}) {
  const { t } = useTranslation();
  const goToDetail = () => {
    // Pass the sets for this session via location state so the detail page
    // does NOT need to re-fetch from the API (requirement #9).
    const sessionSets = allSets.filter((s) => s.interviewSessionId === ps.interviewSessionId);
    navigate(`/user/practice/session/${ps.interviewSessionId}`, {
      state: {
        sessionSets,
      },
    });
  };
  return (
    <Card
      className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
      onClick={goToDetail}>
      <CardContent className="flex items-center gap-5 p-5">
        {/* Index badge */}
        <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl">
          <span className="text-primary text-xl font-bold">{index + 1}</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <CardTitle className="text-foreground line-clamp-1 text-base">
            {ps.practiceSetName ?? t("common.trainingSet")}
          </CardTitle>
          {ps.objective && (
            <CardDescription className="mt-0.5 line-clamp-2 text-sm">
              {ps.objective}
            </CardDescription>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {ps.level && (
              <Badge
                className={cn("text-xs", levelBadgeMap[ps.level] ?? "bg-gray-100 text-gray-700")}>
                {ps.level}
              </Badge>
            )}
            {ps.startDate && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(ps.startDate)}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <Button
          variant="outline"
          size="sm"
          className="ml-2 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            goToDetail();
          }}>
          {t("common.seeDetails")}
        </Button>
      </CardContent>
    </Card>
  );
}
function SessionGroupCard({
  index,
  sets,
  navigate,
}: {
  index: number;
  sets: PracticeSetResponse[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { t } = useTranslation();
  const first = sets[0];
  const sessionId = first.interviewSessionId;
  const dayCount = sets.length;
  const goToSession = () => {
    // Pass the sets for this session via location state (requirement #9)
    navigate(`/user/practice/session/${sessionId}`, {
      state: {
        sessionSets: sets,
      },
    });
  };
  return (
    <Card
      className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
      onClick={goToSession}>
      <CardContent className="flex items-center gap-5 p-5">
        {/* Index badge */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <span className="text-xl font-bold text-amber-600">{index + 1}</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <CardTitle className="text-foreground line-clamp-1 text-base">
            {t("common.route")} {dayCount} {t("userPractice.dateInterviewSession")}
            {sessionId}
          </CardTitle>
          {first.objective && (
            <CardDescription className="mt-0.5 line-clamp-2 text-sm">
              {first.objective}
            </CardDescription>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-100 text-xs text-amber-700 hover:bg-amber-100">
              <Sparkles className="mr-1 h-3 w-3" />
              {dayCount} {t("userPractice.day")}
            </Badge>
            {first.level && (
              <Badge
                className={cn(
                  "text-xs",
                  levelBadgeMap[first.level] ?? "bg-gray-100 text-gray-700"
                )}>
                {first.level}
              </Badge>
            )}
            {first.startDate && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(first.startDate)}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <Button
          variant="outline"
          size="sm"
          className="ml-2 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            goToSession();
          }}>
          {t("userPractice.viewRoute")}
        </Button>
      </CardContent>
    </Card>
  );
}
export function PracticeSetsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [practiceSets, setPracticeSets] = useState<PracticeSetResponse[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sessionGroupPageSize, setSessionGroupPageSize] = useHybridPageSize({
    key: "src_pages_user_practice_practicesetspage_tsx_sessiongrouppagesize",
    defaultPageSize: 8,
  });
  const [standalonePageSize, setStandalonePageSize] = useHybridPageSize({
    key: "src_pages_user_practice_practicesetspage_tsx_standalonepagesize",
    defaultPageSize: 8,
  });
  const hasLoadedRef = useRef(false);
  const loadData = useCallback(
    async (isReload = false) => {
      if (!user?.id) return;
      const shouldShowInitialLoading = !hasLoadedRef.current && !isReload;
      if (shouldShowInitialLoading) {
        setIsInitialLoading(true);
      } else {
        setIsReloading(true);
      }
      try {
        const response = await practiceSetManager.getByUser(user.id);
        if (response.success) {
          setPracticeSets(response.data ?? []);
        } else {
          toast.error(response.error ?? t("common.unableToLoadPracticeSetList"));
        }
      } catch {
        toast.error(t("common.unableToDownloadData"));
      } finally {
        hasLoadedRef.current = true;
        setIsInitialLoading(false);
        setIsReloading(false);
      }
    },

    [user?.id, t]
  );
  useEffect(() => {
    void loadData();
  }, [loadData]);
  const filteredSets = useMemo(() => {
    return practiceSets.filter((ps) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !ps.practiceSetName?.toLowerCase().includes(q) &&
          !ps.objective?.toLowerCase().includes(q)
        )
          return false;
      }
      if (levelFilter !== "all" && ps.level !== levelFilter) return false;
      return true;
    });
  }, [practiceSets, searchQuery, levelFilter]);

  // Tách thành 2 nhóm: AI-linked (có interviewSessionId) và standalone
  const aiLinkedSets = useMemo(
    () => filteredSets.filter((ps) => ps.interviewSessionId != null),
    [filteredSets]
  );
  const standaloneSets = useMemo(
    () => filteredSets.filter((ps) => ps.interviewSessionId == null),
    [filteredSets]
  );

  // Gom nhóm các practice-set AI theo interviewSessionId — mỗi session = 1 thẻ
  const sessionGroups = useMemo<PracticeSetResponse[][]>(() => {
    const map = new Map<number, PracticeSetResponse[]>();
    for (const ps of aiLinkedSets) {
      const key = ps.interviewSessionId!;
      const group = map.get(key) ?? [];
      group.push(ps);
      map.set(key, group);
    }
    return Array.from(map.values());
  }, [aiLinkedSets]);
  const sortableSessionGroups = useMemo<SortableSessionGroup[]>(() => {
    return sessionGroups.map((sets) => {
      const first = sets[0];
      const sessionId = first?.interviewSessionId ?? 0;
      const startDateValues = sets
        .map((set) => toTimestamp(set.startDate))
        .filter((value): value is number => typeof value === "number");
      return {
        idSortValue: sessionId,
        sessionIdSortValue: sessionId,
        dayCountSortValue: sets.length,
        startDateSortValue: startDateValues.length > 0 ? Math.max(...startDateValues) : sessionId,
        levelSortValue: levelSortMap[first?.level || ""] || 0,
        sets,
      };
    });
  }, [sessionGroups, t]);
  const sortableStandaloneSets = useMemo<SortableStandaloneSet[]>(() => {
    return standaloneSets.map((set) => ({
      ...set,
      idSortValue: typeof set.id === "number" ? set.id : 0,
      nameSortValue: set.practiceSetName?.toLowerCase() || "",
      levelSortValue: levelSortMap[set.level || ""] || 0,
      startDateSortValue: toTimestamp(set.startDate) ?? 0,
    }));
  }, [standaloneSets]);
  const { sortedData: sortedSessionGroups, getSortProps: getSessionGroupSortProps } = useSortable(
    sortableSessionGroups,
    {
      defaultSort: {
        key: "startDateSortValue",
        direction: "desc",
      },
      noSortBehavior: "preserve",
      tieBreaker: {
        key: "sessionIdSortValue",
        direction: "desc",
      },
    }
  );
  const { sortedData: sortedStandaloneSets, getSortProps: getStandaloneSortProps } = useSortable(
    sortableStandaloneSets,
    {
      defaultSort: {
        key: "idSortValue",
        direction: "desc",
      },
      noSortBehavior: "preserve",
      tieBreaker: {
        key: "idSortValue",
        direction: "desc",
      },
    }
  );
  const sessionGroupPagination = usePagination({
    totalCount: sortedSessionGroups.length,
    pageSize: sessionGroupPageSize,
  });
  const standalonePagination = usePagination({
    totalCount: sortedStandaloneSets.length,
    pageSize: standalonePageSize,
  });
  const sessionGroupPageData = useMemo(
    () =>
      sortedSessionGroups.slice(
        sessionGroupPagination.startIndex,
        sessionGroupPagination.endIndex + 1
      ),
    [sortedSessionGroups, sessionGroupPagination.startIndex, sessionGroupPagination.endIndex]
  );
  const standalonePageData = useMemo(
    () =>
      sortedStandaloneSets.slice(
        standalonePagination.startIndex,
        standalonePagination.endIndex + 1
      ),
    [sortedStandaloneSets, standalonePagination.startIndex, standalonePagination.endIndex]
  );
  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Banner */}
      <Card className="mb-8 overflow-hidden border-0 bg-linear-to-r from-[#0047AB] via-[#005B9A] to-[#007BFF] py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-white" />
              <h1 className="text-3xl font-bold text-white">{t("common.practiceSet")}</h1>
            </div>
            <p className="max-w-lg text-lg text-white/90">
              {t("userPractice.practiceAlongAnAiGenerated")}
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-2 w-fit"
              onClick={() => navigate("/user/ai-interview/setup")}>
              <Plus className="mr-2 h-5 w-5" />
              {t("common.startInterviewingAi")}
            </Button>
          </div>
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-16 w-16 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative min-w-[300px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder={t("common.searchByNameOrTarget")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              sessionGroupPagination.goToFirstPage();
              standalonePagination.goToFirstPage();
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
              sessionGroupPagination.goToFirstPage();
              standalonePagination.goToFirstPage();
            }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("general.all")}</SelectItem>
              <SelectItem value="INTERN">{t("common.intern")}</SelectItem>
              <SelectItem value="FRESHER">{t("common.fresher")}</SelectItem>
              <SelectItem value="JUNIOR">{t("common.junior")}</SelectItem>
              <SelectItem value="MIDDLE">{t("common.middle")}</SelectItem>
            </SelectContent>
          </Select>
          <ReloadButton
            onReload={async () => {
              await loadData(true);
              sessionGroupPagination.goToFirstPage();
              standalonePagination.goToFirstPage();
            }}
            isLoading={isReloading}
            tooltip={t("userPractice.reloadThePracticeSet")}
          />
        </div>
      </div>

      {/* Loading */}
      {isInitialLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-5 p-5">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-9 w-24 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isInitialLoading && (
        <div className="space-y-8">
          {/* Section 1: Lộ trình từ AI */}
          {sessionGroups.length > 0 && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-foreground text-2xl font-bold">
                    {t("userPractice.roadmapFromAi")}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {t("userPractice.roadmapsAreAutomaticallyGeneratedFrom")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SortButton {...getSessionGroupSortProps("startDateSortValue")}>
                    {t("common.latest")}
                  </SortButton>
                  <SortButton {...getSessionGroupSortProps("dayCountSortValue")}>
                    {t("userPractice.numberOfDays")}
                  </SortButton>
                  <SortButton {...getSessionGroupSortProps("levelSortValue")}>
                    {t("common.level")}
                  </SortButton>
                </div>
              </div>
              <div className="space-y-4">
                {sessionGroupPageData.map((group, index) => (
                  <SessionGroupCard
                    key={group.sessionIdSortValue}
                    sets={group.sets}
                    index={sessionGroupPagination.startIndex + index}
                    navigate={navigate}
                  />
                ))}
              </div>

              {sortedSessionGroups.length > 0 && (
                <div className="mt-4">
                  <PaginationControl
                    pagination={sessionGroupPagination}
                    onPageSizeChange={(nextPageSize) => {
                      setSessionGroupPageSize(nextPageSize);
                      sessionGroupPagination.goToFirstPage();
                    }}
                    pageSizeOptions={[4, 8, 12, 24]}
                  />
                </div>
              )}
            </section>
          )}

          {/* Section 2: Bộ luyện tập tự học */}
          {standaloneSets.length > 0 && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-foreground text-2xl font-bold">
                    {t("userPractice.selfStudyPracticeSet")}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {t("userPractice.thePracticeSetsAreCreated")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SortButton {...getStandaloneSortProps("idSortValue")}>
                    {t("common.latest")}
                  </SortButton>
                  <SortButton {...getStandaloneSortProps("nameSortValue")}>
                    {t("userPractice.setName")}
                  </SortButton>
                  <SortButton {...getStandaloneSortProps("levelSortValue")}>
                    {t("common.level")}
                  </SortButton>
                  <SortButton {...getStandaloneSortProps("startDateSortValue")}>
                    {t("common.startDate")}
                  </SortButton>
                </div>
              </div>
              <div className="space-y-4">
                {standalonePageData.map((ps, index) => (
                  <PracticeSetCard
                    key={ps.id}
                    ps={ps}
                    index={standalonePagination.startIndex + index}
                    navigate={navigate}
                    allSets={practiceSets}
                  />
                ))}
              </div>

              {sortedStandaloneSets.length > 0 && (
                <div className="mt-4">
                  <PaginationControl
                    pagination={standalonePagination}
                    onPageSizeChange={(nextPageSize) => {
                      setStandalonePageSize(nextPageSize);
                      standalonePagination.goToFirstPage();
                    }}
                    pageSizeOptions={[4, 8, 12, 24]}
                  />
                </div>
              )}
            </section>
          )}

          {/* Empty state khi filter không khớp */}
          {filteredSets.length === 0 && practiceSets.length > 0 && (
            <Card className="flex h-64 flex-col items-center justify-center gap-4">
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                <Search className="text-muted-foreground h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">
                  {t("userPractice.noSuitableTrainingSetsWere")}
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
                  sessionGroupPagination.goToFirstPage();
                  standalonePagination.goToFirstPage();
                }}>
                <Filter className="mr-2 h-4 w-4" />
                {t("common.clearFilter")}
              </Button>
            </Card>
          )}

          {/* Empty state khi không có bộ luyện tập nào */}
          {practiceSets.length === 0 && (
            <Card className="overflow-hidden border-0 bg-linear-to-br from-[#0047AB] to-[#007BFF]">
              <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <ExternalLink className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">
                  {t("userPractice.thereAreNoPracticeSets")}
                </CardTitle>
                <CardDescription className="text-white/90">
                  {t("userPractice.completeTheAiInterviewTo")}
                </CardDescription>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate("/user/ai-interview/setup")}>
                  {t("common.startInterviewingAi")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
