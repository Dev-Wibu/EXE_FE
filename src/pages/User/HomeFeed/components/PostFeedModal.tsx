import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/formatting";
import {
  useCheckLiked,
  usePostCommentsCount,
  usePostLikes,
  usePostLikesCount,
} from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";
import type { components } from "../../../../../schema-from-be";

import { CommentSection } from "../../Community/components/CommentSection";
import { LikeButton } from "../../Community/components/LikeButton";
import { ExpandableText } from "./ExpandableText";
import { ImageViewerModal } from "./ImageViewerModal";

type PostResponse = components["schemas"]["PostResponse"];
type PostLikeResponse = components["schemas"]["PostLikeResponse"];

interface PostFeedModalProps {
  item: PostResponse;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
}

export function PostFeedModal({ item, open, onOpenChange }: PostFeedModalProps) {
  const { user } = useAuthStore();
  const post = item.post;
  const postId = post?.postId ?? 0;

  const [likesOpen, setLikesOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const enabled = open && postId > 0;
  const { data: likedData } = useCheckLiked(postId, user?.id ?? 0, enabled && !!user?.id);
  const { data: countData } = usePostLikesCount(postId);
  const { data: likesData } = usePostLikes(postId);
  const { data: commentCountData } = usePostCommentsCount(postId);

  // checkLiked returns { [key: string]: boolean } — extract the first value
  const isLiked = Object.values((likedData ?? {}) as Record<string, boolean>)[0] ?? false;
  const likeCount = (countData as unknown as number) ?? item.likeCount ?? 0;
  const likers =
    (Array.isArray(likesData) ? likesData : (likesData as unknown as PostLikeResponse[])) ?? [];
  const liveCommentCount = (commentCountData as unknown as number) ?? item.commentCount ?? 0;

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
                <LikeButton postId={postId} userId={user.id} showLabel />
              ) : (
                <span className="text-muted-foreground flex-1 text-center text-sm">Thích</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-center gap-1.5"
                onClick={() => {
                  document.getElementById(`comment-section-${postId}`)?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}>
                <MessageCircle className="h-4 w-4" />
                <span>Bình luận</span>
              </Button>
            </div>

            <Separator className="mx-6" />

            {/* Comment section */}
            {postId > 0 && (
              <div id={`comment-section-${postId}`} className="px-6 py-4">
                <CommentSection postId={postId} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen image viewer */}
      {post?.coverImgUrl && (
        <ImageViewerModal
          src={post.coverImgUrl}
          alt={post.title ?? ""}
          open={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </>
  );
}
