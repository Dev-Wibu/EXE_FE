import { describe, expect, it } from "vitest";

import type { Session } from "@/interfaces";

import {
  MENTOR_CALENDAR_STATUSES,
  buildMentorCalendarSessions,
  formatCalendarTime,
  groupMentorCalendarByDate,
  isMentorCalendarStatus,
} from "./mentorSchedule.utils";

describe("mentorSchedule.utils", () => {
  it("accepts only allowed statuses for mentor calendar", () => {
    for (const status of MENTOR_CALENDAR_STATUSES) {
      expect(isMentorCalendarStatus(status)).toBe(true);
    }

    expect(isMentorCalendarStatus("DRAFT")).toBe(false);
    expect(isMentorCalendarStatus("REJECTED")).toBe(false);
    expect(isMentorCalendarStatus(undefined)).toBe(false);
  });

  it("filters sessions by mentor/status and skips sessions without joinTime", () => {
    const sessions: Session[] = [
      { id: 1, userId2: 8, status: "SCHEDULED", joinTime: "2026-04-14T08:00:00" },
      { id: 2, userId2: 8, status: "DRAFT", joinTime: "2026-04-14T09:00:00" },
      { id: 3, userId2: 9, status: "PAID", joinTime: "2026-04-14T10:00:00" },
      { id: 4, userId2: 8, status: "PAID" },
      { id: 5, userId2: 8, status: "COMPLETED", joinTime: "2026-04-15T10:00:00" },
    ];

    const result = buildMentorCalendarSessions(sessions, 8);

    expect(result.map((item) => item.session.id)).toEqual([1, 5]);
    expect(result.every((item) => item.session.userId2 === 8)).toBe(true);
  });

  it("sorts mentor calendar sessions ascending by joinTime", () => {
    const sessions: Session[] = [
      { id: 11, userId2: 7, status: "PAID", joinTime: "2026-04-14T11:30:00" },
      { id: 12, userId2: 7, status: "PAID", joinTime: "2026-04-14T08:30:00" },
      { id: 13, userId2: 7, status: "ONGOING", joinTime: "2026-04-14T09:15:00" },
    ];

    const result = buildMentorCalendarSessions(sessions, 7);

    expect(result.map((item) => item.session.id)).toEqual([12, 13, 11]);
  });

  it("groups sessions by UTC date key and keeps order in each day", () => {
    const sessions: Session[] = [
      { id: 21, userId2: 3, status: "SCHEDULED", joinTime: "2026-04-20T09:00:00" },
      { id: 22, userId2: 3, status: "PAID", joinTime: "2026-04-20T08:00:00" },
      { id: 23, userId2: 3, status: "COMPLETED", joinTime: "2026-04-21T07:00:00" },
    ];

    const items = buildMentorCalendarSessions(sessions, 3);
    const grouped = groupMentorCalendarByDate(items);

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
