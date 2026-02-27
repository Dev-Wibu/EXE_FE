import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { $api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
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

// ============================================================================
// Sub-components
// ============================================================================

function InterviewHeader({
  phaseName,
  questionIndex,
  totalQuestions,
  finished,
  onBack,
}: {
  phaseName: string;
  questionIndex: number;
  totalQuestions: number;
  finished: boolean;
  onBack: () => void;
}) {
  const progress = totalQuestions > 0 ? (questionIndex / totalQuestions) * 100 : 0;

  return (
    <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80">
      <div className="flex items-center gap-3 px-6 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-lg font-bold">Phỏng vấn với AI</h1>
          <div className="flex items-center gap-2">
            {phaseName && (
              <Badge variant="secondary" className="text-xs">
                {phaseName}
              </Badge>
            )}
            {!finished && totalQuestions > 0 && (
              <span className="text-muted-foreground text-xs">
                Câu {questionIndex}/{totalQuestions}
              </span>
            )}
            {finished && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Hoàn thành
              </Badge>
            )}
          </div>
        </div>
      </div>
      {!finished && totalQuestions > 0 && (
        <Progress value={progress} className="h-1 rounded-none" />
      )}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAI = message.role === "ai";

  return (
    <div className={cn("flex gap-3", isAI ? "justify-start" : "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isAI
            ? "bg-gradient-to-br from-[#0047AB] to-[#007BFF]"
            : "bg-emerald-100 dark:bg-emerald-900/40"
        )}>
        {isAI ? (
          <Bot className="h-5 w-5 text-white" />
        ) : (
          <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>

      {/* Bubble */}
      <div className="flex max-w-[75%] flex-col gap-1">
        {isAI && message.meta?.questionType && (
          <Badge variant="outline" className="w-fit text-[10px]">
            {message.meta.questionType}
          </Badge>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isAI
              ? "rounded-tl-sm bg-slate-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
              : "rounded-tr-sm bg-[#0047AB] text-white"
          )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <span
          className={cn("text-muted-foreground text-[11px]", isAI ? "text-left" : "text-right")}>
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
        <Bot className="h-5 w-5 text-white" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-zinc-800">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function ChatInput({
  onSend,
  disabled,
  placeholder,
}: {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    // Dùng setTimeout 0ms để đảm bảo DOM đã render xong trước khi focus
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <div className="border-t bg-white p-4 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-4xl items-end gap-3">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Nhập câu trả lời của bạn..."}
            disabled={disabled}
            rows={1}
            className="border-border focus:ring-primary/20 w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm transition-colors focus:border-[#0047AB] focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800"
            aria-label="Nhập câu trả lời"
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl bg-[#0047AB] hover:bg-[#005B9A]">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export function AIInterviewSessionPage() {
  const navigate = useNavigate();

  // Đọc session key từ localStorage thay vì URL params
  const [sessionKey] = useState<string | undefined>(() => {
    return localStorage.getItem("current-interview-session-key") ?? undefined;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(1);

  const submitMutation = $api.useMutation("post", "/api/v1/interview/submit");

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  const getNow = () =>
    new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const addAIMessage = useCallback(
    (data: {
      questionContent?: string;
      phaseName?: string;
      currentQuestionIndex?: number;
      totalQuestionsInPhase?: number;
      questionType?: string;
      finished?: boolean;
    }) => {
      if (data.phaseName) setCurrentPhase(data.phaseName);
      if (data.currentQuestionIndex) setCurrentQuestionIndex(data.currentQuestionIndex);
      if (data.totalQuestionsInPhase) setTotalQuestions(data.totalQuestionsInPhase);

      if (data.finished) {
        setInterviewFinished(true);
        setMessages((prev) => [
          ...prev,
          {
            id: msgIdCounter.current++,
            role: "ai",
            content:
              "Cuộc phỏng vấn đã kết thúc. Cảm ơn bạn đã tham gia! Bạn có thể xem kết quả đánh giá chi tiết.",
            timestamp: getNow(),
          },
        ]);
        return;
      }

      if (data.questionContent) {
        setMessages((prev) => [
          ...prev,
          {
            id: msgIdCounter.current++,
            role: "ai",
            content: data.questionContent!,
            timestamp: getNow(),
            meta: {
              phaseName: data.phaseName,
              questionIndex: data.currentQuestionIndex,
              totalQuestions: data.totalQuestionsInPhase,
              questionType: data.questionType,
            },
          },
        ]);
      }
    },
    []
  );

  // Start interview — GET /api/v1/interview/start/{sessionKey}
  const {
    data: startData,
    isLoading: isStarting,
    error: startError,
  } = $api.useQuery(
    "get",
    "/api/v1/interview/start/{sessionKey}",
    { params: { path: { sessionKey: sessionKey ?? "" } } },
    { enabled: !!sessionKey && !hasStarted }
  );

  // Process the start response once
  useEffect(() => {
    if (startData && !hasStarted) {
      setHasStarted(true);

      // Nếu phỏng vấn đã hoàn tất trước đó (finished === true từ start response)
      if (startData.finished) {
        setInterviewFinished(true);
        setMessages([
          {
            id: msgIdCounter.current++,
            role: "ai",
            content:
              "Cuộc phỏng vấn này đã hoàn tất trước đó. Bạn có thể xem kết quả đánh giá chi tiết.",
            timestamp: getNow(),
          },
        ]);
        return;
      }

      setTimeout(() => {
        addAIMessage(startData);
      }, 600);
    }
  }, [startData, hasStarted, addAIMessage]);

  // Handle send answer
  const handleSendAnswer = useCallback(
    async (answer: string) => {
      if (!sessionKey || isSubmitting || interviewFinished) return;

      setMessages((prev) => [
        ...prev,
        {
          id: msgIdCounter.current++,
          role: "user",
          content: answer,
          timestamp: getNow(),
        },
      ]);

      setIsSubmitting(true);
      try {
        const response = await submitMutation.mutateAsync({
          body: { sessionKey, answer },
        });
        addAIMessage(response);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: msgIdCounter.current++,
            role: "ai",
            content: "Đã xảy ra lỗi khi xử lý câu trả lời. Vui lòng thử gửi lại.",
            timestamp: getNow(),
          },
        ]);
      } finally {
        setIsSubmitting(false);
      }
    },
    [sessionKey, isSubmitting, interviewFinished, submitMutation, addAIMessage]
  );

  // ---- Error state ----
  if (!sessionKey) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không tìm thấy phiên phỏng vấn</AlertTitle>
          <AlertDescription>Thiếu session key. Vui lòng tạo phiên phỏng vấn mới.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (startError) {
    const errorBody =
      (startError as { message?: string })?.message ?? JSON.stringify(startError).slice(0, 200);
    const isExpired =
      errorBody.includes("not found") || errorBody.includes("expired") || errorBody.includes("404");

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isExpired ? "Phiên phỏng vấn không tồn tại" : "Lỗi khởi động phỏng vấn"}
          </AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              {isExpired
                ? "Phiên phỏng vấn đã hết hạn hoặc không tồn tại. Vui lòng tạo phiên mới."
                : "Không thể bắt đầu phiên phỏng vấn. Vui lòng thử lại."}
            </p>
            {import.meta.env.DEV && errorBody && (
              <p className="text-xs break-all opacity-70">Chi tiết: {errorBody}</p>
            )}
          </AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/dashboard/ai-interview")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Button>
          <Button
            onClick={() => navigate("/dashboard/ai-interview/payment")}
            className="bg-[#0047AB] text-white hover:bg-[#005B9A]">
            Tạo phỏng vấn mới
          </Button>
        </div>
      </div>
    );
  }

  // ---- Loading state ----
  if (isStarting) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#0047AB]" />
          <p className="text-muted-foreground font-medium">Đang khởi động phỏng vấn...</p>
        </div>
      </div>
    );
  }

  // ---- Main chat UI ----
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header with progress */}
      <InterviewHeader
        phaseName={currentPhase}
        questionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        finished={interviewFinished}
        onBack={() => navigate("/dashboard/ai-interview")}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isSubmitting && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input or completion actions */}
      {interviewFinished ? (
        <div className="border-t bg-white p-4 dark:bg-zinc-900">
          <Card className="mx-auto max-w-4xl border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Phỏng vấn hoàn tất!
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Xem đánh giá chi tiết và điểm số của bạn
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  // Xóa sessionKey khỏi localStorage vì phỏng vấn đã xong
                  if (sessionKey) {
                    try {
                      const stored = JSON.parse(
                        localStorage.getItem("interview-session-keys") ?? "{}"
                      );
                      delete stored[sessionKey];
                      localStorage.setItem("interview-session-keys", JSON.stringify(stored));
                    } catch {
                      /* ignore */
                    }
                  }
                  navigate("/dashboard/ai-interview");
                }}
                className="bg-emerald-600 text-white hover:bg-emerald-700">
                Xem kết quả
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <ChatInput
          onSend={handleSendAnswer}
          disabled={isSubmitting || !hasStarted}
          placeholder={
            isSubmitting
              ? "AI đang xử lý..."
              : "Nhập câu trả lời của bạn... (Enter để gửi, Shift+Enter để xuống dòng)"
          }
        />
      )}
    </div>
  );
}
