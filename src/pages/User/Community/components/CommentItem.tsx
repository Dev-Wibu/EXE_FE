import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PostCommentResponse } from "@/interfaces/schema.types";

interface CommentItemProps {
  comment: PostCommentResponse;
  currentUserId?: number;
  onReply?: (comment: PostCommentResponse) => void;
  onEdit?: (comment: PostCommentResponse) => void;
  onDelete?: (comment: PostCommentResponse) => void;
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

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const isOwn = currentUserId != null && comment.userId === currentUserId;
  const initials = comment.userName
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.userAvatar} alt={comment.userName} />
        <AvatarFallback>{initials || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.userName ?? "Ẩn danh"}</span>
          <span className="text-xs text-muted-foreground">
            {getRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm">{comment.content}</p>
        <div className="mt-1 flex gap-2">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onReply?.(comment)}>
            Trả lời
          </Button>
          {isOwn && (
            <>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onEdit?.(comment)}>
                Sửa
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => onDelete?.(comment)}>
                Xóa
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
