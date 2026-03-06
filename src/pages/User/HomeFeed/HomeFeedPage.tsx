import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/authStore";

import { CreatePostModal } from "./components/CreatePostModal";
import { PostFeedCard } from "./components/PostFeedCard";
import { useHomeFeed } from "./useHomeFeed";

type SortBy = "newest" | "popular";

export function HomeFeedPage() {
  const { user } = useAuthStore();
  const { posts, hasMore, isLoading, isFetchingMore, loadMore, refresh } = useHomeFeed();
  const [search, setSearch] = useState("");
  const [majorFilter, setMajorFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const authorName = user?.name ?? "Bạn";
  const authorInitials = authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Derive unique major list from loaded posts
  const allMajors = useMemo(() => {
    return [...new Set(posts.map((p) => p.post?.majorName).filter(Boolean))] as string[];
  }, [posts]);

  // Client-side filter + sort on accumulated posts
  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return posts
      .filter((item) => {
        const post = item.post;
        const matchSearch =
          !search ||
          post?.title?.toLowerCase().includes(lower) ||
          post?.tags?.some((t) => t.toLowerCase().includes(lower)) ||
          false;
        const matchMajor = majorFilter === "all" || post?.majorName === majorFilter;
        return matchSearch && matchMajor;
      })
      .sort((a, b) => {
        if (sortBy === "popular") return (b.likeCount ?? 0) - (a.likeCount ?? 0);
        return 0; // API already returns newest-first
      });
  }, [posts, search, majorFilter, sortBy]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, loadMore]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold">Trang chủ</h1>
        <p className="text-muted-foreground text-sm">Cập nhật bài viết mới nhất từ cộng đồng</p>
      </div>

      {/* Create post prompt */}
      <Card className="flex items-center gap-3 p-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={authorName} />
          <AvatarFallback className="bg-[#0047AB]/10 text-sm font-semibold text-[#0047AB]">
            {authorInitials}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          className="text-muted-foreground hover:bg-muted flex-1 rounded-full border px-4 py-2.5 text-left text-sm transition-colors"
          onClick={() => setCreateModalOpen(true)}>
          Bạn đang nghĩ gì?
        </button>
      </Card>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm kiếm bài viết, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={majorFilter} onValueChange={setMajorFilter}>
          <SelectTrigger className="w-40">
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

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="popular">Phổ biến nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Skeleton loading — first load */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {/* Feed */}
      {!isLoading && filtered.length === 0 && (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          Không tìm thấy bài viết nào phù hợp.
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((item, idx) => (
            <PostFeedCard key={item.post?.postId ?? idx} item={item} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Fetching more indicator */}
      {isFetchingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <p className="text-muted-foreground py-4 text-center text-xs">
          Bạn đã xem hết bài viết rồi.
        </p>
      )}

      <CreatePostModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={refresh}
      />
    </div>
  );
}
