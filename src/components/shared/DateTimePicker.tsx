"use client";

import {
  addDays,
  addHours,
  addMinutes,
  format,
  isAfter,
  isBefore,
  parse,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import { enUS, ja, vi } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import i18n from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Types
export type ThemeVariant = "user" | "mentor" | "admin" | "default";

export interface DateTimePickerProps {
  value: Date | null | undefined;
  onChange: (_date: Date | null) => void;
  placeholder?: string;
  showTime?: boolean;
  hour12?: boolean; // Kept in interface for backward compatibility, but ignored
  minuteStep?: number;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: (_date: Date) => boolean;
  className?: string;
  popoverClassName?: string;
  clearable?: boolean;
  themeVariant?: ThemeVariant;
}

// Map roles to Tailwind accent styles
const THEME_ACCENTS = {
  user: {
    activeBg: "bg-[#007BFF] text-white hover:bg-[#0056b3]",
    hoverBg: "hover:bg-[#F0F8FF] hover:text-[#007BFF] dark:hover:bg-blue-950/30",
    text: "text-[#007BFF]",
    border: "border-slate-300 dark:border-slate-800 focus-within:ring-[#007BFF]",
    focusRing: "focus-within:ring-2 focus-within:ring-[#007BFF]",
    todayBorder: "border-[#007BFF] text-[#007BFF]",
  },
  mentor: {
    activeBg: "bg-emerald-600 text-white hover:bg-emerald-700",
    hoverBg: "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30",
    text: "text-emerald-600",
    border: "border-slate-300 dark:border-slate-800 focus-within:ring-emerald-500",
    focusRing: "focus-within:ring-2 focus-within:ring-emerald-500",
    todayBorder: "border-emerald-600 text-emerald-600",
  },
  admin: {
    activeBg: "bg-indigo-600 text-white hover:bg-indigo-700",
    hoverBg: "hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30",
    text: "text-indigo-600",
    border: "border-slate-300 dark:border-slate-800 focus-within:ring-indigo-500",
    focusRing: "focus-within:ring-2 focus-within:ring-indigo-500",
    todayBorder: "border-indigo-600 text-indigo-600",
  },
  default: {
    activeBg: "bg-[#0047AB] text-white hover:bg-[#003380]",
    hoverBg: "hover:bg-blue-50 hover:text-[#0047AB] dark:hover:bg-slate-800",
    text: "text-[#0047AB]",
    border: "border-slate-300 dark:border-slate-800 focus-within:ring-[#0047AB]",
    focusRing: "focus-within:ring-2 focus-within:ring-[#0047AB]",
    todayBorder: "border-[#0047AB] text-[#0047AB]",
  },
};

export function DateTimePicker({
  value,
  onChange,
  showTime = true,
  minuteStep = 1,
  minDate,
  maxDate,
  disabledDates,
  className,
  popoverClassName,
  clearable = true,
  themeVariant = "default",
}: DateTimePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"days" | "months-years">("days");

  // Active theme classes
  const theme = THEME_ACCENTS[themeVariant] || THEME_ACCENTS.default;

  // Active locale for date-fns
  const currentLang = i18n.language || "vi";
  const dateLocale = React.useMemo(() => {
    if (currentLang === "en") return enUS;
    if (currentLang === "ja") return ja;
    return vi;
  }, [currentLang]);

  // First day of week (Monday for vi, Sunday for en/ja)
  const weekStartsOn = currentLang === "vi" ? 1 : 0;

  // Display and parse format (strictly 24-hour)
  const displayFormat = showTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy";
  const displayPlaceholder = showTime ? "dd/mm/yyyy --:--" : "dd/mm/yyyy";

  // Keyboard manual typing inputs states
  const [inputValue, setInputValue] = React.useState(() => {
    if (value) {
      return format(value, displayFormat, { locale: dateLocale });
    }
    return displayPlaceholder;
  });
  const [hasInputError, setHasInputError] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  // Keep track of the month/year currently displayed in the calendar
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => value || new Date());

  // Refs for scroll alignment
  const hourScrollRef = React.useRef<HTMLDivElement>(null);
  const minuteScrollRef = React.useRef<HTMLDivElement>(null);
  const yearScrollRef = React.useRef<HTMLDivElement>(null);

  // Input and cursor tracking refs for synchronous cursor positioning
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const cursorRef = React.useRef<number | null>(null);
  const lastSelectionRef = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  React.useLayoutEffect(() => {
    if (inputRef.current && cursorRef.current !== null) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  });

  const updateLastSelection = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    lastSelectionRef.current = {
      start: target.selectionStart ?? 0,
      end: target.selectionEnd ?? 0,
    };
  };

  // Sync current month when value changes externally
  React.useEffect(() => {
    if (value) {
      setCurrentMonth(value);
    }
  }, [value]);

  // Sync input text state with selected date value (if not currently focused)
  React.useEffect(() => {
    if (!isFocused) {
      if (value) {
        setInputValue(format(value, displayFormat, { locale: dateLocale }));
        setHasInputError(false);
      } else {
        setInputValue(displayPlaceholder);
        setHasInputError(false);
      }
    }
  }, [value, displayFormat, dateLocale, isFocused, displayPlaceholder]);

  // Centering active year inside scroll list when view mode changes
  React.useEffect(() => {
    if (viewMode === "months-years") {
      const timer = setTimeout(() => {
        if (yearScrollRef.current) {
          const activeEl = yearScrollRef.current.querySelector(
            '[data-active="true"]'
          ) as HTMLElement;
          if (activeEl) {
            yearScrollRef.current.scrollTop =
              activeEl.offsetTop -
              yearScrollRef.current.offsetHeight / 2 +
              activeEl.offsetHeight / 2;
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [viewMode, currentMonth]);

  // Localized Month names
  const localizedMonths = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2026, i, 1);
      if (currentLang === "vi") {
        return t("common.monthNum", { num: i + 1 });
      }
      return format(date, "MMMM", { locale: dateLocale });
    });
  }, [currentLang, dateLocale, t]);

  // Generation of 24 hours
  const hours = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  }, []);

  // Generation of available minutes based on step
  const minutes = React.useMemo(() => {
    const steps: string[] = [];
    for (let i = 0; i < 60; i += minuteStep) {
      steps.push(String(i).padStart(2, "0"));
    }
    return steps;
  }, [minuteStep]);

  // Parse time parts from current value or fallback
  const timeParts = React.useMemo(() => {
    const defaultDate = value || new Date();
    const rawHour = defaultDate.getHours();
    const rawMinute = defaultDate.getMinutes();

    // Find closest minute step
    const minStepVal = Math.round(rawMinute / minuteStep) * minuteStep;
    const finalMinute = minStepVal >= 60 ? 59 : minStepVal;

    return {
      hour: String(rawHour).padStart(2, "0"),
      minute: String(finalMinute).padStart(2, "0"),
      rawHour,
      rawMinute: finalMinute,
    };
  }, [value, minuteStep]);

  // Filtered presets based on showTime
  const activePresets = React.useMemo(() => {
    const allPresets = [
      { id: "plus-15m", labelKey: "plus15Mins", fallback: "+15 Phút", isTime: true },
      { id: "plus-30m", labelKey: "plus30Mins", fallback: "+30 Phút", isTime: true },
      { id: "plus-1h", labelKey: "plus1Hour", fallback: "+1 Giờ", isTime: true },
      { id: "plus-2h", labelKey: "plus2Hours", fallback: "+2 Giờ", isTime: true },
      { id: "today", labelKey: "today", fallback: "Hôm nay", isTime: false },
      { id: "tomorrow", labelKey: "tomorrow", fallback: "Ngày mai", isTime: false },
      { id: "this-weekend", labelKey: "thisWeekend", fallback: "Cuối tuần này", isTime: false },
      { id: "next-week", labelKey: "nextWeek", fallback: "Đầu tuần sau", isTime: false },
      { id: "next-month", labelKey: "nextMonthStart", fallback: "Đầu tháng sau", isTime: false },
    ] as const;

    return allPresets.filter((p) => showTime || !p.isTime);
  }, [showTime]);

  // Perform smooth alignment of active scroll items
  const centerActiveTimeItem = (container: HTMLDivElement | null, activeValue: string) => {
    if (!container) return;
    const activeEl = container.querySelector(`[data-value="${activeValue}"]`) as HTMLElement;
    if (activeEl) {
      container.scrollTop =
        activeEl.offsetTop - container.offsetHeight / 2 + activeEl.offsetHeight / 2;
    }
  };

  // Center active items when popover opens, value changes, or viewMode changes
  React.useEffect(() => {
    if (open && showTime && viewMode === "days") {
      const timer = setTimeout(() => {
        centerActiveTimeItem(hourScrollRef.current, timeParts.hour);
        centerActiveTimeItem(minuteScrollRef.current, timeParts.minute);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, showTime, timeParts.hour, timeParts.minute, viewMode]);

  // Handlers for selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    let newDate = date;
    if (showTime) {
      let hourVal = timeParts.rawHour;
      if (!value) {
        const now = new Date();
        hourVal = now.getHours();
        newDate = setMinutes(newDate, timeParts.rawMinute);
      } else {
        newDate = setMinutes(newDate, value.getMinutes());
      }
      newDate = setHours(newDate, hourVal);
    }

    if (minDate && isBefore(newDate, startOfDay(minDate))) return;
    if (maxDate && isAfter(newDate, maxDate)) return;
    if (disabledDates && disabledDates(newDate)) return;

    onChange(newDate);
  };

  const handleTimeSelect = (type: "hour" | "minute", val: string) => {
    const baseDate = value ? new Date(value) : new Date();
    let nextDate = new Date(baseDate);

    if (type === "hour") {
      const hNum = Number.parseInt(val, 10);
      nextDate = setHours(nextDate, hNum);
    } else if (type === "minute") {
      const mNum = Number.parseInt(val, 10);
      nextDate = setMinutes(nextDate, mNum);
    }

    onChange(nextDate);
  };

  // Masking utility functions
  const isSeparator = (idx: number) => {
    const char = displayPlaceholder[idx];
    return char === "/" || char === ":" || char === " ";
  };

  const clampDayForMonth = (chars: string[]): void => {
    if (/\d/.test(chars[0]) && /\d/.test(chars[1]) && /\d/.test(chars[3]) && /\d/.test(chars[4])) {
      const dayVal = Number(chars[0] + chars[1]);
      const monthVal = Number(chars[3] + chars[4]);

      let yearVal = 2024;
      if (
        /\d/.test(chars[6]) &&
        /\d/.test(chars[7]) &&
        /\d/.test(chars[8]) &&
        /\d/.test(chars[9])
      ) {
        yearVal = Number(chars.slice(6, 10).join(""));
      }

      let maxDays = 31;
      if (monthVal === 2) {
        const isLeap = (yearVal % 4 === 0 && yearVal % 100 !== 0) || yearVal % 400 === 0;
        maxDays = isLeap ? 29 : 28;
      } else if ([4, 6, 9, 11].includes(monthVal)) {
        maxDays = 30;
      }

      if (dayVal > maxDays) {
        const formattedDay = String(maxDays).padStart(2, "0");
        chars[0] = formattedDay[0];
        chars[1] = formattedDay[1];
      }
    }
  };

  const autoCorrectAllSegments = (text: string): string => {
    const chars = text.split("");

    if (/\d/.test(chars[0]) && /\d/.test(chars[1])) {
      let dayVal = Number(chars[0] + chars[1]);
      if (dayVal === 0) dayVal = 1;
      else if (dayVal > 31) dayVal = 31;
      const formatted = String(dayVal).padStart(2, "0");
      chars[0] = formatted[0];
      chars[1] = formatted[1];
    }

    if (/\d/.test(chars[3]) && /\d/.test(chars[4])) {
      let monthVal = Number(chars[3] + chars[4]);
      if (monthVal === 0) monthVal = 1;
      else if (monthVal > 12) monthVal = 12;
      const formatted = String(monthVal).padStart(2, "0");
      chars[3] = formatted[0];
      chars[4] = formatted[1];
    }

    if (/\d/.test(chars[6]) && /\d/.test(chars[7]) && /\d/.test(chars[8]) && /\d/.test(chars[9])) {
      const currentYear = new Date().getFullYear();
      let yearVal = Number(chars.slice(6, 10).join(""));
      const minYear = currentYear - 100;
      const maxYear = currentYear + 100;

      if (yearVal > maxYear) {
        yearVal = maxYear;
      } else if (yearVal < minYear) {
        yearVal = minYear;
      }

      const formatted = String(yearVal);
      chars[6] = formatted[0];
      chars[7] = formatted[1];
      chars[8] = formatted[2];
      chars[9] = formatted[3];
    }

    clampDayForMonth(chars);

    if (showTime && /\d/.test(chars[11]) && /\d/.test(chars[12])) {
      let hourVal = Number(chars[11] + chars[12]);
      if (hourVal > 23) hourVal = 23;
      const formatted = String(hourVal).padStart(2, "0");
      chars[11] = formatted[0];
      chars[12] = formatted[1];
    }

    if (showTime && /\d/.test(chars[14]) && /\d/.test(chars[15])) {
      let minVal = Number(chars[14] + chars[15]);
      if (minVal > 59) minVal = 59;
      const formatted = String(minVal).padStart(2, "0");
      chars[14] = formatted[0];
      chars[15] = formatted[1];
    }

    return chars.join("");
  };

  const syncParsedDate = (text: string) => {
    if (text === displayPlaceholder) {
      setHasInputError(false);
      onChange(null);
      return;
    }

    const hasPlaceholder =
      text.includes("d") || text.includes("m") || text.includes("y") || text.includes("-");

    if (hasPlaceholder) {
      setHasInputError(true);
      return;
    }

    const parsedDate = parse(text, displayFormat, new Date(), { locale: dateLocale });
    const currentYear = new Date().getFullYear();
    const isYearValid =
      parsedDate.getFullYear() >= currentYear - 100 &&
      parsedDate.getFullYear() <= currentYear + 100;

    if (!isNaN(parsedDate.getTime()) && isYearValid) {
      const dayVal = Number(text.slice(0, 2));
      const monthVal = Number(text.slice(3, 5)) - 1;
      const yearVal = Number(text.slice(6, 10));

      if (
        parsedDate.getDate() !== dayVal ||
        parsedDate.getMonth() !== monthVal ||
        parsedDate.getFullYear() !== yearVal
      ) {
        setHasInputError(true);
      } else {
        if (
          (minDate && isBefore(parsedDate, startOfDay(minDate))) ||
          (maxDate && isAfter(parsedDate, maxDate)) ||
          (disabledDates && disabledDates(parsedDate))
        ) {
          setHasInputError(true);
        } else {
          setHasInputError(false);
          onChange(parsedDate);
          setCurrentMonth(parsedDate);
        }
      }
    } else {
      setHasInputError(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const target = e.target;
    const selectionStart = target.selectionStart ?? 0;

    // Get previous selection range
    let selStart = lastSelectionRef.current.start;
    let selEnd = lastSelectionRef.current.end;
    let selLen = selEnd - selStart;

    // Detect programmatic changes (like fireEvent.change or autofill)
    // In a real browser, a single user keystroke changes the length by exactly 1.
    // If length change is not 1 and there was no selection, it is programmatic.
    const lengthDiff = Math.abs(newVal.length - inputValue.length);
    if (selLen === 0 && lengthDiff !== 1) {
      selStart = 0;
      selEnd = inputValue.length;
      selLen = inputValue.length;
    }

    let updatedText = inputValue;
    let newCursorPos = selectionStart;

    // Calculate inserted text and length
    const insertedLen = newVal.length - (inputValue.length - selLen);

    if (insertedLen > 0) {
      // Something was inserted/typed/pasted
      const insertedStr = newVal.slice(selStart, selStart + insertedLen);
      const digits = insertedStr.replace(/\D/g, "");

      const chars = inputValue.split("");

      // 1. Reset the deleted selection range first
      for (let k = selStart; k < selEnd; k++) {
        if (k < displayPlaceholder.length && !isSeparator(k)) {
          chars[k] = displayPlaceholder[k];
        }
      }

      // 2. Write the digits
      let writeIdx = selStart;
      for (let i = 0; i < digits.length; i++) {
        while (writeIdx < displayPlaceholder.length && isSeparator(writeIdx)) {
          writeIdx++;
        }
        if (writeIdx < displayPlaceholder.length) {
          chars[writeIdx] = digits[i];
          writeIdx++;
        }
      }

      updatedText = chars.join("");
      updatedText = autoCorrectAllSegments(updatedText);

      newCursorPos = writeIdx;
      while (newCursorPos < displayPlaceholder.length && isSeparator(newCursorPos)) {
        newCursorPos++;
      }
    } else {
      // Pure deletion (Backspace or Delete)
      const chars = inputValue.split("");
      for (let k = selStart; k < selEnd; k++) {
        if (k < displayPlaceholder.length && !isSeparator(k)) {
          chars[k] = displayPlaceholder[k];
        }
      }

      // If it was a backspace without a selection, it deletes 1 char before the cursor
      if (selLen === 0) {
        const deletedLen = inputValue.length - newVal.length;
        const deletedStart = selectionStart; // The new cursor pos after backspace
        for (let i = 0; i < deletedLen; i++) {
          const idx = deletedStart + i;
          if (idx < displayPlaceholder.length && !isSeparator(idx)) {
            chars[idx] = displayPlaceholder[idx];
          }
        }
        newCursorPos = deletedStart;
      } else {
        newCursorPos = selStart;
      }

      updatedText = chars.join("");
      updatedText = autoCorrectAllSegments(updatedText);
    }

    setInputValue(updatedText);
    syncParsedDate(updatedText);

    // Save the new cursor position to our ref so the layout effect can apply it synchronously
    cursorRef.current = newCursorPos;
    lastSelectionRef.current = { start: newCursorPos, end: newCursorPos };
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (inputValue === displayPlaceholder) {
      setTimeout(() => {
        const activeEl = document.activeElement as HTMLInputElement;
        if (activeEl && typeof activeEl.setSelectionRange === "function") {
          activeEl.setSelectionRange(0, 0);
          lastSelectionRef.current = { start: 0, end: 0 };
        }
      }, 0);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (inputValue === displayPlaceholder) {
      const target = e.currentTarget;
      target.setSelectionRange(0, 0);
      lastSelectionRef.current = { start: 0, end: 0 };
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const digits = pastedText.replace(/\D/g, "");
    if (!digits) return;

    const target = e.currentTarget;
    const selStart = target.selectionStart ?? 0;
    const selEnd = target.selectionEnd ?? 0;

    const chars = inputValue.split("");

    // 1. Reset the selected range first
    for (let k = selStart; k < selEnd; k++) {
      if (k < displayPlaceholder.length && !isSeparator(k)) {
        chars[k] = displayPlaceholder[k];
      }
    }

    // 2. Paste the digits starting at selStart
    let start = selStart;
    for (let i = 0; i < digits.length; i++) {
      while (start < displayPlaceholder.length && isSeparator(start)) {
        start++;
      }
      if (start < displayPlaceholder.length) {
        chars[start] = digits[i];
        const corrected = autoCorrectAllSegments(chars.join(""));
        for (let j = 0; j < chars.length; j++) {
          chars[j] = corrected[j];
        }
        start++;
      } else {
        break;
      }
    }

    const newText = chars.join("");
    setInputValue(newText);
    syncParsedDate(newText);

    cursorRef.current = start;
    lastSelectionRef.current = { start: start, end: start };
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    if (inputValue === displayPlaceholder) {
      setHasInputError(false);
      onChange(null);
    } else {
      syncParsedDate(inputValue);
    }
  };

  // Preset Buttons actions
  const applyPreset = (
    presetType:
      | "plus-15m"
      | "plus-30m"
      | "plus-1h"
      | "plus-2h"
      | "today"
      | "tomorrow"
      | "this-weekend"
      | "next-week"
      | "next-month"
  ) => {
    const now = new Date();
    let nextVal = new Date(now);

    switch (presetType) {
      case "plus-15m":
        nextVal = addMinutes(now, 15);
        break;
      case "plus-30m":
        nextVal = addMinutes(now, 30);
        break;
      case "plus-1h":
        nextVal = addHours(now, 1);
        break;
      case "plus-2h":
        nextVal = addHours(now, 2);
        break;
      case "today":
        nextVal = now;
        break;
      case "tomorrow":
        nextVal = addDays(now, 1);
        break;
      case "this-weekend": {
        const daysToSaturday = (6 - now.getDay() + 7) % 7;
        const saturday = addDays(now, daysToSaturday);
        nextVal = startOfDay(saturday);
        nextVal = setHours(nextVal, 9);
        nextVal = setMinutes(nextVal, 0);
        break;
      }
      case "next-week": {
        const daysToMonday = (8 - now.getDay()) % 7 || 7;
        nextVal = startOfDay(addDays(now, daysToMonday));
        nextVal = setHours(nextVal, 9);
        nextVal = setMinutes(nextVal, 0);
        break;
      }
      case "next-month": {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        nextVal = startOfDay(nextMonth);
        nextVal = setHours(nextVal, 9);
        nextVal = setMinutes(nextVal, 0);
        break;
      }
    }

    // Ensure minutes step alignment
    const currentM = nextVal.getMinutes();
    const minStepVal = Math.round(currentM / minuteStep) * minuteStep;
    nextVal = setMinutes(nextVal, minStepVal >= 60 ? 59 : minStepVal);

    // Validate limits
    if (minDate && isBefore(nextVal, minDate)) return;
    if (maxDate && isAfter(nextVal, maxDate)) return;
    if (disabledDates && disabledDates(nextVal)) return;

    onChange(nextVal);
    setCurrentMonth(nextVal);
    setViewMode("days");
  };

  // Month-Year View navigation helpers
  const yearsList = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startY = currentYear - 100;
    const endY = currentYear + 100;
    return Array.from({ length: endY - startY + 1 }, (_, i) => startY + i);
  }, []);

  const handleMonthYearGridSelect = (monthIdx: number, yearVal: number) => {
    const nextMonth = new Date(yearVal, monthIdx, 1);
    setCurrentMonth(nextMonth);
    setViewMode("days");
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  };

  const clearDateValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setInputValue("");
    setHasInputError(false);
  };

  const translatePreset = (key: string, fallback: string) => {
    const tKey = `common.${key}`;
    const result = t(tKey);
    return result !== tKey ? result : fallback;
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-all focus-within:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
              theme.border,
              hasInputError &&
                "border-rose-500 focus-within:border-rose-500 focus-within:ring-rose-500"
            )}>
            <input
              ref={inputRef}
              type="text"
              className={cn(
                "w-full bg-transparent pr-2 transition-colors outline-none",
                inputValue === displayPlaceholder
                  ? "text-slate-400 dark:text-slate-600"
                  : "text-slate-900 dark:text-slate-100"
              )}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={updateLastSelection}
              onKeyUp={updateLastSelection}
              onFocus={(e) => {
                updateLastSelection(e);
                handleFocus();
              }}
              onBlur={handleInputBlur}
              onClick={(e) => {
                updateLastSelection(e);
                handleInputClick(e);
              }}
              onPaste={handlePaste}
              placeholder={displayPlaceholder}
            />
            <div className="flex items-center gap-1.5 pl-2">
              {clearable && value && (
                <button
                  type="button"
                  onClick={clearDateValue}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-900"
                  aria-label={t("common.clear", "Clear")}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-900"
                  aria-label={t("common.openCalendar", "Open calendar")}>
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </PopoverTrigger>
            </div>
          </div>
        </PopoverAnchor>

        <PopoverContent
          className={cn(
            "flex w-auto flex-row overflow-hidden rounded-xl border border-slate-200/80 bg-white p-0 shadow-lg dark:border-slate-800 dark:bg-slate-950",
            popoverClassName
          )}
          align="start"
          sideOffset={6}>
          {/* Preset shortcuts panel (horizontal grid on mobile/tablet, vertical sidebar on desktop) */}
          <div className="hidden w-full shrink-0 flex-col border-b border-slate-200/80 bg-slate-50/50 p-2.5 md:flex md:w-40 md:border-r md:border-b-0 dark:border-slate-800 dark:bg-slate-900/10">
            <p className="hidden px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase md:block">
              {t("common.shortcuts", "Presets")}
            </p>
            <div className="grid shrink-0 grid-cols-2 gap-1 md:flex md:flex-col md:gap-1.5">
              {activePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="shrink-0 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 md:w-full dark:text-slate-400 dark:hover:bg-slate-900/50"
                  onClick={() => applyPreset(preset.id)}>
                  {translatePreset(preset.labelKey, preset.fallback)}
                </button>
              ))}
            </div>
          </div>

          {/* Main date/time area */}
          <div className="flex flex-row">
            {/* Calendar panel */}
            <div className="flex flex-col border-b border-slate-200/80 p-3 md:border-b-0 dark:border-slate-800">
              {/* Custom Header */}
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1">
                  {viewMode === "months-years" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-600 dark:text-slate-400"
                      onClick={() => setViewMode("days")}
                      aria-label={t("common.back", "Back")}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                    )}
                    onClick={() => setViewMode(viewMode === "days" ? "months-years" : "days")}>
                    <span>
                      {currentLang === "vi"
                        ? `${localizedMonths[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
                        : `${format(currentMonth, "MMMM yyyy", { locale: dateLocale })}`}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-500 transition-transform",
                        viewMode === "months-years" && "rotate-180"
                      )}
                    />
                  </button>
                </div>
                {viewMode === "days" && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-slate-600 dark:text-slate-400"
                      onClick={handlePrevMonth}
                      aria-label={t("common.prevMonth", "Previous month")}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-slate-600 dark:text-slate-400"
                      onClick={handleNextMonth}
                      aria-label={t("common.nextMonth", "Next month")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* View layouts switcher */}
              {viewMode === "days" ? (
                <Calendar
                  mode="single"
                  selected={value || undefined}
                  onSelect={handleDateSelect}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  locale={dateLocale}
                  weekStartsOn={weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                  disabled={disabledDates}
                  classNames={{
                    nav: "hidden", // Hide native nav since we render custom header
                    month_caption: "hidden", // Hide native caption since we render custom header
                    weekdays:
                      "flex justify-between w-full border-b border-slate-100 pb-1.5 dark:border-slate-900",
                    weekday:
                      "text-slate-400 font-semibold text-[11px] text-center w-8 select-none capitalize",
                    day: "h-8 w-8 text-center text-sm p-0 relative focus-within:z-20",
                  }}
                  components={{
                    DayButton: ({ day, modifiers, className, ...props }) => {
                      const isSelected = modifiers.selected;
                      const isCurrToday = modifiers.today;
                      const isOut = modifiers.outside;
                      const isDis = modifiers.disabled;

                      return (
                        <button
                          type="button"
                          disabled={isDis}
                          className={cn(
                            "h-8 w-8 rounded-lg text-xs font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-900",
                            isSelected && theme.activeBg,
                            isCurrToday &&
                              !isSelected &&
                              cn("border font-semibold", theme.todayBorder),
                            isOut && "text-slate-300 dark:text-slate-700",
                            isDis &&
                              "cursor-not-allowed text-slate-200 line-through hover:bg-transparent dark:text-slate-800 dark:hover:bg-transparent",
                            className
                          )}
                          {...props}>
                          {day.date.getDate()}
                        </button>
                      );
                    },
                  }}
                />
              ) : (
                /* Month & Year Select grid */
                <div className="flex w-[252px] flex-col py-2">
                  <div className="flex h-[200px] gap-2">
                    {/* Months 3x4 grid */}
                    <div className="grid flex-1 grid-cols-3 gap-1">
                      {localizedMonths.map((mName, idx) => {
                        const isCurrent = currentMonth.getMonth() === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={cn(
                              "rounded-lg py-2 text-xs font-semibold transition-colors",
                              isCurrent
                                ? theme.activeBg
                                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                            )}
                            onClick={() =>
                              handleMonthYearGridSelect(idx, currentMonth.getFullYear())
                            }>
                            {currentLang === "vi"
                              ? `Thg ${idx + 1}`
                              : currentLang === "ja"
                                ? `${idx + 1}月`
                                : mName.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Years scroll list */}
                    <div className="relative w-16 border-l pl-2 dark:border-slate-800">
                      <div
                        ref={yearScrollRef}
                        className="scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 h-full overflow-y-auto scroll-smooth pr-1">
                        {yearsList.map((y) => {
                          const isCurrent = currentMonth.getFullYear() === y;
                          return (
                            <button
                              key={y}
                              type="button"
                              data-active={isCurrent ? "true" : "false"}
                              className={cn(
                                "my-0.5 w-full rounded-md py-1.5 text-center text-xs font-medium transition-colors",
                                isCurrent
                                  ? theme.activeBg
                                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                              )}
                              onClick={() => handleMonthYearGridSelect(currentMonth.getMonth(), y)}>
                              {y}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer buttons */}
              <div className="mt-2.5 flex items-center justify-between border-t pt-2.5 dark:border-slate-800">
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-500 hover:underline"
                  onClick={() => {
                    onChange(null);
                    setInputValue("");
                    setHasInputError(false);
                    setOpen(false);
                  }}>
                  {t("common.clear", "Xóa")}
                </button>
                <button
                  type="button"
                  className={cn("text-xs font-semibold hover:underline", theme.text)}
                  onClick={() => {
                    onChange(new Date());
                    setInputValue(format(new Date(), displayFormat, { locale: dateLocale }));
                    setHasInputError(false);
                    setOpen(false);
                  }}>
                  {t("common.today", "Hôm nay")}
                </button>
              </div>
            </div>

            {/* Time columns divider & columns panel (Strictly 24h) */}
            {showTime && viewMode === "days" && (
              <div className="flex border-l border-slate-200/80 dark:border-slate-800">
                <div className="flex p-3">
                  <div className="flex flex-col gap-1.5">
                    <p className="px-1.5 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {t("common.time", "Time")}
                    </p>
                    <div className="flex h-[230px] items-center gap-1 select-none">
                      {/* Hour wheel column */}
                      <div className="group/col relative">
                        <div
                          ref={hourScrollRef}
                          className="scrollbar-none h-[210px] w-12 snap-y snap-mandatory overflow-y-auto scroll-smooth py-[90px]">
                          {hours.map((hr) => {
                            const isSelected = timeParts.hour === hr;
                            return (
                              <button
                                key={hr}
                                type="button"
                                data-value={hr}
                                className={cn(
                                  "my-0.5 flex h-8 w-10 snap-center items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                                  isSelected
                                    ? theme.activeBg
                                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                                )}
                                onClick={() => handleTimeSelect("hour", hr)}>
                                {hr}
                              </button>
                            );
                          })}
                        </div>
                        {/* Wheel gradients */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/95 to-transparent dark:from-slate-950/95" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/95 to-transparent dark:from-slate-950/95" />
                      </div>

                      {/* Minutes wheel column */}
                      <div className="group/col relative">
                        <div
                          ref={minuteScrollRef}
                          className="scrollbar-none h-[210px] w-12 snap-y snap-mandatory overflow-y-auto scroll-smooth py-[90px]">
                          {minutes.map((mn) => {
                            const isSelected = timeParts.minute === mn;
                            return (
                              <button
                                key={mn}
                                type="button"
                                data-value={mn}
                                className={cn(
                                  "my-0.5 flex h-8 w-10 snap-center items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                                  isSelected
                                    ? theme.activeBg
                                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                                )}
                                onClick={() => handleTimeSelect("minute", mn)}>
                                {mn}
                              </button>
                            );
                          })}
                        </div>
                        {/* Wheel gradients */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/95 to-transparent dark:from-slate-950/95" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/95 to-transparent dark:from-slate-950/95" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {hasInputError && !open && (
        <div className="animate-in fade-in slide-in-from-top-1 absolute top-[calc(100%+6px)] left-0 z-50 w-full rounded-lg border border-slate-950 bg-slate-900 px-3.5 py-2.5 text-xs text-white shadow-lg dark:bg-slate-800">
          {translatePreset(
            "invalidDate",
            "Vui lòng nhập một giá trị hợp lệ. Trường không hoàn chỉnh hoặc có giá trị không hợp lệ."
          )}
        </div>
      )}
    </div>
  );
}
