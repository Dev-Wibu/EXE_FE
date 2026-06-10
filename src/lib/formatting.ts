import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
export type DateInput = string | number | Date | null | undefined;
const EMPTY_PLACEHOLDER = "—";
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_OFFSET_HOURS = 7;
const ISO_WITH_OFFSET_PATTERN = /(?:[zZ]|[+-]\d{2}:\d{2})$/;
const ISO_ZULU_LOCAL_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?)Z$/;
const ISO_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/;
const US_12H_PATTERN =
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM))$/i;
const US_24H_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
const currentLocale = () => (i18n.language === "en" ? "en-US" : "vi-VN");
let _dateFormatter: Intl.DateTimeFormat | null = null;
let _dateFormatterLocale = "";
function getDateFormatter(): Intl.DateTimeFormat {
  const locale = currentLocale();
  if (!_dateFormatter || _dateFormatterLocale !== locale) {
    _dateFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: VIETNAM_TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    _dateFormatterLocale = locale;
  }
  return _dateFormatter;
}
let _dateTimeFormatter: Intl.DateTimeFormat | null = null;
let _dateTimeFormatterLocale = "";
function getDateTimeFormatter(): Intl.DateTimeFormat {
  const locale = currentLocale();
  if (!_dateTimeFormatter || _dateTimeFormatterLocale !== locale) {
    _dateTimeFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: VIETNAM_TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    _dateTimeFormatterLocale = locale;
  }
  return _dateTimeFormatter;
}
let _dateTimeSecFormatter: Intl.DateTimeFormat | null = null;
let _dateTimeSecFormatterLocale = "";
function getDateTimeSecFormatter(): Intl.DateTimeFormat {
  const locale = currentLocale();
  if (!_dateTimeSecFormatter || _dateTimeSecFormatterLocale !== locale) {
    _dateTimeSecFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: VIETNAM_TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    _dateTimeSecFormatterLocale = locale;
  }
  return _dateTimeSecFormatter;
}
let _timeFormatter: Intl.DateTimeFormat | null = null;
let _timeFormatterLocale = "";
function getTimeFormatter(): Intl.DateTimeFormat {
  const locale = currentLocale();
  if (!_timeFormatter || _timeFormatterLocale !== locale) {
    _timeFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: VIETNAM_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    _timeFormatterLocale = locale;
  }
  return _timeFormatter;
}
const toInt = (value: string | undefined, fallback = 0): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const toMilliseconds = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }
  const normalized = value.padEnd(3, "0").slice(0, 3);
  return toInt(normalized, 0);
};
const isValidDate = (value: Date): boolean => !Number.isNaN(value.getTime());
const buildDateFromVietnamLocal = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): Date => {
  return new Date(
    Date.UTC(year, month - 1, day, hour - VIETNAM_OFFSET_HOURS, minute, second, millisecond)
  );
};
const buildDateFromUtc = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): Date => {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
};
const tryParseIsoLocalAsVietnam = (value: string): Date | null => {
  const match = value.match(ISO_LOCAL_PATTERN);
  if (!match) {
    return null;
  }
  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw, millisecondRaw] = match;
  const parsed = buildDateFromVietnamLocal(
    toInt(yearRaw),
    toInt(monthRaw),
    toInt(dayRaw),
    toInt(hourRaw),
    toInt(minuteRaw),
    toInt(secondRaw),
    toMilliseconds(millisecondRaw)
  );
  return isValidDate(parsed) ? parsed : null;
};
const tryParseIsoLocalAsUtc = (value: string): Date | null => {
  const match = value.match(ISO_LOCAL_PATTERN);
  if (!match) {
    return null;
  }
  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw, millisecondRaw] = match;
  const parsed = buildDateFromUtc(
    toInt(yearRaw),
    toInt(monthRaw),
    toInt(dayRaw),
    toInt(hourRaw),
    toInt(minuteRaw),
    toInt(secondRaw),
    toMilliseconds(millisecondRaw)
  );
  return isValidDate(parsed) ? parsed : null;
};
const tryParseUs12hAsVietnam = (value: string): Date | null => {
  const match = value.match(US_12H_PATTERN);
  if (!match) {
    return null;
  }
  const [, monthRaw, dayRaw, yearRaw, hourRaw, minuteRaw, secondRaw, meridiemRaw] = match;
  const meridiem = meridiemRaw.toUpperCase();
  const baseHour = toInt(hourRaw);
  const hour = meridiem === "PM" ? (baseHour % 12) + 12 : baseHour % 12;
  const parsed = buildDateFromVietnamLocal(
    toInt(yearRaw),
    toInt(monthRaw),
    toInt(dayRaw),
    hour,
    toInt(minuteRaw),
    toInt(secondRaw)
  );
  return isValidDate(parsed) ? parsed : null;
};
const tryParseUs24hAsVietnam = (value: string): Date | null => {
  const match = value.match(US_24H_PATTERN);
  if (!match) {
    return null;
  }
  const [, monthRaw, dayRaw, yearRaw, hourRaw, minuteRaw, secondRaw] = match;
  const parsed = buildDateFromVietnamLocal(
    toInt(yearRaw),
    toInt(monthRaw),
    toInt(dayRaw),
    toInt(hourRaw),
    toInt(minuteRaw),
    toInt(secondRaw)
  );
  return isValidDate(parsed) ? parsed : null;
};
const getDatePart = (
  date: Date,
  formatter: Intl.DateTimeFormat,
  type: Intl.DateTimeFormatPartTypes
) => {
  return formatter.formatToParts(date).find((part) => part.type === type)?.value || "";
};
const parseDateString = (rawValue: string): Date | null => {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }
  if (ISO_WITH_OFFSET_PATTERN.test(value)) {
    const direct = new Date(value);
    if (isValidDate(direct)) {
      return direct;
    }
  }
  const isoLocal = tryParseIsoLocalAsVietnam(value);
  if (isoLocal) {
    return isoLocal;
  }
  const us12h = tryParseUs12hAsVietnam(value);
  if (us12h) {
    return us12h;
  }
  const us24h = tryParseUs24hAsVietnam(value);
  if (us24h) {
    return us24h;
  }
  const fallback = new Date(value);
  return isValidDate(fallback) ? fallback : null;
};
export function parseBackendDate(value: DateInput): Date | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return isValidDate(parsed) ? parsed : null;
  }
  if (typeof value === "string") {
    return parseDateString(value);
  }
  return null;
}
export function toTimestamp(value: DateInput): number | null {
  const parsed = parseBackendDate(value);
  return parsed ? parsed.getTime() : null;
}
export function parseUtcNaiveDate(value: DateInput): Date | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return isValidDate(parsed) ? parsed : null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }
  if (ISO_WITH_OFFSET_PATTERN.test(normalizedValue)) {
    const parsedWithOffset = new Date(normalizedValue);
    return isValidDate(parsedWithOffset) ? parsedWithOffset : null;
  }
  const parsedUtcNaive = tryParseIsoLocalAsUtc(normalizedValue);
  if (parsedUtcNaive) {
    return parsedUtcNaive;
  }
  const fallback = new Date(normalizedValue);
  return isValidDate(fallback) ? fallback : null;
}
export function toUtcNaiveTimestamp(value: DateInput): number | null {
  const parsed = parseUtcNaiveDate(value);
  return parsed ? parsed.getTime() : null;
}
export function treatZuluAsVietnamLocal(value: DateInput): DateInput {
  if (typeof value !== "string") {
    return value;
  }
  const match = value.match(ISO_ZULU_LOCAL_PATTERN);
  if (!match) {
    return value;
  }
  return match[1];
}
export function toVietnamDateKey(value: DateInput): string | null {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return null;
  }
  const year = getDatePart(parsed, getDateFormatter(), "year");
  const month = getDatePart(parsed, getDateFormatter(), "month");
  const day = getDatePart(parsed, getDateFormatter(), "day");
  if (!year || !month || !day) {
    return null;
  }
  return `${year}-${month}-${day}`;
}
export function formatDate(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const df = getDateFormatter();
  const day = getDatePart(parsed, df, "day");
  const month = getDatePart(parsed, df, "month");
  const year = getDatePart(parsed, df, "year");
  if (!day || !month || !year) {
    return fallback;
  }
  return currentLocale() === "en-US" ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}
