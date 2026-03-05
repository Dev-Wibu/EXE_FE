import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PostCommentResponse } from "@/interfaces/schema.types";
import { queryClient } from "@/lib/queryClient";
import { useCommentReplies, useCreateComment, usePostComments } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";

import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  postId: number;
}

function RepliesBlock({
  parentCommentId,
  currentUserId,
  forceExpanded = false,
}: {
  parentCommentId: number;
  currentUserId?: number;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data } = useCommentReplies(parentCommentId);
  const replies = (Array.isArray(data) ? data : (data as unknown as PostCommentResponse[])) ?? [];

  // Auto-expand when parent triggers forceExpanded (e.g., after posting a reply)
  const isExpanded = expanded || forceExpanded;

  if (replies.length === 0) return null;

  return (
    <div className="ml-8 border-l pl-4">
      {!isExpanded ? (
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExpanded(true)}>
          Xem phản hồi ({replies.length})
        </Button>
      ) : (
        <>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={undefined}
            />
          ))}
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExpanded(false)}>
            Thu gọn
          </Button>
        </>
      )}
    </div>
  );
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const { data: commentsData } = usePostComments(postId);
  const createComment = useCreateComment();

  const allComments =
    (Array.isArray(commentsData)
      ? commentsData
      : (commentsData as unknown as PostCommentResponse[])) ?? [];

  // Filter only top-level comments — the API returns all comments including replies,
  // filtering here prevents double-rendering replies that RepliesBlock already shows
  const topLevelComments = allComments.filter((c) => !c.parentCommentId);

  const [newContent, setNewContent] = useState("");
  // Track which top-level comment has its inline reply box open
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  // Track which reply blocks have been auto-expanded (after replying)
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/posts/{postId}/comments", { params: { path: { postId } } }],
    });
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/posts/{postId}/comments/count", { params: { path: { postId } } }],
    });
  };

  const invalidateReplies = (parentCommentId: number) => {
    queryClient.invalidateQueries({
      queryKey: [
        "get",
        "/api/posts/comments/{commentId}/replies",
        { params: { path: { commentId: parentCommentId } } },
      ],
    });
  };

  const handleCommentSubmit = () => {
    const content = newContent.trim();
    if (!content || !currentUserId) return;

    createComment.mutate({ body: { postId, userId: currentUserId, content } } as never, {
      onSuccess: () => {
        setNewContent("");
        invalidate();
      },
      onError: () => toast.error("Không thể gửi bình luận"),
    });
  };

  const handleReplySubmit = (parentCommentId: number) => {
    const content = replyContent.trim();
    if (!content || !currentUserId) return;

    createComment.mutate(
      { body: { postId, userId: currentUserId, content, parentCommentId } } as never,
      {
        onSuccess: () => {
          setReplyContent("");
          setReplyingToId(null);
          // Auto-expand the replies block so the new reply is visible immediately
          setExpandedReplies((prev) => new Set(prev).add(parentCommentId));
          invalidate();
          invalidateReplies(parentCommentId);
        },
        onError: () => toast.error("Không thể gửi phản hồi"),
      }
    );
  };

  // Fix: parentCommentId may be 0 (falsy) for root comments from BE — use explicit > 0 check
  const handleReply = (comment: PostCommentResponse) => {
    const topLevelId =
      comment.parentCommentId && comment.parentCommentId > 0
        ? comment.parentCommentId
        : comment.id!;
    setReplyingToId(topLevelId);
    setReplyContent("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bình luận</h3>

      {topLevelComments.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có bình luận nào</p>
      ) : (
        <div className="space-y-1 divide-y">
          {topLevelComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem comment={comment} currentUserId={currentUserId} onReply={handleReply} />

              <RepliesBlock
                parentCommentId={comment.id!}
                currentUserId={currentUserId}
                forceExpanded={expandedReplies.has(comment.id!)}
              />

              {/* Inline reply input shown directly under this comment thread */}
              {replyingToId === comment.id && (
                <div className="mt-2 ml-8 flex gap-2">
                  <Textarea
                    autoFocus
                    placeholder="Trả lời bình luận... (Ctrl+Enter để gửi)"
                    value={replyContent}
                    rows={2}
                    className="max-h-32 resize-none overflow-auto"
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) handleReplySubmit(comment.id!);
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleReplySubmit(comment.id!)}
                      disabled={!replyContent.trim()}>
                      <Send className="mr-1 h-4 w-4" />
                      Gửi
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingToId(null);
                        setReplyContent("");
                      }}>
                      Hủy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main comment input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Viết bình luận... (Ctrl+Enter để gửi)"
          value={newContent}
          rows={2}
          className="max-h-32 resize-none overflow-auto"
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) handleCommentSubmit();
          }}
        />
        <Button
          size="sm"
          className="self-end"
          onClick={handleCommentSubmit}
          disabled={!newContent.trim()}>
          <Send className="mr-1 h-4 w-4" />
          Gửi
        </Button>
      </div>
    </div>
  );
}
