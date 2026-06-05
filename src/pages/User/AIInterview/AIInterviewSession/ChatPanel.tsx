import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  speechLanguageLabel,
  value,
  onValueChange,
}: {
  onSend: (_message: string) => void;
  disabled: boolean;
  placeholder?: string;
  isListening: boolean;
  interimTranscript: string;
  speechLanguageLabel: string;
  value: string;
  onValueChange: (_val: string) => void;
}) {
  const { t } = useTranslation();
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
  const characterCount = value.length;
  const canSend = value.trim().length > 0 && !disabled && !isListening;
  return (
    <div className="border-t border-slate-200/80 bg-white/95 p-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
                ? t("userAiinterview.listeningUseTheMicButton")
                : (placeholder ?? t("userAiinterview.enterYourAnswer"))
            }
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800",
              isListening
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-900/40"
            )}
            aria-label={t("userAiinterview.enterYourAnswer1")}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl bg-linear-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800">
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-2 flex items-center justify-between px-1 text-[11px]">
        <p className="text-muted-foreground truncate pr-3">
          {isListening
            ? t("userAiinterview.micIsRecordingPressThe")
            : t("general.currentSpeechRecognition", {
                var_0: speechLanguageLabel,
              })}
        </p>
        <span
          className={cn(
            "shrink-0",
            characterCount > 1200 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
          )}>
          {characterCount} {t("userAiinterview.character")}
        </span>
      </div>

      {isListening && (
        <p className="text-muted-foreground mt-2 text-center text-xs">
          <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          {t("userAiinterview.listeningUseTheMicButton1")}
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
  chatInputValue,
  onChatInputChange,
  speechLanguageLabel,
}: {
  messages: ChatMessage[];
  userAvatarUrl?: string;
  isTTSSupported: boolean;
  onToggleSpeak: (_text: string, _id: number) => void;
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
  onSendAnswer: (_answer: string) => void;
  isListening: boolean;
  interimTranscript: string;
  chatInputValue: string;
  onChatInputChange: (_val: string) => void;
  speechLanguageLabel: string;
}) {
  const { t } = useTranslation();
  const inputDisabled = isSubmitting || isEvaluating || !hasStarted;
  const inputPlaceholder = isEvaluating
    ? t("userAiinterview.aiIsEvaluatingTheInterview")
    : isSubmitting
      ? t("userAiinterview.aiIsProcessing")
      : t("userAiinterview.answerEnterToSendShift");
  return (
    <section className="flex h-full min-h-0 flex-col border-t border-slate-200/80 bg-white md:border-t-0 md:border-l dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t("userAiinterview.sessionMessages")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {messages.length} {t("userAiinterview.exchangeContent")}
              </p>
            </div>
          </div>
          {isListening && (
            <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-300">
              {t("userAiinterview.recording")}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-linear-to-b from-slate-100/40 via-white to-slate-100/60 p-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="space-y-4">
          {!interviewFinished && (
            <div className="rounded-2xl border border-cyan-200/80 bg-linear-to-r from-cyan-50/90 via-blue-50/80 to-cyan-50/90 px-3.5 py-2.5 text-xs text-cyan-800 shadow-sm dark:border-cyan-900/70 dark:from-cyan-950/30 dark:via-blue-950/20 dark:to-cyan-950/30 dark:text-cyan-200">
              <p className="font-semibold">{t("userAiinterview.quickHint")}</p>
              <p className="mt-0.5 opacity-90">{t("userAiinterview.answerInRealContextState")}</p>
            </div>
          )}

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

          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
              {t("userAiinterview.theChatWillShowUp")}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {interviewFinished ? (
        <div className="border-t border-slate-200/80 bg-white/95 p-4 dark:border-slate-800 dark:bg-slate-900/95">
          {sessionExpiredMidway ? (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-300">
                      {t("userAiinterview.sessionHasExpired")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("userAiinterview.sessionKeyIsOver1")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={onNavigateToList}>
                    {t("common.backToTheList")}
                  </Button>
                  <Button
                    onClick={onNavigateToSetup}
                    className="bg-linear-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-700 hover:to-blue-800">
                    {t("userAiinterview.createNewInterview")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                      {t("userAiinterview.interviewCompleted")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("userAiinterview.seeDetailedReviewsAndYour")}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onViewResults}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                  {t("userAiinterview.seeResults")}
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
          speechLanguageLabel={speechLanguageLabel}
          value={chatInputValue}
          onValueChange={onChatInputChange}
        />
      )}
    </section>
  );
}
