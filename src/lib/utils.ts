import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ApiResponse, PaginatedResponse } from "@/interfaces";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extracts array data from an ApiResponse that may contain either
 * a direct array or a PaginatedResponse with a data property.
 *
 * @param response - The ApiResponse to extract data from
 * @returns Array of items, or empty array if extraction fails
 */
export function extractDataArray<T>(response: ApiResponse<PaginatedResponse<T> | T[]>): T[] {
  if (!response.success || !response.data) {
    return [];
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Handle PaginatedResponse
  if ("data" in response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
}

/**
 * Formats a Date object to Vietnam timezone ISO-like string.
 * Example: 2026-02-24T10:30:00
 */
export function formatToVietnamISOString(date: Date): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || "00";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Converts datetime-local value (yyyy-MM-ddTHH:mm or yyyy-MM-ddTHH:mm:ss)
 * to Vietnam timezone string.
 */
export function datetimeLocalToVietnamISOString(value: string): string {
  const withoutTimezone = value.replace(/([zZ]|[+-]\d{2}:\d{2})$/, "");
  const withSeconds = withoutTimezone.length === 16 ? `${withoutTimezone}:00` : withoutTimezone;
  return `${withSeconds}`;
}
