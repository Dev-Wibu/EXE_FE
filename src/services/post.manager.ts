/**
 * Post Manager
 * Handles post, comment, and like CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";
import type {
  Post,
  PostCommentRequest,
  PostCommentResponse,
  PostCreateRequest,
  PostLikeRequest,
  PostLikeResponse,
  PostResponseWrapper,
} from "@/interfaces";

/**
 * Normalize a Post object from backend:
 * - Maps major.majorName → major.name (backend uses majorName)
 */
function normalizePost(post: Post): Post {
  if (post.major && !post.major.name && post.major.majorName) {
    return {
      ...post,
      major: { ...post.major, name: post.major.majorName },
    };
  }
  return post;
}

/**
 * Unwrap backend PostResponse[] into Post[] with embedded counts.
 * Backend wraps each post inside { post, likeCount, commentCount, ... }
 */
function unwrapPostResponses(data: unknown): Post[] {
  if (!Array.isArray(data)) return [];

  return data.map((item: PostResponseWrapper | Post, index: number) => {
    // Check if this is a PostResponse wrapper (has .post property)
    if (item && typeof item === "object" && "post" in item && item.post) {
      const wrapper = item as PostResponseWrapper;
      return normalizePost({
        ...wrapper.post,
        likeCount: wrapper.likeCount ?? 0,
        commentCount: wrapper.commentCount ?? 0,
      });
    }

    // Already a flat Post object (mock mode or already unwrapped)
    void index;
    return normalizePost(item as Post);
  });
}

export class PostManager implements BaseManager<Post> {
  private api = createApiInstance();

  /**
   * Create a new post
   * POST /api/posts (multipart/form-data)
   */
  async createPost(data: PostCreateRequest): Promise<ApiResponse<Post>> {
    try {
      const formData = new FormData();
      if (data.title) formData.append("title", data.title);
      if (data.content) formData.append("content", data.content);
      if (data.summary) formData.append("summary", data.summary);
      const authorIdNum = parseInt(String(data.authorId ?? ""), 10);
      if (!isNaN(authorIdNum) && authorIdNum > 0) formData.append("authorId", String(authorIdNum));
      if (data.majorId) formData.append("majorId", String(data.majorId));
      if (data.coverImg) formData.append("coverImg", data.coverImg);
      if (data.status) formData.append("status", data.status);
      if (data.tags) {
        data.tags.forEach((tag) => formData.append("tags", tag));
      }

      const response = await this.api.post(API_ENDPOINTS.POSTS.CREATE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create post",
      };
    }
  }

