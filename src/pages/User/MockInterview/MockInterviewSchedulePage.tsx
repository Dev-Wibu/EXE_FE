import { Calendar, Check, ChevronLeft, ChevronRight, Clock, Timer, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { mockMentors, mockUnavailableDates } from "@/mocks/mentors.mock";

export function MockInterviewSchedulePage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 8, 1)); // September 2025
  const [selectedDate, setSelectedDate] = useState<number | null>(12);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const mentor = mockMentors[0]; // Using first mentor for demo

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    // Returns 0-6 where 0 = Sunday, matching weekDays array order
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
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

  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    if (!mockUnavailableDates.includes(day)) {
      setSelectedDate(day);
    }
  };

  const handleSubmit = () => {
    if (selectedDate) {
      navigate("/dashboard/mock-interview/confirm");
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-20" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isUnavailable = mockUnavailableDates.includes(day);
      const isSelected = selectedDate === day;
      // Day 18 is disabled based on mock design
      const isDisabled = day === 18;

      let className =
        "flex h-10 w-20 items-center justify-center rounded-[28px] cursor-pointer transition-colors";

      if (isUnavailable) {
        className +=
          " bg-rose-400 shadow-[0px_0px_0px_3px_rgba(255,204,204,1.00)] text-white cursor-not-allowed";
      } else if (isSelected) {
        className += " bg-indigo-100 outline outline-2 outline-offset-[-2px] outline-indigo-500";
      } else if (isDisabled) {
        className += " bg-stone-50 text-stone-300 cursor-not-allowed";
      } else {
        className += " hover:bg-gray-100";
      }

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isUnavailable || isDisabled}
          className={className}>
          <span
            className={`font-['Inter'] text-base font-medium ${
              isUnavailable ? "text-white" : isDisabled ? "text-stone-300" : "text-zinc-800"
            }`}>
            {day}
          </span>
        </button>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* Progress Stepper */}
      <div className="relative mx-auto mt-10 flex w-full max-w-4xl items-center justify-center">
        {/* Step 1: Chọn mentor - Completed */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-16 w-16 text-white" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Chọn mentor
          </span>
        </div>

        {/* Line 1 */}
        <div className="mx-4 h-0.5 w-40 bg-blue-800/50" />

        {/* Step 2: Lên lịch - Active */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-600">
            <Calendar className="h-16 w-16 text-white" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Lên lịch
          </span>
        </div>

        {/* Line 2 */}
        <div className="mx-4 h-0.5 w-40 bg-blue-800/50" />

        {/* Step 3: Xác nhận - Inactive */}
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-28 items-center justify-center rounded-full bg-neutral-200">
            <div className="h-20 w-20 rounded-full bg-neutral-300" />
          </div>
          <span className="mt-4 font-['Markazi_Text'] text-3xl leading-5 font-normal text-black">
            Xác nhận
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto mt-16 flex max-w-5xl gap-8 px-6">
        {/* Left Column */}
        <div className="flex-1">
          {/* Mentor Info Card */}
          <div className="h-24 w-full rounded-lg bg-indigo-100 p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-stone-300">
                <User className="h-6 w-6 text-stone-600" />
              </div>
              <div>
                <h3 className="font-['Inter'] text-lg font-bold text-zinc-800">{mentor.name}</h3>
                <p className="font-['Inter'] text-sm font-normal text-stone-500">
                  {mentor.company} - {mentor.position}
                </p>
                <div className="mt-2 flex gap-2">
                  {mentor.skills.map((skill, index) => {
                    const colors = [
                      { bg: "bg-rose-100", text: "text-pink-600" },
                      { bg: "bg-sky-100", text: "text-sky-500" },
                      { bg: "bg-green-100", text: "text-green-500" },
                    ];
                    const color = colors[index % colors.length];
                    return (
                      <span
                        key={skill}
                        className={`${color.bg} rounded-xl px-2 py-0.5 font-['Inter'] text-xs font-bold ${color.text}`}>
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Card */}
          <div className="mt-4 rounded-[10px] bg-white p-6 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)]">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h3 className="font-['Inter'] text-lg font-bold text-zinc-800">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={handleNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Week Days Header */}
            <div className="mt-6 grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center font-['Inter'] text-sm font-bold text-indigo-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="mt-4 grid grid-cols-7 gap-2">{renderCalendar()}</div>
          </div>

          {/* Time Selection */}
          <div className="mt-6">
            <h3 className="font-['Inter'] text-3xl font-bold text-zinc-800">Chọn giờ</h3>
            <div className="mt-4 flex h-16 w-full items-center justify-center rounded-lg bg-white">
              <Clock className="h-8 w-8 text-indigo-500" />
              <span className="ml-4 font-['Inter'] text-xl font-medium text-stone-500">
                {selectedDate ? "Chọn giờ phỏng vấn" : "Vui lòng chọn ngày trước"}
              </span>
            </div>
            {selectedDate && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`h-10 rounded-lg ${
                      selectedTime === time
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } font-['Inter'] text-sm font-medium`}>
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary Card */}
        <div className="w-96 rounded-[10px] bg-white p-5 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)]">
          <div className="border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-4">
              <span className="text-xl text-indigo-500">📅</span>
              <span className="font-['Inter'] text-xl font-medium text-zinc-800">
                {selectedDate ? `${selectedDate}/09/2025` : "--/--/----"}
              </span>
            </div>
          </div>

          <div className="border-b border-zinc-100 py-4">
            <div className="flex items-center gap-4">
              <span className="text-xl text-indigo-500">🕒</span>
              <span className="font-['Inter'] text-xl font-medium text-zinc-800">
                {selectedTime || "--:--"}
              </span>
            </div>
          </div>

          <div className="border-b border-zinc-100 py-4">
            <div className="flex items-center gap-4">
              <Timer className="h-5 w-5 text-indigo-500" />
              <span className="font-['Inter'] text-xl font-medium text-zinc-800">90 phút</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t-2 border-neutral-200 pt-4">
            <span className="font-['Inter'] text-lg font-medium text-zinc-800">TỔNG:</span>
            <span className="font-['Inter'] text-xl font-bold text-indigo-500">
              {formatCurrency(440000)}
            </span>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedTime}
              className="flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-500 shadow-[0px_4px_10px_0px_rgba(93,93,219,0.40)] hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300">
              <span className="text-2xl text-white">↗</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
