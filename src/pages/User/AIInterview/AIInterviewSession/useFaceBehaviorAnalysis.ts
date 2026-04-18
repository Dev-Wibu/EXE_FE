import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  interviewFaceAnalysisManager,
  type FaceBehaviorAnalysisResult,
  type FaceBehaviorAnalyzeMode,
  type FaceBehaviorStatus,
} from "@/services/interview-face-analysis.manager";

import {
  FACE_BEHAVIOR_MODE_LABELS,
  getFaceBehaviorFeatureConfig,
  getFaceBehaviorStatusLabel,
  getFaceBehaviorWarningText,
  isFaceBehaviorWarning,
} from "./faceBehavior.config";
import { useFaceCameraCapture } from "./useFaceCameraCapture";

interface UseFaceBehaviorAnalysisParams {
  sessionKey?: string;
  questionOrder: number;
  isListening: boolean;
  isSubmitting: boolean;
  isEvaluating: boolean;
  interviewFinished: boolean;
}

interface FaceBehaviorRuntimeRef {
  sessionKey?: string;
  questionOrder: number;
}

export function useFaceBehaviorAnalysis(params: UseFaceBehaviorAnalysisParams) {
  const config = useMemo(() => getFaceBehaviorFeatureConfig(), []);
  const featureEnabled = config.enabled && config.mode !== "off";
  const activeMode: FaceBehaviorAnalyzeMode =
    config.mode === "off" ? "mock" : (config.mode as FaceBehaviorAnalyzeMode);

  const {
    videoRef,
    canvasRef,
    isCameraSupported,
    permissionState,
    errorMessage,
    startCamera,
    stopCamera,
    captureFrameAsBlob,
  } = useFaceCameraCapture();

  const [lastResult, setLastResult] = useState<FaceBehaviorAnalysisResult | null>(null);
  const [latestWarningText, setLatestWarningText] = useState<string | null>(null);
  const [warningCount, setWarningCount] = useState(0);

  const runtimeRef = useRef<FaceBehaviorRuntimeRef>({
    sessionKey: params.sessionKey,
    questionOrder: params.questionOrder,
  });
  const pendingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const lastWarningStatusRef = useRef<FaceBehaviorStatus | null>(null);
  const warningStreakRef = useRef(0);
  const lastWarningToastAtRef = useRef(0);
  const lastErrorToastAtRef = useRef(0);
  const hasShownCameraDeniedToastRef = useRef(false);

  const clearCaptureInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    runtimeRef.current = {
      sessionKey: params.sessionKey,
      questionOrder: params.questionOrder,
    };
  }, [params.questionOrder, params.sessionKey]);

  const applyAnalysisResult = useCallback(
    (result: FaceBehaviorAnalysisResult) => {
      setLastResult(result);

      const hasWarning = isFaceBehaviorWarning(result.status, result.warning);
      if (!hasWarning) {
        warningStreakRef.current = 0;
        lastWarningStatusRef.current = null;
        setLatestWarningText(null);
        return;
      }

      setWarningCount((previous) => previous + 1);

      const warningText = getFaceBehaviorWarningText(result.status);
      setLatestWarningText(warningText);

      if (lastWarningStatusRef.current === result.status) {
        warningStreakRef.current += 1;
      } else {
        lastWarningStatusRef.current = result.status;
        warningStreakRef.current = 1;
      }

      const now = Date.now();
      if (
        warningStreakRef.current >= config.warningRepeatThreshold &&
        now - lastWarningToastAtRef.current >= config.warningToastCooldownMs
      ) {
        toast.warning(warningText);
        lastWarningToastAtRef.current = now;
      }
    },
    [config.warningRepeatThreshold, config.warningToastCooldownMs]
  );

  const runCaptureCycle = useCallback(async () => {
    if (!featureEnabled || pendingRef.current) {
      return;
    }

    const frameBlob = await captureFrameAsBlob();
    if (!frameBlob) {
      return;
    }

    const runtime = runtimeRef.current;

    pendingRef.current = true;
    try {
      const response = await interviewFaceAnalysisManager.analyze({
        mode: activeMode,
        imageBlob: frameBlob,
        sessionKey: runtime.sessionKey,
        globalQuestionOrder: runtime.questionOrder,
      });

      if (response.success && response.data) {
        applyAnalysisResult(response.data);
        return;
      }

      const now = Date.now();
      if (
        response.error &&
        now - lastErrorToastAtRef.current >= config.warningToastCooldownMs * 2
      ) {
        toast.warning("Tạm thời chưa thể phân tích khuôn mặt. Buổi phỏng vấn vẫn đang tiếp tục.");
        lastErrorToastAtRef.current = now;
      }
    } finally {
      pendingRef.current = false;
    }
  }, [
    activeMode,
    applyAnalysisResult,
    captureFrameAsBlob,
    config.warningToastCooldownMs,
    featureEnabled,
  ]);

  const shouldMonitor =
    featureEnabled &&
    params.isListening &&
    !params.isSubmitting &&
    !params.isEvaluating &&
    !params.interviewFinished;

  useEffect(() => {
    if (!featureEnabled) {
      clearCaptureInterval();
      stopCamera();
      return;
    }

    if (!shouldMonitor) {
      clearCaptureInterval();
      if (!params.isListening || params.interviewFinished) {
        stopCamera();
      }
      return;
    }

    let disposed = false;

    const startMonitoring = async () => {
      const started = await startCamera();
      if (!started || disposed) {
        return;
      }

      await runCaptureCycle();
      if (disposed) {
        return;
      }

      clearCaptureInterval();
      intervalRef.current = window.setInterval(() => {
        void runCaptureCycle();
      }, config.captureIntervalMs);
    };

    void startMonitoring();

    return () => {
      disposed = true;
      clearCaptureInterval();
      if (!params.isListening) {
        stopCamera();
      }
    };
  }, [
    clearCaptureInterval,
    config.captureIntervalMs,
    featureEnabled,
    params.interviewFinished,
    params.isEvaluating,
    params.isListening,
    params.isSubmitting,
    runCaptureCycle,
    shouldMonitor,
    startCamera,
    stopCamera,
  ]);

  useEffect(() => {
    if (!featureEnabled || permissionState !== "denied") {
      if (permissionState === "granted") {
        hasShownCameraDeniedToastRef.current = false;
      }
      return;
    }

    if (hasShownCameraDeniedToastRef.current) {
      return;
    }

    hasShownCameraDeniedToastRef.current = true;
    toast.error(
      "Bạn đang tắt camera. Hệ thống vẫn cho phép phỏng vấn nhưng có thể giới hạn đánh giá hành vi."
    );
    setLatestWarningText(
      "Camera chưa được bật. Kết quả đánh giá hành vi có thể bị giới hạn trong phiên này."
    );
  }, [featureEnabled, permissionState]);

  const statusLabel = getFaceBehaviorStatusLabel(lastResult?.status);
  const hasWarning = isFaceBehaviorWarning(lastResult?.status, lastResult?.warning);

  return {
    featureEnabled,
    mode: config.mode,
    modeLabel: FACE_BEHAVIOR_MODE_LABELS[config.mode],
    isMonitoring: shouldMonitor && permissionState === "granted",
    isCameraSupported,
    permissionState,
    permissionMessage: errorMessage,
    videoRef,
    canvasRef,
    lastStatus: lastResult?.status ?? null,
    statusLabel,
    hasWarning,
    latestWarningText,
    warningCount,
  };
}
