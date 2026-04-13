import { Calendar, ChevronLeft, ChevronRight, Clock, Star, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useMentorReviewsByMentor } from "@/hooks/useMentorReview";
import { useSessions } from "@/hooks/useSession";
import type { Session } from "@/interfaces";
import { formatCurrency, formatDateTime } from "@/lib/formatting";
import { useAuthStore } from "@/stores/authStore";

import {
  MENTOR_CALENDAR_STATUSES,
  buildMentorCalendarSessions,
  formatCalendarTime,
  groupMentorCalendarByDate,
} from "./mentorSchedule.utils";

const MAX_VISIBLE_SESSIONS = 3;
const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const statusConfig: Record<string, { label: string; dot: string; badgeClass: string }> = {
  SCHEDULED: {
    label: "Sắp diễn ra",
    dot: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  PAID: {
    label: "Đã thanh toán",
    dot: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  ONGOING: {
    label: "Đang diễn ra",
    dot: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  COMPLETED: {
    label: "Hoàn thành",
    dot: "bg-slate-500",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

const defaultStatusConfig = statusConfig.SCHEDULED;

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
};

const getReviewSortTimestamp = (review: { id?: number; session?: Session }) => {
  const value = review.session?.endTime1 || review.session?.startTime1;
  if (!value) {
    return typeof review.id === "number" ? review.id : 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

function CalendarSessionEntry({
  session,
  onOpen,
}: {
  session: Session;
  onOpen: (_sessionId?: number) => void;
}) {
  const cfg = statusConfig[session.status || "SCHEDULED"] || defaultStatusConfig;

  return (
    <button
      onClick={() => onOpen(session.id)}
      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors">
      <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
      <span className="text-muted-foreground shrink-0">{formatCalendarTime(session.joinTime)}</span>
      <span className="text-foreground flex-1 truncate font-medium">
        {session.roomName || `Phiên #${session.id}`}
      </span>
      <Badge className={`${cfg.badgeClass} border-0 px-1.5 py-0 text-[10px]`}>{cfg.label}</Badge>
    </button>
  );
}

export function MentorOverviewPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const mentorId = user?.id;
  const { data: allSessions = [], isLoading: sessionsLoading } = useSessions();
  const { data: reviews = [], isLoading: reviewsLoading } = useMentorReviewsByMentor(mentorId || 0);

  const now = new Date();
  const nowTimestamp = now.getTime();
  const todayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;

  const [currentYear, setCurrentYear] = useState(now.getUTCFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getUTCMonth());

  const mentorSessions = useMemo(() => {
    if (!mentorId) {
      return [];
    }
    return allSessions.filter((session) => session.userId2 === mentorId);
  }, [allSessions, mentorId]);

  const calendarItems = useMemo(() => {
    return buildMentorCalendarSessions(allSessions, mentorId);
  }, [allSessions, mentorId]);

  const sessionsByDate = useMemo(() => {
    return groupMentorCalendarByDate(calendarItems);
  }, [calendarItems]);

  const totalSessions = mentorSessions.length;
  const completedSessions = mentorSessions.filter(
    (session) => session.status === "COMPLETED"
  ).length;
  const upcomingSessions = mentorSessions.filter(
    (session) =>
      session.status === "SCHEDULED" || session.status === "PAID" || session.status === "ONGOING"
  ).length;
  const totalStudents = new Set(
    mentorSessions
      .map((session) => session.userId)
      .filter((studentId): studentId is number => typeof studentId === "number")
  ).size;

  const ratings = reviews
    .map((review) => review.rating)
    .filter((rating): rating is number => typeof rating === "number");
  const averageRating = ratings.length
    ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  const totalEarnings = mentorSessions.reduce((sum, session) => {
    if (session.status !== "COMPLETED") {
      return sum;
    }

    return typeof session.totalPrice === "number" ? sum + session.totalPrice : sum;
  }, 0);

  const upcomingScheduleItems = calendarItems
    .filter((item) => item.timestamp >= nowTimestamp && item.session.status !== "COMPLETED")
    .slice(0, 4);

  const recentReviews = [...reviews]
    .sort((a, b) => getReviewSortTimestamp(b) - getReviewSortTimestamp(a))
    .slice(0, 4);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const calendarDays: (number | null)[] = [];
  for (let index = 0; index < adjustedFirstDay; index += 1) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push(day);
  }
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let index = 0; index < calendarDays.length; index += 7) {
    weeks.push(calendarDays.slice(index, index + 7));
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prevYear) => prevYear - 1);
      return;
    }
    setCurrentMonth((prevMonth) => prevMonth - 1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prevYear) => prevYear + 1);
      return;
    }
    setCurrentMonth((prevMonth) => prevMonth + 1);
  };

  const handleOpenSessionDetail = (sessionId?: number) => {
    if (typeof sessionId === "number") {
      navigate(`/mentor/sessions/${sessionId}`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-linear-to-r from-emerald-500 to-teal-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Chào mừng trở lại, {user?.name || "Mentor"}!</h1>
        <p className="mt-2 text-emerald-100">
          Theo dõi lịch hẹn, đánh giá và hiệu suất mentoring của bạn tại INBLUE AI.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-100 dark:border-emerald-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Tổng phiên phỏng vấn
            </CardTitle>
            <Calendar className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-800 dark:text-white">{totalSessions}</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {completedSessions} hoàn thành • {upcomingSessions} sắp tới
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 dark:border-blue-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Học viên đã hỗ trợ
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-800 dark:text-white">{totalStudents}</div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Tính theo lịch sử mentoring</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-100 dark:border-yellow-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Đánh giá trung bình
            </CardTitle>
            <Star className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-zinc-800 dark:text-white">
                {averageRating}
              </span>
              <span className="text-lg text-gray-500">/5</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Dựa trên đánh giá đã gửi</p>
          </CardContent>
        </Card>

        <Card className="border-green-100 dark:border-green-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Tổng thu nhập ước tính
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-800 dark:text-white">
              {formatCurrency(totalEarnings)}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Từ các phiên đã hoàn thành</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold uppercase">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </CardTitle>
            <CardDescription>Lịch hẹn mentoring của bạn</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden flex-wrap items-center gap-3 text-xs lg:flex">
              {MENTOR_CALENDAR_STATUSES.map((status) => {
                const cfg = statusConfig[status] || defaultStatusConfig;
                return (
                  <span key={status} className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className="text-muted-foreground">{cfg.label}</span>
                  </span>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              aria-label="Tháng trước">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Tháng sau">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 border-b pb-2">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="text-muted-foreground text-center text-sm font-medium uppercase">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="border-border min-h-[108px] rounded-lg border p-2 opacity-30"
                      />
                    );
                  }

                  const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayItems = sessionsByDate.get(dateKey) || [];
                  const isToday = dateKey === todayKey;
                  const visibleItems = dayItems.slice(0, MAX_VISIBLE_SESSIONS);
                  const overflowCount = dayItems.length - MAX_VISIBLE_SESSIONS;

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`border-border min-h-[108px] rounded-lg border p-2 transition-colors ${
                        isToday
                          ? "border-emerald-400 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/20"
                          : dayItems.length > 0
                            ? "hover:bg-muted/40"
                            : "hover:bg-muted/20"
                      }`}>
                      <div
                        className={`mb-1 text-sm font-medium ${
                          isToday
                            ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"
                            : "text-muted-foreground"
                        }`}>
                        {String(day).padStart(2, "0")}
                      </div>

                      {dayItems.length > 0 && (
                        <div className="flex flex-col gap-0.5">
                          {visibleItems.map((item) => {
                            const cfg =
                              statusConfig[item.session.status || "SCHEDULED"] ||
                              defaultStatusConfig;
                            return (
                              <button
                                key={item.session.id}
                                onClick={() => handleOpenSessionDetail(item.session.id)}
                                className={`flex items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:opacity-80 ${cfg.badgeClass}`}
                                title={`${formatCalendarTime(item.session.joinTime)} — ${item.session.roomName || `Phiên #${item.session.id}`}`}>
                                <Clock className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate text-[10px] font-medium">
                                  {formatCalendarTime(item.session.joinTime)}
                                </span>
                              </button>
                            );
                          })}

                          {overflowCount > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground mt-0.5 text-center text-[10px] font-medium transition-colors">
                                  +{overflowCount} phiên khác
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-80 p-2"
                                side="right"
                                align="start"
                                sideOffset={8}>
                                <p className="mb-2 text-xs font-semibold">{`${String(day).padStart(2, "0")}/${String(
                                  currentMonth + 1
                                ).padStart(2, "0")}/${currentYear} — ${dayItems.length} phiên`}</p>
                                <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
                                  {dayItems.map((item) => (
                                    <CalendarSessionEntry
                                      key={item.session.id}
                                      session={item.session}
                                      onOpen={handleOpenSessionDetail}
                                    />
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Phiên cần theo dõi</CardTitle>
              <CardDescription>Các lịch hẹn sắp diễn ra hoặc đang diễn ra</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/mentor?tab=sessions")}>
              Xem toàn bộ
            </Button>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : upcomingScheduleItems.length === 0 ? (
              <p className="text-sm text-slate-500">Hiện chưa có phiên nào cần theo dõi.</p>
            ) : (
              <div className="space-y-2">
                {upcomingScheduleItems.map((item) => {
                  const cfg =
                    statusConfig[item.session.status || "SCHEDULED"] || defaultStatusConfig;
                  return (
                    <button
                      key={item.session.id}
                      onClick={() => handleOpenSessionDetail(item.session.id)}
                      className="hover:bg-muted flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors">
                      <div>
                        <p className="text-sm font-semibold">
                          {item.session.roomName || `Phiên #${item.session.id}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(item.session.joinTime)}
                        </p>
                      </div>
                      <Badge className={cfg.badgeClass}>{cfg.label}</Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đánh giá gần đây</CardTitle>
            <CardDescription>Những đánh giá mentor đã gửi gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : recentReviews.length === 0 ? (
              <p className="text-sm text-slate-500">Bạn chưa có đánh giá nào gần đây.</p>
            ) : (
              <div className="space-y-2">
                {recentReviews.map((review) => (
                  <button
                    key={review.id}
                    onClick={() => {
                      if (review.id) {
                        navigate(`/mentor/reviews/${review.id}`);
                      }
                    }}
                    className="hover:bg-muted flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors">
                    <div>
                      <p className="text-sm font-semibold">
                        {review.session?.roomName || `Phiên #${review.session?.id || review.id}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        Học viên #{review.session?.userId || "-"}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      {typeof review.rating === "number" ? review.rating.toFixed(1) : "-"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
