import { AlertCircle, CheckCircle2, Mic, MicOff, Send } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ChatBubble, EvaluatingIndicator, TypingIndicator } from "./ChatBubble";
import type { ChatMessage } from "./types";

// ============================================================================
// ChatInput (local component)
// ============================================================================

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
// ChatPanel
// ============================================================================

export function ChatPanel({
  messages,
  userAvatarUrl,
  isTTSSupported,
  onToggleSpeak,
  speakingId,
  isEvaluating,
  isSubmitting,
  hasStarted,
  messagesEndRef,
  interviewFinished,
  sessionExpiredMidway,
  onNavigateToList,
  onNavigateToSetup,
  onViewResults,
  onSendAnswer,
  isListening,
  interimTranscript,
  isSpeechSupported,
  chatInputValue,
  onChatInputChange,
  onStartListening,
  onStopListening,
}: {
  messages: ChatMessage[];
  userAvatarUrl?: string;
  isTTSSupported: boolean;
  onToggleSpeak: (text: string, id: number) => void;
  speakingId: string | number | null;
  isEvaluating: boolean;
  isSubmitting: boolean;
  hasStarted: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  interviewFinished: boolean;
  sessionExpiredMidway: boolean;
  onNavigateToList: () => void;
  onNavigateToSetup: () => void;
  onViewResults: () => void;
  onSendAnswer: (answer: string) => void;
  isListening: boolean;
  interimTranscript: string;
  isSpeechSupported: boolean;
  chatInputValue: string;
  onChatInputChange: (val: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
}) {
  const inputDisabled = isSubmitting || isEvaluating || !hasStarted;
  const inputPlaceholder = isEvaluating
    ? "AI đang đánh giá buổi phỏng vấn..."
    : isSubmitting
      ? "AI đang xử lý..."
      : "Nhập câu trả lời của bạn... (Enter để gửi, Shift+Enter để xuống dòng)";

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              userAvatarUrl={userAvatarUrl}
              onSpeak={isTTSSupported ? onToggleSpeak : undefined}
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
                  <Button variant="outline" onClick={onNavigateToList}>
                    Quay lại danh sách
                  </Button>
                  <Button
                    onClick={onNavigateToSetup}
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
                  onClick={onViewResults}
                  className="bg-emerald-600 text-white hover:bg-emerald-700">
                  Xem kết quả
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <ChatInput
          onSend={onSendAnswer}
          disabled={inputDisabled}
          placeholder={inputPlaceholder}
          isListening={isListening}
          interimTranscript={interimTranscript}
          isSpeechSupported={isSpeechSupported}
          value={chatInputValue}
          onValueChange={onChatInputChange}
          onStartListening={onStartListening}
          onStopListening={onStopListening}
        />
      )}
    </>
  );
}
