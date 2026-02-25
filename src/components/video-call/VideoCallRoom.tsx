/**
 * VideoCallRoom.tsx
 * Main video call room component using Daily.co iframe (createFrame)
 * Matches VideoCall-Fe: full Daily.co UI with pre-call lobby, device settings, call controls
 */

import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useVideoCall } from "./useVideoCall";

interface VideoCallRoomProps {
  roomUrl: string;
  userName: string;
  onLeave?: () => void;
  onError?: (_error: string) => void;
  onJoined?: (_participantId: string) => void;
  className?: string;
}

export function VideoCallRoom({
  roomUrl,
  userName,
  onLeave,
  onError,
  onJoined,
  className,
}: VideoCallRoomProps) {
  const { joinRoom, roomState, error, callObject } = useVideoCall();
  const containerRef = useRef<HTMLDivElement>(null);
  const hasCalledOnJoined = useRef(false);
  const hasStartedJoin = useRef(false);

  // Reset flags when roomUrl changes (new room)
  useEffect(() => {
    hasCalledOnJoined.current = false;
    hasStartedJoin.current = false;
  }, [roomUrl]);

  // Join room on mount - pass container element for iframe
  useEffect(() => {
    if (
      roomUrl &&
      userName &&
      roomState === "idle" &&
      containerRef.current &&
      !hasStartedJoin.current
    ) {
      hasStartedJoin.current = true;
      joinRoom(roomUrl, userName, containerRef.current);
    }
  }, [roomUrl, userName, roomState, joinRoom]);

  // Handle error callback
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle joined callback - fire only once per room
  useEffect(() => {
    if (roomState === "joined" && callObject && onJoined && !hasCalledOnJoined.current) {
      const localParticipant = callObject.participants()?.local;
      if (localParticipant?.session_id) {
        hasCalledOnJoined.current = true;
        onJoined(localParticipant.session_id);
      }
    }
  }, [roomState, callObject, onJoined]);

  // Handle leave callback
  const handleLeave = useCallback(() => {
    onLeave?.();
  }, [onLeave]);

  const normalizedError = (error || "").toLowerCase();
  const isRoomUnavailableError =
    normalizedError.includes("room is no longer available") ||
    normalizedError.includes("không còn khả dụng") ||
    normalizedError.includes("hết hạn") ||
    normalizedError.includes("exp-room");

  // Trigger leave callback when room state becomes "left"
  useEffect(() => {
    if (roomState === "left") {
      handleLeave();
    }
  }, [roomState, handleLeave]);

  // Render error state
  if (roomState === "error") {
    if (isRoomUnavailableError) {
      return (
        <Card className={cn("border-destructive/30 bg-destructive/5 w-full", className)}>
          <CardContent className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
            <div className="bg-destructive/10 mb-5 rounded-full p-4">
              <XCircle className="text-destructive h-10 w-10" />
            </div>
            <h3 className="text-foreground text-xl font-semibold">Phòng họp không còn khả dụng</h3>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
              Liên kết phòng này đã hết hạn hoặc phòng đã bị đóng từ phía hệ thống. Bạn không thể
              tham gia bằng link hiện tại.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button variant="default" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tải lại phòng
              </Button>
              <Button variant="outline" onClick={handleLeave}>
                Quay lại danh sách phiên
              </Button>
            </div>

            <p className="text-muted-foreground mt-4 text-xs">
              Nếu lỗi vẫn tiếp diễn, vui lòng tạo phiên mới hoặc liên hệ quản trị viên.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>{error || "Đã xảy ra lỗi khi kết nối cuộc gọi."}</AlertDescription>
          </Alert>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLeave}>
              Quay lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render left state
  if (roomState === "left") {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground text-lg">Bạn đã rời khỏi phòng họp.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex h-full w-full flex-col overflow-hidden", className)}>
      <CardContent className="relative flex-1 p-0">
        {/* Daily.co iframe container - matches VideoCall-Fe #video-container */}
        {/* Daily.co iframe handles its own pre-call lobby, device settings, and call controls */}
        <div ref={containerRef} className="h-full min-h-[600px] w-full" />
      </CardContent>
    </Card>
  );
}
