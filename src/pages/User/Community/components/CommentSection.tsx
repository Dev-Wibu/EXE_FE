import { ChevronDown, ChevronUp, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PostCommentResponse } from "@/interfaces/schema.types";
import { queryClient } from "@/lib/queryClient";
import { useCreateComment, usePostComments } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";

import { CommentItem } from "./CommentItem";

// ---------------------------------------------------------------------------
// Comment tree helpers
// ---------------------------------------------------------------------------

type CommentNode = {
  comment: PostCommentResponse;
  children: CommentNode[];
};

function buildCommentTree(comments: PostCommentResponse[]): CommentNode[] {
  const nodeMap = new Map<number, CommentNode>();
  comments.forEach((c) => {
    if (c.id != null) nodeMap.set(c.id, { comment: c, children: [] });
  });

  const roots: CommentNode[] = [];
  comments.forEach((c) => {
    const node = c.id != null ? nodeMap.get(c.id) : undefined;
    if (!node) return;
    const pid = c.parentCommentId;
    if (!pid || pid === 0) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(pid);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not in this batch — treat as root
        roots.push(node);
      }
    }
  });

  return roots;
}

// DFS-flatten all descendants of a node, sorted chronologically (oldest first)
function flattenDescendants(node: CommentNode): PostCommentResponse[] {
  const result: PostCommentResponse[] = [];
  function dfs(children: CommentNode[]) {
    for (const child of children) {
      result.push(child.comment);
      dfs(child.children);
    }
  }
  dfs(node.children);
  result.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  return result;
}

// Walk up the comment chain to find the root-level comment ID
function findRootCommentId(
  commentId: number,
  commentById: Map<number, PostCommentResponse>,
  rootIds: Set<number>
): number {
  if (rootIds.has(commentId)) return commentId;
  const c = commentById.get(commentId);
  if (!c?.parentCommentId) return commentId;
  return findRootCommentId(c.parentCommentId, commentById, rootIds);
}

// ---------------------------------------------------------------------------
// ReplyInput — shared reply textarea block
// ---------------------------------------------------------------------------

