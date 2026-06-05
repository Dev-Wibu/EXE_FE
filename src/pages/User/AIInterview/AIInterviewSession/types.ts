import type { TFunction } from "i18next";

export interface ChatMessage {
  id: number;
  role: "ai" | "user";
  content: string;
  timestamp: string;
  meta?: {
    phaseName?: string;
    questionIndex?: number;
    totalQuestions?: number;
    questionType?: string;
  };
}
export type SpeechLanguageCode = "vi-VN" | "en-US";
export const buildSpeechLanguageLabels = (t: TFunction): Record<SpeechLanguageCode, string> => ({
  "vi-VN": t("common.vietnamese"),
  "en-US": "English",
});
