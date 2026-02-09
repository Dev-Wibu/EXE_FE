import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import {
  useCheckLiked,
  usePostLikesCount,
  useLikePost,
  useUnlikePost,
} from "@/services/post.manager";

interface LikeButtonProps {
  postId: number;
  userId: number;
  onLikeChange?: (liked: boolean) => void;
}

export function LikeButton({ postId, userId, onLikeChange }: LikeButtonProps) {
  const { data: likedData } = useCheckLiked(postId, userId);
  const { data: countData } = usePostLikesCount(postId);
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();

  const liked = (likedData as unknown as boolean) ?? false;
  const count = (countData as unknown as number) ?? 0;

  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const isLiked = optimisticLiked !== null ? optimisticLiked : liked;
  const likeCount = optimisticCount !== null ? optimisticCount : count;

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["get", `/api/posts/likes/${postId}/check/${userId}`] });
    queryClient.invalidateQueries({ queryKey: ["get", `/api/posts/likes/${postId}/count`] });
  };

  const handleToggle = () => {
    if (isLiked) {
      setOptimisticLiked(false);
      setOptimisticCount(Math.max(0, likeCount - 1));
      unlikeMutation.mutate(
        { params: { path: { postId, userId } } } as never,
        {
          onSuccess: () => {
            invalidateQueries();
            setOptimisticLiked(null);
            setOptimisticCount(null);
            onLikeChange?.(false);
          },
          onError: () => {
            setOptimisticLiked(null);
            setOptimisticCount(null);
            toast.error("Không thể bỏ thích bài viết");
          },
        }
      );
    } else {
      setOptimisticLiked(true);
      setOptimisticCount(likeCount + 1);
      likeMutation.mutate(
        { body: { postId, userId } } as never,
        {
          onSuccess: () => {
            invalidateQueries();
            setOptimisticLiked(null);
            setOptimisticCount(null);
            onLikeChange?.(true);
          },
          onError: () => {
            setOptimisticLiked(null);
            setOptimisticCount(null);
            toast.error("Không thể thích bài viết");
          },
        }
      );
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleToggle();
      }}
      className="gap-1"
    >
      <Heart
        className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
      />
      <span>{likeCount}</span>
    </Button>
  );
}
