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

export const SPEECH_LANGUAGE_LABELS: Record<SpeechLanguageCode, string> = {
  "vi-VN": "Tiếng Việt",
  "en-US": "English",
};
