import { MediaLightboxDialog } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/formatting";
import { invalidatePostFeedQueries } from "@/lib/post-feed";
import { useCheckLiked, useCreateComment, usePostById } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";
import { Heart, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { components } from "../../../../schema-from-be";
import { CommentSection } from "../CommentSection";
import { LikeButton } from "../LikeButton";
import { LikeListModal } from "../LikeListModal";
import { ExpandableText } from "./ExpandableText";
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
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const post = item.post;
  const postId = post?.postId ?? 0;
  const [likeModalOpen, setLikeModalOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const createComment = useCreateComment();

  // Only fetch live data when user is logged in (API requires auth)
  const shouldFetchLive = !!user?.id;
  const { data: liveRaw } = usePostById(postId, shouldFetchLive);
  const live = liveRaw as unknown as PostResponse | undefined;

  // Only check liked status when user is logged in
  const { data: likedData } = useCheckLiked(postId, user?.id ?? 0, !!user?.id);
  const handlePostModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && imageViewerOpen) {
      return;
    }
    onOpenChange(nextOpen);
  };
  const invalidateLivePost = () => {
    invalidatePostFeedQueries(postId);
  };
  const handleCommentSubmit = () => {
    const content = newComment.trim();
    if (!content || !user?.id) return;
    createComment.mutate(
      {
        body: {
          postId,
          userId: user.id,
          content,
        },
      } as never,
      {
        onSuccess: () => {
          setNewComment("");
          invalidateLivePost();
          onCommentCountChange?.((liveCommentCount ?? 0) + 1);
        },
        onError: () => toast.error(t("compPost.cannotPostComments")),
      }
    );
  };
  const rawLiked = Object.values(likedData ?? {})[0] as string | boolean | undefined;
  const isLiked = rawLiked === true || rawLiked === "true";
  const likeCount = live?.likeCount ?? item.likeCount ?? 0;

  // Synchronized list of users who liked the post (excluding empty/null userNames)
  const rawLikers = ((live?.postLikes ?? item.postLikes ?? []) as PostLikeResponse[]).filter(
    (l): l is PostLikeResponse & { userName: string } => !!l.userName
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
  const liveCommentCount = live?.commentCount ?? item.commentCount ?? 0;
  const postComments = (live?.postComments ?? item.postComments ?? []) as PostCommentResponse[];
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
  const coverMediaItems = post?.coverImgUrl
    ? [
        {
          id: `post-cover-${postId}`,
          name: post.title ?? t("compPost.articlePhoto"),
          src: post.coverImgUrl,
          alt: post.title ?? t("compPost.articlePhoto"),
          kind: "image" as const,
          requireAuth: false,
        },
      ]
    : [];
  return (
    <>
      <Dialog open={open} onOpenChange={handlePostModalOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0"
          onEscapeKeyDown={(event) => {
            if (imageViewerOpen) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (imageViewerOpen) {
              event.preventDefault();
            }
          }}>
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-center">
              {t("compPost.articleBy")} {authorName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-x-hidden overflow-y-auto">
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
                <p className="text-muted-foreground text-xs">
                  {formatDateTime(post?.creationDate)}
                </p>
              </div>
            </div>

            <h2 className="px-6 pt-3 text-lg leading-snug font-bold">{post?.title}</h2>

            {post?.summary && (
              <div className="mx-6 mt-3 rounded-lg border-l-4 border-[#0047AB]/40 bg-slate-50 py-2.5 pr-4 pl-3 dark:border-[#66B2FF]/40 dark:bg-slate-800/50">
                <ExpandableText
                  text={post.summary}
                  clampClass="line-clamp-4"
                  className="text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                />
              </div>
            )}

            {post?.content && (
              <div className="px-6 pt-3">
                <ExpandableText
                  text={post.content}
                  clampClass="line-clamp-8"
                  className="text-sm leading-relaxed wrap-break-word"
                />
              </div>
            )}

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

            {(post?.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 px-6 pt-3">
                {post!.tags!.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs text-slate-500">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {(likeLabel || liveCommentCount > 0) && (
              <div className="flex items-center gap-1 px-6 pt-3 pb-1">
                {likeLabel && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="flex cursor-pointer items-center gap-1 text-left hover:underline"
                          type="button"
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
                {liveCommentCount > 0 && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {liveCommentCount} {t("general.comments")}
                  </span>
                )}
              </div>
            )}

            <Separator className="mx-6" />

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
                <span className="text-muted-foreground flex-1 text-center text-sm">
                  {t("compPost.prefer")}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-center gap-1.5"
                onClick={() => document.getElementById(`comment-input-${postId}`)?.focus()}>
                <MessageCircle className="h-4 w-4" />
                <span>{t("common.comment1")}</span>
              </Button>
            </div>

            <Separator className="mx-6" />

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
                placeholder={t("compPost.writeACommentCtrlEnter")}
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
      </Dialog>

      {coverMediaItems.length > 0 && (
        <MediaLightboxDialog
          open={open && imageViewerOpen}
          onOpenChange={(nextOpen) => setImageViewerOpen(nextOpen)}
          items={coverMediaItems}
        />
      )}

      <LikeListModal likes={likers} open={likeModalOpen} onOpenChange={setLikeModalOpen} />
    </>
  );
}
