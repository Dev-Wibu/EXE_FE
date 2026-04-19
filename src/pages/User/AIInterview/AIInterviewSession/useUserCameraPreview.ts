import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CameraPreviewState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

const resolveCameraError = (error: unknown): { state: CameraPreviewState; message: string } => {
  if (!(error instanceof DOMException)) {
    return {
      state: "error",
      message: "Không thể bật camera. Vui lòng thử lại.",
    };
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return {
      state: "denied",
      message: "Bạn đã từ chối quyền camera. Có thể tiếp tục phỏng vấn mà không bật camera.",
    };
  }

  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return {
      state: "error",
      message: "Không tìm thấy camera trên thiết bị hiện tại.",
    };
  }

  return {
    state: "error",
    message: "Không thể truy cập camera. Vui lòng kiểm tra lại thiết bị và quyền truy cập.",
  };
};

export function useUserCameraPreview(autoStart = true) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = useMemo(
    () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    []
  );

  const [state, setState] = useState<CameraPreviewState>(isSupported ? "idle" : "unsupported");
  const [message, setMessage] = useState<string | null>(
    isSupported ? null : "Trình duyệt hiện tại không hỗ trợ camera."
  );

  const stopCamera = useCallback(() => {
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

  const startCamera = useCallback(async () => {
    if (!isSupported) {
      setState("unsupported");
      setMessage("Trình duyệt hiện tại không hỗ trợ camera.");
      return false;
    }

    if (streamRef.current) {
      setState("granted");
      setMessage(null);
      return true;
    }

    setState("requesting");
    setMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 360 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      setState("granted");
      setMessage(null);
      return true;
    } catch (error) {
      stopCamera();
      const resolved = resolveCameraError(error);
      setState(resolved.state);
      setMessage(resolved.message);
      return false;
    }
  }, [isSupported, stopCamera]);

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
