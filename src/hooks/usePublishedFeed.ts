import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { postManager } from "@/services/post.manager";

import type { Post, PostResponseWrapper } from "@/interfaces/schema.types";
import { invalidatePostFeedQueries } from "@/lib/post-feed";

type PostResponseFeed = PostResponseWrapper;

export interface UsePublishedFeedReturn {
  posts: PostResponseFeed[];
  hasMore: boolean;
  isLoading: boolean;
  isReloading: boolean;
  isFetchingMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export function usePublishedFeed(): UsePublishedFeedReturn {
  const [posts, setPosts] = useState<PostResponseFeed[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const pendingRefreshRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const response = await postManager.getPublished();
      if (response.success) {
        // postManager.getPublished returns Post[] (already unwrapped)
        const flatPosts = response.data as unknown as Post[];
        const wrapped: PostResponseFeed[] = flatPosts.map((p) => ({
          post: {
            postId: p.postId,
            title: p.title,
            content: p.content,
            summary: p.summary,
            status: p.status,
            creationDate: p.creationDate,
            lastModifiedDate: p.lastModifiedDate,
            coverImgUrl: p.coverImgUrl,
            tags: p.tags,
            author: p.author
              ? {
                  name: p.author.name,
                  avatar: p.author.avatarUrl,
                }
              : undefined,
            majorName: p.major?.name || p.major?.majorName,
          },
          likeCount: p.likeCount ?? 0,
          commentCount: p.commentCount ?? 0,
        }));

        if (pendingRefreshRef.current) {
          setPosts(wrapped.reverse());
          pendingRefreshRef.current = false;
          setIsReloading(false);
        } else {
          setPosts((prev) => [...prev, ...wrapped]);
        }
        setHasMore(false);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
      setIsReloading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    // published endpoint is not paginated
  };

  const refresh = useCallback(() => {
    pendingRefreshRef.current = true;
    setIsReloading(true);
    setPosts([]);
    invalidatePostFeedQueries();
    void load();
  }, [load]);

  return {
    posts,
    hasMore,
    isLoading,
    isReloading,
    isFetchingMore: false,
    loadMore,
    refresh,
  };
}

export function usePublishedFeedFiltered(options?: {
  search?: string;
  majorFilter?: string;
  sortBy?: "newest" | "popular" | "recent_activity";
}) {
  const { posts, hasMore, isLoading, isReloading, isFetchingMore, loadMore, refresh } =
    usePublishedFeed();

  const filtered = useMemo(() => {
    const lower = (options?.search ?? "").toLowerCase();
    return posts
      .filter((item) => {
        const post = item.post;
        const matchSearch =
          !options?.search ||
          post?.title?.toLowerCase().includes(lower) ||
          post?.tags?.some((t) => t.toLowerCase().includes(lower)) ||
          false;
        const matchMajor =
          !options?.majorFilter ||
          options?.majorFilter === "all" ||
          post?.major?.name ||
          post?.major?.majorName === options?.majorFilter;
        return matchSearch && matchMajor;
      })
      .sort(() => {
        if (options?.sortBy === "popular") return 0;
        return 0;
      });
  }, [posts, options?.search, options?.majorFilter, options?.sortBy]);

  return { posts: filtered, hasMore, isLoading, isReloading, isFetchingMore, loadMore, refresh };
}
