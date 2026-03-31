import { Eye, MessageSquare, Search, ThumbsUp, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatDate } from "@/lib/formatting";

import { ReloadButton } from "@/components/shared";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Post, PostCommentResponse } from "@/interfaces";
import { getPostStatusBadge } from "@/lib/status-utils";
import { postManager } from "@/services/post.manager";
import { toast } from "sonner";

type StatusFilter = "all" | "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function PostManagementPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Detail dialog
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [postComments, setPostComments] = useState<PostCommentResponse[]>([]);

  // Delete comment confirmation
  const [commentToDelete, setCommentToDelete] = useState<PostCommentResponse | null>(null);
  const [isDeleteCommentOpen, setIsDeleteCommentOpen] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await postManager.getAll();
      if (response.success && response.data) {
        const postData = Array.isArray(response.data)
          ? response.data
          : ((response.data as { data?: Post[] }).data ?? []);
        setPosts(postData as Post[]);
      } else {
        toast.error(response.error || "Không thể tải danh sách bài viết");
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (statusFilter !== "all" && post.status !== statusFilter) return false;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return post.title?.toLowerCase().includes(lowerQuery);
      }
      return true;
    });
  }, [posts, statusFilter, searchQuery]);

  const handleViewDetail = async (post: Post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
    if (post.postId) {
      const commentsRes = await postManager.getCommentsByPostId(post.postId);
      if (commentsRes.success && commentsRes.data) {
        setPostComments(commentsRes.data);
      }
    }
  };

  const handleDeleteComment = (comment: PostCommentResponse) => {
    setCommentToDelete(comment);
    setIsDeleteCommentOpen(true);
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete?.id) return;
    try {
      const response = await postManager.deleteComment(commentToDelete.id);
      if (response.success) {
        toast.success("Đã xóa bình luận thành công");
        setPostComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
        setIsDeleteCommentOpen(false);
        setCommentToDelete(null);
        // Refresh comments count
        // Refresh posts list to get updated counts
        loadPosts();
      } else {
        toast.error(response.error || "Không thể xóa bình luận");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Không thể xóa bình luận");
    }
  };

  const getPostRowKey = (post: Post, index: number) => {
    if (post.postId) {
      return `post-${post.postId}`;
    }

    return `post-fallback-${post.creationDate ?? "no-date"}-${post.title ?? "untitled"}-${index}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="font-['Inter'] text-lg text-gray-500 dark:text-slate-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          Quản Lý Bài Viết
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Quản lý bài viết, trạng thái và bình luận
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative w-96">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
              <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
              <SelectItem value="ARCHIVED">Đã lưu trữ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ReloadButton
          onReload={loadPosts}
          isLoading={loading}
          tooltip="Tải lại danh sách bài viết"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Chuyên ngành</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Lượt thích</TableHead>
              <TableHead>Bình luận</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post, index) => (
              <TableRow key={getPostRowKey(post, index)}>
                <TableCell className="max-w-[250px] truncate font-medium">
                  {post.title || "—"}
                </TableCell>
                <TableCell>{post.author?.name || "—"}</TableCell>
                <TableCell>
                  <StatusBadge {...getPostStatusBadge(post.status)} />
                </TableCell>
                <TableCell>{post.major?.name || post.major?.majorName || "—"}</TableCell>
                <TableCell>{formatDate(post.creationDate)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-gray-400" />
                    {post.likeCount ?? 0}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-gray-400" />
                    {post.commentCount ?? 0}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => handleViewDetail(post)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredPosts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                  Không có bài viết nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>Chi tiết bài viết</DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              {/* Cover Image */}
              {selectedPost.coverImgUrl && (
                <img
                  src={selectedPost.coverImgUrl}
                  alt={selectedPost.title}
                  className="h-48 w-full rounded-lg object-cover"
                />
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-2">
                <StatusBadge {...getPostStatusBadge(selectedPost.status)} />
                {selectedPost.major && (
                  <Badge variant="outline">
                    {selectedPost.major.name || selectedPost.major.majorName}
                  </Badge>
                )}
                {selectedPost.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Author */}
              <div className="text-sm text-gray-600 dark:text-slate-400">
                <span className="font-medium">Tác giả:</span> {selectedPost.author?.name || "—"}
              </div>

              {/* Content */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
                <p className="text-sm whitespace-pre-wrap">{selectedPost.content}</p>
              </div>

              {/* Comments Section */}
              <div>
                <h3 className="mb-2 font-medium">Bình luận ({postComments.length})</h3>
                {postComments.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có bình luận nào</p>
                ) : (
                  <div className="space-y-2">
                    {postComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start justify-between rounded-lg border p-3 dark:border-slate-700">
                        <div>
                          <p className="text-sm font-medium">{comment.userName || "Ẩn danh"}</p>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {comment.content}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteComment(comment)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog open={isDeleteCommentOpen} onOpenChange={setIsDeleteCommentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa bình luận</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCommentOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteComment}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
