import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateTimeWithSeconds,
  formatDayMonth,
  formatShortCurrency,
  formatTime,
  formatTimeDayMonth,
  formatUtcNaiveDateTime,
  formatUtcNaiveTime,
  localDatetimeLocalToUtc,
  parseBackendDate,
  parseUtcNaiveDate,
  toTimestamp,
  toUtcNaiveTimestamp,
  toVietnamDateKey,
  treatZuluAsVietnamLocal,
  utcToLocalDatetimeLocal,
} from "./formatting";

// ---------------------------------------------------------------------------
// Core parsing: parseBackendDate
// ---------------------------------------------------------------------------
describe("parseBackendDate", () => {
  it("parses backend naive ISO-like string as Vietnam local time", () => {
    const date = parseBackendDate("2026-04-14 21:26:00.000");
    expect(date).not.toBeNull();
    // Vietnam local 21:26 → UTC 14:26
    expect(date!.toISOString()).toBe("2026-04-14T14:26:00.000Z");
  });

  it("parses backend US 12-hour PM timestamp as Vietnam local time", () => {
    const date = parseBackendDate("4/15/2026 2:00:26 PM");
    expect(date).not.toBeNull();
    // Vietnam local 14:00 → UTC 07:00
    expect(date!.toISOString()).toBe("2026-04-15T07:00:26.000Z");
  });

  it("parses backend US 12-hour AM timestamp", () => {
    const date = parseBackendDate("4/15/2026 9:30:00 AM");
    expect(date).not.toBeNull();
    // Vietnam local 09:30 → UTC 02:30
    expect(date!.toISOString()).toBe("2026-04-15T02:30:00.000Z");
  });

  it("parses 12:00 AM as midnight (00:00)", () => {
    const date = parseBackendDate("4/15/2026 12:00:00 AM");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2026-04-14T17:00:00.000Z");
  });

  it("parses 12:00 PM as noon (12:00)", () => {
    const date = parseBackendDate("4/15/2026 12:00:00 PM");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2026-04-15T05:00:00.000Z");
  });

  it("returns null for boolean input (not a DateInput type)", () => {
    // @ts-expect-error — testing runtime guard against non-DateInput
    expect(parseBackendDate(true)).toBeNull();
    // @ts-expect-error — boolean is not a valid DateInput
    expect(parseBackendDate(false)).toBeNull();
  });

  it("parses US 24-hour format", () => {
    const date = parseBackendDate("4/15/2026 14:00:26");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2026-04-15T07:00:26.000Z");
  });

  it("parses US 24-hour format without seconds", () => {
    const date = parseBackendDate("4/15/2026 14:00");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2026-04-15T07:00:00.000Z");
  });

  it("returns null for null", () => {
    expect(parseBackendDate(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseBackendDate(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseBackendDate("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(parseBackendDate("   ")).toBeNull();
  });

  it("returns null for invalid Date object", () => {
    expect(parseBackendDate(new Date("not-a-date"))).toBeNull();
  });

  it("returns valid Date for valid Date object", () => {
    const d = new Date("2026-06-01T00:00:00Z");
    expect(parseBackendDate(d)).toBe(d);
  });

  it("parses numeric timestamp (milliseconds)", () => {
    const ts = new Date("2026-06-01T12:00:00Z").getTime();
    const parsed = parseBackendDate(ts);
    expect(parsed).not.toBeNull();
    expect(parsed!.getTime()).toBe(ts);
  });

  it("parses epoch 0 correctly", () => {
    const parsed = parseBackendDate(0);
    expect(parsed).not.toBeNull();
    expect(parsed!.getTime()).toBe(0);
  });

  it("returns null for NaN", () => {
    expect(parseBackendDate(Number.NaN)).toBeNull();
  });

  it("returns null for Infinity", () => {
    expect(parseBackendDate(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("accepts ISO with explicit +07:00 offset", () => {
    const date = parseBackendDate("2026-04-14T21:26:00+07:00");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2026-04-14T14:26:00.000Z");
  });

  it("accepts ISO with negative offset -05:00", () => {
    const date = parseBackendDate("2026-04-14T14:26:00-05:00");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2026-04-14T19:26:00.000Z");
  });

  it("accepts Z-suffixed ISO (treated as real UTC)", () => {
    const date = parseBackendDate("2026-04-14T14:26:00Z");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2026-04-14T14:26:00.000Z");
  });

  it("parses ISO local with fractional seconds (6 digits)", () => {
    const date = parseBackendDate("2026-04-14T21:26:00.123456");
    expect(date).not.toBeNull();
    // Fractional 123456 → padEnd(3,'0').slice(0,3) = "123" ms
    expect(date!.toISOString()).toBe("2026-04-14T14:26:00.123Z");
  });

  it("parses ISO local with 1-digit fractional", () => {
    const date = parseBackendDate("2026-04-14T21:26:00.5");
    expect(date).not.toBeNull();
    // .5 → padEnd(3,'0').slice(0,3) = "500" ms
    expect(date!.toISOString()).toBe("2026-04-14T14:26:00.500Z");
  });

  it("parses ISO local with 9-digit fractional", () => {
    const date = parseBackendDate("2026-04-14T21:26:00.123456789");
    expect(date).not.toBeNull();
    // .123456789 → slice(0,3) = "123" ms
    expect(date!.toISOString()).toBe("2026-04-14T14:26:00.123Z");
  });

  it("parses ISO local with T separator", () => {
    const date = parseBackendDate("2026-04-14T21:26:00");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2026-04-14T14:26:00.000Z");
  });

  it("parses ISO local date-only (no time)", () => {
    const date = parseBackendDate("2026-04-14");
    expect(date).not.toBeNull();
    // Date-only → Vietnam midnight → UTC previous day 17:00
    expect(date!.toISOString()).toBe("2026-04-13T17:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// Core parsing: parseUtcNaiveDate
// ---------------------------------------------------------------------------
describe("parseUtcNaiveDate", () => {
  it("parses UTC-naive ISO timestamp correctly", () => {
    const value = "2026-04-18T13:21:05.473428";
    const date = parseUtcNaiveDate(value);
    expect(date).not.toBeNull();
    expect(date!.getTime()).toBe(Date.UTC(2026, 3, 18, 13, 21, 5, 473));
  });

  it("returns null for null", () => {
    expect(parseUtcNaiveDate(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseUtcNaiveDate(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseUtcNaiveDate("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(parseUtcNaiveDate("   ")).toBeNull();
  });

  it("returns null for invalid Date object", () => {
    expect(parseUtcNaiveDate(new Date("invalid"))).toBeNull();
  });

  it("returns valid Date for valid Date object", () => {
    const d = new Date("2026-06-01T00:00:00Z");
    expect(parseUtcNaiveDate(d)).toBe(d);
  });

  it("parses numeric timestamp", () => {
    const ts = new Date("2026-06-01T12:00:00Z").getTime();
    const parsed = parseUtcNaiveDate(ts);
    expect(parsed).not.toBeNull();
    expect(parsed!.getTime()).toBe(ts);
  });

  it("returns null for boolean input", () => {
    // @ts-expect-error — testing runtime guard
    expect(parseUtcNaiveDate(true)).toBeNull();
    // @ts-expect-error — boolean is not a valid DateInput
    expect(parseUtcNaiveDate(false)).toBeNull();
  });

  it("parses epoch 0", () => {
    const parsed = parseUtcNaiveDate(0);
    expect(parsed).not.toBeNull();
    expect(parsed!.getTime()).toBe(0);
  });

  it("returns null for NaN", () => {
    expect(parseUtcNaiveDate(Number.NaN)).toBeNull();
  });

  it("keeps explicit timezone offset values unchanged", () => {
    const value = "2026-04-18T13:21:05Z";
    const parsed = parseUtcNaiveDate(value);
    expect(parsed).not.toBeNull();
    expect(parsed!.toISOString()).toBe("2026-04-18T13:21:05.000Z");
  });

  it("keeps explicit +07:00 offset values", () => {
    const value = "2026-04-18T13:21:05+07:00";
    const parsed = parseUtcNaiveDate(value);
    expect(parsed).not.toBeNull();
    expect(parsed!.toISOString()).toBe("2026-04-18T06:21:05.000Z");
  });

  it("parses UTC-naive date-only (no time)", () => {
    const date = parseUtcNaiveDate("2026-04-14");
    expect(date).not.toBeNull();
    expect(date!.getTime()).toBe(Date.UTC(2026, 3, 14));
  });
});

// ---------------------------------------------------------------------------
// treatZuluAsVietnamLocal
// ---------------------------------------------------------------------------
describe("treatZuluAsVietnamLocal", () => {
  it("strips Z suffix from ISO string", () => {
    expect(treatZuluAsVietnamLocal("2026-04-14T21:30:38.869Z")).toBe("2026-04-14T21:30:38.869");
  });

  it("keeps lowercase z suffix (regex only matches uppercase Z)", () => {
    // ISO_ZULU_LOCAL_PATTERN only matches uppercase Z
    expect(treatZuluAsVietnamLocal("2026-04-14T21:30:38.869z")).toBe("2026-04-14T21:30:38.869z");
  });

  it("returns non-Z string unchanged", () => {
    const value = "2026-04-14T21:30:38.869+07:00";
    expect(treatZuluAsVietnamLocal(value)).toBe(value);
  });

  it("returns non-string input unchanged (number)", () => {
    expect(treatZuluAsVietnamLocal(42 as unknown as string)).toBe(42);
  });

  it("returns non-string input unchanged (null)", () => {
    expect(treatZuluAsVietnamLocal(null as unknown as string)).toBeNull();
  });

  it("returns non-string input unchanged (undefined)", () => {
    expect(treatZuluAsVietnamLocal(undefined as unknown as string)).toBeUndefined();
  });

  it("returns non-string input unchanged (Date)", () => {
    const d = new Date();
    expect(treatZuluAsVietnamLocal(d as unknown as string)).toBe(d);
  });

  it("strips Z from time-only with Z (e.g., minimal ISO)", () => {
    expect(treatZuluAsVietnamLocal("2026-04-14T21:30Z")).toBe("2026-04-14T21:30");
  });

  it("does not strip Z from non-ISO strings that end with Z", () => {
    // Not matching ISO_ZULU_LOCAL_PATTERN
    expect(treatZuluAsVietnamLocal("helloZ")).toBe("helloZ");
  });
});

// ---------------------------------------------------------------------------
// toVietnamDateKey
// ---------------------------------------------------------------------------
describe("toVietnamDateKey", () => {
  it("returns date key for naive ISO string", () => {
    expect(toVietnamDateKey("2026-04-14 21:26:00.000")).toBe("2026-04-14");
  });

  it("returns date key for UTC Z-suffixed string", () => {
    expect(toVietnamDateKey("2026-04-14T14:26:00Z")).toBe("2026-04-14");
  });

  it("returns null for null", () => {
    expect(toVietnamDateKey(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(toVietnamDateKey(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(toVietnamDateKey("")).toBeNull();
  });

  it("returns null for invalid string", () => {
    expect(toVietnamDateKey("not-a-date")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// toTimestamp / toUtcNaiveTimestamp
// ---------------------------------------------------------------------------
describe("toTimestamp", () => {
  it("returns timestamp for valid input", () => {
    const ts = toTimestamp("2026-04-14T14:26:00Z");
    expect(ts).not.toBeNull();
    expect(ts).toBe(new Date("2026-04-14T14:26:00Z").getTime());
  });

  it("returns null for null", () => {
    expect(toTimestamp(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(toTimestamp(undefined)).toBeNull();
  });

  it("returns null for invalid string", () => {
    expect(toTimestamp("not-a-date")).toBeNull();
  });

  it("returns 0 for epoch 0", () => {
    expect(toTimestamp(0)).toBe(0);
  });
});

describe("toUtcNaiveTimestamp", () => {
  it("returns UTC-naive timestamp", () => {
    const value = "2026-04-18T13:21:05.473428";
    expect(toUtcNaiveTimestamp(value)).toBe(Date.UTC(2026, 3, 18, 13, 21, 5, 473));
  });

  it("returns null for null", () => {
    expect(toUtcNaiveTimestamp(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(toUtcNaiveTimestamp(undefined)).toBeNull();
  });

  it("returns null for invalid string", () => {
    expect(toUtcNaiveTimestamp("invalid")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(toUtcNaiveTimestamp("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// format helpers — basic formatting
// ---------------------------------------------------------------------------
describe("formatDate", () => {
  it("formats to DD/MM/YYYY (default vi locale)", () => {
    expect(formatDate("2026-04-14T14:26:00Z")).toBe("14/04/2026");
  });

  it("returns default fallback for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("returns default fallback for invalid string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("returns custom fallback for null", () => {
    expect(formatDate(null, "N/A")).toBe("N/A");
  });

  it("returns custom fallback for invalid input", () => {
    expect(formatDate("bad", "no date")).toBe("no date");
  });

  it("accepts Date object", () => {
    expect(formatDate(new Date("2026-04-14T14:26:00Z"))).toBe("14/04/2026");
  });
});

describe("formatDateTime", () => {
  it("formats to DD/MM/YYYY HH:mm", () => {
    expect(formatDateTime("2026-04-14 21:26:00.000")).toBe("14/04/2026 21:26");
  });

  it("returns default fallback for null", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("returns custom fallback for null", () => {
    expect(formatDateTime(null, "no date")).toBe("no date");
  });

  it("returns custom fallback for invalid input", () => {
    expect(formatDateTime("bad", "missing")).toBe("missing");
  });
});

describe("formatTime", () => {
  it("formats to HH:mm", () => {
    expect(formatTime("2026-04-14 21:26:00.000")).toBe("21:26");
  });

  it("returns default fallback for null", () => {
    expect(formatTime(null)).toBe("—");
  });

  it("returns custom fallback for null", () => {
    expect(formatTime(null, "no time")).toBe("no time");
  });
});

describe("formatDayMonth", () => {
  it("formats to DD/MM", () => {
    expect(formatDayMonth("2026-04-14T14:26:00Z")).toBe("14/04");
  });

  it("returns default fallback for null", () => {
    expect(formatDayMonth(null)).toBe("—");
  });

  it("returns custom fallback for null", () => {
    expect(formatDayMonth(null, "n/a")).toBe("n/a");
  });
});

describe("formatTimeDayMonth", () => {
  it("formats to HH:mm, DD/MM", () => {
    expect(formatTimeDayMonth("2026-04-14T14:26:00Z")).toBe("21:26, 14/04");
  });

  it("returns default fallback for null", () => {
    expect(formatTimeDayMonth(null)).toBe("—");
  });

  it("returns custom fallback for null", () => {
    expect(formatTimeDayMonth(null, "no")).toBe("no");
  });
});

// ---------------------------------------------------------------------------
// formatDateTimeWithSeconds
// ---------------------------------------------------------------------------
describe("formatDateTimeWithSeconds", () => {
  it("formats with seconds", () => {
    // Vietnam local 21:26:05 → parsed as Vietnam local
    const result = formatDateTimeWithSeconds("2026-04-14T21:26:05");
    expect(result).toBe("14/04/2026 21:26:05");
  });

  it("returns default fallback for null", () => {
    expect(formatDateTimeWithSeconds(null)).toBe("—");
  });

  it("returns custom fallback for null", () => {
    expect(formatDateTimeWithSeconds(null, "n/a")).toBe("n/a");
  });

  it("returns fallback for invalid string", () => {
    expect(formatDateTimeWithSeconds("not-a-date")).toBe("—");
  });
});

// ---------------------------------------------------------------------------
// formatUtcNaiveDateTime / formatUtcNaiveTime
// ---------------------------------------------------------------------------
describe("formatUtcNaiveDateTime", () => {
  it("parses UTC-naive ISO timestamps correctly", () => {
    const value = "2026-04-18T13:21:05.473428";
    expect(formatUtcNaiveDateTime(value)).toBe("18/04/2026 20:21");
  });

  it("returns default fallback for null", () => {
    expect(formatUtcNaiveDateTime(null)).toBe("—");
  });

  it("returns custom fallback for null", () => {
    expect(formatUtcNaiveDateTime(null, "N/A")).toBe("N/A");
  });

  it("keeps explicit Z timezone values", () => {
    expect(formatUtcNaiveDateTime("2026-04-18T13:21:05Z")).toBe("18/04/2026 20:21");
  });
});

describe("formatUtcNaiveTime", () => {
  it("formats UTC-naive time", () => {
    expect(formatUtcNaiveTime("2026-04-18T13:21:05.473428")).toBe("20:21");
  });

  it("returns default fallback for null", () => {
    expect(formatUtcNaiveTime(null)).toBe("—");
  });

  it("returns custom fallback for null", () => {
    expect(formatUtcNaiveTime(null, "no")).toBe("no");
  });

  it("returns fallback for invalid string", () => {
    expect(formatUtcNaiveTime("invalid")).toBe("—");
  });
});

// ---------------------------------------------------------------------------
// formatCurrency / formatShortCurrency
// ---------------------------------------------------------------------------
describe("formatCurrency", () => {
  it("formats positive number with VND suffix", () => {
    const result = formatCurrency(1000);
    // Intl.NumberFormat formats 1000 with grouping separator
    expect(result).toMatch(/1[.,\s]?000/);
    // t("common.vnd") resolves to "VND" in test env (English fallback)
    expect(result).toContain("VND");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/^0/);
    expect(result).toContain("VND");
  });

  it("formats large number", () => {
    const result = formatCurrency(1000000);
    expect(result).toMatch(/1[.,\s]?000[.,\s]?000/);
    expect(result).toContain("VND");
  });

  it("formats negative number preserving sign", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("500");
    expect(result).toMatch(/-/);
    expect(result).toContain("VND");
  });
});

describe("formatShortCurrency", () => {
  it("formats positive number with ₫ suffix", () => {
    const result = formatShortCurrency(5000);
    expect(result).toMatch(/5[.,\s]?000/);
    expect(result).toContain("₫");
  });

  it("formats zero", () => {
    const result = formatShortCurrency(0);
    expect(result).toMatch(/^0/);
    expect(result).toContain("₫");
  });

  it("formats negative number with absolute value (no minus sign)", () => {
    const result = formatShortCurrency(-3000);
    // Math.abs(-3000) = 3000, so no negative sign in output
    expect(result).toMatch(/3[.,\s]?000/);
    expect(result).not.toMatch(/-/);
    expect(result).toContain("₫");
  });

  it("formats large number", () => {
    const result = formatShortCurrency(1000000);
    expect(result).toMatch(/1[.,\s]?000[.,\s]?000/);
    expect(result).toContain("₫");
  });
});

// ---------------------------------------------------------------------------
// Integration: Date + timestamp inputs with format helpers
// ---------------------------------------------------------------------------
describe("Date and timestamp inputs with format helpers", () => {
  it("formatDate accepts Date object", () => {
    const value = new Date("2026-04-14T14:26:00Z");
    expect(formatDate(value)).toBe("14/04/2026");
  });

  it("formatDateTime accepts numeric timestamp", () => {
    const value = new Date("2026-04-14T14:26:00Z");
    expect(formatDateTime(value.getTime())).toBe("14/04/2026 21:26");
  });

  it("formatTime accepts Date object", () => {
    const value = new Date("2026-04-14T14:26:00Z");
    expect(formatTime(value)).toBe("21:26");
  });

  it("formatDayMonth accepts Date object", () => {
    const value = new Date("2026-04-14T14:26:00Z");
    expect(formatDayMonth(value)).toBe("14/04");
  });

  it("formatTimeDayMonth accepts Date object", () => {
    const value = new Date("2026-04-14T14:26:00Z");
    expect(formatTimeDayMonth(value)).toBe("21:26, 14/04");
  });
});

// ---------------------------------------------------------------------------
// Integration: treatZuluAsVietnamLocal → formatDateTime roundtrip
// ---------------------------------------------------------------------------
describe("treatZuluAsVietnamLocal + format roundtrip", () => {
  it("normalizes Z suffix and formats as Vietnam local time", () => {
    const value = "2026-04-14T21:30:38.869Z";
    const normalized = treatZuluAsVietnamLocal(value);

    expect(normalized).toBe("2026-04-14T21:30:38.869");
    expect(formatDateTime(normalized)).toBe("14/04/2026 21:30");
  });

  it("keeps non-Z timezone values unchanged for formatting", () => {
    const value = "2026-04-14T21:30:38.869+07:00";
    expect(treatZuluAsVietnamLocal(value)).toBe(value);
  });
});

describe("utcToLocalDatetimeLocal", () => {
  it("converts Z-suffixed UTC date-time string to local Vietnam datetime-local format", () => {
    expect(utcToLocalDatetimeLocal("2026-06-10T11:58:00Z")).toBe("2026-06-10T18:58");
  });

  it("converts naive local date-time string to local Vietnam datetime-local format", () => {
    expect(utcToLocalDatetimeLocal("2026-06-10T18:58:00")).toBe("2026-06-10T18:58");
  });

  it("returns empty string for null/undefined/invalid inputs", () => {
    expect(utcToLocalDatetimeLocal(null)).toBe("");
    expect(utcToLocalDatetimeLocal(undefined)).toBe("");
    expect(utcToLocalDatetimeLocal("invalid-date")).toBe("");
  });
});

describe("localDatetimeLocalToUtc", () => {
  it("converts local Vietnam YYYY-MM-DDTHH:mm to UTC ISO string with Z suffix", () => {
    expect(localDatetimeLocalToUtc("2026-06-10T18:58")).toBe("2026-06-10T11:58:00.000Z");
  });

  it("returns empty string for empty/invalid inputs", () => {
    expect(localDatetimeLocalToUtc("")).toBe("");
    expect(localDatetimeLocalToUtc("invalid-date")).toBe("");
  });
});
