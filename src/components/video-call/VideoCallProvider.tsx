/**
 * VideoCallProvider.tsx
 * Manages Daily.co callObject lifecycle using createFrame (iframe-based)
 * Matches VideoCall-Fe reference: full Daily.co UI (pre-call lobby, device settings, controls)
 * Based on VideoCall-Fe reference implementation
 */

import type { DailyCall } from "@daily-co/daily-js";
import DailyIframe from "@daily-co/daily-js";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RoomState, VideoCallContextValue } from "./VideoCallContext";
import { VideoCallContext } from "./VideoCallContext";

interface VideoCallProviderProps {
  children: ReactNode;
}

const DAILY_URL_REGEX = /^https?:\/\//i;

function extractErrorMessage(error: unknown): string {
  if (!error) {
    return "Đã xảy ra lỗi khi kết nối cuộc gọi.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object") {
    const errorLike = error as {
      errorMsg?: string;
      message?: string;
      error?: {
        msg?: string;
      };
    };

    return (
      errorLike.errorMsg ||
      errorLike.error?.msg ||
      errorLike.message ||
      "Đã xảy ra lỗi khi kết nối cuộc gọi."
    );
  }

  return "Đã xảy ra lỗi khi kết nối cuộc gọi.";
}

function isRoomUnavailableError(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return (
    normalized.includes("room is no longer available") ||
    normalized.includes("không còn khả dụng") ||
    normalized.includes("hết hạn") ||
    normalized.includes("exp-room")
  );
}

function normalizeRoomUrl(rawRoomUrl: string): string | null {
  const trimmed = rawRoomUrl.trim();
  if (!trimmed) return null;

  // Backend may return full URL or host/path without protocol
  if (DAILY_URL_REGEX.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes(".")) {
    return `https://${trimmed}`;
  }

  // If only room name is provided, cannot infer Daily domain safely
  return null;
}

export function VideoCallProvider({ children }: VideoCallProviderProps) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [roomState, setRoomState] = useState<RoomState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Use ref to track callObject for stable callbacks (avoids stale closures)
  const callObjectRef = useRef<DailyCall | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    callObjectRef.current = callObject;
  }, [callObject]);

  // Cleanup call object on unmount only
  useEffect(() => {
    return () => {
      if (callObjectRef.current) {
        callObjectRef.current.destroy();
      }
    };
  }, []);

  // Join room handler - uses createFrame (iframe-based, full Daily.co UI)
  const joinRoom = useCallback(
    async (roomUrl: string, userName: string, container: HTMLElement) => {
      if (!roomUrl) {
        setError("Thiếu URL phòng họp.");
        return;
      }

      const normalizedRoomUrl = normalizeRoomUrl(roomUrl);
      if (!normalizedRoomUrl) {
        setError("URL phòng họp không hợp lệ. Vui lòng kiểm tra roomUrl từ backend.");
        setRoomState("error");
        return;
      }

      let hasDailyErrorEvent = false;

      try {
        setRoomState("joining");
        setError(null);

        // Destroy existing call object if any (avoid duplicate)
        if (callObjectRef.current) {
          await callObjectRef.current.destroy();
          callObjectRef.current = null;
          setCallObject(null);
        }

        // Also check for any existing Daily instance globally (prevent "Duplicate DailyIframe")
        try {
          const existingInstance = DailyIframe.getCallInstance();
          if (existingInstance) {
            await existingInstance.destroy();
          }
        } catch {
          // Ignore cleanup errors - proceed with creating new instance
        }

        // Create Daily.co iframe frame (same pattern as VideoCall-Fe reference).
        const newCallObject = DailyIframe.createFrame(container, {
          iframeStyle: { width: "100%", height: "100%", border: "none" },
          url: normalizedRoomUrl,
          showLeaveButton: true,
        });

        // Set up event listeners
        // "joined-meeting" fires when user clicks "Join" in Daily.co's pre-call lobby
        newCallObject.on("joined-meeting", () => {
          setRoomState("joined");
        });

        newCallObject.on("left-meeting", () => {
          setRoomState("left");
          // Destroy frame on leave (matches VideoCall-Fe behavior)
          newCallObject.destroy();
          callObjectRef.current = null;
          setCallObject(null);
        });

        newCallObject.on("error", (event) => {
          hasDailyErrorEvent = true;

          const rawErrorMessage = extractErrorMessage(event);
          const isUnavailableByType = event?.error?.type === "exp-room";
          const isUnavailableByMessage = isRoomUnavailableError(rawErrorMessage);

          const errorMessage =
            isUnavailableByType || isUnavailableByMessage
              ? "Phòng họp này không còn khả dụng (đã hết hạn hoặc đã bị đóng)."
              : rawErrorMessage;

          console.error("[Daily.co] init/join error", {
            roomUrl: normalizedRoomUrl,
            event,
          });

          setError(errorMessage);
          setRoomState("error");

          // Stop internal call lifecycle to avoid endless retry/noise loops.
          newCallObject.destroy();
          callObjectRef.current = null;
          setCallObject(null);
        });

        callObjectRef.current = newCallObject;
        setCallObject(newCallObject);

        // Join flow like VideoCall-Fe; Daily still renders its own pre-call experience.
        await newCallObject.join({
          userName,
        });
      } catch (err) {
        if (hasDailyErrorEvent) {
          // Daily error event has already set a specific, user-friendly error message.
          return;
        }

        const rawErrorMessage = extractErrorMessage(err);
        const isUnavailable = isRoomUnavailableError(rawErrorMessage);

        setError(
          isUnavailable
            ? "Phòng họp này không còn khả dụng (đã hết hạn hoặc đã bị đóng)."
            : rawErrorMessage || "Không thể tham gia phòng họp."
        );
        setRoomState("error");
      }
    },
    []
  );

  // Leave room handler
  const leaveRoom = useCallback(async () => {
    if (!callObjectRef.current) return;

    try {
      setRoomState("leaving");
      await callObjectRef.current.leave();
      await callObjectRef.current.destroy();
      callObjectRef.current = null;
      setCallObject(null);
      setRoomState("left");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể rời phòng họp.");
    }
  }, []);

  // Memoize context value
  const value = useMemo<VideoCallContextValue>(
    () => ({
      callObject,
      roomState,
      error,
      joinRoom,
      leaveRoom,
    }),
    [callObject, roomState, error, joinRoom, leaveRoom]
  );

  return <VideoCallContext.Provider value={value}>{children}</VideoCallContext.Provider>;
}
