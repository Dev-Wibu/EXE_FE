import { Mic, MicOff, MonitorPlay, Video, VideoOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AIInterviewSessionPage() {
  const navigate = useNavigate();
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const handleStartInterview = () => {
    setIsInterviewStarted(true);
  };

  const handleEndInterview = () => {
    setIsInterviewStarted(false);
    navigate("/dashboard/ai-interview/result/1");
  };

  return (
    <div className="bg-background min-h-screen p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
          <MonitorPlay className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Trò chuyện với AI</h1>
          <p className="text-muted-foreground text-sm">
            {isInterviewStarted
              ? "Cuộc phỏng vấn đang diễn ra..."
              : "Sẵn sàng để bắt đầu phỏng vấn"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card className="mx-auto max-w-5xl overflow-hidden">
        <CardContent className="p-0">
          {/* Video Area */}
          <div className="bg-muted/50 relative flex aspect-video w-full items-center justify-center">
            {/* Placeholder for webcam feed */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-full">
                <Video className="text-muted-foreground h-12 w-12" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">
                {isInterviewStarted
                  ? "Cuộc phỏng vấn đang diễn ra..."
                  : "Camera sẽ được bật khi bắt đầu phỏng vấn"}
              </p>
            </div>

            {/* Recording indicator */}
            {isInterviewStarted && (
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1.5 backdrop-blur-sm">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                <span className="text-xs font-medium text-white">Đang ghi hình</span>
              </div>
            )}

            {/* Status indicators */}
            <div className="absolute right-4 bottom-4 flex gap-2">
              <div className="bg-background/80 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm">
                {isInterviewStarted ? (
                  <Video className="h-5 w-5 text-emerald-500" />
                ) : (
                  <VideoOff className="text-muted-foreground h-5 w-5" />
                )}
              </div>
              <div className="bg-background/80 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm">
                {isInterviewStarted ? (
                  <Mic className="h-5 w-5 text-emerald-500" />
                ) : (
                  <MicOff className="text-muted-foreground h-5 w-5" />
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 p-6">
            {!isInterviewStarted ? (
              <Button
                onClick={handleStartInterview}
                size="lg"
                className="h-14 gap-3 rounded-xl bg-emerald-600 px-10 text-lg font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                <Video className="h-5 w-5" />
                Bắt đầu cuộc phỏng vấn
              </Button>
            ) : (
              <Button
                onClick={handleEndInterview}
                size="lg"
                variant="destructive"
                className="h-14 gap-3 rounded-xl px-10 text-lg font-semibold">
                <VideoOff className="h-5 w-5" />
                Kết thúc cuộc phỏng vấn
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
