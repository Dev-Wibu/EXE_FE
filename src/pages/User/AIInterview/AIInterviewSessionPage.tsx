import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import logo from "@/assets/icon.svg";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpeechRecognition, useSpeechSynthesis } from "@/hooks";
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

function ChatBubble({
  message,
  userAvatarUrl,
  onSpeak,
  speakingId,
}: {
  message: ChatMessage;
  userAvatarUrl?: string;
  onSpeak?: (text: string, id: number) => void;
  speakingId?: string | number | null;
}) {
  const isAI = message.role === "ai";
  const isThisSpeaking = speakingId === message.id;

  return (
    <div className={cn("flex gap-3", isAI ? "justify-start" : "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full",
          isAI
            ? "bg-gradient-to-br from-[#0047AB] to-[#007BFF]"
            : "bg-emerald-100 dark:bg-emerald-900/40"
        )}>
        {isAI ? (
          <img src={logo} alt="AI" className="h-6 w-6 object-contain" />
        ) : userAvatarUrl ? (
          <img src={userAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>

      {/* Bubble */}
      <div className="group flex max-w-[75%] flex-col gap-1">
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
        <div className={cn("flex items-center gap-1", isAI ? "justify-start" : "justify-end")}>
          <span
            className={cn("text-muted-foreground text-[11px]", isAI ? "text-left" : "text-right")}>
            {message.timestamp}
          </span>
          {isAI && onSpeak && (
            <button
              onClick={() => onSpeak(message.content, message.id)}
              title={isThisSpeaking ? "Dừng đọc" : "Đọc to tin nhắn"}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full transition-all",
                "opacity-0 group-hover:opacity-100 focus:opacity-100",
                isThisSpeaking
                  ? "text-[#0047AB] opacity-100"
                  : "text-muted-foreground hover:text-[#0047AB]"
              )}>
              {isThisSpeaking ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
        <img src={logo} alt="AI" className="h-6 w-6 object-contain" />
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

function EvaluatingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#0047AB] to-[#007BFF]">
        <img src={logo} alt="AI" className="h-6 w-6 object-contain" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-blue-50 px-4 py-3 dark:bg-blue-950/40">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-pulse text-[#0047AB]" />
          <span className="text-sm font-medium text-[#0047AB] dark:text-blue-300">
            AI đang đánh giá buổi phỏng vấn...
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatInput({
  onSend,
  disabled,
  placeholder,
  isListening,
  interimTranscript,
  isSpeechSupported,
  value,
  onValueChange,
  onStartListening,
  onStopListening,
}: {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
  isListening: boolean;
  interimTranscript: string;
  isSpeechSupported: boolean;
  value: string;
  onValueChange: (val: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    onValueChange("");
    // Dùng setTimeout 0ms để đảm bảo DOM đã render xong trước khi focus
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value, disabled, onSend, onValueChange]);

  // Tự động focus lại khi AI trả lời xong (disabled chuyển true → false)
  const prevDisabledRef = useRef(disabled);
  useEffect(() => {
    if (prevDisabledRef.current && !disabled) {
      inputRef.current?.focus();
    }
    prevDisabledRef.current = disabled;
  }, [disabled]);

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

  // Ghép interim transcript vào cuối để preview realtime khi đang nói
  const displayValue =
    isListening && interimTranscript ? (value ? value + " " : "") + interimTranscript : value;

  return (
    <div className="border-t bg-white p-4 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-4xl items-end gap-3">
        {isSpeechSupported && (
          <Button
            onClick={() => (isListening ? onStopListening() : onStartListening())}
            disabled={disabled}
            size="icon"
            title={isListening ? "Dừng nhận dạng giọng nói" : "Bắt đầu nói (vi-VN)"}
            className={cn(
              "h-11 w-11 shrink-0 rounded-xl transition-all",
              isListening
                ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300"
            )}>
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={displayValue}
            onChange={(e) => {
              if (!isListening) onValueChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Đang lắng nghe... nói tiếng Việt rõ ràng"
                : (placeholder ?? "Nhập câu trả lời của bạn...")
            }
            disabled={disabled}
            rows={1}
            className={cn(
              "border-border focus:ring-primary/20 w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800",
              isListening
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "focus:border-[#0047AB] focus:ring-2"
            )}
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
      {isListening && (
        <p className="text-muted-foreground mt-2 text-center text-xs">
          <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Đang nghe... Nhấn nút mic lần nữa để dừng
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export function AIInterviewSessionPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // chatInputValue là state được lift lên từ ChatInput để callback STT có thể cập nhật trực tiếp
  const [chatInputValue, setChatInputValue] = useState("");

  // Khởi tạo STT (Speech-to-Text) — onFinalTranscript gọi trực tiếp từ native event, không qua useEffect
  const {
    isListening,
    interimTranscript,
    isSupported: isSpeechRecognitionSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition("vi-VN", (finalText) => {
    setChatInputValue((prev) => (prev.trim() ? prev.trim() + " " + finalText : finalText));
  });

  const {
    speakingId,
    isSupported: isTTSSupported,
    speak,
    cancel: cancelSpeech,
  } = useSpeechSynthesis("vi-VN");

  // Toggle TTS cho một tin nhắn — nếu đang phát tin này thì dừng, ngược lại phát mới
  const handleToggleSpeak = useCallback(
    (text: string, id: number) => {
      if (speakingId === id) {
        cancelSpeech();
      } else {
        speak(text, id);
      }
    },
    [speak, cancelSpeech, speakingId]
  );

  // Đọc session key từ URL params
  const [searchParams] = useSearchParams();
  const sessionKey = searchParams.get("sessionKey") ?? undefined;

  const [sessionExpiredMidway, setSessionExpiredMidway] = useState(false);

  // Kiểm tra xem phiên có đã được đánh dấu hoàn thành trong localStorage chưa
  const [isAlreadyFinished] = useState<boolean>(() => {
    if (!sessionKey) return false;
    return localStorage.getItem(`interview-finished-${sessionKey}`) === "true";
  });

  // Khôi phục lịch sử chat từ localStorage khi tải lại trang
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!sessionKey) return [];
    try {
      const saved = localStorage.getItem(`interview-chat-${sessionKey}`);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as ChatMessage[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  // isEvaluating = true trong khoảng 3 giây sau khi trả lời xong câu hỏi cuối cùng
  const [isEvaluating, setIsEvaluating] = useState(false);
  // Khôi phục trạng thái finished nếu phiên đã hoàn thành trước đó
  const [interviewFinished, setInterviewFinished] = useState(isAlreadyFinished);
  const [currentPhase, setCurrentPhase] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  // hasStarted = true ngay nếu đã có lịch sử chat hoặc phiên đã hoàn thành
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    if (isAlreadyFinished) return true;
    if (!sessionKey) return false;
    try {
      const saved = localStorage.getItem(`interview-chat-${sessionKey}`);
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(1);
  // Dùng ref thay vì state để guard khỏi StrictMode double-invocation
  const hasProcessedStartRef = useRef(false);
  // Guard để tránh khôi phục từ cache nhiều lần
  const hasRestoredFromCacheRef = useRef(false);

  // Lấy trạng thái Redis của phiên đang chạy — dùng để:
  // 1. Lấy dbId (numeric session ID) cho navigate đến trang kết quả
  // 2. Khôi phục lịch sử chat khi localStorage bị xóa
  const { data: cacheData } = $api.useQuery(
    "get",
    "/api/interview-sessions/cache/{sessionKey}",
    { params: { path: { sessionKey: sessionKey ?? "" } } },
    {
      enabled: !!sessionKey && !interviewFinished,
      refetchOnWindowFocus: false,
      // Chỉ cần fetch 1 lần khi mount — dbId và history không thay đổi trong session
      staleTime: Infinity,
    }
  );

  // sessionId từ cache Redis (dbId) — dùng để navigate đến trang kết quả
  const sessionId = cacheData?.dbId;

  // Lưu sessionId vào localStorage làm fallback (phòng khi cache đã hết hạn lúc navigate)
  useEffect(() => {
    if (sessionId && sessionKey) {
      localStorage.setItem(`interview-session-id-${sessionKey}`, String(sessionId));
    }
  }, [sessionId, sessionKey]);

  // Khôi phục lịch sử chat từ Redis khi localStorage bị xóa (ví dụ: private browsing)
  useEffect(() => {
    if (!cacheData || hasRestoredFromCacheRef.current || messages.length > 0) return;
    hasRestoredFromCacheRef.current = true;

    const restored: ChatMessage[] = [];
    let counter = 1;
    for (const exchange of cacheData.chatHistory ?? []) {
      if (exchange.questionText) {
        restored.push({
          id: counter++,
          role: "ai",
          content: exchange.questionText,
          timestamp: exchange.submittedAt
            ? new Date(exchange.submittedAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
        });
      }
      if (exchange.answerText) {
        restored.push({
          id: counter++,
          role: "user",
          content: exchange.answerText,
          timestamp: "—",
        });
      }
    }
    // Câu hỏi hiện tại đang chờ user trả lời
    if (cacheData.currentQuestionText) {
      restored.push({
        id: counter++,
        role: "ai",
        content: cacheData.currentQuestionText,
        timestamp: "—",
      });
    }
    if (restored.length > 0) {
      setMessages(restored);
      msgIdCounter.current = counter;
      setHasStarted(true);
      // Đánh dấu đã xử lý để startQuery không thêm câu hỏi trùng
      hasProcessedStartRef.current = true;
    }
    if (cacheData.currentQuestionIndex != null) {
      setCurrentQuestionIndex(cacheData.currentQuestionIndex);
    }
  }, [cacheData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Đặt lại msgIdCounter dựa trên các message đã khôi phục
  useEffect(() => {
    if (messages.length > 0) {
      msgIdCounter.current = Math.max(...messages.map((m) => m.id)) + 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy 1 lần khi mount

  const submitMutation = $api.useMutation("post", "/api/v1/interview/submit");

  // Persist chat history to localStorage whenever messages change
  useEffect(() => {
    if (!sessionKey || messages.length === 0) return;
    try {
      localStorage.setItem(`interview-chat-${sessionKey}`, JSON.stringify(messages));
    } catch {
      // Bỏ qua nếu localStorage đầy
    }
  }, [messages, sessionKey]);

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
        // Dừng TTS nếu đang phát khi kết thúc buổi phỏng vấn
        cancelSpeech();
        // setEvaluating rồi delay trước khi hiện completion card
        setIsEvaluating(true);
        // Xóa session key khỏi danh sách "Đang tiến hành" và đánh dấu finished
        if (sessionKey) {
          try {
            const stored = JSON.parse(localStorage.getItem("interview-session-keys") ?? "{}");
            delete stored[sessionKey];
            localStorage.setItem("interview-session-keys", JSON.stringify(stored));
            localStorage.setItem(`interview-finished-${sessionKey}`, "true");
          } catch {
            /* ignore */
          }
        }
        // Invalidate sessions cache để dữ liệu mới nhất (kết quả đánh giá) được tải sẵn
        void queryClient.invalidateQueries({
          queryKey: ["get", "/api/interview-sessions/user/{userId}"],
        });
        // Sau 3 giây ẩn evaluating và hiện completion card
        setTimeout(() => {
          setIsEvaluating(false);
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
        }, 3000);
        return;
      }

      if (data.questionContent) {
        const newId = msgIdCounter.current++;
        setMessages((prev) => [
          ...prev,
          {
            id: newId,
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
        // Tự động đọc to câu hỏi mới của AI
        if (isTTSSupported) {
          speak(data.questionContent, newId);
        }
      }
    },
    [isTTSSupported, speak, cancelSpeech] // eslint-disable-line react-hooks/exhaustive-deps
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

  // Process the start response once — dùng ref guard để tránh StrictMode chạy effect 2 lần
  useEffect(() => {
    if (startData && !hasProcessedStartRef.current) {
      hasProcessedStartRef.current = true;
      setHasStarted(true);

      // Luôn khôi phục trạng thái phase/progress từ phản hồi start
      if (startData.phaseName) setCurrentPhase(startData.phaseName);
      if (startData.currentQuestionIndex) setCurrentQuestionIndex(startData.currentQuestionIndex);
      if (startData.totalQuestionsInPhase) setTotalQuestions(startData.totalQuestionsInPhase);

      // Nếu phỏng vấn đã hoàn tất trước đó (finished === true từ start response)
      if (startData.finished) {
        setInterviewFinished(true);
        // Xóa session key khỏi danh sách active + đánh dấu finished
        if (sessionKey) {
          try {
            const stored = JSON.parse(localStorage.getItem("interview-session-keys") ?? "{}");
            delete stored[sessionKey];
            localStorage.setItem("interview-session-keys", JSON.stringify(stored));
            localStorage.setItem(`interview-finished-${sessionKey}`, "true");
          } catch {
            /* ignore */
          }
        }
        // Chỉ thêm tin nhắn kết thúc nếu chưa có lịch sử chat được khôi phục
        setMessages((prev) => {
          if (prev.length > 0) return prev;
          return [
            {
              id: msgIdCounter.current++,
              role: "ai",
              content:
                "Cuộc phỏng vấn này đã hoàn tất trước đó. Bạn có thể xem kết quả đánh giá chi tiết.",
              timestamp: getNow(),
            },
          ];
        });
        return;
      }

      // Kiểm tra nếu câu hỏi hiện tại đã là tin nhắn cuối cùng (tải lại trang giữa chừng)
      // Nếu trùng nội dung thì không thêm lại — tránh hiển thị câu hỏi trùng lặp
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "ai" && lastMsg.content === startData.questionContent) {
        return;
      }

      setTimeout(() => {
        addAIMessage(startData);
      }, 600);
    }
  }, [startData, addAIMessage]); // messages không trong deps vì chỉ đọc giá trị tại thời điểm mount

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
      } catch (err) {
        const errMsg = (err as { message?: string })?.message?.toLowerCase() ?? "";
        const isExpiry =
          errMsg.includes("not found") || errMsg.includes("expired") || errMsg.includes("404");
        if (isExpiry) {
          setSessionExpiredMidway(true);
          setInterviewFinished(true);
          setMessages((prev) => [
            ...prev,
            {
              id: msgIdCounter.current++,
              role: "ai",
              content:
                "Phiên phỏng vấn đã hết hạn sau 1 giờ không hoạt động. Bạn không thể tiếp tục phiên này. Vui lòng tạo buổi phỏng vấn mới.",
              timestamp: getNow(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: msgIdCounter.current++,
              role: "ai",
              content: "Đã xảy ra lỗi khi xử lý câu trả lời. Vui lòng thử gửi lại.",
              timestamp: getNow(),
            },
          ]);
        }
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
  // Bỏ qua màn hình loading nếu đã có lịch sử chat được khôi phục từ localStorage
  if (isStarting && messages.length === 0) {
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
            <ChatBubble
              key={msg.id}
              message={msg}
              userAvatarUrl={user?.avatarUrl ?? undefined}
              onSpeak={isTTSSupported ? handleToggleSpeak : undefined}
              speakingId={speakingId}
            />
          ))}
          {isEvaluating && <EvaluatingIndicator />}
          {isSubmitting && !isEvaluating && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input or completion actions */}
      {interviewFinished ? (
        <div className="border-t bg-white p-4 dark:bg-zinc-900">
          {sessionExpiredMidway ? (
            <Card className="mx-auto max-w-4xl border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-300">Phiên đã hết hạn</p>
                    <p className="text-muted-foreground text-sm">
                      Session key quá 1 giờ — không thể tiếp tục phiên này
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate("/dashboard/ai-interview")}>
                    Quay lại danh sách
                  </Button>
                  <Button
                    onClick={() => navigate("/dashboard/ai-interview/payment")}
                    className="bg-[#0047AB] text-white hover:bg-[#005B9A]">
                    Tạo phỏng vấn mới
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                    // Dọn localStorage và chuyển đến trang kết quả
                    if (sessionKey) {
                      try {
                        const stored = JSON.parse(
                          localStorage.getItem("interview-session-keys") ?? "{}"
                        );
                        delete stored[sessionKey];
                        localStorage.setItem("interview-session-keys", JSON.stringify(stored));
                        localStorage.removeItem(`interview-chat-${sessionKey}`);
                        localStorage.removeItem(`interview-finished-${sessionKey}`);
                        localStorage.removeItem(`interview-session-id-${sessionKey}`);
                      } catch {
                        /* ignore */
                      }
                    }
                    // Đọc session ID đã được lưu, dùng làm URL kết quả
                    const resolvedId =
                      sessionId ??
                      (sessionKey
                        ? localStorage.getItem(`interview-session-id-${sessionKey}`)
                        : null);
                    if (resolvedId) {
                      navigate(`/dashboard/ai-interview/result/${resolvedId}`);
                    } else {
                      navigate("/dashboard/ai-interview");
                    }
                  }}
                  className="bg-emerald-600 text-white hover:bg-emerald-700">
                  Xem kết quả
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <ChatInput
          onSend={handleSendAnswer}
          disabled={isSubmitting || isEvaluating || !hasStarted}
          placeholder={
            isEvaluating
              ? "AI đang đánh giá buổi phỏng vấn..."
              : isSubmitting
                ? "AI đang xử lý..."
                : "Nhập câu trả lời của bạn... (Enter để gửi, Shift+Enter để xuống dòng)"
          }
          isListening={isListening}
          interimTranscript={interimTranscript}
          isSpeechSupported={isSpeechRecognitionSupported}
          value={chatInputValue}
          onValueChange={setChatInputValue}
          onStartListening={startListening}
          onStopListening={stopListening}
        />
      )}
    </div>
  );
}
