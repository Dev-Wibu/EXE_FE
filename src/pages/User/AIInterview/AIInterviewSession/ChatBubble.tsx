import logo from "@/assets/icon.svg";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, User, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ChatMessage } from "./types";
export function ChatBubble({
  message,
  userAvatarUrl,
  onSpeak,
  speakingId,
}: {
  message: ChatMessage;
  userAvatarUrl?: string;
  onSpeak?: (_text: string, _id: number) => void;
  speakingId?: string | number | null;
}) {
  const { t } = useTranslation();

  const QUESTION_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
    BLUEPRINT: {
      label: t("userAiinterview.mainSentence"),
      className:
        "border-indigo-300 bg-indigo-100 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    },
    FOLLOW_UP: {
      label: t("userAiinterview.nextSentence"),
      className:
        "border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    },
  };
  const ROLE_LABELS: Record<ChatMessage["role"], string> = {
    ai: t("userAiinterview.aiInterviewer"),
    user: t("common.friend"),
  };

  const isAI = message.role === "ai";
  const isThisSpeaking = speakingId === message.id;
  return (
    <div className={cn("flex gap-3", isAI ? "justify-start" : "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-sm",
          isAI
            ? "bg-linear-to-br from-cyan-600 to-blue-700"
            : "bg-emerald-100 dark:bg-emerald-900/40"
        )}>
        {isAI ? (
          <img src={logo} alt={t("common.ai")} className="h-6 w-6 object-contain" />
        ) : userAvatarUrl ? (
          <img
            src={userAvatarUrl}
            alt={t("common.avatar")}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>

      {/* Bubble */}
      <div className="group flex max-w-[84%] flex-col gap-1 md:max-w-[74%]">
        <div
          className={cn("flex items-center gap-1.5 px-1", isAI ? "justify-start" : "justify-end")}>
          <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            {ROLE_LABELS[message.role]}
          </span>
          {isAI && message.meta?.phaseName && (
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300">
              {message.meta.phaseName}
            </span>
          )}
        </div>

        {isAI &&
          message.meta?.questionType &&
          (() => {
            const typeConfig = QUESTION_TYPE_CONFIG[message.meta.questionType];
            return (
              <Badge
                variant="outline"
                className={cn(
                  "w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                  typeConfig?.className
                )}>
                {typeConfig?.label ?? message.meta.questionType}
              </Badge>
            );
          })()}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
            isAI
              ? "rounded-tl-sm border border-cyan-200/70 bg-linear-to-br from-white via-cyan-50/70 to-blue-50/70 text-slate-800 shadow-cyan-200/40 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100"
              : "rounded-tr-sm bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-emerald-500/30"
          )}>
          <p>{message.content}</p>
        </div>

        <div className={cn("flex items-center gap-1", isAI ? "justify-start" : "justify-end")}>
          <span
            className={cn(
              "text-muted-foreground inline-flex items-center gap-1 text-[10px]",
              isAI ? "text-left" : "text-right"
            )}>
            <span className="inline-block h-1 w-1 rounded-full bg-slate-400" />
            {message.timestamp}
          </span>
          {isAI && onSpeak && (
            <button
              onClick={() => onSpeak(message.content, message.id)}
              title={
                isThisSpeaking
                  ? t("userAiinterview.stopReading")
                  : t("userAiinterview.readTheMessageOutLoud")
              }
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full transition-all",
                "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100",
                isThisSpeaking
                  ? "bg-cyan-100 text-cyan-700 opacity-100 dark:bg-cyan-900/40 dark:text-cyan-300"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-slate-800"
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
export function TypingIndicator() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-cyan-600 to-blue-700 shadow-sm">
        <img src={logo} alt={t("common.ai")} className="h-6 w-6 object-contain" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-cyan-200/70 bg-linear-to-br from-white via-cyan-50/60 to-blue-50/60 px-4 py-3 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
export function EvaluatingIndicator() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-cyan-600 to-blue-700 shadow-sm">
        <img src={logo} alt={t("common.ai")} className="h-6 w-6 object-contain" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-cyan-200/70 bg-cyan-50 px-4 py-3 shadow-sm dark:border-cyan-800/70 dark:bg-cyan-950/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 animate-pulse text-cyan-700 dark:text-cyan-300" />
          <span className="text-sm font-medium text-cyan-700 dark:text-cyan-200">
            {t("userAiinterview.aiIsEvaluatingTheInterview")}
          </span>
        </div>
      </div>
    </div>
  );
}
