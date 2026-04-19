import {
  ArrowLeft,
  CheckCircle2,
  Languages,
  MessageSquare,
  Volume2,
  VolumeOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { SpeechLanguageCode } from "./types";

export function InterviewHeader({
  phaseName,
  questionIndex,
  totalQuestions,
  finished,
  isTTSSupported,
  isMuted,
  speechLanguage,
  speechLanguageLabel,
  activeVoiceName,
  shouldWarnSpeechFallback,
  canSwitchSpeechLanguage,
  onSpeechLanguageChange,
  onToggleMute,
  onBack,
}: {
  phaseName: string;
  questionIndex: number;
  totalQuestions: number;
  finished: boolean;
  isTTSSupported: boolean;
  isMuted: boolean;
  speechLanguage: SpeechLanguageCode;
  speechLanguageLabel: string;
  activeVoiceName: string | null;
  shouldWarnSpeechFallback: boolean;
  canSwitchSpeechLanguage: boolean;
  onSpeechLanguageChange: (_language: SpeechLanguageCode) => void;
  onToggleMute: () => void;
  onBack: () => void;
}) {
  const progress = totalQuestions > 0 ? (questionIndex / totalQuestions) * 100 : 0;
  const safeProgress = Math.max(0, Math.min(progress, 100));

  return (
    <div className="border-b border-slate-200/80 bg-linear-to-r from-white via-cyan-50/40 to-blue-50/40 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10 shrink-0 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-600 to-blue-700 shadow-sm">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-base font-black tracking-tight md:text-lg">
            Phỏng vấn với AI
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {phaseName && (
              <Badge variant="secondary" className="rounded-full text-xs">
                {phaseName}
              </Badge>
            )}
            {!finished && totalQuestions > 0 && (
              <span className="text-muted-foreground text-xs">
                Câu {questionIndex}/{totalQuestions}
              </span>
            )}
            {!finished && totalQuestions > 0 && (
              <Badge
                variant="outline"
                className="rounded-full border-cyan-200 bg-cyan-50 text-[11px] text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300">
                {Math.round(safeProgress)}% hoàn tất
              </Badge>
            )}
            {finished && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Hoàn thành
              </Badge>
            )}
          </div>
        </div>

        {!finished && (
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 lg:inline-flex dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Đang phỏng vấn trực tiếp
          </div>
        )}

        {!finished && (
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] md:inline-flex dark:border-slate-700 dark:bg-slate-800/70">
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-200">
              <Languages className="h-3.5 w-3.5" />
              Giọng nói
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!canSwitchSpeechLanguage}
                onClick={() => onSpeechLanguageChange("vi-VN")}
                className={cn(
                  "rounded-full px-2 py-0.5 font-semibold transition-colors",
                  speechLanguage === "vi-VN"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                )}>
                VI
              </button>
              <button
                type="button"
                disabled={!canSwitchSpeechLanguage}
                onClick={() => onSpeechLanguageChange("en-US")}
                className={cn(
                  "rounded-full px-2 py-0.5 font-semibold transition-colors",
                  speechLanguage === "en-US"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                )}>
                EN
              </button>
            </div>
            <span className="text-slate-500 dark:text-slate-400">{speechLanguageLabel}</span>
          </div>
        )}

        {!finished && shouldWarnSpeechFallback && (
          <div className="hidden rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700 lg:inline-flex dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            Giọng Việt có thể không khả dụng, hệ thống có thể đọc bằng giọng mặc định
            {activeVoiceName && (
              <span className="ml-1 text-amber-600/80 dark:text-amber-200/80">
                ({activeVoiceName})
              </span>
            )}
          </div>
        )}

        {isTTSSupported && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMute}
                className={isMuted ? "text-muted-foreground" : "text-cyan-600"}
                aria-label={isMuted ? "Bật âm thanh AI" : "Tắt âm thanh AI"}>
                {isMuted ? <VolumeOff className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? "Âm thanh AI: Tắt" : "Âm thanh AI: Bật"}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {!finished && totalQuestions > 0 && (
        <div className="px-4 pb-3 md:px-6">
          <div className="text-muted-foreground mb-1 flex items-center justify-between text-[11px]">
            <span>Tiến độ phiên</span>
            <span>
              {questionIndex}/{totalQuestions} câu
            </span>
          </div>
          <Progress value={safeProgress} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
