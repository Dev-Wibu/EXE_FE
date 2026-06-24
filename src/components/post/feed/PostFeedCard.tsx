import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/formatting";
import { useCheckLiked } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";
import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { components } from "../../../../schema-from-be";
import { LikeButton } from "../LikeButton";
import { LikeListModal } from "../LikeListModal";
import { PostFeedModal } from "./PostFeedModal";
type PostResponse = components["schemas"]["PostResponse"];
interface PostFeedCardProps {
  item: PostResponse;
}
export function PostFeedCard({ item }: PostFeedCardProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const post = item.post;
  const postId = post?.postId ?? 0;
  const commentCount = item.commentCount ?? 0;
  const { data: likedData } = useCheckLiked(postId, user?.id ?? 0, !!user?.id && postId > 0);
  const [localLikeAdjust, setLocalLikeAdjust] = useState(0);
  const rawLiked = Object.values(likedData ?? {})[0] as string | boolean | undefined;
  const isLiked = rawLiked === true || rawLiked === "true";
  const likeCount = (item.likeCount ?? 0) + localLikeAdjust;
  const [modalOpen, setModalOpen] = useState(false);
  const [likeModalOpen, setLikeModalOpen] = useState(false);

  // Synchronized list of users who liked the post (excluding empty/null userNames)
  const rawLikers = (item.postLikes ?? []).filter(
    (l): l is components["schemas"]["PostLikeResponse"] & { userName: string } => !!l.userName
  );
  const likers = [...rawLikers];
  if (isLiked && user?.name) {
    if (!likers.some((l) => l.userName === user.name)) {
      likers.unshift({
        userName: user.name,
        userAvatar: user.avatarUrl ?? "",
      });
    }
  } else if (!isLiked && user?.name) {
    const idx = likers.findIndex((l) => l.userName === user.name);
    if (idx !== -1) {
      likers.splice(idx, 1);
    }
  }
  const showSuffix = likeCount > 10;
  const displayLikers = showSuffix ? likers.slice(0, 9) : likers.slice(0, 10);
  const extraCount = Math.max(0, likeCount - displayLikers.length);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const authorName = post?.author?.name ?? t("common.anonymous");
  const authorInitials = authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const likeLabel = (() => {
    if (likeCount === 0) return null;
    if (isLiked && likeCount === 1) return t("common.friend");
    if (isLiked)
      return t("general.youAndOthers", {
        var_0: likeCount - 1,
      });
    return `${likeCount}`;
  })();
  return (
    <>
      <Card className="overflow-hidden rounded-xl border-slate-200/70 py-0 shadow-sm hover:shadow-md dark:border-slate-800">
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
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(post as any)?.majorName && (
                  <Badge
                    variant="secondary"
                    className="bg-[#DCEEFF] text-xs text-[#0047AB] dark:bg-[#0047AB]/20 dark:text-[#66B2FF]">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(post as any).majorName}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">{formatDateTime(post?.creationDate)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pb-2">
          <button
            type="button"
            className="block w-full text-left"
            onClick={() => setModalOpen(true)}>
            <h3 className="line-clamp-2 text-base leading-snug font-bold hover:text-[#0047AB] dark:hover:text-[#66B2FF]">
              {post?.title}
            </h3>
          </button>

          {post?.summary && (
            <div className="rounded-lg border-l-4 border-[#0047AB]/40 bg-slate-50 py-2 pr-3 pl-3 dark:border-[#66B2FF]/40 dark:bg-slate-800/50">
              <p className="line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {post.summary}
              </p>
            </div>
          )}

          {post?.content && post.content !== post?.summary && (
            <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed">
              {post.content}
            </p>
          )}

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

        {(likeLabel || localCommentCount > 0) && (
          <div className="flex items-center gap-1 px-4 py-0">
            {likeLabel && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-1 text-left hover:underline"
                      onClick={() => setLikeModalOpen(true)}>
                      <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                      <span className="text-muted-foreground text-xs">{likeLabel}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="z-50 max-w-xs rounded-lg border-slate-800 bg-slate-900 p-2 text-slate-50 shadow-xl">
                    <div className="space-y-1.5">
                      {displayLikers.map((liker) => (
                        <div key={liker.userName} className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 ring-1 ring-slate-700/50">
                            <AvatarImage src={liker.userAvatar} alt={liker.userName} />
                            <AvatarFallback className="bg-[#0047AB]/20 text-[10px] font-bold text-[#66B2FF]">
                              {(liker.userName ?? "").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-xs font-medium">{liker.userName}</span>
                        </div>
                      ))}
                      {showSuffix && extraCount > 0 && (
                        <div className="pl-7 text-[11px] font-medium text-slate-400">
                          {t("compPost.andOthersCount", { count: extraCount })}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {localCommentCount > 0 && (
              <button
                type="button"
                className="text-muted-foreground ml-auto text-xs hover:underline"
                onClick={() => setModalOpen(true)}>
                {localCommentCount} {t("general.comments")}
              </button>
            )}
          </div>
        )}

        <Separator className="mx-4" />

        <CardFooter className="flex items-center pt-0 pb-2">
          {user?.id && postId > 0 ? (
            <LikeButton
              postId={postId}
              userId={user.id}
              showLabel
              externalLikeCount={likeCount}
              onLikeChange={(liked) => setLocalLikeAdjust(liked ? 1 : -1)}
            />
          ) : (
            <span className="text-muted-foreground flex-1 text-center text-sm">
              {t("compPost.prefer")}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-center gap-1.5"
            onClick={() => setModalOpen(true)}>
            <MessageCircle className="h-4 w-4" />
            <span>{t("common.comment1")}</span>
          </Button>
        </CardFooter>
      </Card>

      <PostFeedModal
        item={item}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCommentCountChange={setLocalCommentCount}
      />

      <LikeListModal likes={likers} open={likeModalOpen} onOpenChange={setLikeModalOpen} />
    </>
  );
}