  /**
   * Get comments by post ID
   * GET /api/posts/{postId}/comments
   */
  async getCommentsByPostId(postId: number): Promise<ApiResponse<PostCommentResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.COMMENTS, { postId });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch comments",
      };
    }
  }

  /**
   * Get comments count by post ID
   * GET /api/posts/{postId}/comments/count
   */
  async getCommentsCount(postId: number): Promise<ApiResponse<number>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.COMMENTS_COUNT, { postId });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch comments count",
      };
    }
  }

  /**
   * Create a comment
   * POST /api/posts/comments
   */
  async createComment(data: PostCommentRequest): Promise<ApiResponse<PostCommentResponse>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.POSTS.CREATE_COMMENT, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create comment",
      };
    }
  }

  /**
   * Get comment by ID
   * GET /api/posts/comments/{commentId}
   */
  async getCommentById(commentId: number): Promise<ApiResponse<PostCommentResponse>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.COMMENT_DETAIL, { commentId });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch comment",
      };
    }
  }

  /**
   * Update a comment
   * PUT /api/posts/comments/{commentId}
   */
  async updateComment(
    commentId: number,
    data: Partial<PostCommentRequest>
  ): Promise<ApiResponse<PostCommentResponse>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.UPDATE_COMMENT, { commentId });
      const response = await this.api.put(endpoint, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update comment",
      };
    }
  }

  /**
   * Delete a comment
   * DELETE /api/posts/comments/{commentId}
   */
  async deleteComment(commentId: number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.DELETE_COMMENT, { commentId });
      await this.api.delete(endpoint);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete comment",
      };
    }
  }

  /**
   * Get replies to a comment
   * GET /api/posts/comments/{parentCommentId}/replies
   */
  async getReplies(parentCommentId: number): Promise<ApiResponse<PostCommentResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.COMMENT_REPLIES, { parentCommentId });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch replies",
      };
    }
  }

  /**
   * Like a post
   * POST /api/posts/likes
   */
  async likePost(data: PostLikeRequest): Promise<ApiResponse<PostLikeResponse>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.POSTS.LIKE, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to like post",
      };
    }
  }

  /**
   * Get likes by post ID
   * GET /api/posts/likes/{postId}
   */
  async getLikesByPostId(postId: number): Promise<ApiResponse<PostLikeResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.LIKES_BY_POST, { postId });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch likes",
      };
    }
  }

  /**
   * Get likes count by post ID
   * GET /api/posts/likes/{postId}/count
   */
  async getLikesCount(postId: number): Promise<ApiResponse<number>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.LIKES_COUNT, { postId });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch likes count",
      };
    }
  }

  /**
   * Check if user liked a post
   * GET /api/posts/likes/{postId}/check/{userId}
   */
  async checkLiked(postId: number, userId: number): Promise<ApiResponse<boolean>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.CHECK_LIKED, { postId, userId });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check like status",
      };
    }
  }

  /**
   * Unlike a post
   * DELETE /api/posts/likes/{postId}/{userId}
   */
  async unlikePost(postId: number, userId: number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.UNLIKE, { postId, userId });
      await this.api.delete(endpoint);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to unlike post",
      };
    }
  }

  // BaseManager interface methods
  async getAll(_params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Post> | Post[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.POSTS.LIST, { params: _params });
      // Backend returns PostResponse[] wrapper — unwrap into Post[]
      const posts = unwrapPostResponses(response.data);
      return { success: true, data: posts };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch posts",
      };
    }
  }

  async getById(id: string | number): Promise<ApiResponse<Post>> {
    try {
      // No GET /api/posts/{postId} endpoint in schema.
      // Fetch all posts and filter by postId as a workaround.
      const response = await this.api.get(API_ENDPOINTS.POSTS.LIST);
      const posts = unwrapPostResponses(response.data);
      const post = posts.find((p) => p.postId === Number(id));
      if (!post) {
        return { success: false, error: "Post not found" };
      }
      return { success: true, data: post };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch post",
      };
    }
  }

  /**
   * Get all published posts
   * GET /api/posts/published
   */
  async getPublished(): Promise<ApiResponse<Post[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.POSTS.PUBLISHED);
      // Backend returns PostResponse[] wrapper — unwrap into Post[]
      const posts = unwrapPostResponses(response.data);
      return { success: true, data: posts };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch published posts",
      };
    }
  }

  /**
   * Change post status
   * GET /api/posts/change-status/{postId}?status=DRAFT|PUBLISHED|ARCHIVED
   */
  async changeStatus(
    postId: number,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  ): Promise<ApiResponse<Record<string, string>>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.CHANGE_STATUS, { postId });
      const response = await this.api.get(endpoint, { params: { status } });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to change post status",
      };
    }
  }

  async create(data: Partial<Post>): Promise<ApiResponse<Post>> {
    return this.createPost(data as PostCreateRequest);
  }

  async update(id: string | number, data: Partial<Post>): Promise<ApiResponse<Post>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.POSTS.UPDATE, {
        ...data,
        postId: Number(id),
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update post",
      };
    }
  }

  /**
   * Update a post using multipart/form-data (same endpoint as create, with postId appended)
   * POST /api/posts (multipart/form-data) — backend uses postId presence to detect update
   */
  async updatePost(id: string | number, data: PostCreateRequest): Promise<ApiResponse<Post>> {
    try {
      const formData = new FormData();
      formData.append("postId", String(id));
      if (data.title) formData.append("title", data.title);
      if (data.content) formData.append("content", data.content);
      if (data.summary) formData.append("summary", data.summary);
      const updateAuthorIdNum = parseInt(String(data.authorId ?? ""), 10);
      if (!isNaN(updateAuthorIdNum) && updateAuthorIdNum > 0)
        formData.append("authorId", String(updateAuthorIdNum));
      if (data.majorId) formData.append("majorId", String(data.majorId));
      if (data.coverImg) formData.append("coverImg", data.coverImg);
      if (data.status) formData.append("status", data.status);
      if (data.tags) {
        data.tags.forEach((tag) => formData.append("tags", tag));
      }

      const response = await this.api.post(API_ENDPOINTS.POSTS.CREATE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update post",
      };
    }
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.DELETE, { postId: id });
      await this.api.delete(endpoint);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete post",
      };
    }
  }
}

