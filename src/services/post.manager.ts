/**
 * Post Manager
 * Handles post, comment, and like CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
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

// Mock data for development
const mockPosts: Post[] = [
  {
    postId: 1,
    title: "Getting Started with System Design",
    content: "System design interviews are crucial for senior engineering roles...",
    summary: "A guide to system design interviews",
    status: "PUBLISHED",
    author: { id: 1, name: "John Doe", email: "john@example.com" },
    creationDate: "2026-01-15T10:00:00Z",
    lastModifiedDate: "2026-01-15T10:00:00Z",
    major: { id: 1, name: "Computer Science", description: "CS Major" },
    coverImgUrl: "https://example.com/cover1.jpg",
    tags: ["system-design", "interview"],
  },
  {
    postId: 2,
    title: "Top 10 Behavioral Interview Tips",
    content: "Behavioral interviews assess your soft skills and cultural fit...",
    summary: "Tips for acing behavioral interviews",
    status: "PUBLISHED",
    author: { id: 2, name: "Jane Smith", email: "jane@example.com" },
    creationDate: "2026-01-16T14:30:00Z",
    lastModifiedDate: "2026-01-16T14:30:00Z",
    major: { id: 2, name: "Business", description: "Business Major" },
    coverImgUrl: "https://example.com/cover2.jpg",
    tags: ["behavioral", "tips"],
  },
  {
    postId: 3,
    title: "Data Structures Cheat Sheet",
    content: "Here is a quick reference for common data structures...",
    summary: "Quick reference for data structures",
    status: "DRAFT",
    author: { id: 1, name: "John Doe", email: "john@example.com" },
    creationDate: "2026-01-17T09:00:00Z",
    lastModifiedDate: "2026-01-17T09:00:00Z",
    tags: ["data-structures", "cheat-sheet"],
  },
];

const mockComments: PostCommentResponse[] = [
  {
    id: 1,
    postId: 1,
    userId: 2,
    userName: "Jane Smith",
    userAvatar: "https://example.com/avatar2.jpg",
    content: "Great article! Very helpful.",
    createdAt: "2026-01-15T12:00:00Z",
    updatedAt: "2026-01-15T12:00:00Z",
  },
  {
    id: 2,
    postId: 1,
    userId: 3,
    userName: "Bob Wilson",
    userAvatar: "https://example.com/avatar3.jpg",
    content: "Could you elaborate on the CAP theorem section?",
    createdAt: "2026-01-15T13:00:00Z",
    updatedAt: "2026-01-15T13:00:00Z",
  },
  {
    id: 3,
    postId: 1,
    userId: 1,
    userName: "John Doe",
    content: "Sure! I will add more details soon.",
    parentCommentId: 2,
    createdAt: "2026-01-15T14:00:00Z",
    updatedAt: "2026-01-15T14:00:00Z",
  },
];

const mockLikes: PostLikeResponse[] = [
  {
    id: 1,
    postId: 1,
    userId: 2,
    userName: "Jane Smith",
    userAvatar: "https://example.com/avatar2.jpg",
    createdAt: "2026-01-15T11:00:00Z",
  },
  {
    id: 2,
    postId: 1,
    userId: 3,
    userName: "Bob Wilson",
    userAvatar: "https://example.com/avatar3.jpg",
    createdAt: "2026-01-15T12:30:00Z",
  },
  {
    id: 3,
    postId: 2,
    userId: 1,
    userName: "John Doe",
    createdAt: "2026-01-16T15:00:00Z",
  },
];

export class PostManager implements BaseManager<Post> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Create a new post
   * POST /api/posts (multipart/form-data)
   */
  async createPost(data: PostCreateRequest): Promise<ApiResponse<Post>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockPosts.map((p) => p.postId || 0)) + 1;
      const newPost: Post = {
        postId: newId,
        title: data.title,
        content: data.content,
        summary: data.summary,
        status: data.status || "DRAFT",
        tags: data.tags,
        creationDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString(),
      };
      mockPosts.push(newPost);
      return { success: true, data: newPost };
    }

    try {
      const formData = new FormData();
      if (data.title) formData.append("title", data.title);
      if (data.content) formData.append("content", data.content);
      if (data.summary) formData.append("summary", data.summary);
      if (data.authorId) formData.append("authorId", String(data.authorId));
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
    if (this.mode === "mock") {
      const comments = mockComments.filter((c) => c.postId === postId && !c.parentCommentId);
      return { success: true, data: comments };
    }

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
    if (this.mode === "mock") {
      const count = mockComments.filter((c) => c.postId === postId).length;
      return { success: true, data: count };
    }

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
    if (this.mode === "mock") {
      const newId = Math.max(...mockComments.map((c) => c.id || 0)) + 1;
      const newComment: PostCommentResponse = {
        id: newId,
        postId: data.postId,
        userId: data.userId,
        content: data.content,
        parentCommentId: data.parentCommentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockComments.push(newComment);
      return { success: true, data: newComment };
    }

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
    if (this.mode === "mock") {
      const comment = mockComments.find((c) => c.id === commentId);
      if (!comment) {
        return { success: false, error: "Comment not found" };
      }
      return { success: true, data: comment };
    }

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
    if (this.mode === "mock") {
      const index = mockComments.findIndex((c) => c.id === commentId);
      if (index === -1) {
        return { success: false, error: "Comment not found" };
      }
      mockComments[index] = {
        ...mockComments[index],
        content: data.content || mockComments[index].content,
        updatedAt: new Date().toISOString(),
      };
      return { success: true, data: mockComments[index] };
    }

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
    if (this.mode === "mock") {
      const index = mockComments.findIndex((c) => c.id === commentId);
      if (index === -1) {
        return { success: false, error: "Comment not found" };
      }
      mockComments.splice(index, 1);
      return { success: true };
    }

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
    if (this.mode === "mock") {
      const replies = mockComments.filter((c) => c.parentCommentId === parentCommentId);
      return { success: true, data: replies };
    }

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
    if (this.mode === "mock") {
      const newId = Math.max(...mockLikes.map((l) => l.id || 0)) + 1;
      const newLike: PostLikeResponse = {
        id: newId,
        postId: data.postId,
        userId: data.userId,
        createdAt: new Date().toISOString(),
      };
      mockLikes.push(newLike);
      return { success: true, data: newLike };
    }

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
    if (this.mode === "mock") {
      const likes = mockLikes.filter((l) => l.postId === postId);
      return { success: true, data: likes };
    }

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
    if (this.mode === "mock") {
      const count = mockLikes.filter((l) => l.postId === postId).length;
      return { success: true, data: count };
    }

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
    if (this.mode === "mock") {
      const liked = mockLikes.some((l) => l.postId === postId && l.userId === userId);
      return { success: true, data: liked };
    }

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
    if (this.mode === "mock") {
      const index = mockLikes.findIndex((l) => l.postId === postId && l.userId === userId);
      if (index === -1) {
        return { success: false, error: "Like not found" };
      }
      mockLikes.splice(index, 1);
      return { success: true };
    }

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
    if (this.mode === "mock") {
      return { success: true, data: [...mockPosts] };
    }

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
    if (this.mode === "mock") {
      const post = mockPosts.find((p) => p.postId === Number(id));
      if (!post) {
        return { success: false, error: "Post not found" };
      }
      return { success: true, data: post };
    }

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
    if (this.mode === "mock") {
      const published = mockPosts.filter((p) => p.status === "PUBLISHED");
      return { success: true, data: published };
    }

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
    if (this.mode === "mock") {
      const index = mockPosts.findIndex((p) => p.postId === postId);
      if (index === -1) {
        return { success: false, error: "Post not found" };
      }
      mockPosts[index] = { ...mockPosts[index], status };
      return { success: true, data: { message: "Status changed" } };
    }

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
    if (this.mode === "mock") {
      const index = mockPosts.findIndex((p) => p.postId === Number(id));
      if (index === -1) {
        return { success: false, error: "Post not found" };
      }
      mockPosts[index] = { ...mockPosts[index], ...data };
      return { success: true, data: mockPosts[index] };
    }

    try {
      // Note: Backend confirmed POST should be used for updates (not PUT)
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

  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockPosts.findIndex((p) => p.postId === Number(id));
      if (index === -1) {
        return { success: false, error: "Post not found" };
      }
      mockPosts.splice(index, 1);
      return { success: true };
    }

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
import { $api } from "@/lib/api";

export const useCreatePost = () => $api.useMutation("post", "/api/posts");
export const usePostComments = (postId: number) =>
  $api.useQuery("get", "/api/posts/{postId}/comments", { params: { path: { postId } } });
export const usePostCommentsCount = (postId: number) =>
  $api.useQuery("get", "/api/posts/{postId}/comments/count", { params: { path: { postId } } });
export const useCreateComment = () => $api.useMutation("post", "/api/posts/comments");
export const useCommentDetail = (commentId: number) =>
  $api.useQuery("get", "/api/posts/comments/{commentId}", { params: { path: { commentId } } });
export const useUpdateComment = () => $api.useMutation("put", "/api/posts/comments/{commentId}");
export const useDeleteComment = () => $api.useMutation("delete", "/api/posts/comments/{commentId}");
export const useCommentReplies = (parentCommentId: number) =>
  $api.useQuery("get", "/api/posts/comments/{parentCommentId}/replies", {
    params: { path: { parentCommentId } },
  });
export const useLikePost = () => $api.useMutation("post", "/api/posts/likes");
export const usePostLikes = (postId: number) =>
  $api.useQuery("get", "/api/posts/likes/{postId}", { params: { path: { postId } } });
export const usePostLikesCount = (postId: number) =>
  $api.useQuery("get", "/api/posts/likes/{postId}/count", { params: { path: { postId } } });
export const useCheckLiked = (postId: number, userId: number) =>
  $api.useQuery("get", "/api/posts/likes/{postId}/check/{userId}", {
    params: { path: { postId, userId } },
  });
export const useUnlikePost = () => $api.useMutation("delete", "/api/posts/likes/{postId}/{userId}");
export const usePublishedPosts = () => $api.useQuery("get", "/api/posts/published");
export const useChangePostStatus = () =>
  $api.useMutation("get", "/api/posts/change-status/{postId}");
