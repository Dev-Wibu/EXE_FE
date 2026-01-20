import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CalendarEvent } from "@/mocks/overview.mock";
import { mockCalendarEvents, mockDashboardStats } from "@/mocks/overview.mock";

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

// Map color to Tailwind classes
const getEventColorClasses = (color: CalendarEvent["color"]): { bg: string; text: string } => {
  const colorMap: Record<CalendarEvent["color"], { bg: string; text: string }> = {
    green: { bg: "bg-green-500", text: "text-white" },
    sky: { bg: "bg-sky-500", text: "text-white" },
    purple: { bg: "bg-purple-500", text: "text-white" },
    orange: { bg: "bg-orange-400", text: "text-white" },
    zinc: { bg: "bg-zinc-500", text: "text-white" },
  };
  return colorMap[color];
};

// Check if a date has an event
const getEventForDate = (
  year: number,
  month: number,
  day: number,
  events: CalendarEvent[]
): CalendarEvent | undefined => {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return events.find((event) => event.date === dateStr);
};

export function OverviewPage() {
  // Initialize with July 2025 to match the mock data events
  // This ensures the demo calendar shows events properly
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(6); // July (0-indexed)

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

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Fill remaining cells to complete the grid (up to 35 or 42 cells)
  while (calendarDays.length < 35) {
    calendarDays.push(null);
  }

  // Group into weeks
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Helper function to get event and color for a specific day
  const getDayEventInfo = (day: number | null) => {
    if (day === null) {
      return { event: undefined, colorClasses: null };
    }
    const event = getEventForDate(currentYear, currentMonth, day, mockCalendarEvents);
    const colorClasses = event ? getEventColorClasses(event.color) : null;
    return { event, colorClasses };
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
              {mockDashboardStats.todayPlan}
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
            <span className="text-6xl font-bold text-white">
              {mockDashboardStats.totalQuestions}
            </span>
          </CardContent>
        </Card>

        {/* Interviews Card */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-400 to-emerald-600">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-white" />
              <CardTitle className="text-xl text-white">Buổi phỏng vấn</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <CardDescription className="text-white/80">Tổng số buổi đã tham gia</CardDescription>
            <span className="text-6xl font-bold text-white">
              {mockDashboardStats.totalInterviews}
            </span>
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
              <ChevronRight className="h-5 w-5" />
            </Button>
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
                  const { event, colorClasses } = getDayEventInfo(day);

                  return (
                    <div
                      key={dayIndex}
                      className={`relative min-h-[100px] rounded-lg border p-2 transition-colors ${
                        colorClasses
                          ? `${colorClasses.bg} border-transparent`
                          : "border-border hover:bg-muted/50"
                      }`}>
                      {day !== null && (
                        <>
                          <div
                            className={`text-sm font-medium ${
                              colorClasses ? "text-white/70" : "text-muted-foreground"
                            }`}>
                            {String(day).padStart(2, "0")}
                          </div>
                          {event && (
                            <div className="mt-2 text-center">
                              <p className="line-clamp-2 text-xs font-semibold text-white">
                                {event.title}
                              </p>
                            </div>
                          )}
                        </>
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
