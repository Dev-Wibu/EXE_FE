import { CheckCircle, Eye, MessageSquare, Search, Trash2, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatDate } from "@/lib/formatting";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type ModerationFilter = "all" | "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function PostModerationPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModerationFilter>("DRAFT");

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

  const statusCounts = useMemo(() => {
    return {
      DRAFT: posts.filter((p) => p.status === "DRAFT").length,
      PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length,
      ARCHIVED: posts.filter((p) => p.status === "ARCHIVED").length,
    };
  }, [posts]);

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

  const handleApprove = async (post: Post) => {
    if (!post.postId) return;
    try {
      const response = await postManager.changeStatus(post.postId, "PUBLISHED");
      if (response.success) {
        toast.success("Đã duyệt bài viết thành công");
        loadPosts();
      } else {
        toast.error(response.error || "Không thể duyệt bài viết");
      }
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Không thể duyệt bài viết");
    }
  };

  const handleReject = async (post: Post) => {
    if (!post.postId) return;
    try {
      const response = await postManager.changeStatus(post.postId, "ARCHIVED");
      if (response.success) {
        toast.success("Đã từ chối bài viết");
        loadPosts();
      } else {
        toast.error(response.error || "Không thể từ chối bài viết");
      }
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Không thể từ chối bài viết");
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
      } else {
        toast.error(response.error || "Không thể xóa bình luận");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Không thể xóa bình luận");
    }
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
          Kiểm Duyệt Bài Viết
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          Xem xét và phê duyệt bài viết trước khi xuất bản
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.DRAFT}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Đã duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.PUBLISHED}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Đã từ chối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.ARCHIVED}</div>
          </CardContent>
        </Card>
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
            onValueChange={(value) => setStatusFilter(value as ModerationFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Chờ duyệt</SelectItem>
              <SelectItem value="PUBLISHED">Đã duyệt</SelectItem>
              <SelectItem value="ARCHIVED">Đã từ chối</SelectItem>
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pending count */}
        <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2 dark:bg-yellow-900/30">
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
            {statusCounts.DRAFT} bài viết chờ duyệt
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Chuyên ngành</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => (
              <TableRow key={post.postId}>
                <TableCell className="max-w-[300px] truncate font-medium">
                  {post.title || "—"}
                </TableCell>
                <TableCell>{post.author?.name || "—"}</TableCell>
                <TableCell>{post.major?.name || post.major?.majorName || "—"}</TableCell>
                <TableCell>{formatDate(post.creationDate)}</TableCell>
                <TableCell>
                  <StatusBadge {...getPostStatusBadge(post.status)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleViewDetail(post)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {post.status === "DRAFT" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleApprove(post)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleReject(post)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredPosts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">
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
            <DialogDescription>Xem chi tiết bài viết</DialogDescription>
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

              {/* Moderation Actions */}
              {selectedPost.status === "DRAFT" && (
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApprove(selectedPost);
                      setIsDetailOpen(false);
                    }}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Duyệt
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleReject(selectedPost);
                      setIsDetailOpen(false);
                    }}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Từ chối
                  </Button>
                </div>
              )}

              {/* Comments Section */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Bình luận ({postComments.length})
                </h3>
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