export function formatDateTime(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const dtf = getDateTimeFormatter();
  const day = getDatePart(parsed, dtf, "day");
  const month = getDatePart(parsed, dtf, "month");
  const year = getDatePart(parsed, dtf, "year");
  const hour = getDatePart(parsed, dtf, "hour");
  const minute = getDatePart(parsed, dtf, "minute");
  if (!day || !month || !year || !hour || !minute) {
    return fallback;
  }
  const dateStr =
    currentLocale() === "en-US" ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
  return `${dateStr} ${hour}:${minute}`;
}
export function formatUtcNaiveDateTime(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseUtcNaiveDate(value);
  if (!parsed) {
    return fallback;
  }
  return formatDateTime(parsed, fallback);
}
export function formatDateTimeWithSeconds(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const dtf = getDateTimeSecFormatter();
  const day = getDatePart(parsed, dtf, "day");
  const month = getDatePart(parsed, dtf, "month");
  const year = getDatePart(parsed, dtf, "year");
  const hour = getDatePart(parsed, dtf, "hour");
  const minute = getDatePart(parsed, dtf, "minute");
  const second = getDatePart(parsed, dtf, "second");
  if (!day || !month || !year || !hour || !minute || !second) {
    return fallback;
  }
  const dateStr =
    currentLocale() === "en-US" ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
  return `${dateStr} ${hour}:${minute}:${second}`;
}
export function formatTime(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const hour = getDatePart(parsed, getTimeFormatter(), "hour");
  const minute = getDatePart(parsed, getTimeFormatter(), "minute");
  if (!hour || !minute) {
    return fallback;
  }
  return `${hour}:${minute}`;
}
export function formatUtcNaiveTime(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseUtcNaiveDate(value);
  if (!parsed) {
    return fallback;
  }
  return formatTime(parsed, fallback);
}
export function formatDayMonth(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const df = getDateFormatter();
  const day = getDatePart(parsed, df, "day");
  const month = getDatePart(parsed, df, "month");
  if (!day || !month) {
    return fallback;
  }
  return currentLocale() === "en-US" ? `${month}/${day}` : `${day}/${month}`;
}
export function formatTimeDayMonth(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const dtf = getDateTimeFormatter();
  const hour = getDatePart(parsed, dtf, "hour");
  const minute = getDatePart(parsed, dtf, "minute");
  const day = getDatePart(parsed, dtf, "day");
  const month = getDatePart(parsed, dtf, "month");
  if (!hour || !minute || !day || !month) {
    return fallback;
  }
  const dateStr = currentLocale() === "en-US" ? `${month}/${day}` : `${day}/${month}`;
  return `${hour}:${minute}, ${dateStr}`;
}
export function formatCurrency(amount: number): string {
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";
  return new Intl.NumberFormat(locale).format(amount) + t("common.vnd");
}
export function formatShortCurrency(amount: number): string {
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";
  return new Intl.NumberFormat(locale).format(Math.abs(amount)) + t("general.text");
}

