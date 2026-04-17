import { format as formatDateFn } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, Clock, Filter, Target, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSessions } from "@/hooks/useSession";
import { formatDateTime } from "@/lib/formatting";
import { cn } from "@/lib/utils";

import {
  USER_CALENDAR_STATUSES,
  type UserCalendarSession,
  buildUserCalendarSessions,
  formatCalendarTime,
  groupUserCalendarByDate,
} from "./userSchedule.utils";

const MAX_VISIBLE_SESSIONS = 2;
const MOBILE_VIEW_AGENDA = "agenda";
const MOBILE_VIEW_CALENDAR = "calendar";
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
  DRAFT: {
    label: "Chờ duyệt",
    dot: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
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
  REJECTED: {
    label: "Bị từ chối",
    dot: "bg-red-500",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  CANCELED: {
    label: "Đã hủy",
    dot: "bg-rose-500",
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

const defaultStatusConfig = statusConfig.SCHEDULED;

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
};

const toDateKeyFromParts = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
};

const toFilterDateKey = (value?: Date): string | undefined => {
  if (!value) {
    return undefined;
  }

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate()
  ).padStart(2, "0")}`;
};

const isDateKeyInRange = (dateKey: string, fromKey?: string, toKey?: string) => {
  if (fromKey && dateKey < fromKey) {
    return false;
  }

  if (toKey && dateKey > toKey) {
    return false;
  }

  return true;
};

function AgendaSessionItem({
  item,
  onOpenDetail,
  onOpenRoom,
  onWriteReview,
}: {
  item: UserCalendarSession;
  onOpenDetail: (_sessionId?: number) => void;
  onOpenRoom: (_sessionId?: number) => void;
  onWriteReview: (_sessionId?: number) => void;
}) {
  const status = statusConfig[item.session.status || "SCHEDULED"] || defaultStatusConfig;
  const canJoinRoom =
    (item.session.status === "PAID" || item.session.status === "ONGOING") && !!item.session.roomUrl;
  const canWriteReview = item.session.status === "COMPLETED";

  return (
    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-colors dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {item.session.roomName || `Phiên #${item.session.id}`}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mentor #{item.session.userId2 || "-"}
          </p>
        </div>
        <Badge className={cn("border-0", status.badgeClass)}>{status.label}</Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDateTime(item.session.joinTime)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onOpenDetail(item.session.id)}>
          Xem chi tiết
        </Button>
        {canJoinRoom && (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onOpenRoom(item.session.id)}>
            Vào phòng
          </Button>
        )}
        {canWriteReview && (
          <Button size="sm" variant="secondary" onClick={() => onWriteReview(item.session.id)}>
            Viết đánh giá
          </Button>
        )}
      </div>
    </div>
  );
}

function CalendarSessionEntry({
  item,
  onOpen,
}: {
  item: UserCalendarSession;
  onOpen: (_sessionId?: number) => void;
}) {
  const status = statusConfig[item.session.status || "SCHEDULED"] || defaultStatusConfig;

  return (
    <button
      onClick={() => onOpen(item.session.id)}
      className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors">
      <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} />
      <span className="text-muted-foreground shrink-0">
        {formatCalendarTime(item.session.joinTime)}
      </span>
      <span className="text-foreground flex-1 truncate font-medium">
        {item.session.roomName || `Phiên #${item.session.id}`}
      </span>
      <Badge className={cn("border-0 px-1.5 py-0 text-[10px]", status.badgeClass)}>
        {status.label}
      </Badge>
    </button>
  );
}

