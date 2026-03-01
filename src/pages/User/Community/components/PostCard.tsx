import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Post } from "@/interfaces/schema.types";
import { formatDate } from "@/lib/formatting";
import { usePostCommentsCount } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";
import { MessageCircle } from "lucide-react";

import { LikeButton } from "./LikeButton";

interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  const { user } = useAuthStore();
  const { data: commentCountData } = usePostCommentsCount(post.postId ?? 0);
  const commentCount = (commentCountData as unknown as number) ?? 0;

  const authorInitials = post.author?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const summary =
    post.summary && post.summary.length > 120 ? `${post.summary.slice(0, 120)}...` : post.summary;

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onClick}>
      {post.coverImgUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img src={post.coverImgUrl} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={post.author?.avatarUrl} alt={post.author?.name} />
            <AvatarFallback className="text-xs">{authorInitials || "?"}</AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground text-sm">{post.author?.name ?? "Ẩn danh"}</span>
          <span className="text-muted-foreground text-xs">· {formatDate(post.creationDate)}</span>
        </div>
        <h3 className="text-lg leading-tight font-semibold">{post.title}</h3>
      </CardHeader>
      <CardContent className="pb-2">
        {summary && <p className="text-muted-foreground text-sm">{summary}</p>}
        <div className="mt-2 flex flex-wrap gap-1">
          {post.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {(post.major?.name || post.major?.majorName) && (
            <Badge variant="outline" className="text-xs">
              {post.major?.name || post.major?.majorName}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-3 pt-0">
        {user?.id && post.postId && <LikeButton postId={post.postId} userId={user.id} />}
        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
