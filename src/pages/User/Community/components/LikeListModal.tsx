import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PostLikeResponse } from "@/interfaces/schema.types";
import { usePostLikes } from "@/services/post.manager";

interface LikeListModalProps {
  postId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LikeListModal({ postId, open, onOpenChange }: LikeListModalProps) {
  const { data } = usePostLikes(postId);
  const likes = (Array.isArray(data) ? data : (data as unknown as PostLikeResponse[])) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Người đã thích</DialogTitle>
        </DialogHeader>
        {likes.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Chưa có ai thích bài viết này
          </p>
        ) : (
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {likes.map((like, index) => {
              const initials = like.userName
                ?.split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <div
                  key={`${like.userName ?? "user"}-${index}`}
                  className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={like.userAvatar} alt={like.userName} />
                    <AvatarFallback>{initials || "?"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{like.userName ?? "Ẩn danh"}</span>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
