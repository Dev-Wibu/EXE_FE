import { AlertTriangle, Camera, CameraOff, CircleAlert, ShieldAlert } from "lucide-react";
import type { RefObject } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { CameraPermissionState } from "./useFaceCameraCapture";

interface FacePreviewWidgetProps {
  enabled: boolean;
  modeLabel: string;
  permissionState: CameraPermissionState;
  permissionMessage?: string | null;
  isMonitoring: boolean;
  warningText?: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

const PERMISSION_LABELS: Record<CameraPermissionState, string> = {
  idle: "Chưa khởi tạo",
  requesting: "Đang xin quyền",
  granted: "Đã bật camera",
  denied: "Đã từ chối camera",
  unsupported: "Không hỗ trợ camera",
  error: "Lỗi camera",
};

export function FacePreviewWidget({
  enabled,
  modeLabel,
  permissionState,
  permissionMessage,
  isMonitoring,
  warningText,
  videoRef,
  canvasRef,
}: FacePreviewWidgetProps) {
  if (!enabled) {
    return null;
  }

  const isGranted = permissionState === "granted";
  const showDeniedState = permissionState === "denied";

  return (
    <div className="border-t border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/30">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Theo dõi hành vi khuôn mặt
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Chế độ: {modeLabel}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "rounded-full border text-xs",
              isMonitoring
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}>
            {isMonitoring ? "Đang theo dõi" : PERMISSION_LABELS[permissionState]}
          </Badge>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr]">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            {isGranted ? (
              <video
                ref={videoRef}
                muted
                autoPlay
                playsInline
                className="h-[150px] w-full object-cover md:h-[136px]"
              />
            ) : (
              <div className="flex h-[150px] flex-col items-center justify-center gap-2 text-slate-500 md:h-[136px] dark:text-slate-300">
                {showDeniedState ? (
                  <CameraOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
                <p className="px-3 text-center text-xs">{PERMISSION_LABELS[permissionState]}</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Nếu không bật camera, hệ thống vẫn cho phép phỏng vấn nhưng có thể giới hạn đánh
                  giá hành vi trong kết quả cuối cùng.
                </p>
              </div>
            </div>

            {warningText && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{warningText}</p>
                </div>
              </div>
            )}

            {permissionMessage && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{permissionMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
