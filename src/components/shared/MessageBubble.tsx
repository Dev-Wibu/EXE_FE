import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CheckCheck,
  Clock3,
  Copy,
  CornerUpRight,
  Pin,
  PinOff,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { Fragment, type ReactNode } from "react";

export type MessageDeliveryStatus = "sending" | "sent" | "failed";

interface MessageBubbleProps {
  id: string;
  sender: "ai" | "user";
  content: string;
  timestamp: string;
  searchQuery?: string;
  status?: MessageDeliveryStatus;
  isPinned?: boolean;
  onCopy?: (_content: string) => void;
  onRetry?: (_messageId: string) => void;
  onForward?: (_content: string) => void;
  onTogglePin?: (_messageId: string) => void;
}

const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightContent = (content: string, searchQuery: string): ReactNode => {
  const keyword = searchQuery.trim();
  if (!keyword) {
    return content;
  }

  const matcher = new RegExp(`(${escapeForRegex(keyword)})`, "gi");
  const parts = content.split(matcher);

  return parts.map((part, index) => {
    if (part.toLowerCase() === keyword.toLowerCase()) {
      return (
        <mark
          key={`${part}-${index}`}
          className="rounded-sm bg-amber-200/90 px-0.5 text-slate-900 dark:bg-amber-300/80">
          {part}
        </mark>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
};

const getRelativeTime = (timestamp: string): string => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Vừa xong";
  }

  return formatDistanceToNow(parsed, { addSuffix: true, locale: vi });
};

const getReadableTimestamp = (timestamp: string): string => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const STATUS_LABELS: Record<MessageDeliveryStatus, string> = {
  sending: "Đang gửi",
  sent: "Đã gửi",
  failed: "Gửi lỗi",
};

export function MessageBubble({
  id,
  sender,
  content,
  timestamp,
  searchQuery = "",
  status,
  isPinned = false,
  onCopy,
  onRetry,
  onForward,
  onTogglePin,
}: MessageBubbleProps) {
  const relativeTime = getRelativeTime(timestamp);
  const fullTime = getReadableTimestamp(timestamp);
  const showStatus = sender === "user" && !!status;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <article
          className={cn(
            "flex max-w-[88%] flex-col gap-1 sm:max-w-[80%] lg:max-w-[70%]",
            sender === "user" ? "ml-auto items-end" : "items-start"
          )}>
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-sm leading-6 wrap-break-word whitespace-pre-wrap shadow-sm",
              sender === "user"
                ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20"
                : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            )}>
            {highlightContent(content, searchQuery)}
          </div>

          <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default">{relativeTime}</span>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>{fullTime}</TooltipContent>
            </Tooltip>

            {isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Pin className="h-3 w-3" />
                Đã ghim
              </span>
            )}

            {showStatus && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5",
                  status === "failed"
                    ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                )}>
                {status === "sending" && <Clock3 className="h-3 w-3" />}
                {status === "sent" && <CheckCheck className="h-3 w-3" />}
                {status === "failed" && <TriangleAlert className="h-3 w-3" />}
                {STATUS_LABELS[status]}
              </span>
            )}
          </div>
        </article>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        <ContextMenuItem onSelect={() => onCopy?.(content)}>
          <Copy className="h-4 w-4" />
          Sao chép nội dung
        </ContextMenuItem>

        {onForward && (
          <ContextMenuItem onSelect={() => onForward(content)}>
            <CornerUpRight className="h-4 w-4" />
            Chuyển tiếp vào ô soạn
          </ContextMenuItem>
        )}

        {onTogglePin && (
          <ContextMenuItem onSelect={() => onTogglePin(id)}>
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            {isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
          </ContextMenuItem>
        )}

        {status === "failed" && onRetry && (
          <ContextMenuItem onSelect={() => onRetry(id)}>
            <RotateCcw className="h-4 w-4" />
            Gửi lại tin nhắn
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
