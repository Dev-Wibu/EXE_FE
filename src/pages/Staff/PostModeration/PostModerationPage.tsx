import { PaginationControl, ReloadButton, SortButton } from "@/components/shared";
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
import { useHybridPageSize, usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";
import type { Post, PostCommentResponse } from "@/interfaces";
import { formatDate, toTimestamp } from "@/lib/formatting";
import { getPostStatusBadge } from "@/lib/status-utils";
import { postManager } from "@/services/post.manager";
import { CheckCircle, Eye, MessageSquare, Search, Trash2, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
type ModerationFilter = "all" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
type SortablePost = Post & {
  idSortValue: number;
  titleSortValue: string;
  authorSortValue: string;
  createdAtSortValue: number;
  statusSortValue: string;
};
export function PostModerationPage() {
  const { t } = useTranslation();
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
          : ((
              response.data as {
                data?: Post[];
              }
            ).data ?? []);
        setPosts(postData as Post[]);
      } else {
        toast.error(response.error || t("common.unableToLoadArticleList"));
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error(t("common.unableToLoadArticleList"));
    } finally {
      setLoading(false);
    }
  }, [t]);
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
  const sortablePosts = useMemo<SortablePost[]>(() => {
    return filteredPosts.map((post) => ({
      ...post,
      idSortValue: typeof post.postId === "number" ? post.postId : 0,
      titleSortValue: post.title?.toLowerCase() || "",
      authorSortValue: post.author?.name?.toLowerCase() || "",
      createdAtSortValue: toTimestamp(post.creationDate) ?? 0,
      statusSortValue: post.status || "",
    }));
  }, [filteredPosts]);
  const { sortedData, getSortProps } = useSortable(sortablePosts, {
    defaultSort: {
      key: "createdAtSortValue",
      direction: "desc",
    },
    noSortBehavior: "preserve",
    tieBreaker: {
      key: "idSortValue",
      direction: "desc",
    },
  });
  const [pageSize, setPageSize] = useHybridPageSize({
    key: "src_pages_staff_postmoderation_postmoderationpage_tsx_pagesize",
    defaultPageSize: 10,
  });
  const pagination = usePagination({
    totalCount: sortedData.length,
    pageSize,
  });
  const pageData = useMemo(
    () => sortedData.slice(pagination.startIndex, pagination.endIndex + 1),
    [pagination.endIndex, pagination.startIndex, sortedData]
  );
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
        toast.success(t("staffPostmoderation.theArticleHasBeenApproved"));
        loadPosts();
      } else {
        toast.error(response.error || t("staffPostmoderation.cannotBrowsePosts"));
      }
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error(t("staffPostmoderation.cannotBrowsePosts"));
    }
  };
  const handleReject = async (post: Post) => {
    if (!post.postId) return;
    try {
      const response = await postManager.changeStatus(post.postId, "ARCHIVED");
      if (response.success) {
        toast.success(t("common.postRejected"));
        loadPosts();
      } else {
        toast.error(response.error || t("staffPostmoderation.postsCannotBeRejected"));
      }
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error(t("staffPostmoderation.postsCannotBeRejected"));
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
        toast.success(t("common.commentSuccessfullyDeleted"));
        setPostComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
        setIsDeleteCommentOpen(false);
        setCommentToDelete(null);
      } else {
        toast.error(response.error || t("common.commentsCannotBeDeleted"));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(t("common.commentsCannotBeDeleted"));
    }
  };
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-950">
        <SpinnerBlock fullScreen size="xl" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white p-8 dark:bg-slate-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-['Inter'] text-3xl font-bold text-zinc-800 dark:text-white">
          {t("staffPostmoderation.articleModeration")}
        </h1>
        <p className="font-['Inter'] text-base text-gray-600 dark:text-slate-400">
          {t("staffPostmoderation.reviewAndApproveArticlesBefore")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t("common.waitingForApproval")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.DRAFT}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t("common.approved")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.PUBLISHED}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t("staffPostmoderation.refused")}
            </CardTitle>
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
              placeholder={t("staffPostmoderation.searchByTitle")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                pagination.goToFirstPage();
              }}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as ModerationFilter);
              pagination.goToFirstPage();
            }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("common.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">{t("common.waitingForApproval")}</SelectItem>
              <SelectItem value="PUBLISHED">{t("common.approved")}</SelectItem>
              <SelectItem value="ARCHIVED">{t("staffPostmoderation.refused")}</SelectItem>
              <SelectItem value="all">{t("general.all")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={loadPosts}
            isLoading={loading}
            tooltip={t("common.reloadArticleList")}
          />
          <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2 dark:bg-yellow-900/30">
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              {statusCounts.DRAFT} {t("staffPostmoderation.postsAwaitingApproval")}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton {...getSortProps("titleSortValue")}>{t("common.title")}</SortButton>
              </TableHead>
              <TableHead>
                <SortButton {...getSortProps("authorSortValue")}>{t("common.author")}</SortButton>
              </TableHead>
              <TableHead>{t("common.specialized")}</TableHead>
              <TableHead>
                <SortButton {...getSortProps("createdAtSortValue")}>
                  {t("common.creationDate")}
                </SortButton>
              </TableHead>
              <TableHead>
                <SortButton {...getSortProps("statusSortValue")}>{t("common.status")}</SortButton>
              </TableHead>
              <TableHead className="text-right">{t("common.operation")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((post) => (
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
            {pageData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                  {t("staffPostmoderation.thereAreNoPosts")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {sortedData.length > 0 && (
          <PaginationControl
            pagination={pagination}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              pagination.goToFirstPage();
            }}
          />
        )}

        {sortedData.length === 0 && (searchQuery || statusFilter !== "DRAFT") && (
          <div className="flex justify-center pb-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("DRAFT");
                pagination.goToFirstPage();
              }}>
              {t("common.clearFilter")}
            </Button>
          </div>
        )}
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>{t("staffPostmoderation.seeArticleDetails")}</DialogDescription>
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
                <span className="font-medium">{t("staffPostmoderation.author")}</span>{" "}
                {selectedPost.author?.name || "—"}
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
                    {t("common.browse")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleReject(selectedPost);
                      setIsDetailOpen(false);
                    }}>
                    <XCircle className="mr-2 h-4 w-4" />
                    {t("common.refuse")}
                  </Button>
                </div>
              )}

              {/* Comments Section */}
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-medium">
                  <MessageSquare className="h-4 w-4" />
                  {t("staffPostmoderation.comment")}
                  {postComments.length})
                </h3>
                {postComments.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {t("staffPostmoderation.thereAreNoCommentsYet")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {postComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start justify-between rounded-lg border p-3 dark:border-slate-700">
                        <div>
                          <p className="text-sm font-medium">
                            {comment.userName || t("common.anonymous")}
                          </p>
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
            <DialogTitle>{t("common.confirmCommentDeletion")}</DialogTitle>
            <DialogDescription>{t("staffPostmoderation.areYouSureYouWant")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCommentOpen(false)}>
              {t("general.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteComment}>
              {t("general.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
