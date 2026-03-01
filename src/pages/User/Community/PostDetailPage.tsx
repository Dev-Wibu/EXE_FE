import { ArrowLeft, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { formatDate } from "@/lib/formatting";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Post } from "@/interfaces/schema.types";
import { postManager } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";

import { CommentSection } from "./components/CommentSection";
import { LikeButton } from "./components/LikeButton";
import { LikeListModal } from "./components/LikeListModal";

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeModalOpen, setLikeModalOpen] = useState(false);

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      setLoading(true);
      const result = await postManager.getById(postId);
      if (result.success && result.data) {
        setPost(result.data);
      }
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return <p className="text-muted-foreground">Đang tải bài viết...</p>;
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("..")}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay lại
        </Button>
        <p className="text-muted-foreground">Không tìm thấy bài viết</p>
      </div>
    );
  }

  const authorInitials = post.author?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("..")}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay lại
        </Button>
        {user?.id && post.author?.id === user.id && (
          <Button variant="outline" size="sm" onClick={() => navigate(`${postId}/edit`)}>
            <Edit className="mr-1 h-4 w-4" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      <Card>
        {post.coverImgUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img src={post.coverImgUrl} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader>
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <div className="flex items-center gap-3 pt-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.author?.avatarUrl} alt={post.author?.name} />
              <AvatarFallback>{authorInitials || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{post.author?.name ?? "Ẩn danh"}</p>
              <p className="text-muted-foreground text-xs">{formatDate(post.creationDate)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 pt-2">
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
        </CardHeader>
        <CardContent className="space-y-4">
          {post.summary && <p className="text-muted-foreground italic">{post.summary}</p>}
          <div className="whitespace-pre-wrap">{post.content}</div>

          <div className="flex items-center gap-2 border-t pt-4">
            {user?.id && post.postId && <LikeButton postId={post.postId} userId={user.id} />}
            {post.postId && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs"
                onClick={() => setLikeModalOpen(true)}>
                Xem ai đã thích
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {post.postId && <CommentSection postId={post.postId} />}

      {post.postId && (
        <LikeListModal postId={post.postId} open={likeModalOpen} onOpenChange={setLikeModalOpen} />
      )}
    </div>
  );
}
