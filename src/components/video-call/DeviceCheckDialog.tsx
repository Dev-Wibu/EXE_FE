/**
 * DeviceCheckDialog.tsx
 * Dialog for users to test their microphone and camera before joining the Daily.co room.
 * Uses browser's native navigator.mediaDevices API (no Daily.co dependency).
 */

import { Camera, CameraOff, Check, Mic, MicOff, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeviceCheckDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user confirms devices are ready and wants to join */
  onConfirm?: (_selection: DeviceCheckSelection) => void;
  displayName?: string;
  onDisplayNameChange?: (value: string) => void;
  showDisplayName?: boolean;
}

export interface DeviceCheckSelection {
  audioDeviceId: string | null;
  videoDeviceId: string | null;
  isMicOn: boolean;
  isCameraOn: boolean;
}

export function DeviceCheckDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  displayName,
  onDisplayNameChange,
  showDisplayName = true,
}: DeviceCheckDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previewRequestIdRef = useRef(0);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const animationRef = useRef<number>(0);

  const stopAudioMeter = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext) {
      void audioContext.close().catch(() => undefined);
    }

    setMicLevel(0);
  }, []);

  const stopStream = useCallback(() => {
    // Mỗi lần dừng stream sẽ tăng request id để vô hiệu hóa các startPreview cũ đang pending.
    previewRequestIdRef.current += 1;
    stopAudioMeter();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, [stopAudioMeter]);

  const startPreview = useCallback(
    async (mic: boolean, camera: boolean, audioId?: string, videoId?: string) => {
      stopStream();
      const requestId = previewRequestIdRef.current;
      setError(null);

      if (!mic && !camera) return;

      try {
        const constraints: MediaStreamConstraints = {
          video: camera ? { deviceId: videoId ? { exact: videoId } : undefined } : false,
          audio: mic ? { deviceId: audioId ? { exact: audioId } : undefined } : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (requestId !== previewRequestIdRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setIsStreaming(true);

        if (videoRef.current && camera) {
          videoRef.current.srcObject = stream;
        }

        // Mic level meter
        if (mic) {
          const audioContext = new AudioContext();
          audioContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateLevel = () => {
            if (requestId !== previewRequestIdRef.current) {
              return;
            }
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animationRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch {
        if (requestId !== previewRequestIdRef.current) {
          return;
        }
        stopStream();
        setError("Không thể truy cập thiết bị. Vui lòng kiểm tra quyền truy cập camera/mic.");
      }
    },
    [stopStream]
  );

  // Enumerate devices on open
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const resetTimerId = window.setTimeout(() => {
      setError(null);
      setIsCameraOn(true);
      setIsMicOn(true);
      setSelectedAudioId("");
      setSelectedVideoId("");
    }, 0);

    const refreshDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (cancelled) return;

      const nextAudioDevices = devices.filter((d) => d.kind === "audioinput");
      const nextVideoDevices = devices.filter((d) => d.kind === "videoinput");

      setAudioDevices(nextAudioDevices);
      setVideoDevices(nextVideoDevices);
      setSelectedAudioId(nextAudioDevices[0]?.deviceId ?? "");
      setSelectedVideoId(nextVideoDevices[0]?.deviceId ?? "");
    };

    const init = async () => {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        tempStream.getTracks().forEach((t) => t.stop());

        await refreshDevices();
      } catch {
        if (!cancelled) {
          setError("Không thể liệt kê thiết bị. Vui lòng cấp quyền truy cập camera/mic.");
        }
      }
    };

    const handleDeviceChange = () => {
      void refreshDevices();
    };

    void init();
    navigator.mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);

    return () => {
      cancelled = true;
      window.clearTimeout(resetTimerId);
      navigator.mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
    };
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const handleClose = (open: boolean) => {
    if (!open) {
      stopStream();
    }
    onOpenChange(open);
  };

  const handleToggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    void startPreview(next, isCameraOn, selectedAudioId, selectedVideoId);
  };

  const handleToggleCamera = () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    void startPreview(isMicOn, next, selectedAudioId, selectedVideoId);
  };

  const handleRefresh = () => {
    void startPreview(isMicOn, isCameraOn, selectedAudioId, selectedVideoId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kiểm tra thiết bị</DialogTitle>
          <DialogDescription>
            Kiểm tra camera và microphone trước khi tham gia phòng họp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showDisplayName && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Tên hiển thị trong phòng họp:</p>
              <Input
                value={displayName ?? ""}
                onChange={(e) => onDisplayNameChange?.(e.target.value)}
                placeholder="Tên tài khoản"
              />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Camera preview */}
          <div className="relative overflow-hidden rounded-lg bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-60 w-full object-cover ${!isCameraOn ? "hidden" : ""}`}
            />
            {!isCameraOn && (
              <div className="flex h-60 items-center justify-center">
                <CameraOff className="h-12 w-12 text-slate-500" />
              </div>
            )}
          </div>

          {/* Toggle & start buttons */}
          <div className="flex justify-center gap-3">
            {!isStreaming && (
              <Button size="sm" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Bắt đầu kiểm tra
              </Button>
            )}
            {isStreaming && (
              <>
                <Button
                  variant={isMicOn ? "default" : "destructive"}
                  size="sm"
                  onClick={handleToggleMic}
                  className="gap-2">
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {isMicOn ? "Mic bật" : "Mic tắt"}
                </Button>
                <Button
                  variant={isCameraOn ? "default" : "destructive"}
                  size="sm"
                  onClick={handleToggleCamera}
                  className="gap-2">
                  {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                  {isCameraOn ? "Camera bật" : "Camera tắt"}
                </Button>
              </>
            )}
          </div>

          {/* Mic level */}
          {isMicOn && isStreaming && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Mức âm thanh microphone:</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-100"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
            </div>
          )}

          {/* Device selection */}
          {videoDevices.length > 1 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Camera:</p>
              <Select
                value={selectedVideoId}
                onValueChange={(v) => {
                  setSelectedVideoId(v);
                  if (isStreaming) {
                    void startPreview(isMicOn, isCameraOn, selectedAudioId, v);
                  }
                }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Chọn camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${videoDevices.indexOf(d) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {audioDevices.length > 1 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Microphone:</p>
              <Select
                value={selectedAudioId}
                onValueChange={(v) => {
                  setSelectedAudioId(v);
                  if (isStreaming) {
                    void startPreview(isMicOn, isCameraOn, v, selectedVideoId);
                  }
                }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Chọn microphone" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label || `Mic ${audioDevices.indexOf(d) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {onConfirm ? "Hủy" : "Đóng"}
          </Button>
          {onConfirm && (
            <Button
              onClick={() => {
                stopStream();
                onConfirm({
                  audioDeviceId: selectedAudioId || null,
                  videoDeviceId: selectedVideoId || null,
                  isMicOn,
                  isCameraOn,
                });
              }}
              className="gap-2 bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4" />
              Xác nhận & Tham gia
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
