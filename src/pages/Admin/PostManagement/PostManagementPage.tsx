import {
  ArrowLeft,
  CheckCircle2,
  Columns2,
  Eye,
  LayoutGrid,
  MessageSquare,
  PenSquare,
  Search,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CommentSection, LikeButton, LikeListModal } from "@/components/post";
import { PaginationControl, ReloadButton } from "@/components/shared";
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
import { SpinnerBlock } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import type { Post, PostCommentResponse, PostLikeResponse, PostStatus } from "@/interfaces";
import { formatDate } from "@/lib/formatting";
import { queryClient } from "@/lib/queryClient";
import { getPostStatusBadge } from "@/lib/status-utils";
import { extractDataArray } from "@/lib/utils";
import { postManager, usePostById } from "@/services/post.manager";
import { useAuthStore } from "@/stores/authStore";

import { PostCreateForm } from "./components/PostCreateForm";
import { PostEditForm } from "./components/PostEditForm";

type StatusFilter = "all" | PostStatus;
type ListLayout = "table" | "grid";

type ViewState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; postId: number }
  | { mode: "detail"; postId: number };

type PostDetailPayload = {
  post?: Post;
  likeCount?: number;
  commentCount?: number;
  postLikes?: PostLikeResponse[];
  postComments?: PostCommentResponse[];
};

