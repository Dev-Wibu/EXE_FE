import { BookOpen, ChevronLeft, ChevronRight, Clock, Target, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserSessions } from "@/hooks/useSession";
import type { Session } from "@/interfaces";

// Calendar utility functions
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const getMonthName = (month: number): string => {
  const months = [
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
  return months[month];
};

/** Consistent status config used across the app (same colors as SessionHistoryPage & MentorSessionsPage) */
const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: {
    label: "Chờ duyệt",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  SCHEDULED: {
    label: "Sắp diễn ra",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  ONGOING: {
    label: "Đang diễn ra",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
  },
  COMPLETED: {
    label: "Hoàn thành",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-500",
  },
  REJECTED: {
    label: "Bị từ chối",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  CANCELED: {
    label: "Đã hủy",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

const defaultStatusConfig = statusConfig.SCHEDULED;

/** Max visible session dots per calendar cell before showing "+N" */
const MAX_VISIBLE_DOTS = 3;

function formatTime(dateStr?: string): string {
  if (!dateStr) return "--:--";
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A single session entry shown in the popover or inline */
function SessionEntry({ session, onClick }: { session: Session; onClick: () => void }) {
  const cfg = statusConfig[session.status || "SCHEDULED"] || defaultStatusConfig;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
      <span className="text-muted-foreground shrink-0">
        {formatTime(session.joinTime || session.startTime1)}
      </span>
      <span className="text-foreground flex-1 truncate font-medium">
        {session.roomName || `Phiên #${session.id}`}
      </span>
      <Badge
        className={`${cfg.bg} ${cfg.text} shrink-0 border-0 px-1.5 py-0 text-[10px] leading-4 hover:${cfg.bg}`}>
        {cfg.label}
      </Badge>
    </button>
  );
}

export function OverviewPage() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useUserSessions();

  // Group sessions by date key (YYYY-MM-DD) from joinTime
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
      const raw = s.joinTime || s.startTime1;
      if (!raw) continue;
      const key = toDateKey(raw);
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    // Sort each day's sessions by time
    for (const [, arr] of map) {
      arr.sort((a, b) => {
        const tA = new Date(a.joinTime || a.startTime1 || "").getTime();
        const tB = new Date(b.joinTime || b.startTime1 || "").getTime();
        return tA - tB;
      });
    }
    return map;
  }, [sessions]);

  // Compute dashboard stats from actual sessions
  const totalInterviews = sessions.length;
  const completedInterviews = sessions.filter((s) => s.status === "COMPLETED").length;

  // Initialize with current date
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  while (calendarDays.length < 35) {
    calendarDays.push(null);
  }

  // Group into weeks
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const navigateToSession = (sessionId?: number) => {
    if (sessionId) {
      navigate(`/dashboard/mock-interview/history/${sessionId}`);
    } else {
      navigate(`/dashboard/mock-interview/history`);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      {/* Top Stats Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Today's Plan Card */}
        <Card className="col-span-1 overflow-hidden border-0 bg-gradient-to-br from-[#007BFF] to-[#0047AB] md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-white" />
              <CardTitle className="text-xl text-white">Kế hoạch của hôm nay</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-base text-white/90">
              {sessions.filter((s) => s.status === "SCHEDULED" || s.status === "ONGOING").length > 0
                ? "Bạn có phiên phỏng vấn sắp tới, hãy chuẩn bị nhé!"
                : "Sẵn sàng để trang bị cho hành trình mới"}
            </CardDescription>
            <Button variant="secondary" className="mt-2">
              Thực hành ngay
            </Button>
          </CardContent>
        </Card>

        {/* Questions Card */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#66B2FF] to-[#005B9A]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-white" />
              <CardTitle className="text-xl text-white">Câu hỏi đã làm</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <CardDescription className="text-white/80">Số câu hỏi đã hoàn thành</CardDescription>
            <span className="text-6xl font-bold text-white">0</span>
          </CardContent>
        </Card>

        {/* Interviews Card */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-400 to-emerald-600">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Video className="h-6 w-6 text-white" />
              <CardTitle className="text-xl text-white">Buổi phỏng vấn</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <CardDescription className="text-white/80">
              Hoàn thành: {completedInterviews} / {totalInterviews}
            </CardDescription>
            <span className="text-6xl font-bold text-white">{totalInterviews}</span>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Section */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-2xl font-bold uppercase">
              {getMonthName(currentMonth)} {currentYear}
            </CardTitle>
            <CardDescription>Lịch hoạt động của bạn</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="hidden flex-wrap items-center gap-3 text-xs lg:flex">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="text-muted-foreground">{cfg.label}</span>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                aria-label="Tháng trước">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Tháng sau">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 border-b pb-2">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="text-muted-foreground text-center text-sm font-medium uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="mt-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return (
                      <div
                        key={dayIndex}
                        className="border-border min-h-[100px] rounded-lg border p-2 opacity-30"
                      />
                    );
                  }

                  const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const daySessions = sessionsByDate.get(dateKey) || [];
                  const isToday = dateKey === todayStr;
                  const hasEvents = daySessions.length > 0;
                  const visibleSessions = daySessions.slice(0, MAX_VISIBLE_DOTS);
                  const overflowCount = daySessions.length - MAX_VISIBLE_DOTS;

                  return (
                    <div
                      key={dayIndex}
                      className={`border-border relative min-h-[100px] rounded-lg border p-2 transition-colors ${
                        isToday
                          ? "border-blue-400 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/20"
                          : hasEvents
                            ? "hover:bg-muted/50"
                            : "hover:bg-muted/30"
                      }`}>
                      {/* Day number */}
                      <div
                        className={`mb-1 text-sm font-medium ${
                          isToday
                            ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white"
                            : "text-muted-foreground"
                        }`}>
                        {String(day).padStart(2, "0")}
                      </div>

                      {/* Session dots & inline entries */}
                      {hasEvents && (
                        <div className="flex flex-col gap-0.5">
                          {visibleSessions.map((s) => {
                            const cfg =
                              statusConfig[s.status || "SCHEDULED"] || defaultStatusConfig;
                            return (
                              <button
                                key={s.id}
                                onClick={() => navigateToSession(s.id)}
                                className={`flex items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:opacity-80 ${cfg.bg}`}
                                title={`${formatTime(s.joinTime || s.startTime1)} — ${s.roomName || `Phiên #${s.id}`} (${cfg.label})`}>
                                <Clock className={`h-2.5 w-2.5 shrink-0 ${cfg.text}`} />
                                <span className={`truncate text-[10px] font-medium ${cfg.text}`}>
                                  {formatTime(s.joinTime || s.startTime1)}
                                </span>
                              </button>
                            );
                          })}

                          {/* Overflow: show "+N more" with Popover */}
                          {overflowCount > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground mt-0.5 text-center text-[10px] font-medium transition-colors">
                                  +{overflowCount} phiên khác
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-72 p-2"
                                side="right"
                                align="start"
                                sideOffset={8}>
                                <p className="mb-2 text-xs font-semibold">
                                  {String(day).padStart(2, "0")}/
                                  {String(currentMonth + 1).padStart(2, "0")}/{currentYear} —{" "}
                                  {daySessions.length} phiên
                                </p>
                                <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                                  {daySessions.map((s) => (
                                    <SessionEntry
                                      key={s.id}
                                      session={s}
                                      onClick={() => navigateToSession(s.id)}
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
    </div>
  );
}