export function formatRelativeTime(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const now = new Date();

  // Calculate timezone-aware calendar difference in Vietnam time zone
  const vnOffsetMs = VIETNAM_OFFSET_HOURS * 60 * 60 * 1000;
  const parsedVnStart = new Date(parsed.getTime() + vnOffsetMs);
  parsedVnStart.setUTCHours(0, 0, 0, 0);
  const nowVnStart = new Date(now.getTime() + vnOffsetMs);
  nowVnStart.setUTCHours(0, 0, 0, 0);

  const calendarDiffDays = Math.round(
    (nowVnStart.getTime() - parsedVnStart.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (calendarDiffDays === 0) {
    const diffMs = now.getTime() - parsed.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) {
      return t("sharedMessenger.justNow");
    }
    if (diffMin < 60) {
      return t("sharedMessenger.minutesAgo", { count: diffMin });
    }
    return t("sharedMessenger.hoursAgo", { count: diffHour });
  }

  if (calendarDiffDays === 1) {
    return t("sharedMessenger.yesterday");
  }

  if (calendarDiffDays >= 2 && calendarDiffDays <= 7) {
    return t("sharedMessenger.daysAgo", { count: calendarDiffDays });
  }

  // Older than 7 days: return dd/MM or dd/MM/yyyy
  const df = getDateFormatter();
  const day = getDatePart(parsed, df, "day");
  const month = getDatePart(parsed, df, "month");
  const year = getDatePart(parsed, df, "year");
  if (!day || !month || !year) {
    return fallback;
  }

  const currentYear = now.getFullYear().toString();
  if (year !== currentYear) {
    return currentLocale() === "en-US" ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
  }
  return currentLocale() === "en-US" ? `${month}/${day}` : `${day}/${month}`;
}

/**
 * Converts a backend DateInput (UTC or local naive) to a local datetime-local input string (YYYY-MM-DDTHH:mm).
 */
export function utcToLocalDatetimeLocal(value: DateInput): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return "";
  }
  const dtf = getDateTimeFormatter();
  const year = getDatePart(parsed, dtf, "year");
  const month = getDatePart(parsed, dtf, "month");
  const day = getDatePart(parsed, dtf, "day");
  const hour = getDatePart(parsed, dtf, "hour");
  const minute = getDatePart(parsed, dtf, "minute");
  if (!year || !month || !day || !hour || !minute) {
    return "";
  }
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Converts a local datetime-local value (YYYY-MM-DDTHH:mm) to a UTC ISO-8601 string (ending in Z).
 */
export function localDatetimeLocalToUtc(value: string): string {
  if (!value) {
    return "";
  }
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) {
    return "";
  }
  const [yearRaw, monthRaw, dayRaw] = datePart.split("-");
  const [hourRaw, minuteRaw] = timePart.split(":");
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return "";
  }

  // Convert Vietnam (+7) local time to UTC Date
  const utcDate = new Date(
    Date.UTC(year, month - 1, day, hour - VIETNAM_OFFSET_HOURS, minute, 0, 0)
  );
  return utcDate.toISOString();
}