export function PostManagementPage() {
  const { user } = useAuthStore();

  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [majorFilter, setMajorFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [layout, setLayout] = useState<ListLayout>("table");
  const [pageSize, setPageSize] = useState(10);

  const [likesOpen, setLikesOpen] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState<number | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);

  const detailPostId = view.mode === "detail" ? view.postId : 0;
  const { data: detailRaw, isLoading: detailLoading } = usePostById(
    detailPostId,
    view.mode === "detail" && detailPostId > 0
  );
  const detailData = detailRaw as unknown as PostDetailPayload | undefined;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await postManager.getAll();
      if (!response.success) {
        toast.error(response.error || "Không thể tải danh sách bài viết");
        return;
      }
      setPosts(extractDataArray<Post>(response));
    } catch {
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const invalidatePostDetail = useCallback((postId: number) => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/posts/{postId}", { params: { path: { postId } } }],
    });
    queryClient.invalidateQueries({ queryKey: ["get", "/api/posts/feed"] });
  }, []);

  const allMajors = useMemo(() => {
    return [
      ...new Set(posts.map((p) => p.major?.name || p.major?.majorName).filter(Boolean)),
    ] as string[];
  }, [posts]);

  const allTags = useMemo(() => {
    return [...new Set(posts.flatMap((p) => p.tags ?? []))];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return posts
      .filter((post) => {
        if (statusFilter !== "all" && post.status !== statusFilter) {
          return false;
        }

        const majorName = post.major?.name || post.major?.majorName;
        if (majorFilter !== "all" && majorName !== majorFilter) {
          return false;
        }

        if (tagFilter !== "all" && !post.tags?.includes(tagFilter)) {
          return false;
        }

        if (!keyword) {
          return true;
        }

        const fields = [
          post.title,
          post.summary,
          post.content,
          post.author?.name,
          majorName,
          ...(post.tags ?? []),
        ];

        return fields.some((field) => field?.toLowerCase().includes(keyword));
      })
      .sort((a, b) => {
        const timeA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
        const timeB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
        return timeB - timeA;
      });
  }, [posts, searchQuery, statusFilter, majorFilter, tagFilter]);

  const pagination = usePagination({ totalCount: filteredPosts.length, pageSize });
  const pageItems = useMemo(
    () => filteredPosts.slice(pagination.startIndex, pagination.endIndex + 1),
    [filteredPosts, pagination.startIndex, pagination.endIndex]
  );

  const statusCounts = useMemo(() => {
    return {
      total: posts.length,
      draft: posts.filter((post) => post.status === "DRAFT").length,
      published: posts.filter((post) => post.status === "PUBLISHED").length,
      archived: posts.filter((post) => post.status === "ARCHIVED").length,
    };
  }, [posts]);

  const detailPost = detailData?.post;
  const detailLikes = detailData?.postLikes ?? [];
  const detailComments = detailData?.postComments ?? [];
  const detailLikeCount = detailData?.likeCount ?? detailPost?.likeCount ?? 0;
  const detailCommentCount =
    detailData?.commentCount ?? detailData?.postComments?.length ?? detailPost?.commentCount ?? 0;

  const commentToDelete =
    commentToDeleteId != null
      ? detailComments.find((comment) => comment.id === commentToDeleteId)
      : undefined;

  const updateStatus = async (postId: number, status: PostStatus, successText: string) => {
    setStatusUpdatingId(postId);
    try {
      const response = await postManager.changeStatus(postId, status);
      if (response.success) {
        toast.success(successText);
        await loadPosts();
        invalidatePostDetail(postId);
      } else {
        toast.error(response.error || "Không thể cập nhật trạng thái bài viết");
      }
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDeleteId) {
      return;
    }

    setDeletingComment(true);
    try {
      const response = await postManager.deleteComment(commentToDeleteId);
      if (response.success) {
        toast.success("Đã xóa bình luận thành công");
        setCommentToDeleteId(null);
        if (detailPostId > 0) {
          invalidatePostDetail(detailPostId);
        }
        await loadPosts();
      } else {
        toast.error(response.error || "Không thể xóa bình luận");
      }
    } finally {
      setDeletingComment(false);
    }
  };

  const getPostKey = (post: Post, index: number) => {
    if (post.postId) {
      return `post-${post.postId}`;
    }
    return `post-${post.title ?? "untitled"}-${post.creationDate ?? "no-date"}-${index}`;
  };

  if (view.mode === "create") {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" size="sm" onClick={() => setView({ mode: "list" })}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay lại danh sách
        </Button>
        <PostCreateForm
          onSuccess={() => {
            setView({ mode: "list" });
            void loadPosts();
          }}
          onCancel={() => setView({ mode: "list" })}
        />
      </div>
    );
  }

  if (view.mode === "edit") {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" size="sm" onClick={() => setView({ mode: "list" })}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay lại danh sách
        </Button>
        <PostEditForm
          postId={view.postId}
          onSuccess={() => {
            setView({ mode: "list" });
            void loadPosts();
          }}
          onCancel={() => setView({ mode: "list" })}
        />
      </div>
    );
  }

  if (view.mode === "detail") {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" size="sm" onClick={() => setView({ mode: "list" })}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay lại danh sách
        </Button>

        {detailLoading ? (
          <SpinnerBlock size="lg" />
        ) : !detailPost ? (
          <p className="text-muted-foreground">Không tìm thấy bài viết</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Chi tiết bài viết</h2>
                <p className="text-muted-foreground text-sm">
                  Theo dõi tương tác và kiểm duyệt bình luận tại một nơi.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {detailPost.postId && (
                  <Button
                    variant="outline"
                    onClick={() => setView({ mode: "edit", postId: detailPost.postId! })}>
                    <PenSquare className="mr-1 h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                )}
                {detailPost.postId && detailPost.status === "DRAFT" && (
                  <>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() =>
                        void updateStatus(detailPost.postId!, "PUBLISHED", "Đã duyệt bài viết")
                      }
                      disabled={statusUpdatingId === detailPost.postId}>
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Duyệt
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        void updateStatus(detailPost.postId!, "ARCHIVED", "Đã từ chối bài viết")
                      }
                      disabled={statusUpdatingId === detailPost.postId}>
                      <XCircle className="mr-1 h-4 w-4" />
                      Từ chối
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Card>
              {detailPost.coverImgUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={detailPost.coverImgUrl}
                    alt={detailPost.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge {...getPostStatusBadge(detailPost.status)} />
                  {(detailPost.major?.name || detailPost.major?.majorName) && (
                    <Badge variant="outline">
                      {detailPost.major?.name || detailPost.major?.majorName}
                    </Badge>
                  )}
                  {detailPost.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="text-2xl">{detailPost.title}</CardTitle>
                <div className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium">
                    {detailPost.author?.name || "Ẩn danh"}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{formatDate(detailPost.creationDate)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {detailPost.summary && (
                  <p className="text-muted-foreground italic">{detailPost.summary}</p>
                )}
                {detailPost.content && <p className="whitespace-pre-wrap">{detailPost.content}</p>}

                <div className="flex flex-wrap items-center gap-4 border-t pt-4">
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <ThumbsUp className="h-4 w-4" />
                    {detailLikeCount} lượt thích
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    {detailCommentCount} bình luận
                  </div>

                  {user?.id && detailPost.postId && (
                    <LikeButton
                      postId={detailPost.postId}
                      userId={user.id}
                      externalLikeCount={detailLikeCount}
                      onLikeChange={() => invalidatePostDetail(detailPost.postId!)}
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    disabled={detailLikes.length === 0}
                    onClick={() => setLikesOpen(true)}>
                    Xem danh sách lượt thích
                  </Button>
                </div>
              </CardContent>
            </Card>

            {detailPost.postId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bình luận & phản hồi</CardTitle>
                </CardHeader>
                <CardContent>
                  <CommentSection
                    postId={detailPost.postId}
                    externalComments={detailComments}
                    onExternalInvalidate={() => invalidatePostDetail(detailPost.postId!)}
                    allowDelete
                    onDeleteComment={setCommentToDeleteId}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <LikeListModal likes={detailLikes} open={likesOpen} onOpenChange={setLikesOpen} />

        <Dialog open={commentToDeleteId !== null} onOpenChange={() => setCommentToDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa bình luận</DialogTitle>
              <DialogDescription>
                {commentToDelete?.content
                  ? `Bạn có chắc chắn muốn xóa bình luận: "${commentToDelete.content}"?`
                  : "Bạn có chắc chắn muốn xóa bình luận này?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCommentToDeleteId(null)}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleDeleteComment()}
                disabled={deletingComment}>
                {deletingComment ? "Đang xóa..." : "Xóa bình luận"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bài viết & Cộng đồng</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý nội dung, kiểm duyệt và theo dõi tương tác trong một màn hình.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={loadPosts}
            isLoading={loading}
            tooltip="Tải lại danh sách bài viết"
          />
          <Button onClick={() => setView({ mode: "create" })}>Tạo bài viết</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Tổng bài viết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusCounts.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Bản nháp</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{statusCounts.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Đã xuất bản</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{statusCounts.published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Đã lưu trữ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-600">{statusCounts.archived}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Tìm theo tiêu đề, nội dung, tác giả, thẻ..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                <SelectItem value="ARCHIVED">Đã lưu trữ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={majorFilter} onValueChange={setMajorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chuyên ngành" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chuyên ngành</SelectItem>
                {allMajors.map((major) => (
                  <SelectItem key={major} value={major}>
                    {major}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Thẻ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thẻ</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={layout === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setLayout("table")}>
                <Columns2 className="mr-1 h-4 w-4" />
                Bảng
              </Button>
              <Button
                variant={layout === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setLayout("grid")}>
                <LayoutGrid className="mr-1 h-4 w-4" />
                Lưới
              </Button>
            </div>
          </div>

          {loading ? (
            <SpinnerBlock size="lg" />
          ) : pageItems.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">Không có bài viết phù hợp</p>
          ) : layout === "table" ? (
            <div className="rounded-md border">
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
                  {pageItems.map((post, index) => (
                    <TableRow key={getPostKey(post, index)}>
                      <TableCell className="max-w-[260px]">
                        <p className="truncate font-medium">{post.title || "—"}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {post.summary || post.content || ""}
                        </p>
                      </TableCell>
                      <TableCell>{post.author?.name || "—"}</TableCell>
                      <TableCell>
                        <StatusBadge {...getPostStatusBadge(post.status)} />
                      </TableCell>
                      <TableCell>{post.major?.name || post.major?.majorName || "—"}</TableCell>
                      <TableCell>{formatDate(post.creationDate)}</TableCell>
                      <TableCell>{post.likeCount ?? 0}</TableCell>
                      <TableCell>{post.commentCount ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {post.postId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setView({ mode: "detail", postId: post.postId! })}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {post.postId && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setView({ mode: "edit", postId: post.postId! })}>
                              <PenSquare className="h-4 w-4" />
                            </Button>
                          )}
                          {post.postId && post.status === "DRAFT" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                onClick={() =>
                                  void updateStatus(post.postId!, "PUBLISHED", "Đã duyệt bài viết")
                                }
                                disabled={statusUpdatingId === post.postId}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  void updateStatus(post.postId!, "ARCHIVED", "Đã từ chối bài viết")
                                }
                                disabled={statusUpdatingId === post.postId}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((post, index) => (
                <Card key={getPostKey(post, index)} className="flex flex-col">
                  {post.coverImgUrl && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img
                        src={post.coverImgUrl}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge {...getPostStatusBadge(post.status)} />
                      <span className="text-muted-foreground text-xs">
                        {formatDate(post.creationDate)}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-base">
                      {post.title || "Không có tiêu đề"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <p className="text-muted-foreground line-clamp-3 text-sm">
                      {post.summary || post.content || "Không có nội dung"}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {(post.major?.name || post.major?.majorName) && (
                        <Badge variant="outline">{post.major?.name || post.major?.majorName}</Badge>
                      )}
                      {post.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-muted-foreground flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {post.likeCount ?? 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {post.commentCount ?? 0}
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2">
                      {post.postId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setView({ mode: "detail", postId: post.postId! })}>
                          <Eye className="mr-1 h-4 w-4" />
                          Chi tiết
                        </Button>
                      )}
                      {post.postId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setView({ mode: "edit", postId: post.postId! })}>
                          <PenSquare className="mr-1 h-4 w-4" />
                          Chỉnh sửa
                        </Button>
                      )}
                      {post.postId && post.status === "DRAFT" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() =>
                              void updateStatus(post.postId!, "PUBLISHED", "Đã duyệt bài viết")
                            }
                            disabled={statusUpdatingId === post.postId}>
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              void updateStatus(post.postId!, "ARCHIVED", "Đã từ chối bài viết")
                            }
                            disabled={statusUpdatingId === post.postId}>
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <PaginationControl
            pagination={pagination}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[6, 9, 10, 20]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
