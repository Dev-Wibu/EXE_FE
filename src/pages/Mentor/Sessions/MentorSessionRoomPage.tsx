/**
 * MentorSessionRoomPage.tsx
 * Active video call room for mentor sessions
 * Route: /mentor/sessions/room/:sessionId
 */

import { AlertCircle, ArrowLeft, Calendar, Clock, Settings, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeviceCheckDialog, VideoCallProvider, VideoCallRoom } from "@/components/video-call";
import { useJoinSession, useSessionById } from "@/hooks/useSession";
import { useAuthStore } from "@/stores/authStore";

export function MentorSessionRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [hasJoinedTracking, setHasJoinedTracking] = useState(false);
  const [isDeviceCheckOpen, setIsDeviceCheckOpen] = useState(true);
  const [hasConfirmedDevices, setHasConfirmedDevices] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const { data: session, isLoading, error } = useSessionById(Number(sessionId));
  const joinSessionMutation = useJoinSession();

  // Validate session and user
  const canJoin =
    session &&
    (session.status === "SCHEDULED" || session.status === "ONGOING") &&
    session.roomUrl &&
    user;

  // Handle when mentor joins the call (callback from VideoCallRoom)
  const handleJoined = async (participantId: string) => {
    if (hasJoinedTracking || !session?.roomName || !user?.id) return;

    // Track join via API
    await joinSessionMutation.mutateAsync({
      sessionName: session.roomName,
      userId: user.id,
      participantId,
      isMentor: true, // Mentor is joining
    });

    setHasJoinedTracking(true);
  };

  // Handle when mentor leaves the call
  const handleLeave = () => {
    navigate("/mentor?tab=sessions");
  };

  // Handle errors from video call
  const handleError = (errorMessage: string) => {
    console.error("Video call error:", errorMessage);
  };

  // Redirect if session is not available
  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/mentor?tab=sessions");
    }
  }, [isLoading, session, navigate]);

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-4">
        <Skeleton className="h-8 w-48" />
        <div className="mt-4">
          <Skeleton className="h-[70vh] w-full rounded-lg" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="container max-w-4xl py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>Không tìm thấy phiên phỏng vấn. Vui lòng thử lại sau.</AlertDescription>
        </Alert>
        <Button className="mt-4" variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  if (!canJoin) {
    return (
      <div className="container max-w-4xl py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không thể tham gia</AlertTitle>
          <AlertDescription>
            {session.status === "DRAFT" &&
              "Phiên phỏng vấn chưa được duyệt. Vui lòng chờ Staff/Admin xét duyệt."}
            {session.status === "REJECTED" && "Phiên phỏng vấn này đã bị từ chối."}
            {session.status === "COMPLETED" && "Phiên phỏng vấn này đã kết thúc."}
            {session.status === "CANCELED" && "Phiên phỏng vấn này đã bị hủy."}
            {!session.roomUrl &&
              session.status !== "DRAFT" &&
              session.status !== "REJECTED" &&
              session.status !== "COMPLETED" &&
              session.status !== "CANCELED" &&
              "Phòng họp chưa được tạo."}
          </AlertDescription>
        </Alert>
        <Button className="mt-4" variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold">Phòng phỏng vấn (Mentor)</h1>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeviceCheckOpen(true)}
            className="gap-2">
            <Settings className="h-4 w-4" />
            Kiểm tra thiết bị
          </Button>
        </div>
      </div>

      {/* Device Check Dialog - auto-opens on entry, requires confirmation */}
      <DeviceCheckDialog
        isOpen={isDeviceCheckOpen}
        onOpenChange={setIsDeviceCheckOpen}
        displayName={displayName}
        onDisplayNameChange={setDisplayName}
        onConfirm={() => {
          setIsDeviceCheckOpen(false);
          setHasConfirmedDevices(true);
        }}
      />

      {/* Main Video Area - Only shown after device check confirmation */}
      {hasConfirmedDevices ? (
        <div className="w-full">
          <VideoCallProvider>
            <VideoCallRoom
              roomUrl={session.roomUrl!}
              userName={displayName.trim() || user?.name || "Mentor"}
              onLeave={handleLeave}
              onError={handleError}
              onJoined={handleJoined}
              className="h-[80vh] w-full"
            />
          </VideoCallProvider>
        </div>
      ) : (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed">
          <Settings className="h-12 w-12 text-slate-400" />
          <p className="text-lg font-medium text-slate-600">
            Vui lòng kiểm tra thiết bị trước khi tham gia
          </p>
          <Button onClick={() => setIsDeviceCheckOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Kiểm tra thiết bị
          </Button>
        </div>
      )}

      {/* Session Info - Below video like YouTube description */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Thông tin phiên phỏng vấn</CardTitle>
              <CardDescription>Chi tiết buổi phỏng vấn</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  session.status === "ONGOING"
                    ? "bg-green-100 text-green-700"
                    : session.status === "SCHEDULED"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                }`}>
                {session.status === "ONGOING" && "Đang diễn ra"}
                {session.status === "SCHEDULED" && "Đã lên lịch"}
                {session.status === "COMPLETED" && "Đã kết thúc"}
                {session.status === "CANCELED" && "Đã hủy"}
              </span>
              {session.status === "COMPLETED" && (
                <Button size="sm" onClick={() => navigate(`/mentor/sessions/${sessionId}/review`)}>
                  Viết đánh giá
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="text-muted-foreground h-4 w-4 shrink-0" />
              <span>Phòng: {session.roomName}</span>
            </div>
            {session.joinTime && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
                <span>
                  Giờ họp:{" "}
                  {new Date(session.joinTime).toLocaleString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            {session.startTime1 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
                <span>
                  Bắt đầu:{" "}
                  {new Date(session.startTime1).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            {session.durationSeconds1 && session.durationSeconds1 > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
                <span>Thời lượng: {Math.floor(session.durationSeconds1 / 60)} phút</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
