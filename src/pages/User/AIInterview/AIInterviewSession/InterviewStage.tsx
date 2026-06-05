import logo from "@/assets/icon.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Camera, CameraOff, GripVertical, LoaderCircle, Mic, MicOff } from "lucide-react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CameraPreviewState } from "./useUserCameraPreview";
const CAMERA_PANEL_MIN_WIDTH = 240;
const CAMERA_PANEL_MAX_WIDTH = 520;
const CAMERA_PANEL_DEFAULT_WIDTH = 360;
const CAMERA_PANEL_COLLAPSED_HEIGHT = 100;
interface InterviewStageProps {
  phaseName: string;
  questionIndex: number;
  totalQuestions: number;
  interviewFinished: boolean;
  sessionExpiredMidway: boolean;
  isListening: boolean;
  isSpeechSupported: boolean;
  canUseSpeechInput: boolean;
  speechLanguageLabel: string;
  isSubmitting: boolean;
  isEvaluating: boolean;
  cameraState: CameraPreviewState;
  cameraMessage: string | null;
  cameraVideoRef: RefObject<HTMLVideoElement | null>;
  onToggleListening: () => void;
  onToggleCamera: () => void;
}
export function InterviewStage({
  phaseName,
  questionIndex,
  totalQuestions,
  interviewFinished,
  sessionExpiredMidway,
  isListening,
  isSpeechSupported,
  canUseSpeechInput,
  speechLanguageLabel,
  isSubmitting,
  isEvaluating,
  cameraState,
  cameraMessage,
  cameraVideoRef,
  onToggleListening,
  onToggleCamera,
}: InterviewStageProps) {
  const { t } = useTranslation();

  const CAMERA_STATE_LABELS: Record<CameraPreviewState, string> = {
    idle: t("userAiinterview.cameraIsOff"),
    requesting: t("userAiinterview.askingForCameraPermission"),
    granted: t("userAiinterview.cameraIsOn"),
    denied: t("userAiinterview.cameraPermissionDenied"),
    unsupported: t("userAiinterview.cameraIsNotSupported"),
    error: t("userAiinterview.cameraError"),
  };
  const resolveStageStatus = (params: {
    interviewFinished: boolean;
    sessionExpiredMidway: boolean;
    isEvaluating: boolean;
    isSubmitting: boolean;
    isListening: boolean;
  }): string => {
    if (params.sessionExpiredMidway) return t("userAiinterview.sessionHasExpiredPleaseCreate");
    if (params.interviewFinished) return t("userAiinterview.interviewCompletedYouCanSee");
    if (params.isEvaluating) return t("userAiinterview.aiIsEvaluatingYourResponses");
    if (params.isSubmitting) return t("userAiinterview.aiIsProcessingTheAnswer");
    if (params.isListening) return t("userAiinterview.recordingYourAnswer");
    return t("userAiinterview.pressTheMicToStart");
  };

  const [cameraPanelWidth, setCameraPanelWidth] = useState(CAMERA_PANEL_DEFAULT_WIDTH);
  const resizeStartRef = useRef({
    pointerId: -1,
    startX: 0,
    startWidth: CAMERA_PANEL_DEFAULT_WIDTH,
  });
  const clampPanelWidth = useCallback((nextWidth: number) => {
    if (typeof window === "undefined") {
      return Math.min(CAMERA_PANEL_MAX_WIDTH, Math.max(CAMERA_PANEL_MIN_WIDTH, nextWidth));
    }
    const viewportMax = Math.min(
      CAMERA_PANEL_MAX_WIDTH,
      Math.max(CAMERA_PANEL_MIN_WIDTH, window.innerWidth - 24)
    );
    return Math.min(viewportMax, Math.max(CAMERA_PANEL_MIN_WIDTH, nextWidth));
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleWindowResize = () => {
      setCameraPanelWidth((prevWidth) => clampPanelWidth(prevWidth));
    };
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [clampPanelWidth]);
  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
    };
  }, []);
  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      resizeStartRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth: cameraPanelWidth,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.userSelect = "none";
    },
    [cameraPanelWidth]
  );
  const handleResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (resizeStartRef.current.pointerId !== event.pointerId) {
        return;
      }
      const deltaX = resizeStartRef.current.startX - event.clientX;
      const nextWidth = resizeStartRef.current.startWidth + deltaX;
      setCameraPanelWidth(clampPanelWidth(nextWidth));
    },
    [clampPanelWidth]
  );
  const handleResizePointerUp = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (resizeStartRef.current.pointerId !== event.pointerId) {
      return;
    }
    resizeStartRef.current.pointerId = -1;
    document.body.style.userSelect = "";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);
  const stageStatus = resolveStageStatus({
    interviewFinished,
    sessionExpiredMidway,
    isEvaluating,
    isSubmitting,
    isListening,
  });
  const canShowPulse = !interviewFinished && (isListening || isSubmitting || isEvaluating);
  const canToggleMic = isSpeechSupported && (isListening || canUseSpeechInput);
  const isCameraCollapsed = cameraState === "idle";
  return (
    <section className="relative flex min-h-80 flex-1 items-center justify-center overflow-hidden border-b border-slate-800 bg-slate-950 px-4 py-6 md:border-r md:border-b-0 md:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_56%),radial-gradient(circle_at_bottom,rgba(14,116,144,0.35),rgba(2,6,23,1)_64%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-size-[22px_22px] opacity-35" />

      <div className="absolute top-4 left-4 z-20 flex max-w-[70%] flex-wrap items-center gap-2">
        {phaseName && (
          <Badge className="rounded-full bg-cyan-600/85 text-white hover:bg-cyan-600/85">
            {phaseName}
          </Badge>
        )}
        {!interviewFinished && totalQuestions > 0 && (
          <Badge
            variant="outline"
            className="rounded-full border-slate-500 bg-slate-900/80 text-slate-100">
            {t("common.sentence")} {questionIndex}/{totalQuestions}
          </Badge>
        )}
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div
          className={cn(
            "relative flex h-44 w-44 items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_50px_rgba(8,145,178,0.45)] backdrop-blur-sm md:h-52 md:w-52",
            canShowPulse && "animate-pulse"
          )}>
          {canShowPulse && (
            <span className="absolute inset-0 animate-ping rounded-full border border-cyan-300/60" />
          )}
          <img
            src={logo}
            alt={t("common.aiInterview")}
            className="relative h-20 w-20 object-contain md:h-24 md:w-24"
          />
        </div>

        <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">
          {t("userAiinterview.aiInterviewAssistant")}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">{stageStatus}</p>

        {isListening && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200">
            <Mic className="h-3.5 w-3.5" />
            {t("userAiinterview.recording")}
          </div>
        )}
      </div>

      <div
        data-testid="camera-panel"
        className={cn(
          "absolute top-4 right-4 z-20 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 shadow-lg shadow-black/40",
          isCameraCollapsed && "h-[100px]"
        )}
        style={{
          width: `${cameraPanelWidth}px`,
          maxWidth: "calc(100% - 0.5rem)",
          minWidth: `${CAMERA_PANEL_MIN_WIDTH}px`,
          height: isCameraCollapsed ? `${CAMERA_PANEL_COLLAPSED_HEIGHT}px` : undefined,
        }}>
        {!isCameraCollapsed && (
          <div className="relative aspect-video bg-slate-950">
            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "h-full w-full object-cover transition-opacity duration-200",
                cameraState === "granted" ? "opacity-100" : "opacity-0"
              )}
            />
            {cameraState !== "granted" && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
                {cameraState === "requesting" ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : cameraState === "denied" ? (
                  <CameraOff className="h-5 w-5 text-amber-300" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
                <p className="px-2 text-center text-[11px] leading-tight">
                  {CAMERA_STATE_LABELS[cameraState]}
                </p>
              </div>
            )}
          </div>
        )}

        <div
          className={cn(
            "p-2.5",
            isCameraCollapsed ? "flex h-full flex-col justify-between" : "space-y-2"
          )}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-200">
              <Bot className="h-3.5 w-3.5 text-cyan-300" />
              <span>{t("userAiinterview.yourCamera")}</span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={onToggleCamera}
              className="h-7 rounded-lg bg-slate-700 px-2 text-[10px] text-white hover:bg-slate-600">
              {cameraState === "granted" ? t("userAiinterview.turnOff") : t("common.turnOn")}
            </Button>
          </div>

          {isCameraCollapsed ? (
            <p className="line-clamp-1 text-[10px] leading-snug text-slate-400">
              {CAMERA_STATE_LABELS[cameraState]}
            </p>
          ) : (
            cameraMessage && (
              <p className="line-clamp-2 text-[10px] leading-snug text-slate-400 md:line-clamp-3">
                {cameraMessage}
              </p>
            )
          )}
        </div>

        <button
          type="button"
          aria-label={t("userAiinterview.dragToResizeTheCamera")}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
          className="absolute bottom-1 left-1 z-30 inline-flex h-5 w-5 cursor-ew-resize items-center justify-center rounded-md bg-slate-800/80 text-slate-300 hover:bg-slate-700">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
        <Button
          type="button"
          onClick={onToggleListening}
          disabled={!canToggleMic}
          className={cn(
            "h-16 min-w-72 rounded-full px-6 text-base font-semibold shadow-[0_16px_40px_rgba(2,132,199,0.35)] transition-all",
            isListening
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-cyan-600 text-white hover:bg-cyan-700",
            !canToggleMic && "cursor-not-allowed opacity-60"
          )}>
          <span className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </span>
          {isListening
            ? t("userAiinterview.stopRecordingAndSendImmediately")
            : t("general.startSpeaking", {
                var_0: speechLanguageLabel,
              })}
        </Button>

        {!isSpeechSupported && (
          <p className="mt-2 text-center text-xs text-slate-300">
            {t("userAiinterview.currentBrowsersDoNotSupport")}
          </p>
        )}
      </div>
    </section>
  );
}
