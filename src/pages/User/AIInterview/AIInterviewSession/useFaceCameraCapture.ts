import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CameraPermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

interface UseFaceCameraCaptureOptions {
  frameWidth?: number;
  frameHeight?: number;
}

const resolveCameraErrorMessage = (
  error: unknown
): { state: CameraPermissionState; message: string } => {
  if (!(error instanceof DOMException)) {
    return {
      state: "error",
      message: "Không thể khởi tạo camera. Vui lòng thử lại.",
    };
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return {
      state: "denied",
      message:
        "Bạn đã từ chối quyền camera. Hệ thống vẫn tiếp tục phỏng vấn nhưng có thể giới hạn đánh giá hành vi.",
    };
  }

  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return {
      state: "error",
      message: "Không tìm thấy thiết bị camera phù hợp trên máy của bạn.",
    };
  }

  return {
    state: "error",
    message: "Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.",
  };
};

export function useFaceCameraCapture(options: UseFaceCameraCaptureOptions = {}) {
  const frameWidth = options.frameWidth ?? 480;
  const frameHeight = options.frameHeight ?? 320;

  const isCameraSupported = useMemo(
    () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    []
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [permissionState, setPermissionState] = useState<CameraPermissionState>(
    isCameraSupported ? "idle" : "unsupported"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    isCameraSupported ? null : "Trình duyệt hiện tại không hỗ trợ truy cập camera."
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
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    if (!isCameraSupported) {
      setPermissionState("unsupported");
      setErrorMessage("Trình duyệt hiện tại không hỗ trợ truy cập camera.");
      return false;
    }

    if (streamRef.current) {
      setPermissionState("granted");
      setErrorMessage(null);
      return true;
    }

    setPermissionState("requesting");
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: frameWidth },
          height: { ideal: frameHeight },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      setPermissionState("granted");
      setErrorMessage(null);
      return true;
    } catch (error) {
      stopCamera();
      const resolved = resolveCameraErrorMessage(error);
      setPermissionState(resolved.state);
      setErrorMessage(resolved.message);
      return false;
    }
  }, [frameHeight, frameWidth, isCameraSupported, stopCamera]);

  const captureFrameAsBlob = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null;
    }

    const drawWidth = video.videoWidth || frameWidth;
    const drawHeight = video.videoHeight || frameHeight;

    canvas.width = drawWidth;
    canvas.height = drawHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    context.drawImage(video, 0, 0, drawWidth, drawHeight);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
  }, [frameHeight, frameWidth]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isCameraSupported,
    permissionState,
    errorMessage,
    startCamera,
    stopCamera,
    captureFrameAsBlob,
  };
}