// Export singleton instance
export const postManager = new PostManager();

// React Query hooks using $api
import { useQuery } from "@tanstack/react-query";

import { $api } from "@/lib/api";

export const useCreatePost = () => $api.useMutation("post", "/api/posts");
export const usePostComments = (postId: number, enabled = true) =>
  useQuery({
    queryKey: ["postComments", postId],
    queryFn: async () => {
      const res = await postManager.getCommentsByPostId(postId);
      return res.data ?? [];
    },
    enabled: enabled && postId > 0,
  });
export const usePostCommentsCount = (postId: number) =>
  useQuery({
    queryKey: ["postCommentsCount", postId],
    queryFn: async () => {
      const res = await postManager.getCommentsCount(postId);
      return res.data ?? 0;
    },
    enabled: postId > 0,
  });
export const useCreateComment = () => $api.useMutation("post", "/api/posts/comments");
export const useCommentDetail = (commentId: number) =>
  useQuery({
    queryKey: ["commentDetail", commentId],
    queryFn: async () => {
      const res = await postManager.getCommentById(commentId);
      return res.data;
    },
    enabled: commentId > 0,
  });
export const useUpdateComment = () => $api.useMutation("put", "/api/posts/comments/{commentId}");
export const useDeleteComment = () => $api.useMutation("delete", "/api/posts/comments/{commentId}");
export const useCommentReplies = (parentCommentId: number) =>
  useQuery({
    queryKey: ["commentReplies", parentCommentId],
    queryFn: async () => {
      const res = await postManager.getReplies(parentCommentId);
      return res.data ?? [];
    },
    enabled: parentCommentId > 0,
  });
export const useLikePost = () => $api.useMutation("post", "/api/posts/likes");
export const usePostLikes = (postId: number) =>
  useQuery({
    queryKey: ["postLikes", postId],
    queryFn: async () => {
      const res = await postManager.getLikesByPostId(postId);
      return res.data ?? [];
    },
    enabled: postId > 0,
  });
export const usePostLikesCount = (postId: number, enabled = true) =>
  useQuery({
    queryKey: ["postLikesCount", postId],
    queryFn: async () => {
      const res = await postManager.getLikesCount(postId);
      return res.data ?? 0;
    },
    enabled: enabled && postId > 0,
  });
export const useCheckLiked = (postId: number, userId: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/posts/likes/{postId}/check/{userId}",
    { params: { path: { postId, userId } } },
    { enabled: enabled && postId > 0 && userId > 0 }
  );
export const useUnlikePost = () => $api.useMutation("delete", "/api/posts/likes/{postId}/{userId}");
export const usePublishedPosts = () => $api.useQuery("get", "/api/posts/published");
export const useChangePostStatus = () =>
  $api.useMutation("get", "/api/posts/change-status/{postId}");
export const useNewFeed = (params?: { page?: number; size?: number }) =>
  $api.useQuery("get", "/api/posts/feed", { params: { query: params } });
export const usePostById = (postId: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/posts/{postId}",
    { params: { path: { postId } } },
    { enabled: enabled && postId > 0 }
  );
