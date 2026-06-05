import { ReloadButton } from "@/components/shared";
import { PaginationControl } from "@/components/shared/PaginationControl";
import { SortButton } from "@/components/shared/SortButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingCardList } from "@/components/ui/loading-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useUserSessions } from "@/hooks/useSession";
import { useSortable } from "@/hooks/useSortable";
import { formatDate, formatTime, toTimestamp } from "@/lib/formatting";
import { getMockInterviewStatusBadge } from "@/lib/status-utils";
import { Calendar, Clock, LogIn, Search, User as UserIcon, Users, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
type InterviewStatusFilter = "all" | "SCHEDULED" | "PAID" | "ONGOING";
type InterviewItem = {
  id?: number;
  title: string;
  mentorName: string;
  date: string;
  time: string;
  joinTime?: string;
  status: "upcoming" | "paid" | "ongoing";
  canJoin: boolean;
  isTimeReached: boolean;
  statusSortValue: number;
  sessionSortValue: number;
};
const mockInterviewStatusSortMap: Record<InterviewItem["status"], number> = {
  upcoming: 1,
  paid: 2,
  ongoing: 3,
};
export function MockInterviewListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InterviewStatusFilter>("all");
  const { data: sessions = [], isLoading, isRefetching, refetch } = useUserSessions();

  // Current time state for joinTime-based blocking (updates every 30s)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const interviewSessions = useMemo(
    () =>
      [...sessions]
        .filter(
          (session) =>
            session.status === "SCHEDULED" ||
            session.status === "PAID" ||
            session.status === "ONGOING"
        )
        .sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
    [sessions]
  );

  // Transform sessions to interview format for display.
  const interviews = useMemo<InterviewItem[]>(() => {
    return interviewSessions.map((session) => {
      const joinTimestamp = toTimestamp(session.joinTime);
      const isTimeReached = joinTimestamp ? joinTimestamp <= now : true;
      const normalizedStatus: InterviewItem["status"] =
        session.status === "ONGOING" ? "ongoing" : session.status === "PAID" ? "paid" : "upcoming";
      const sessionSortValue =
        joinTimestamp ??
        toTimestamp(session.startTime1) ??
        (typeof session.id === "number" ? session.id : 0);
      return {
        id: session.id,
        title:
          session.roomName ||
          t("common.sessionVar0", {
            var_0: session.id,
          }),
        mentorName: t("common.mentorWithId", {
          id: session.userId2 || t("common.noDataAvailable"),
        }),
        date: session.joinTime
          ? formatDate(session.joinTime, t("common.noDataAvailable"))
          : formatDate(session.startTime1, t("common.noDataAvailable")),
        time: session.joinTime
          ? formatTime(session.joinTime, t("common.noDataAvailable"))
          : formatTime(session.startTime1, t("common.noDataAvailable")),
        joinTime: session.joinTime,
        status: normalizedStatus,
        canJoin:
          (session.status === "PAID" || session.status === "ONGOING") &&
          !!session.roomUrl &&
          isTimeReached,
        isTimeReached,
        statusSortValue: mockInterviewStatusSortMap[normalizedStatus],
        sessionSortValue,
      };
    });
  }, [interviewSessions, now, t]);

  // Filter interviews based on search query and status
  const filteredInterviews = useMemo(() => {
    if (!searchQuery && statusFilter === "all") return interviews;
    const lowerQuery = searchQuery.toLowerCase();
    return interviews.filter(
      (interview) =>
        (statusFilter === "all" ||
          (statusFilter === "SCHEDULED" && interview.status === "upcoming") ||
          (statusFilter === "PAID" && interview.status === "paid") ||
          (statusFilter === "ONGOING" && interview.status === "ongoing")) &&
        (lowerQuery.length === 0 ||
          interview.title.toLowerCase().includes(lowerQuery) ||
          interview.mentorName.toLowerCase().includes(lowerQuery))
    );
  }, [interviews, searchQuery, statusFilter]);
  const { sortedData, getSortProps } = useSortable(filteredInterviews);
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_user_mockinterview_mockinterviewlistpage_tsx_pagesize",
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
  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Banner */}
      <Card className="mb-8 overflow-hidden border-0 bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-600 py-0">
        <CardContent className="flex items-center justify-between p-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-white" />
              <h1 className="text-3xl font-bold text-white">{t("common.interviewWithMentor1")}</h1>
            </div>
            <p className="max-w-lg text-lg text-white/90">
              {sessions.length > 0
                ? t("general.youHaveCompletedMockInterview", {
                    var_0: sessions.filter((s) => s.status === "COMPLETED").length,
                  })
                : t("userMockinterview.youHavenTHadAny")}
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-2 w-fit"
              onClick={() => navigate("/user/mock-interview/schedule")}>
              <Video className="mr-2 h-5 w-5" />
              {t("userMockinterview.scheduleANewInterview")}
            </Button>
          </div>
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Video className="h-16 w-16 text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Search Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">{t("common.sessionIsComingSoon")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("userMockinterview.listOfUpcomingOrOngoing")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder={t("userMockinterview.searchByNameMentor")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as InterviewStatusFilter);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t("common.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allStatus")}</SelectItem>
              <SelectItem value="SCHEDULED">{t("common.comingSoon")}</SelectItem>
              <SelectItem value="PAID">{t("common.paid")}</SelectItem>
              <SelectItem value="ONGOING">{t("common.ongoing")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("userMockinterview.arrange")}
            </span>
            <SortButton {...getSortProps("id")}>{t("common.id")}</SortButton>
            <SortButton {...getSortProps("sessionSortValue")}>{t("common.time")}</SortButton>
            <SortButton {...getSortProps("statusSortValue")}>{t("common.status")}</SortButton>
          </div>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                pagination.goToFirstPage();
              }}>
              {t("common.clearFilter")}
            </Button>
          )}
          <ReloadButton
            onReload={async () => {
              await refetch();
            }}
            isLoading={isRefetching}
            tooltip={t("common.reloadSessionList")}
          />
        </div>
      </div>

      {/* Active/Incomplete Interview Cards */}
      {isLoading ? (
        <LoadingCardList count={4} />
      ) : (
        <div className="space-y-4">
          {pageData.map((interview, index) => (
            <Card
              key={interview.id}
              className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate(`/user/mock-interview/history/${interview.id}`)}>
              <CardContent className="flex items-center gap-6 p-6">
                {/* Sequential Number */}
                <div className="bg-primary/10 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold">
                  {pagination.startIndex + index + 1}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-foreground text-lg font-semibold">
                    {interview.title}
                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                      (ID: {interview.id})
                    </span>
                  </h3>

                  {/* Metadata */}
                  <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{interview.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{interview.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="h-4 w-4" />
                      <span>{interview.mentorName}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Join Button */}
                <div className="flex shrink-0 items-center gap-2">
                  {interview.canJoin && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/mock-interview/room/${interview.id}`);
                      }}
                      className="gap-1 bg-green-600 hover:bg-green-700">
                      <LogIn className="h-3.5 w-3.5" />
                      {t("general.join")}
                    </Button>
                  )}
                  {!interview.isTimeReached && interview.joinTime && (
                    <Badge className="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700 hover:bg-amber-100">
                      <Clock className="h-3.5 w-3.5" />
                      {t("common.itsNotTimeYet")}
                    </Badge>
                  )}
                  <StatusBadge {...getMockInterviewStatusBadge(interview.status)} />
                </div>
              </CardContent>
            </Card>
          ))}

          {sortedData.length === 0 && !isLoading && (
            <Card className="flex h-64 flex-col items-center justify-center gap-4">
              <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                <Search className="text-muted-foreground h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium">
                  {searchQuery
                    ? t("userMockinterview.noMatchingSessionFound")
                    : t("userMockinterview.thereAreNoUnfinishedSessions")}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {searchQuery
                    ? t("common.trySearchingWithOtherKeywords")
                    : t("userMockinterview.youHaveNoPendingSessions")}
                </p>
              </div>
            </Card>
          )}

          {/* CTA to book new interview */}
          {sortedData.length > 0 && (
            <Card className="overflow-hidden border-dashed">
              <CardHeader className="text-center">
                <CardTitle>{t("general.bookNewInterviewSession")}</CardTitle>
                <CardDescription>{t("userMockinterview.chooseTheRightMentorAnd")}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                <Button size="lg" onClick={() => navigate("/user/mock-interview/schedule")}>
                  <Users className="mr-2 h-5 w-5" />
                  {t("userMockinterview.selectMentor")}
                </Button>
              </CardContent>
            </Card>
          )}

          {sortedData.length > 0 && (
            <PaginationControl
              pagination={pagination}
              onPageSizeChange={(size) => {
                setPageSize(size);
                pagination.goToFirstPage();
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          )}
        </div>
      )}
    </div>
  );
}
