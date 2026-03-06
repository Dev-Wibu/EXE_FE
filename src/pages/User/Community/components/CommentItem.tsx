import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PostCommentResponse } from "@/interfaces/schema.types";

interface CommentItemProps {
  comment: PostCommentResponse;
  currentUserId?: number;
  onReply?: (comment: PostCommentResponse) => void;
  /** Full name of the @mentioned user (parent comment author). Enables exact multi-word matching. */
  mentionedUserName?: string;
  /** ID of the parent comment — used as jump target when @mention is clicked. */
  parentCommentId?: number;
  /** Called with the parent comment ID when the @mention span is clicked. */
  onMentionClick?: (parentCommentId: number) => void;
  /** When true, applies a brief highlight ring (used after jump-to-parent scroll). */
  isHighlighted?: boolean;
}

function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} tháng trước`;
}

function renderContent(
  text: string | undefined,
  mentionedUserName: string | undefined,
  parentCommentId: number | undefined,
  onMentionClick: ((pid: number) => void) | undefined
): (string | React.ReactElement)[] {
  if (!text) return [];

  // If we know the exact mentioned username, match it precisely — handles multi-word names
  // like "@Hoàng Tử Gió" that the generic \S+ regex would split at the first space.
  if (mentionedUserName) {
    const mention = `@${mentionedUserName}`;
    if (text.startsWith(mention)) {
      const rest = text.slice(mention.length);
      const clickable = !!(onMentionClick && parentCommentId);
      const mentionEl = (
        <span
          key="mention"
          className={`inline-flex items-center rounded-md bg-[#007BFF]/10 px-1.5 py-0.5 text-xs font-semibold text-[#007BFF]${clickable ? " cursor-pointer hover:bg-[#007BFF]/20" : ""}`}
          onClick={
            clickable
              ? (e) => {
                  e.stopPropagation();
                  onMentionClick!(parentCommentId!);
                }
              : undefined
          }>
          {mention}
        </span>
      );
      return [mentionEl, ...renderContent(rest, undefined, undefined, undefined)];
    }
  }

  // Fallback: regex match for single-word @mentions (no spaces)
  const parts = text.split(/(@\S+)/g);
  return parts.map((part, i) =>
    /^@\S+$/.test(part) ? (
      <span
        key={i}
        className="inline-flex items-center rounded-md bg-[#007BFF]/10 px-1.5 py-0.5 text-xs font-semibold text-[#007BFF]">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export function CommentItem({
  comment,
  onReply,
  mentionedUserName,
  parentCommentId,
  onMentionClick,
  isHighlighted,
}: CommentItemProps) {
  const initials = comment.userName
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      data-comment-id={comment.id}
      className={`flex gap-3 rounded py-3 transition-colors duration-500${isHighlighted ? "bg-[#007BFF]/10 ring-1 ring-[#007BFF]/30" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.userAvatar} alt={comment.userName} />
        <AvatarFallback>{initials || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.userName ?? "Ẩn danh"}</span>
          <span className="text-muted-foreground text-xs">
            {getRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm wrap-break-word whitespace-pre-wrap">
          {renderContent(comment.content, mentionedUserName, parentCommentId, onMentionClick)}
        </p>
        {onReply && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-6 px-2 text-xs"
            onClick={() => onReply(comment)}>
            Trả lời
          </Button>
        )}
      </div>
    </div>
  );
}
