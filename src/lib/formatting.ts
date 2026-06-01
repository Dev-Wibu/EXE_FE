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
const vietnamDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VIETNAM_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const vietnamDateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VIETNAM_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const vietnamDateTimeWithSecondsFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VIETNAM_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const vietnamTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VIETNAM_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
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
  const year = getDatePart(parsed, vietnamDateFormatter, "year");
  const month = getDatePart(parsed, vietnamDateFormatter, "month");
  const day = getDatePart(parsed, vietnamDateFormatter, "day");
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
  const day = getDatePart(parsed, vietnamDateFormatter, "day");
  const month = getDatePart(parsed, vietnamDateFormatter, "month");
  const year = getDatePart(parsed, vietnamDateFormatter, "year");
  if (!day || !month || !year) {
    return fallback;
  }
  return `${day}/${month}/${year}`;
}
export function formatDateTime(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const day = getDatePart(parsed, vietnamDateTimeFormatter, "day");
  const month = getDatePart(parsed, vietnamDateTimeFormatter, "month");
  const year = getDatePart(parsed, vietnamDateTimeFormatter, "year");
  const hour = getDatePart(parsed, vietnamDateTimeFormatter, "hour");
  const minute = getDatePart(parsed, vietnamDateTimeFormatter, "minute");
  if (!day || !month || !year || !hour || !minute) {
    return fallback;
  }
  return `${day}/${month}/${year} ${hour}:${minute}`;
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
  const day = getDatePart(parsed, vietnamDateTimeWithSecondsFormatter, "day");
  const month = getDatePart(parsed, vietnamDateTimeWithSecondsFormatter, "month");
  const year = getDatePart(parsed, vietnamDateTimeWithSecondsFormatter, "year");
  const hour = getDatePart(parsed, vietnamDateTimeWithSecondsFormatter, "hour");
  const minute = getDatePart(parsed, vietnamDateTimeWithSecondsFormatter, "minute");
  const second = getDatePart(parsed, vietnamDateTimeWithSecondsFormatter, "second");
  if (!day || !month || !year || !hour || !minute || !second) {
    return fallback;
  }
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}
export function formatTime(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const hour = getDatePart(parsed, vietnamTimeFormatter, "hour");
  const minute = getDatePart(parsed, vietnamTimeFormatter, "minute");
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
  const day = getDatePart(parsed, vietnamDateFormatter, "day");
  const month = getDatePart(parsed, vietnamDateFormatter, "month");
  if (!day || !month) {
    return fallback;
  }
  return `${day}/${month}`;
}
export function formatTimeDayMonth(value: DateInput, fallback = EMPTY_PLACEHOLDER): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return fallback;
  }
  const hour = getDatePart(parsed, vietnamDateTimeFormatter, "hour");
  const minute = getDatePart(parsed, vietnamDateTimeFormatter, "minute");
  const day = getDatePart(parsed, vietnamDateTimeFormatter, "day");
  const month = getDatePart(parsed, vietnamDateTimeFormatter, "month");
  if (!hour || !minute || !day || !month) {
    return fallback;
  }
  return `${hour}:${minute}, ${day}/${month}`;
}
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + t("common.vnd");
}
export function formatShortCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.abs(amount)) + t("general.text");
}
export function getTransactionTypeLabel(type: string): string {
  switch (type) {
    case "deposit":
      return t("common.depositMoney");
    case "payment":
      return t("common.pay");
    case "refund":
      return t("general.withdrawMoney");
    case "unknown":
      return t("sharedSpeechplaygroundpage.areNot");
    default:
      return type;
  }
}
export function getTransactionStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return t("general.completed");
    case "pending":
      return t("common.processing1");
    case "failed":
      return t("general.failed1");
    default:
      return status;
  }
}
