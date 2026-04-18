import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatTime,
  formatTimeDayMonth,
  parseBackendDate,
  toTimestamp,
  toVietnamDateKey,
  treatZuluAsVietnamLocal,
} from "./formatting";

describe("formatting datetime helpers", () => {
  it("parses backend naive ISO-like string as Vietnam local time", () => {
    const value = "2026-04-14 21:26:00.000";

    expect(formatDateTime(value)).toBe("14/04/2026 21:26");
    expect(formatTime(value)).toBe("21:26");
    expect(toVietnamDateKey(value)).toBe("2026-04-14");
  });

  it("parses backend US 12-hour timestamp as Vietnam local time", () => {
    const value = "4/15/2026 2:00:26 PM";

    expect(formatDateTime(value)).toBe("15/04/2026 14:00");
    expect(formatTime(value)).toBe("14:00");
    expect(formatDayMonth(value)).toBe("15/04");
  });

  it("keeps explicit timezone values and converts display to Vietnam timezone", () => {
    const value = "2026-04-14T14:26:00Z";

    expect(formatDateTime(value)).toBe("14/04/2026 21:26");
    expect(formatTimeDayMonth(value)).toBe("21:26, 14/04");
    expect(toVietnamDateKey(value)).toBe("2026-04-14");
  });

  it("normalizes Z suffix when backend encodes Vietnam local wall-time as UTC", () => {
    const value = "2026-04-14T21:30:38.869Z";
    const normalized = treatZuluAsVietnamLocal(value);

    expect(normalized).toBe("2026-04-14T21:30:38.869");
    expect(formatDateTime(normalized)).toBe("14/04/2026 21:30");
  });

  it("keeps non-Z timezone values unchanged", () => {
    const value = "2026-04-14T21:30:38.869+07:00";

    expect(treatZuluAsVietnamLocal(value)).toBe(value);
  });

  it("returns fallback placeholders for invalid input", () => {
    expect(parseBackendDate("not-a-date")).toBeNull();
    expect(toTimestamp("not-a-date")).toBeNull();
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
    expect(formatTime("not-a-date")).toBe("—");
  });

  it("accepts Date and unix timestamp inputs", () => {
    const value = new Date("2026-04-14T14:26:00Z");

    expect(formatDate(value)).toBe("14/04/2026");
    expect(formatDateTime(value.getTime())).toBe("14/04/2026 21:26");
  });
});
