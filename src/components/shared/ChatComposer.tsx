import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Send, SmilePlus } from "lucide-react";
import { useEffect, useRef } from "react";

interface ChatComposerProps {
  value: string;
  onChange: (_value: string) => void;
  onSend: () => void;
  placeholder: string;
  isMobile?: boolean;
  disabled?: boolean;
}

const QUICK_EMOJIS = ["😀", "😂", "😍", "👍", "🙏", "🔥", "🎯", "💡", "✅", "🚀"];

export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder,
  isMobile = false,
  disabled = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [value]);

  const appendEmoji = (emoji: string) => {
    onChange(`${value}${emoji}`);
    textareaRef.current?.focus();
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMobile || disabled) {
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl items-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            title="Chèn emoji"
            aria-label="Chèn emoji"
            disabled={disabled}>
            <SmilePlus className="h-4.5 w-4.5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56 p-2">
          <p className="px-2 pb-1 text-xs font-semibold text-slate-500">Emoji nhanh</p>
          <div className="grid grid-cols-5 gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <DropdownMenuItem
                key={emoji}
                className="justify-center text-lg"
                onSelect={() => appendEmoji(emoji)}>
                {emoji}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1">
        <textarea
          data-messenger-composer="true"
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "max-h-[132px] min-h-11 w-full resize-none rounded-xl border bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-900 transition outline-none dark:bg-slate-800 dark:text-slate-100",
            "focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:border-blue-700 dark:focus:ring-blue-900/40",
            "border-slate-200 dark:border-slate-700",
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
      </div>

      <Button
        onClick={onSend}
        size="icon"
        className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700"
        disabled={disabled}
        title="Gửi tin nhắn"
        aria-label="Gửi tin nhắn">
        <Send className="h-4.5 w-4.5" />
      </Button>
    </div>
  );
}
