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
