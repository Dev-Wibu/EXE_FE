import type { Session } from "@/interfaces";

export const MENTOR_CALENDAR_STATUSES = ["SCHEDULED", "PAID", "ONGOING", "COMPLETED"] as const;

const MENTOR_CALENDAR_STATUS_SET = new Set<string>(MENTOR_CALENDAR_STATUSES);

const toUtc = (value: string) =>
  value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`;

export interface MentorCalendarSession {
  session: Session;
  joinDate: Date;
  dateKey: string;
  timestamp: number;
}

export const isMentorCalendarStatus = (status?: string): boolean => {
  return status ? MENTOR_CALENDAR_STATUS_SET.has(status) : false;
};

export const parseJoinDate = (joinTime?: string): Date | undefined => {
  if (!joinTime) {
    return undefined;
  }

  const parsedDate = new Date(toUtc(joinTime));
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

export const toDateKey = (date: Date): string => {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
};

export const formatCalendarTime = (joinTime?: string): string => {
  const date = parseJoinDate(joinTime);
  if (!date) {
    return "--:--";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
};

export const buildMentorCalendarSessions = (
  sessions: Session[],
  mentorId?: number
): MentorCalendarSession[] => {
  if (!mentorId) {
    return [];
  }

  return sessions
    .filter((session) => session.userId2 === mentorId)
    .filter((session) => isMentorCalendarStatus(session.status))
    .reduce<MentorCalendarSession[]>((result, session) => {
      const joinDate = parseJoinDate(session.joinTime);
      if (!joinDate) {
        return result;
      }

      result.push({
        session,
        joinDate,
        dateKey: toDateKey(joinDate),
        timestamp: joinDate.getTime(),
      });
      return result;
    }, [])
    .sort((a, b) => a.timestamp - b.timestamp);
};

export const groupMentorCalendarByDate = (
  items: MentorCalendarSession[]
): Map<string, MentorCalendarSession[]> => {
  const grouped = new Map<string, MentorCalendarSession[]>();

  for (const item of items) {
    const current = grouped.get(item.dateKey) ?? [];
    current.push(item);
    grouped.set(item.dateKey, current);
  }

  for (const [, dayItems] of grouped) {
    dayItems.sort((a, b) => a.timestamp - b.timestamp);
  }

  return grouped;
};
