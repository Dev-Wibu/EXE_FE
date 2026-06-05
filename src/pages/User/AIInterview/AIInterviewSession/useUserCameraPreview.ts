import type { TFunction } from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type CameraPreviewState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";
const resolveCameraError = (
  error: unknown,
  t: TFunction
): {
  state: CameraPreviewState;
  message: string;
} => {
  if (!(error instanceof DOMException)) {
    return {
      state: "error",
      message: t("userAiinterview.cannotTurnOnTheCamera"),
    };
  }
  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return {
      state: "denied",
      message: t("userAiinterview.youHaveDeniedCameraPermission"),
    };
  }
  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return {
      state: "error",
      message: t("userAiinterview.cameraNotFoundOnCurrent"),
    };
  }
  return {
    state: "error",
    message: t("userAiinterview.cannotAccessCameraPleaseCheck"),
  };
};
const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
  width: {
    ideal: 640,
  },
  height: {
    ideal: 360,
  },
};
export function useUserCameraPreview(
  autoStart = true,
  preferredVideoDeviceId: string | null = null
) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const fallbackToastDeviceIdRef = useRef<string | null>(null);
  const isSupported = useMemo(
    () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    []
  );
  const [state, setState] = useState<CameraPreviewState>(isSupported ? "idle" : "unsupported");
  const [message, setMessage] = useState<string | null>(
    isSupported ? null : t("userAiinterview.currentBrowserDoesNotSupport")
  );
  const stopCamera = useCallback(() => {
    requestIdRef.current += 1;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setState((previousState) => {
      if (
        previousState === "denied" ||
        previousState === "unsupported" ||
        previousState === "error"
      ) {
        return previousState;
      }
      return "idle";
    });
  }, []);
  useEffect(() => {
    fallbackToastDeviceIdRef.current = null;
  }, [preferredVideoDeviceId]);
  const startCamera = useCallback(async () => {
    if (!isSupported) {
      setState("unsupported");
      setMessage(t("userAiinterview.currentBrowserDoesNotSupport"));
      return false;
    }
    if (streamRef.current) {
      setState("granted");
      setMessage(null);
      return true;
    }
    const requestId = ++requestIdRef.current;
    setState("requesting");
    setMessage(null);
    const attachStream = async (stream: MediaStream) => {
      if (requestId !== requestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState("granted");
      return true;
    };
    const preferredConstraints: MediaTrackConstraints = preferredVideoDeviceId
      ? {
          deviceId: {
            exact: preferredVideoDeviceId,
          },
          width: {
            ideal: 640,
          },
          height: {
            ideal: 360,
          },
        }
      : DEFAULT_VIDEO_CONSTRAINTS;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: preferredConstraints,
        audio: false,
      });
      const attached = await attachStream(stream);
      if (!attached) {
        return false;
      }
      setState("granted");
      setMessage(null);
      return true;
    } catch (error) {
      const resolved = resolveCameraError(error, t);
      const canFallbackToDefault = !!preferredVideoDeviceId && resolved.state === "error";
      if (!canFallbackToDefault) {
        stopCamera();
        setState(resolved.state);
        setMessage(resolved.message);
        return false;
      }
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: DEFAULT_VIDEO_CONSTRAINTS,
          audio: false,
        });
        const attached = await attachStream(fallbackStream);
        if (!attached) {
          return false;
        }
        setMessage(t("userAiinterview.unableToOpenTheSelected"));
        if (fallbackToastDeviceIdRef.current !== preferredVideoDeviceId) {
          fallbackToastDeviceIdRef.current = preferredVideoDeviceId;
          toast.warning(t("userAiinterview.unableToOpenTheSelected"));
        }
        return true;
      } catch (fallbackError) {
        stopCamera();
        const fallbackResolved = resolveCameraError(fallbackError, t);
        setState(fallbackResolved.state);
        setMessage(fallbackResolved.message);
        return false;
      }
    }
  }, [isSupported, preferredVideoDeviceId, stopCamera, t]);
  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      stopCamera();
      return;
    }
    void startCamera();
  }, [startCamera, stopCamera]);
  useEffect(() => {
    let timerId: number | null = null;
    if (autoStart) {
      timerId = window.setTimeout(() => {
        void startCamera();
      }, 0);
    }
    return () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);
  useEffect(() => {
    if (state !== "granted") {
      return;
    }
    const videoElement = videoRef.current;
    const stream = streamRef.current;
    if (!videoElement || !stream) {
      return;
    }
    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
    }
    void videoElement.play().catch(() => undefined);
  }, [state]);
  return {
    videoRef,
    isSupported,
    state,
    message,
    isCameraOn: state === "granted",
    startCamera,
    stopCamera,
    toggleCamera,
  };
}
