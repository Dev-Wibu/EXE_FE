import { Sparkles, User, Volume2, VolumeX } from "lucide-react";

import logo from "@/assets/icon.svg";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { ChatMessage } from "./types";

export function ChatBubble({
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

export function TypingIndicator() {
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

export function EvaluatingIndicator() {
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
