import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/formatting";
import { useCheckLiked } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";
import type { components } from "../../../../../schema-from-be";

import { LikeButton } from "../../Community/components/LikeButton";
import { PostFeedModal } from "./PostFeedModal";

type PostResponse = components["schemas"]["PostResponse"];

interface PostFeedCardProps {
  item: PostResponse;
}

export function PostFeedCard({ item }: PostFeedCardProps) {
  const { user } = useAuthStore();
  const post = item.post;
  const postId = post?.postId ?? 0;

  // Feed API already returns commentCount — no extra round-trip needed
  const commentCount = item.commentCount ?? 0;

  // useCheckLiked provides the is-liked state per user; likeCount from feed data + local optimistic
  const { data: likedData } = useCheckLiked(postId, user?.id ?? 0, !!user?.id && postId > 0);
  const [localLikeAdjust, setLocalLikeAdjust] = useState(0);

  // checkLiked returns { [key: string]: boolean } — extract the first value
  const isLiked = Object.values((likedData ?? {}) as Record<string, boolean>)[0] ?? false;
  const likeCount = (item.likeCount ?? 0) + localLikeAdjust;

  const [modalOpen, setModalOpen] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);

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
      <Card className="overflow-hidden rounded-xl border-slate-200/70 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800">
        {/* Author + major + date */}
        <CardHeader className="pt-4 pb-2">
          <div className="flex items-center gap-3">
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
        </CardHeader>

        {/* Title + Summary + Content */}
        <CardContent className="space-y-2 pb-2">
          {/* Title — clickable */}
          <button
            type="button"
            className="block w-full text-left"
            onClick={() => setModalOpen(true)}>
            <h3 className="line-clamp-2 text-base leading-snug font-bold hover:text-[#0047AB] dark:hover:text-[#66B2FF]">
              {post?.title}
            </h3>
          </button>

          {/* Summary — visually distinct as a highlighted intro block */}
          {post?.summary && (
            <div className="rounded-lg border-l-4 border-[#0047AB]/40 bg-slate-50 py-2 pr-3 pl-3 dark:border-[#66B2FF]/40 dark:bg-slate-800/50">
              <p className="line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {post.summary}
              </p>
            </div>
          )}

          {/* Content — regular body text, distinct from summary */}
          {post?.content && post.content !== post?.summary && (
            <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed">
              {post.content}
            </p>
          )}

          {/* Tags */}
          {(post?.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post!.tags!.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs text-slate-500 dark:text-slate-400">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        {/* Cover image (after text — text-first layout) */}
        {post?.coverImgUrl && (
          <div
            className="aspect-video w-full cursor-pointer overflow-hidden"
            onClick={() => setModalOpen(true)}>
            <img
              src={post.coverImgUrl}
              alt={post.title ?? ""}
              className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
            />
          </div>
        )}

        {/* Like/comment count bar (Facebook-style) */}
        {(likeLabel || localCommentCount > 0) && (
          <div className="flex items-center gap-1 px-4 pt-2 pb-1">
            {likeLabel && (
              <>
                <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                <span className="text-muted-foreground text-xs">{likeLabel}</span>
              </>
            )}
            {localCommentCount > 0 && (
              <button
                type="button"
                className="text-muted-foreground ml-auto text-xs hover:underline"
                onClick={() => setModalOpen(true)}>
                {localCommentCount} bình luận
              </button>
            )}
          </div>
        )}

        <Separator className="mx-4" />

        {/* Action row */}
        <CardFooter className="flex items-center gap-1 pt-1 pb-2">
          {user?.id && postId > 0 ? (
            <LikeButton
              postId={postId}
              userId={user.id}
              showLabel
              externalLikeCount={likeCount}
              onLikeChange={(liked) => setLocalLikeAdjust(liked ? 1 : -1)}
            />
          ) : (
            <span className="text-muted-foreground flex-1 text-center text-sm">Thích</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-center gap-1.5"
            onClick={() => setModalOpen(true)}>
            <MessageCircle className="h-4 w-4" />
            <span>Bình luận</span>
          </Button>
        </CardFooter>
      </Card>

      <PostFeedModal
        item={item}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCommentCountChange={setLocalCommentCount}
      />
    </>
  );
}
