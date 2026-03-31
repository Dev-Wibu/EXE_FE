import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PaginationControl, ReloadButton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePagination } from "@/hooks/usePagination";
import type { Post } from "@/interfaces/schema.types";
import { extractDataArray } from "@/lib/utils";
import { postManager } from "@/services/post.manager";

import { PostCard } from "./components/PostCard";

export function PostListPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const result = await postManager.getPublished();
    if (result.success && result.data) {
      setPosts(extractDataArray<Post>(result));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPosts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPosts]);

  const allMajors = [
    ...new Set(posts.map((p) => p.major?.name || p.major?.majorName).filter(Boolean)),
  ] as string[];

  const filtered = useMemo(() => {
    return posts
      .filter((p) => {
        if (tagFilter && !p.tags?.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()))) {
          return false;
        }
        if (majorFilter !== "all" && (p.major?.name || p.major?.majorName) !== majorFilter) {
          return false;
        }
        return true;
      })
      .reverse();
  }, [posts, tagFilter, majorFilter]);

  // Pagination
  const [pageSize, setPageSize] = useState(9);
  const pagination = usePagination({
    totalCount: filtered.length,
    pageSize,
  });

  const pageData = useMemo(() => {
    return filtered.slice(pagination.startIndex, pagination.endIndex + 1);
  }, [filtered, pagination.startIndex, pagination.endIndex]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cộng đồng</h1>
          <p className="text-muted-foreground">Bài viết</p>
        </div>
        <div className="flex items-center gap-2">
          <ReloadButton
            onReload={loadPosts}
            isLoading={loading}
            tooltip="Tải lại danh sách bài viết"
          />
          <Button onClick={() => navigate("community/create")}>
            <Plus className="mr-1 h-4 w-4" />
            Tạo bài viết mới
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Lọc theo thẻ..."
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="w-48"
        />
        <Select value={majorFilter} onValueChange={setMajorFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Chuyên ngành" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chuyên ngành</SelectItem>
            {allMajors.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Chưa có bài viết nào</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pageData.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onClick={() => navigate(`community/${post.postId}`)}
              />
            ))}
          </div>
          {filtered.length > pageSize && (
            <PaginationControl pagination={pagination} onPageSizeChange={setPageSize} />
          )}
        </>
      )}
    </div>
  );
}
