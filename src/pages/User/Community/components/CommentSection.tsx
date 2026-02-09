import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";
import type { PostCommentResponse } from "@/interfaces/schema.types";
import {
  usePostComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
  useCommentReplies,
} from "@/services/post.manager";

import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  postId: number;
}

function RepliesBlock({ parentCommentId, currentUserId, onReply, onEdit, onDelete }: {
  parentCommentId: number;
  currentUserId?: number;
  onReply: (c: PostCommentResponse) => void;
  onEdit: (c: PostCommentResponse) => void;
  onDelete: (c: PostCommentResponse) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data } = useCommentReplies(parentCommentId);
  const replies = (Array.isArray(data) ? data : (data as unknown as PostCommentResponse[])) ?? [];

  if (replies.length === 0) return null;

  return (
    <div className="ml-8 border-l pl-4">
      {!expanded ? (
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExpanded(true)}>
          Xem phản hồi ({replies.length})
        </Button>
      ) : (
        replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            currentUserId={currentUserId}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const { data: commentsData } = usePostComments(postId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();

  const comments = (Array.isArray(commentsData) ? commentsData : (commentsData as unknown as PostCommentResponse[])) ?? [];

  const [newContent, setNewContent] = useState("");
  const [replyTo, setReplyTo] = useState<PostCommentResponse | null>(null);
  const [editingComment, setEditingComment] = useState<PostCommentResponse | null>(null);
  const [editContent, setEditContent] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["get", `/api/posts/${postId}/comments`] });
    queryClient.invalidateQueries({ queryKey: ["get", `/api/posts/${postId}/comments/count`] });
    queryClient.invalidateQueries({ queryKey: ["get", "/api/posts/comments/"] });
  };

  const handleSubmit = () => {
    const content = newContent.trim();
    if (!content || !currentUserId) return;

    createComment.mutate(
      {
        body: {
          postId,
          userId: currentUserId,
          content,
          parentCommentId: replyTo?.id,
        },
      } as never,
      {
        onSuccess: () => {
          setNewContent("");
          setReplyTo(null);
          invalidate();
        },
        onError: () => toast.error("Không thể gửi bình luận"),
      }
    );
  };

  const handleDelete = (comment: PostCommentResponse) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    deleteComment.mutate(
      { params: { path: { commentId: comment.id! } } } as never,
      {
        onSuccess: () => invalidate(),
        onError: () => toast.error("Không thể xóa bình luận"),
      }
    );
  };

  const handleEditStart = (comment: PostCommentResponse) => {
    setEditingComment(comment);
    setEditContent(comment.content ?? "");
  };

  const handleEditSave = () => {
    if (!editingComment || !editContent.trim()) return;
    updateComment.mutate(
      {
        params: { path: { commentId: editingComment.id! } },
        body: { content: editContent.trim() },
      } as never,
      {
        onSuccess: () => {
          setEditingComment(null);
          setEditContent("");
          invalidate();
        },
        onError: () => toast.error("Không thể cập nhật bình luận"),
      }
    );
  };

  const handleReply = (comment: PostCommentResponse) => {
    setReplyTo(comment);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bình luận</h3>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có bình luận nào</p>
      ) : (
        <div className="space-y-1 divide-y">
          {comments.map((comment) => (
            <div key={comment.id}>
              {editingComment?.id === comment.id ? (
                <div className="flex gap-2 py-3">
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                  />
                  <Button size="sm" onClick={handleEditSave}>Lưu</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>Hủy</Button>
                </div>
              ) : (
                <CommentItem
                  comment={comment}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                  onEdit={handleEditStart}
                  onDelete={handleDelete}
                />
              )}
              <RepliesBlock
                parentCommentId={comment.id!}
                currentUserId={currentUserId}
                onReply={handleReply}
                onEdit={handleEditStart}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {replyTo && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Trả lời {replyTo.userName}</span>
          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => setReplyTo(null)}>
            ✕
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Viết bình luận..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button size="sm" onClick={handleSubmit} disabled={!newContent.trim()}>
          <Send className="mr-1 h-4 w-4" />
          Gửi
        </Button>
      </div>
    </div>
  );
}
