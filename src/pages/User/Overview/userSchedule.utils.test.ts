import { describe, expect, it } from "vitest";

import type { Session } from "@/interfaces";

import {
  USER_CALENDAR_STATUSES,
  buildUserCalendarSessions,
  formatCalendarTime,
  groupUserCalendarByDate,
  isUserCalendarStatus,
} from "./userSchedule.utils";

describe("userSchedule.utils", () => {
  it("accepts only allowed statuses for user calendar", () => {
    for (const status of USER_CALENDAR_STATUSES) {
      expect(isUserCalendarStatus(status)).toBe(true);
    }

    expect(isUserCalendarStatus("UNKNOWN_STATUS")).toBe(false);
    expect(isUserCalendarStatus(undefined)).toBe(false);
  });

  it("filters sessions by valid status and skips sessions without joinTime", () => {
    const sessions: Session[] = [
      { id: 1, status: "SCHEDULED", joinTime: "2026-04-14T08:00:00" },
      {
        id: 2,
        status: "UNKNOWN_STATUS" as Session["status"],
        joinTime: "2026-04-14T09:00:00",
      },
      { id: 3, status: "PAID" },
      { id: 4, status: "COMPLETED", joinTime: "2026-04-15T10:00:00" },
    ];

    const result = buildUserCalendarSessions(sessions);

    expect(result.map((item) => item.session.id)).toEqual([1, 4]);
  });

  it("sorts user calendar sessions ascending by joinTime", () => {
    const sessions: Session[] = [
      { id: 11, status: "PAID", joinTime: "2026-04-14T11:30:00" },
      { id: 12, status: "PAID", joinTime: "2026-04-14T08:30:00" },
      { id: 13, status: "ONGOING", joinTime: "2026-04-14T09:15:00" },
    ];

    const result = buildUserCalendarSessions(sessions);

    expect(result.map((item) => item.session.id)).toEqual([12, 13, 11]);
  });

  it("groups sessions by UTC date key and keeps order in each day", () => {
    const sessions: Session[] = [
      { id: 21, status: "SCHEDULED", joinTime: "2026-04-20T09:00:00" },
      { id: 22, status: "PAID", joinTime: "2026-04-20T08:00:00" },
      { id: 23, status: "COMPLETED", joinTime: "2026-04-21T07:00:00" },
    ];

    const items = buildUserCalendarSessions(sessions);
    const grouped = groupUserCalendarByDate(items);

    const day1 = grouped.get("2026-04-20") ?? [];
    const day2 = grouped.get("2026-04-21") ?? [];

    expect(day1.map((item) => item.session.id)).toEqual([22, 21]);
    expect(day2.map((item) => item.session.id)).toEqual([23]);
  });

  it("formats calendar time in 24h vi-VN style", () => {
    expect(formatCalendarTime("2026-04-14T06:05:00")).toBe("06:05");
    expect(formatCalendarTime(undefined)).toBe("--:--");
  });
});
