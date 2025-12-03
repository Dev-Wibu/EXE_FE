import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month];
};

// Map color to Tailwind classes
const getEventColorClasses = (color: CalendarEvent["color"]): { bg: string; text: string } => {
  const colorMap: Record<CalendarEvent["color"], { bg: string; text: string }> = {
    green: { bg: "bg-green-600", text: "text-white" },
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

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

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
    <div className="min-h-screen bg-white">
      {/* Top Stats Section */}
      <div className="flex gap-6">
        {/* Today's Plan Card */}
        <div className="h-56 w-96 overflow-hidden rounded-[30px] bg-sky-100">
          <div className="p-7">
            <h2 className="font-['Open_Sans'] text-3xl leading-8 font-semibold text-blue-800">
              Kế hoạch của hôm nay
            </h2>
            <p className="mt-2 font-['Open_Sans'] text-base leading-5 font-normal text-black">
              {mockDashboardStats.todayPlan}
            </p>
          </div>
          <div className="mt-4 px-7">
            <button className="font-['Open_Sans'] text-2xl leading-5 font-semibold text-blue-800 hover:text-blue-900">
              Thực hành ngay
            </button>
          </div>
        </div>

        {/* Questions Card */}
        <div className="relative h-56 w-72 overflow-hidden rounded-[30px] bg-sky-100">
          <div className="p-7">
            <h2 className="font-['Open_Sans'] text-3xl leading-10 font-semibold text-blue-800">
              Câu hỏi{" "}
            </h2>
          </div>
          <div className="absolute right-7 bottom-10">
            <span className="font-['Open_Sans'] text-6xl leading-10 font-normal text-black">
              {mockDashboardStats.totalQuestions}
            </span>
          </div>
        </div>

        {/* Interviews Card */}
        <div className="relative h-56 w-72 overflow-hidden rounded-[30px] bg-sky-100">
          <div className="p-7">
            <h2 className="font-['Open_Sans'] text-3xl leading-10 font-semibold text-blue-800">
              Buổi phỏng vấn
            </h2>
          </div>
          <div className="absolute right-7 bottom-10">
            <span className="font-['Open_Sans'] text-6xl leading-10 font-normal text-black">
              {mockDashboardStats.totalInterviews}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="mt-8 bg-white px-12 py-12">
        {/* Calendar Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-['Inter'] text-4xl font-bold text-zinc-800 uppercase">
            {getMonthName(currentMonth)} {currentYear}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg p-2 hover:bg-gray-100"
              aria-label="Previous month">
              <ChevronLeft className="h-6 w-6 text-zinc-800" />
            </button>
            <button
              onClick={handleNextMonth}
              className="rounded-lg p-2 hover:bg-gray-100"
              aria-label="Next month">
              <ChevronRight className="h-6 w-6 text-zinc-800" />
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="flex overflow-hidden">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="h-6 w-40 font-['Inter'] text-sm font-medium text-zinc-800 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="mt-4 flex flex-col">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex overflow-hidden">
              {week.map((day, dayIndex) => {
                const { event, colorClasses } = getDayEventInfo(day);

                return (
                  <div
                    key={dayIndex}
                    className={`relative h-32 w-40 outline outline-1 outline-offset-[-0.5px] outline-neutral-200 ${
                      colorClasses ? colorClasses.bg : ""
                    }`}>
                    {day !== null && (
                      <>
                        <div
                          className={`absolute top-[10px] left-[8px] font-['Inter'] text-sm font-medium ${
                            colorClasses ? "text-white opacity-70" : "text-neutral-400"
                          }`}>
                          {String(day).padStart(2, "0")}
                        </div>
                        {event && (
                          <div className="absolute top-[42px] left-[11px] flex flex-col items-center gap-1.5 overflow-hidden">
                            <div className="w-36 truncate text-center font-['Inter'] text-sm font-bold text-white">
                              {event.title}
                            </div>
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
      </div>
    </div>
  );
}
