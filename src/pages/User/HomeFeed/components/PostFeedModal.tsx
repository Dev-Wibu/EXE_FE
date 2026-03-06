import { Heart, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/formatting";
import { queryClient } from "@/lib/queryClient";
import { useCheckLiked, useCreateComment, usePostById } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";
import type { components } from "../../../../../schema-from-be";

import { CommentSection } from "../../Community/components/CommentSection";
import { LikeButton } from "../../Community/components/LikeButton";
import { ExpandableText } from "./ExpandableText";
import { ImageViewerModal } from "./ImageViewerModal";

type PostResponse = components["schemas"]["PostResponse"];
type PostLikeResponse = components["schemas"]["PostLikeResponse"];
type PostCommentResponse = components["schemas"]["PostCommentResponse"];

interface PostFeedModalProps {
  item: PostResponse;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onCommentCountChange?: (_count: number) => void;
}

export function PostFeedModal({
  item,
  open,
  onOpenChange,
  onCommentCountChange,
}: PostFeedModalProps) {
  const { user } = useAuthStore();
  const post = item.post;
  const postId = post?.postId ?? 0;

  const [likesOpen, setLikesOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const createComment = useCreateComment();

  // Fetch live post detail only when the modal is open — covers likeCount, commentCount,
  // postLikes, and postComments in a single request (replaces 4 separate queries)
  const enabled = open && postId > 0;
  const { data: liveRaw } = usePostById(postId, enabled);
  const live = liveRaw as unknown as PostResponse | undefined;

  const { data: likedData } = useCheckLiked(postId, user?.id ?? 0, enabled && !!user?.id);

  const invalidateLivePost = () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/posts/{postId}", { params: { path: { postId } } }],
    });
    queryClient.invalidateQueries({ queryKey: ["get", "/api/posts/feed"] });
  };

  const handleCommentSubmit = () => {
    const content = newComment.trim();
    if (!content || !user?.id) return;
    createComment.mutate({ body: { postId, userId: user.id, content } } as never, {
      onSuccess: () => {
        setNewComment("");
        invalidateLivePost();
        onCommentCountChange?.((liveCommentCount ?? 0) + 1);
      },
      onError: () => toast.error("Không thể gửi bình luận"),
    });
  };

  // checkLiked returns { [key: string]: boolean } — extract the first value
  const isLiked = Object.values((likedData ?? {}) as Record<string, boolean>)[0] ?? false;
  const likeCount = live?.likeCount ?? item.likeCount ?? 0;
  const likers = (live?.postLikes ?? item.postLikes ?? []) as PostLikeResponse[];
  const liveCommentCount = live?.commentCount ?? item.commentCount ?? 0;
  const postComments = (live?.postComments ?? item.postComments ?? []) as PostCommentResponse[];

  const authorName = post?.author?.name ?? "Ẩn danh";
  const authorInitials = authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Facebook-style like count label
  const likeLabel = (() => {
    if (likeCount === 0) return null;
    if (isLiked && likeCount === 1) return "Bạn";
    if (isLiked) return `Bạn và ${likeCount - 1} người khác`;
    return `${likeCount}`;
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-center">Bài viết của {authorName}</DialogTitle>
          </DialogHeader>

          {/* Scrollable body — overflow-x-hidden prevents horizontal scrollbar */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto">
            {/* Author row */}
            <div className="flex items-center gap-3 px-6 pt-4">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-slate-100 dark:ring-slate-800">
                <AvatarImage src={post?.author?.avatar} alt={authorName} />
                <AvatarFallback className="bg-[#0047AB]/10 text-sm font-semibold text-[#0047AB]">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{authorName}</span>
                  {post?.majorName && (
                    <Badge
                      variant="secondary"
                      className="bg-[#DCEEFF] text-xs text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]">
                      {post.majorName}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">{formatDate(post?.creationDate)}</p>
              </div>
            </div>

            {/* Title */}
            <h2 className="px-6 pt-3 text-lg leading-snug font-bold">{post?.title}</h2>

            {/* Summary — highlighted block, distinct from content */}
            {post?.summary && (
              <div className="mx-6 mt-3 rounded-lg border-l-4 border-[#0047AB]/40 bg-slate-50 py-2.5 pr-4 pl-3 dark:border-[#66B2FF]/40 dark:bg-slate-800/50">
                <ExpandableText
                  text={post.summary}
                  clampClass="line-clamp-4"
                  className="text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                />
              </div>
            )}

            {/* Full content — with expandable "Xem thêm" */}
            {post?.content && (
              <div className="px-6 pt-3">
                <ExpandableText
                  text={post.content}
                  clampClass="line-clamp-8"
                  className="text-sm leading-relaxed wrap-break-word"
                />
              </div>
            )}

            {/* Cover image — clickable to open full-screen viewer */}
            {post?.coverImgUrl && (
              <div
                className="mt-3 w-full cursor-pointer overflow-hidden"
                onClick={() => setImageViewerOpen(true)}>
                <img
                  src={post.coverImgUrl}
                  alt={post.title ?? ""}
                  className="h-auto w-full object-contain transition-opacity hover:opacity-90"
                />
              </div>
            )}

            {/* Tags */}
            {(post?.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 px-6 pt-3">
                {post!.tags!.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs text-slate-500">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Like/comment count bar */}
            {(likeLabel || liveCommentCount > 0) && (
              <div className="flex items-center gap-1 px-6 pt-3 pb-1">
                {likeLabel && (
                  <Popover open={likesOpen} onOpenChange={setLikesOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1 hover:underline" type="button">
                        <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                        <span className="text-muted-foreground text-xs">{likeLabel}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="max-h-64 w-56 overflow-y-auto p-2"
                      side="top"
                      align="start">
                      <p className="mb-2 text-xs font-semibold">Người đã thích</p>
                      {likers.length === 0 ? (
                        <p className="text-muted-foreground text-xs">Chưa có ai</p>
                      ) : (
                        likers.map((l, i) => (
                          <div key={i} className="flex items-center gap-2 py-1">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={l.userAvatar} alt={l.userName} />
                              <AvatarFallback className="text-[10px]">
                                {l.userName?.[0]?.toUpperCase() ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{l.userName ?? "Ẩn danh"}</span>
                          </div>
                        ))
                      )}
                    </PopoverContent>
                  </Popover>
                )}
                {liveCommentCount > 0 && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {liveCommentCount} bình luận
                  </span>
                )}
              </div>
            )}

            <Separator className="mx-6" />

            {/* Action row */}
            <div className="flex items-center gap-1 px-4 py-1">
              {user?.id && postId > 0 ? (
                <LikeButton
                  postId={postId}
                  userId={user.id}
                  showLabel
                  externalLikeCount={likeCount}
                  onLikeChange={invalidateLivePost}
                />
              ) : (
                <span className="text-muted-foreground flex-1 text-center text-sm">Thích</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-center gap-1.5"
                onClick={() => document.getElementById(`comment-input-${postId}`)?.focus()}>
                <MessageCircle className="h-4 w-4" />
                <span>Bình luận</span>
              </Button>
            </div>

            <Separator className="mx-6" />

            {/* Comment thread (no input box — input is in sticky bottom bar) */}
            {postId > 0 && (
              <div className="px-6 py-4">
                <CommentSection
                  key={postId}
                  postId={postId}
                  externalComments={postComments}
                  onExternalInvalidate={invalidateLivePost}
                  hideInput
                />
              </div>
            )}
          </div>

          {/* Sticky comment input — always visible at modal bottom */}
          {postId > 0 && user?.id && (
            <div className="flex shrink-0 items-end gap-2 border-t px-4 py-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? ""} />
                <AvatarFallback className="bg-[#0047AB]/10 text-xs font-semibold text-[#0047AB]">
                  {(user.name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Textarea
                id={`comment-input-${postId}`}
                placeholder="Viết bình luận... (Ctrl+Enter để gửi)"
                value={newComment}
                rows={1}
                className="max-h-28 flex-1 resize-none overflow-auto"
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleCommentSubmit();
                }}
              />
              <Button
                size="sm"
                className="shrink-0"
                onClick={handleCommentSubmit}
                disabled={!newComment.trim() || createComment.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
        {/* Full-screen image viewer — inside DialogContent so Radix treats its DOM as internal,
              preventing the DismissableLayer from closing the Dialog on backdrop/X click */}
        {post?.coverImgUrl && (
          <ImageViewerModal
            src={post.coverImgUrl}
            alt={post.title ?? ""}
            open={imageViewerOpen}
            onClose={() => setImageViewerOpen(false)}
          />
        )}
      </Dialog>
    </>
  );
}