export function OverviewPage() {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions();

  const now = new Date();
  const nowTimestamp = now.getTime();
  const todayKey = toDateKeyFromParts(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const [currentYear, setCurrentYear] = useState(now.getUTCFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getUTCMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...USER_CALENDAR_STATUSES]);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [mobileView, setMobileView] = useState<string>(MOBILE_VIEW_AGENDA);

  const calendarItems = useMemo(() => {
    return buildUserCalendarSessions(sessions);
  }, [sessions]);

  const fromKey = useMemo(() => toFilterDateKey(fromDate), [fromDate]);
  const toKey = useMemo(() => toFilterDateKey(toDate), [toDate]);

  const filteredCalendarItems = useMemo(() => {
    return calendarItems.filter((item) => {
      const status = item.session.status || "";
      return selectedStatuses.includes(status) && isDateKeyInRange(item.dateKey, fromKey, toKey);
    });
  }, [calendarItems, selectedStatuses, fromKey, toKey]);

  const sessionsByDate = useMemo(() => {
    return groupUserCalendarByDate(filteredCalendarItems);
  }, [filteredCalendarItems]);

  const totalInterviews = sessions.length;
  const completedInterviews = sessions.filter((session) => session.status === "COMPLETED").length;
  const upcomingInterviews = sessions.filter(
    (session) =>
      session.status === "SCHEDULED" || session.status === "PAID" || session.status === "ONGOING"
  ).length;
  const pendingInterviews = sessions.filter((session) => session.status === "DRAFT").length;

  const upcomingScheduleItems = filteredCalendarItems
    .filter(
      (item) =>
        item.timestamp >= nowTimestamp &&
        item.session.status !== "COMPLETED" &&
        item.session.status !== "REJECTED" &&
        item.session.status !== "CANCELED"
    )
    .slice(0, 4);

  const selectedDayItems = sessionsByDate.get(selectedDateKey) || [];

  const selectedDateDisplay = useMemo(() => {
    const [year, month, day] = selectedDateKey.split("-").map(Number);
    if (!year || !month || !day) {
      return "Ngày đã chọn";
    }

    return formatDateFn(new Date(year, month - 1, day), "EEEE, dd/MM/yyyy", { locale: vi });
  }, [selectedDateKey]);

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
      navigate(`/user/mock-interview/history/${sessionId}`);
    }
  };

  const handleOpenSessionRoom = (sessionId?: number) => {
    if (typeof sessionId === "number") {
      navigate(`/user/mock-interview/room/${sessionId}`);
    }
  };

  const handleWriteReview = (sessionId?: number) => {
    if (typeof sessionId === "number") {
      navigate(`/user/mock-interview/history/${sessionId}/feedback`);
    }
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((current) => {
      if (current.includes(status)) {
        return current.filter((item) => item !== status);
      }
      return [...current, status];
    });
  };

  const resetFilters = () => {
    setSelectedStatuses([...USER_CALENDAR_STATUSES]);
    setFromDate(undefined);
    setToDate(undefined);
  };

  const jumpToToday = () => {
    setCurrentYear(now.getUTCFullYear());
    setCurrentMonth(now.getUTCMonth());
    setSelectedDateKey(todayKey);
  };

  const renderCalendarContent = () => (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <CardHeader className="gap-4 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold uppercase">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </CardTitle>
            <CardDescription>Lịch hoạt động theo tháng của bạn</CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" size="sm" onClick={jumpToToday}>
              Hôm nay
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {USER_CALENDAR_STATUSES.map((status) => {
            const cfg = statusConfig[status] || defaultStatusConfig;
            return (
              <span
                key={status}
                className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 border-b border-slate-200 pb-2 dark:border-slate-800">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">
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
                      className="min-h-32 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 opacity-50 dark:border-slate-800 dark:bg-slate-900/20"
                    />
                  );
                }

                const dateKey = toDateKeyFromParts(currentYear, currentMonth, day);
                const dayItems = sessionsByDate.get(dateKey) || [];
                const visibleItems = dayItems.slice(0, MAX_VISIBLE_SESSIONS);
                const overflowCount = dayItems.length - MAX_VISIBLE_SESSIONS;
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDateKey;

                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={cn(
                      "bg-background min-h-32 rounded-xl border p-2.5 transition-colors",
                      isSelected
                        ? "border-blue-500 ring-1 ring-blue-500/30"
                        : isToday
                          ? "border-indigo-400/70 bg-indigo-50/50 dark:border-indigo-700 dark:bg-indigo-950/20"
                          : "border-slate-200/80 dark:border-slate-800",
                      !isSelected &&
                        dayItems.length > 0 &&
                        "hover:border-slate-300 dark:hover:border-slate-700"
                    )}>
                    <div className="mb-2 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedDateKey(dateKey)}
                        className={cn(
                          "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold transition-colors",
                          isSelected
                            ? "bg-blue-600 text-white"
                            : isToday
                              ? "bg-indigo-600 text-white"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        )}
                        aria-label={`Chọn ngày ${day}`}>
                        {String(day).padStart(2, "0")}
                      </button>
                      {dayItems.length > 0 && (
                        <Badge className="border-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {dayItems.length}
                        </Badge>
                      )}
                    </div>

                    {dayItems.length > 0 && (
                      <div className="space-y-1">
                        {visibleItems.map((item) => {
                          const cfg =
                            statusConfig[item.session.status || "SCHEDULED"] || defaultStatusConfig;
                          return (
                            <button
                              key={item.session.id}
                              onClick={() => handleOpenSessionDetail(item.session.id)}
                              className={cn(
                                "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] transition-colors hover:opacity-90",
                                cfg.badgeClass
                              )}>
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="shrink-0 font-medium">
                                {formatCalendarTime(item.session.joinTime)}
                              </span>
                              <span className="truncate">
                                {item.session.roomName || `#${item.session.id}`}
                              </span>
                            </button>
                          );
                        })}

                        {overflowCount > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="w-full rounded-md border border-dashed border-slate-300 px-2 py-1 text-center text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600">
                                +{overflowCount} phiên khác
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-80 p-2"
                              side="bottom"
                              align="start"
                              sideOffset={8}>
                              <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {`${String(day).padStart(2, "0")}/${String(currentMonth + 1).padStart(2, "0")}/${currentYear} - ${dayItems.length} phiên`}
                              </p>
                              <div className="flex max-h-52 flex-col gap-1 overflow-y-auto">
                                {dayItems.map((item) => (
                                  <CalendarSessionEntry
                                    key={item.session.id}
                                    item={item}
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
  );

  const renderAgendaContent = () => (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <CardHeader className="space-y-4 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg">Lịch hẹn theo ngày</CardTitle>
          <CardDescription className="capitalize">{selectedDateDisplay}</CardDescription>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Filter className="h-4 w-4" />
            Bộ lọc
          </div>

          <div className="flex flex-wrap gap-2">
            {USER_CALENDAR_STATUSES.map((status) => {
              const cfg = statusConfig[status] || defaultStatusConfig;
              const active = selectedStatuses.includes(status);
              return (
                <Button
                  key={status}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => toggleStatus(status)}
                  className={cn("h-8", active && "bg-blue-600 hover:bg-blue-700")}>
                  <span className={`mr-1.5 h-2 w-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </Button>
              );
            })}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  {fromDate ? formatDateFn(fromDate, "dd/MM/yyyy", { locale: vi }) : "Từ ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <DatePicker
                  mode="single"
                  selected={fromDate}
                  onSelect={(value) => {
                    setFromDate(value);
                    if (value && toDate && value > toDate) {
                      setToDate(undefined);
                    }
                  }}
                  locale={vi}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  {toDate ? formatDateFn(toDate, "dd/MM/yyyy", { locale: vi }) : "Đến ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <DatePicker
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  locale={vi}
                  disabled={(date) => (fromDate ? date < fromDate : false)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="ghost" size="sm" className="w-fit" onClick={resetFilters}>
            Đặt lại bộ lọc
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {sessionsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : selectedDayItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Không có lịch hẹn trong ngày đã chọn
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Thử đổi ngày hoặc điều chỉnh bộ lọc để xem thêm phiên phù hợp.
            </p>
          </div>
        ) : (
          selectedDayItems.map((item) => (
            <AgendaSessionItem
              key={item.session.id}
              item={item}
              onOpenDetail={handleOpenSessionDetail}
              onOpenRoom={handleOpenSessionRoom}
              onWriteReview={handleWriteReview}
            />
          ))
        )}

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/30">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Phiên sắp tới
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/user?tab=interviewHistory")}>
              Xem lịch sử
            </Button>
          </div>

          {upcomingScheduleItems.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hiện chưa có phiên nào cần theo dõi trong bộ lọc hiện tại.
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingScheduleItems.map((item) => {
                const cfg = statusConfig[item.session.status || "SCHEDULED"] || defaultStatusConfig;
                return (
                  <button
                    key={item.session.id}
                    onClick={() => handleOpenSessionDetail(item.session.id)}
                    className="hover:bg-background flex w-full items-center justify-between rounded-lg border border-slate-200/80 bg-white p-2.5 text-left transition-colors dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.session.roomName || `Phiên #${item.session.id}`}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDateTime(item.session.joinTime)}
                      </p>
                    </div>
                    <Badge className={cn("border-0", cfg.badgeClass)}>{cfg.label}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/30">
          <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Hành động nhanh
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => navigate("/user/mock-interview/select-mentor")}>
              Đặt lịch mentor
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/user?tab=mockInterview")}>
              Danh sách phiên
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/user?tab=interviewHistory")}>
              Lịch sử phỏng vấn
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-blue-200/70 bg-white dark:border-blue-900/50 dark:bg-slate-950">
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Dashboard người dùng
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Tổng quan phỏng vấn
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Theo dõi lịch hẹn và các thao tác quan trọng để chuẩn bị tốt cho từng phiên.
            </p>
          </div>
          <Button onClick={() => navigate("/user/mock-interview/select-mentor")}>
            Đặt lịch mới
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Tổng phiên phỏng vấn
            </CardTitle>
            <Video className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalInterviews}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tất cả phiên bạn đã đặt</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Phiên sắp diễn ra
            </CardTitle>
            <Clock className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {upcomingInterviews}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">SCHEDULED, PAID, ONGOING</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Phiên hoàn thành
            </CardTitle>
            <Calendar className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {completedInterviews}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Có thể gửi hoặc cập nhật đánh giá
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Yêu cầu chờ duyệt
            </CardTitle>
            <Target className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {pendingInterviews}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Các phiên trạng thái DRAFT</p>
          </CardContent>
        </Card>
      </div>

      <div className="xl:hidden">
        <Tabs value={mobileView} onValueChange={setMobileView}>
          <TabsList className="mb-3 grid w-full grid-cols-2">
            <TabsTrigger value={MOBILE_VIEW_AGENDA}>Danh sách</TabsTrigger>
            <TabsTrigger value={MOBILE_VIEW_CALENDAR}>Lịch tháng</TabsTrigger>
          </TabsList>
          <TabsContent value={MOBILE_VIEW_AGENDA}>{renderAgendaContent()}</TabsContent>
          <TabsContent value={MOBILE_VIEW_CALENDAR}>{renderCalendarContent()}</TabsContent>
        </Tabs>
      </div>

      <div className="hidden gap-6 xl:grid xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)]">
        {renderCalendarContent()}
        {renderAgendaContent()}
      </div>
    </div>
  );
}
