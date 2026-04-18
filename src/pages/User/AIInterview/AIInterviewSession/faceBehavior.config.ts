import type {
  FaceBehaviorAnalyzeMode,
  FaceBehaviorStatus,
} from "@/services/interview-face-analysis.manager";

export type FaceBehaviorFeatureMode = FaceBehaviorAnalyzeMode | "off";

export interface FaceBehaviorFeatureConfig {
  enabled: boolean;
  mode: FaceBehaviorFeatureMode;
  captureIntervalMs: number;
  warningToastCooldownMs: number;
  warningRepeatThreshold: number;
}

const DEFAULT_CONFIG: FaceBehaviorFeatureConfig = {
  enabled: false,
  mode: "off",
  captureIntervalMs: 1000,
  warningToastCooldownMs: 8000,
  warningRepeatThreshold: 2,
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return fallback;
};

const parsePositiveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const parseFeatureMode = (value: string | undefined): FaceBehaviorFeatureMode => {
  if (!value) {
    return DEFAULT_CONFIG.mode;
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized === "off" ||
    normalized === "mock" ||
    normalized === "analysis" ||
    normalized === "proctoring" ||
    normalized === "auto"
  ) {
    return normalized;
  }

  return DEFAULT_CONFIG.mode;
};

export const getFaceBehaviorFeatureConfig = (): FaceBehaviorFeatureConfig => {
  const enabled = parseBoolean(import.meta.env.VITE_AI_INTERVIEW_FACE_BEHAVIOR_ENABLED, false);
  const mode = parseFeatureMode(import.meta.env.VITE_AI_INTERVIEW_FACE_BEHAVIOR_MODE);

  return {
    enabled,
    mode,
    captureIntervalMs: parsePositiveNumber(
      import.meta.env.VITE_AI_INTERVIEW_FACE_CAPTURE_INTERVAL_MS,
      DEFAULT_CONFIG.captureIntervalMs
    ),
    warningToastCooldownMs: parsePositiveNumber(
      import.meta.env.VITE_AI_INTERVIEW_FACE_WARNING_TOAST_COOLDOWN_MS,
      DEFAULT_CONFIG.warningToastCooldownMs
    ),
    warningRepeatThreshold: parsePositiveNumber(
      import.meta.env.VITE_AI_INTERVIEW_FACE_WARNING_REPEAT_THRESHOLD,
      DEFAULT_CONFIG.warningRepeatThreshold
    ),
  };
};

export const FACE_BEHAVIOR_MODE_LABELS: Record<FaceBehaviorFeatureMode, string> = {
  off: "Tắt",
  mock: "Mô phỏng",
  analysis: "Phân tích ảnh",
  proctoring: "Ghi nhận proctoring",
  auto: "Tự động",
};

export const FACE_BEHAVIOR_STATUS_LABELS: Record<FaceBehaviorStatus, string> = {
  TURNING_LEFT: "Quay đầu sang trái",
  TURNING_RIGHT: "Quay đầu sang phải",
  BOWING_HEAD: "Cúi đầu",
  LOOKING_UP_HEAD: "Ngẩng đầu lên cao",
  TOO_CLOSE: "Quá gần camera",
  TOO_FAR: "Quá xa camera",
  GLANCING_LEFT: "Liếc mắt sang trái",
  GLANCING_RIGHT: "Liếc mắt sang phải",
  LOOKING_UP_EYES: "Đảo mắt lên trên",
  LOOKING_DOWN_EYES: "Nhìn xuống",
  NORMAL: "Bình thường",
  UNKNOWN: "Chưa xác định",
};

export const FACE_BEHAVIOR_WARNING_TEXTS: Record<FaceBehaviorStatus, string> = {
  TURNING_LEFT: "Bạn đang quay đầu sang trái quá lâu. Hãy nhìn thẳng vào màn hình.",
  TURNING_RIGHT: "Bạn đang quay đầu sang phải quá lâu. Hãy nhìn thẳng vào màn hình.",
  BOWING_HEAD: "Bạn đang cúi đầu. Hãy giữ tư thế thẳng để hệ thống đánh giá ổn định hơn.",
  LOOKING_UP_HEAD: "Bạn đang ngẩng đầu quá cao. Hãy đưa khuôn mặt về giữa khung hình.",
  TOO_CLOSE: "Khuôn mặt đang quá gần camera. Vui lòng ngồi lùi lại một chút.",
  TOO_FAR: "Khuôn mặt đang quá xa camera. Vui lòng ngồi gần hơn một chút.",
  GLANCING_LEFT: "Bạn đang liếc mắt sang trái nhiều lần. Hãy tập trung vào buổi phỏng vấn.",
  GLANCING_RIGHT: "Bạn đang liếc mắt sang phải nhiều lần. Hãy tập trung vào buổi phỏng vấn.",
  LOOKING_UP_EYES: "Bạn đang đảo mắt lên trên nhiều lần. Hãy giữ ánh nhìn ổn định.",
  LOOKING_DOWN_EYES:
    "Bạn đang nhìn xuống nhiều lần. Hãy nhìn vào màn hình để kết quả chính xác hơn.",
  NORMAL: "Tư thế khuôn mặt đang ổn định.",
  UNKNOWN: "Hệ thống chưa xác định rõ hành vi khuôn mặt ở khung hình gần nhất.",
};

export const getFaceBehaviorStatusLabel = (status?: FaceBehaviorStatus | null): string => {
  if (!status) {
    return "Chưa có dữ liệu";
  }

  return FACE_BEHAVIOR_STATUS_LABELS[status] ?? FACE_BEHAVIOR_STATUS_LABELS.UNKNOWN;
};

export const getFaceBehaviorWarningText = (status?: FaceBehaviorStatus | null): string => {
  if (!status) {
    return FACE_BEHAVIOR_WARNING_TEXTS.UNKNOWN;
  }

  return FACE_BEHAVIOR_WARNING_TEXTS[status] ?? FACE_BEHAVIOR_WARNING_TEXTS.UNKNOWN;
};

export const isFaceBehaviorWarning = (
  status?: FaceBehaviorStatus | null,
  warning?: boolean
): boolean => {
  if (typeof warning === "boolean") {
    return warning;
  }

  if (!status) {
    return false;
  }

  return status !== "NORMAL" && status !== "UNKNOWN";
};