interface ReplyInputProps {
  userName: string;
  value: string;
  onChange: (_v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function ReplyInput({ userName, value, onChange, onSubmit, onCancel }: ReplyInputProps) {
  return (
    <div className="mt-2 flex flex-col gap-1.5 pl-11">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">Đang trả lời</span>
        <span className="rounded bg-[#007BFF]/10 px-1.5 py-0.5 text-xs font-semibold text-[#007BFF]">
          @{userName}
        </span>
      </div>
      <div className="flex gap-2">
        <Textarea
          autoFocus
          placeholder="Trả lời... (Ctrl+Enter để gửi)"
          value={value}
          rows={2}
          className="max-h-32 flex-1 resize-none overflow-auto"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) onSubmit();
          }}
        />
        <div className="flex flex-col gap-1">
          <Button size="sm" onClick={onSubmit} disabled={!value.trim()}>
            <Send className="mr-1 h-4 w-4" />
            Gửi
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommentThread — Tiered reply system: up to 3 levels of nesting.
// Level 0: root, Level 1: direct replies, Level 2: replies to level-1.
// Level 3+: rendered at level 2 depth with @mention (no further indentation).
// ---------------------------------------------------------------------------

interface CommentThreadProps {
  node: CommentNode;
  currentUserId?: number;
  replyingToId: number | null;
  replyContent: string;
  onSetReplyingId: (_id: number | null) => void;
  onReplyContentChange: (_v: string) => void;
  onReplySubmit: (_parentCommentId: number) => void;
  expandedIds: Set<number>;
  onToggleExpand: (_id: number) => void;
  commentById: Map<number, PostCommentResponse>;
  highlightedCommentId: number | null;
  onMentionClick: (_parentCommentId: number) => void;
  depth?: number;
}

function CommentThread({
  node,
  currentUserId,
  replyingToId,
  replyContent,
  onSetReplyingId,
  onReplyContentChange,
  onReplySubmit,
  expandedIds,
  onToggleExpand,
  commentById,
  highlightedCommentId,
  onMentionClick,
  depth = 0,
}: CommentThreadProps) {
  const { comment } = node;
  const isExpanded = comment.id != null && expandedIds.has(comment.id);
  const isReplyingToThis = replyingToId === comment.id;

  // At max nesting depth (2), flatten all deeper descendants
  const maxDepth = 2;
  const atMaxDepth = depth >= maxDepth;
  const flatChildren = useMemo(
    () => (atMaxDepth ? flattenDescendants(node) : []),
    [node, atMaxDepth]
  );
  const directChildren = atMaxDepth ? [] : node.children;
  const totalReplies = atMaxDepth ? flatChildren.length : node.children.length;

  return (
    <div>
      {/* Current comment */}
      <CommentItem
        comment={comment}
        currentUserId={currentUserId}
        onReply={(c) => {
          onSetReplyingId(c.id ?? null);
          onReplyContentChange("");
        }}
        mentionedUserName={
          depth > 0 && comment.parentCommentId
            ? commentById.get(comment.parentCommentId)?.userName
            : undefined
        }
        parentCommentId={depth > 0 ? comment.parentCommentId : undefined}
        isHighlighted={highlightedCommentId === comment.id}
        onMentionClick={onMentionClick}
      />

      {/* Reply input for this comment */}
      {isReplyingToThis && (
        <ReplyInput
          userName={comment.userName ?? ""}
          value={replyContent}
          onChange={onReplyContentChange}
          onSubmit={() => comment.id != null && onReplySubmit(comment.id)}
          onCancel={() => {
            onSetReplyingId(null);
            onReplyContentChange("");
          }}
        />
      )}

      {/* Nested replies */}
      {totalReplies > 0 && (
        <div
          className={
            depth < maxDepth
              ? "ml-11 border-l border-slate-200 pl-3 dark:border-slate-700"
              : "ml-6 border-l border-slate-200 pl-3 dark:border-slate-700"
          }>
          {!isExpanded ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1 text-xs"
              onClick={() => comment.id != null && onToggleExpand(comment.id)}>
              <ChevronDown className="h-3.5 w-3.5" />
              Xem {totalReplies} phản hồi
            </Button>
          ) : (
            <>
              {atMaxDepth
                ? flatChildren.map((reply) => {
                    const isReplyingToReply = replyingToId === reply.id;
                    return (
                      <div key={reply.id}>
                        <CommentItem
                          comment={reply}
                          currentUserId={currentUserId}
                          onReply={(c) => {
                            onSetReplyingId(c.id ?? null);
                            onReplyContentChange("");
                          }}
                          mentionedUserName={
                            reply.parentCommentId
                              ? commentById.get(reply.parentCommentId)?.userName
                              : undefined
                          }
                          parentCommentId={reply.parentCommentId}
                          isHighlighted={highlightedCommentId === reply.id}
                          onMentionClick={onMentionClick}
                        />
                        {isReplyingToReply && (
                          <ReplyInput
                            userName={reply.userName ?? ""}
                            value={replyContent}
                            onChange={onReplyContentChange}
                            onSubmit={() => reply.id != null && onReplySubmit(reply.id)}
                            onCancel={() => {
                              onSetReplyingId(null);
                              onReplyContentChange("");
                            }}
                          />
                        )}
                      </div>
                    );
                  })
                : directChildren.map((child) => (
                    <CommentThread
                      key={child.comment.id}
                      node={child}
                      currentUserId={currentUserId}
                      replyingToId={replyingToId}
                      replyContent={replyContent}
                      onSetReplyingId={onSetReplyingId}
                      onReplyContentChange={onReplyContentChange}
                      onReplySubmit={onReplySubmit}
                      expandedIds={expandedIds}
                      onToggleExpand={onToggleExpand}
                      commentById={commentById}
                      highlightedCommentId={highlightedCommentId}
                      onMentionClick={onMentionClick}
                      depth={depth + 1}
                    />
                  ))}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-1 text-xs"
                onClick={() => comment.id != null && onToggleExpand(comment.id)}>
                <ChevronUp className="h-3.5 w-3.5" />
                Thu gọn
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommentSection — public component
// ---------------------------------------------------------------------------

interface CommentSectionProps {
  postId: number;
  /** When provided (from PostFeedModal via usePostById), skips the internal usePostComments fetch */
  externalComments?: PostCommentResponse[];
  /** When provided, called instead of internal invalidation after any mutation */
  onExternalInvalidate?: () => void;
  /** When true, hides the main comment input box (used by PostFeedModal sticky bottom bar) */
  hideInput?: boolean;
}

export function CommentSection({
  postId,
  externalComments,
  onExternalInvalidate,
  hideInput = false,
}: CommentSectionProps) {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  // Only fetch from API when no external comments are supplied (community PostDetailPage context)
  const { data: commentsData } = usePostComments(postId, !externalComments);
  const createComment = useCreateComment();

  const commentTree = useMemo(() => {
    const comments: PostCommentResponse[] =
      externalComments ??
      (Array.isArray(commentsData)
        ? commentsData
        : (commentsData as unknown as PostCommentResponse[])) ??
      [];
    return buildCommentTree(comments);
  }, [externalComments, commentsData]);

  // Flat lookup map for all comments — used for @mention resolution and reply-submit root-finding
  const commentById = useMemo(() => {
    const map = new Map<number, PostCommentResponse>();
    function addToMap(nodes: CommentNode[]) {
      for (const n of nodes) {
        if (n.comment.id != null) map.set(n.comment.id, n.comment);
        addToMap(n.children);
      }
    }
    addToMap(commentTree);
    return map;
  }, [commentTree]);

  // IDs of root-level comments (no parentCommentId) — used to find which thread to expand
  const rootIds = useMemo(
    () => new Set(commentTree.map((n) => n.comment.id).filter((id): id is number => id != null)),
    [commentTree]
  );

  const [newContent, setNewContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("oldest");
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
    queryClient.invalidateQueries({ queryKey: ["postCommentsCount", postId] });
  };

  const handleCommentSubmit = () => {
    const content = newContent.trim();
    if (!content || !currentUserId) return;

    createComment.mutate({ body: { postId, userId: currentUserId, content } } as never, {
      onSuccess: () => {
        setNewContent("");
        if (onExternalInvalidate) onExternalInvalidate();
        else invalidate();
      },
      onError: () => toast.error("Không thể gửi bình luận"),
    });
  };

  const handleReplySubmit = (parentCommentId: number) => {
    const rawContent = replyContent.trim();
    if (!rawContent || !currentUserId) return;

    const parentComment = commentById.get(parentCommentId);
    const content = parentComment?.userName
      ? `@${parentComment.userName} ${rawContent}`
      : rawContent;

    createComment.mutate(
      { body: { postId, userId: currentUserId, content, parentCommentId } } as never,
      {
        onSuccess: () => {
          setReplyContent("");
          setReplyingToId(null);
          // Expand the root thread so the new reply is immediately visible
          const rootId = findRootCommentId(parentCommentId, commentById, rootIds);
          setExpandedIds((prev) => new Set(prev).add(rootId));
          if (onExternalInvalidate) onExternalInvalidate();
          else invalidate();
        },
        onError: () => toast.error("Không thể gửi phản hồi"),
      }
    );
  };

  const handleToggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMentionClick = (parentCommentId: number) => {
    // Expand the root thread that contains the target comment, then scroll to it
    const rootId = findRootCommentId(parentCommentId, commentById, rootIds);
    setExpandedIds((prev) => new Set(prev).add(rootId));
    // Small delay so the DOM updates from the expand before we try to scroll
    setTimeout(() => {
      const el = document.querySelector(`[data-comment-id="${parentCommentId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setHighlightedCommentId(parentCommentId);
      setTimeout(() => setHighlightedCommentId(null), 2000);
    }, 50);
  };

  const sortedTree = useMemo(() => {
    if (sortOrder === "oldest") return commentTree;
    return [...commentTree].sort((a, b) => {
      if (!a.comment.createdAt || !b.comment.createdAt) return 0;
      return new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime();
    });
  }, [commentTree, sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bình luận</h3>
        {commentTree.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1 text-xs"
            onClick={() => setSortOrder((prev) => (prev === "oldest" ? "newest" : "oldest"))}>
            {sortOrder === "oldest" ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Cũ nhất
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Mới nhất
              </>
            )}
          </Button>
        )}
      </div>

      {sortedTree.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có bình luận nào</p>
      ) : (
        <div className="space-y-1 divide-y">
          {sortedTree.map((node) => (
            <CommentThread
              key={node.comment.id}
              node={node}
              currentUserId={currentUserId}
              replyingToId={replyingToId}
              replyContent={replyContent}
              onSetReplyingId={setReplyingToId}
              onReplyContentChange={setReplyContent}
              onReplySubmit={handleReplySubmit}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
              commentById={commentById}
              highlightedCommentId={highlightedCommentId}
              onMentionClick={handleMentionClick}
            />
          ))}
        </div>
      )}

      {/* Main comment input — hidden when parent provides its own sticky input */}
      {!hideInput && (
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
      )}
    </div>
  );
}
