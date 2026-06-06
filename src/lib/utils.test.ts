import { describe, expect, it } from "vitest";
import {
  cn,
  datetimeLocalToVietnamISOString,
  extractDataArray,
  formatToVietnamISOString,
} from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles conditional classes", () => {
    const condition = false;
    expect(cn("base", condition && "hidden", "extra")).toBe("base extra");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("extractDataArray", () => {
  it("returns empty array for unsuccessful response", () => {
    expect(extractDataArray({ success: false, data: null } as never)).toEqual([]);
  });

  it("returns empty array when data is null", () => {
    expect(extractDataArray({ success: true, data: null } as never)).toEqual([]);
  });

  it("extracts direct array", () => {
    const items = [{ id: 1 }, { id: 2 }];
    expect(extractDataArray({ success: true, data: items })).toEqual(items);
  });

  it("extracts from paginated response", () => {
    const items = [{ id: 1 }];
    expect(
      extractDataArray({
        success: true,
        data: { data: items, total: 1, page: 1, pageSize: 10 },
      } as never)
    ).toEqual(items);
  });

  it("returns empty array for unexpected data shape", () => {
    expect(extractDataArray({ success: true, data: { unexpected: true } } as never)).toEqual([]);
  });
});

describe("formatToVietnamISOString", () => {
  it("formats a Date to Vietnam timezone string with exact values", () => {
    // 2026-06-01T10:30:00Z = 2026-06-01T17:30:00 in Asia/Ho_Chi_Minh (UTC+7)
    const date = new Date("2026-06-01T10:30:00Z");
    const result = formatToVietnamISOString(date);
    expect(result).toBe("2026-06-01T17:30:00");
  });

  it("formats midnight UTC correctly (previous day in Vietnam)", () => {
    // 2026-01-01T00:00:00Z = 2026-01-01T07:00:00 in Vietnam
    const date = new Date("2026-01-01T00:00:00Z");
    const result = formatToVietnamISOString(date);
    expect(result).toBe("2026-01-01T07:00:00");
  });

  it("handles late evening UTC crossing midnight in Vietnam", () => {
    // 2026-12-31T18:00:00Z = 2027-01-01T01:00:00 in Vietnam
    const date = new Date("2026-12-31T18:00:00Z");
    const result = formatToVietnamISOString(date);
    expect(result).toBe("2027-01-01T01:00:00");
  });
});

describe("extractDataArray — additional edge cases", () => {
  it("returns empty array for empty data array", () => {
    expect(extractDataArray({ success: true, data: [] })).toEqual([]);
  });

  it("returns empty array for response with no success field", () => {
    expect(extractDataArray({ data: [{ id: 1 }] } as never)).toEqual([]);
  });

  it("returns empty array when data.data is null", () => {
    expect(extractDataArray({ success: true, data: { data: null } } as never)).toEqual([]);
  });

  it("returns empty array when data.data is not an array", () => {
    expect(extractDataArray({ success: true, data: { data: "not-array" } } as never)).toEqual([]);
  });

  it("returns empty array when data.data is an object", () => {
    expect(extractDataArray({ success: true, data: { data: { nested: true } } } as never)).toEqual(
      []
    );
  });
});

describe("datetimeLocalToVietnamISOString — additional edge cases", () => {
  it("returns empty string unchanged", () => {
    expect(datetimeLocalToVietnamISOString("")).toBe("");
  });

  it("passes through date-only string unchanged", () => {
    expect(datetimeLocalToVietnamISOString("2026-06-01")).toBe("2026-06-01");
  });

  it("preserves milliseconds in datetime string", () => {
    // "2026-06-01T10:30:00.123" has length 23, not 16, so no seconds appended
    expect(datetimeLocalToVietnamISOString("2026-06-01T10:30:00.123")).toBe(
      "2026-06-01T10:30:00.123"
    );
  });

  it("strips lowercase z timezone suffix", () => {
    expect(datetimeLocalToVietnamISOString("2026-06-01T10:30:00z")).toBe("2026-06-01T10:30:00");
  });
});

describe("formatToVietnamISOString — epoch date", () => {
  it("formats Unix epoch (1970-01-01T00:00:00Z) to Vietnam time", () => {
    const date = new Date(0);
    const result = formatToVietnamISOString(date);
    // Vietnam used UTC+8 historically before 1975, so epoch in Vietnam is 1970-01-01T08:00:00
    expect(result).toBe("1970-01-01T08:00:00");
  });
});

describe("datetimeLocalToVietnamISOString", () => {
  it("passes through datetime-local value with seconds", () => {
    expect(datetimeLocalToVietnamISOString("2026-06-01T10:30:00")).toBe("2026-06-01T10:30:00");
  });

  it("appends :00 when seconds are missing", () => {
    expect(datetimeLocalToVietnamISOString("2026-06-01T10:30")).toBe("2026-06-01T10:30:00");
  });

  it("strips timezone suffix Z", () => {
    expect(datetimeLocalToVietnamISOString("2026-06-01T10:30:00Z")).toBe("2026-06-01T10:30:00");
  });

  it("strips timezone offset", () => {
    expect(datetimeLocalToVietnamISOString("2026-06-01T10:30:00+07:00")).toBe(
      "2026-06-01T10:30:00"
    );
  });
});
