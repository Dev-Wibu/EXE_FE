import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Post Manager
 * Handles post, comment, and like CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import type {
  ApiResponse,
  BaseManager,
  PaginatedResponse,
  PaginationParams,
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
      major: {
        ...post.major,
        name: post.major.majorName,
      },
    };
  }
  return post;
}

/**
 * Unwrap backend PostResponse[] into Post[] with embedded counts.
 * Backend wraps each post inside { post, likeCount, commentCount, ... }
 * API may return:
 * - Direct array: PostResponseWrapper[] or Post[]
 * - Paginated: { totalPages, totalElements, content: PostResponseWrapper[] }
 */
function unwrapPostResponses(data: unknown): Post[] {
  // Handle standard response wrapper: { traceId, data }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if ("data" in obj && Array.isArray(obj.data)) {
      return unwrapPostResponses(obj.data);
    }
    if ("content" in obj) {
      return unwrapPostResponses(obj.content);
    }
  }

  // Handle paginated response: { content: [...] }
  if (data && typeof data === "object" && !Array.isArray(data) && "content" in data) {
    const paginatedData = data as {
      content?: unknown;
    };
    return unwrapPostResponses(paginatedData.content);
  }
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
      const response = await fetchClient
        .POST("/api/posts", {
          ...{
            headers: {
              "Content-Type": undefined,
            },
          },
          // @ts-expect-error: Backend Swagger schema mismatch
          body: formData,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToCreatePost"),
      };
    }
  }

  /**
   * Get comments by post ID
   * GET /api/posts/{postId}/comments
   */
  async getCommentsByPostId(postId: number): Promise<ApiResponse<PostCommentResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.COMMENTS, {
        postId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadComments"),
      };
    }
  }

  /**
   * Get comments count by post ID
   * GET /api/posts/{postId}/comments/count
   */
  async getCommentsCount(postId: number): Promise<ApiResponse<number>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.COMMENTS_COUNT, {
        postId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadCommentCount"),
      };
    }
  }

  /**
   * Create a comment
   * POST /api/posts/comments
   */
  async createComment(data: PostCommentRequest): Promise<ApiResponse<PostCommentResponse>> {
    try {
      const response = await fetchClient
        .POST("/api/posts/comments", { body: data })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotCreateComment"),
      };
    }
  }

  /**
   * Get comment by ID
   * GET /api/posts/comments/{commentId}
   */
  async getCommentById(commentId: number): Promise<ApiResponse<PostCommentResponse>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.COMMENT_DETAIL, {
        commentId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadComments"),
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
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.UPDATE_COMMENT, {
        commentId,
      });
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .PUT(endpoint, { body: data })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToUpdateComments"),
      };
    }
  }

  /**
   * Delete a comment
   * DELETE /api/posts/comments/{commentId}
   */
  async deleteComment(commentId: number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.DELETE_COMMENT, {
        commentId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      await fetchClient.DELETE(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.commentsCannotBeDeleted"),
      };
    }
  }

  /**
   * Get replies to a comment
   * GET /api/posts/comments/{parentCommentId}/replies
   */
  async getReplies(parentCommentId: number): Promise<ApiResponse<PostCommentResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.COMMENT_REPLIES, {
        parentCommentId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.couldNotLoadResponse"),
      };
    }
  }

  /**
   * Like a post
   * POST /api/posts/likes
   */
  async likePost(data: PostLikeRequest): Promise<ApiResponse<PostLikeResponse>> {
    try {
      const response = await fetchClient.POST("/api/posts/likes", { body: data }).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.cannotLikeThePost"),
      };
    }
  }

  /**
   * Get likes by post ID
   * GET /api/posts/likes/{postId}
   */
  async getLikesByPostId(postId: number): Promise<ApiResponse<PostLikeResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.LIKES_BY_POST, {
        postId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadLikes"),
      };
    }
  }

  /**
   * Get likes count by post ID
   * GET /api/posts/likes/{postId}/count
   */
  async getLikesCount(postId: number): Promise<ApiResponse<number>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.LIKES_COUNT, {
        postId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadLikes1"),
      };
    }
  }

  /**
   * Check if user liked a post
   * GET /api/posts/likes/{postId}/check/{userId}
   */
  async checkLiked(postId: number, userId: number): Promise<ApiResponse<boolean>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.CHECK_LIKED, {
        postId,
        userId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToCheckLikeStatus"),
      };
    }
  }

  /**
   * Unlike a post
   * DELETE /api/posts/likes/{postId}/{userId}
   */
  async unlikePost(postId: number, userId: number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.UNLIKE, {
        postId,
        userId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      await fetchClient.DELETE(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.cannotUnlikePosts"),
      };
    }
  }

  // BaseManager interface methods
  async getAll(_params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Post> | Post[]>> {
    try {
      const response = await fetchClient
        .GET("/api/posts", {
          // @ts-expect-error: Backend Swagger schema mismatch
          params: _params,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      // Backend returns PostResponse[] wrapper — unwrap into Post[]
      const posts = unwrapPostResponses(response.data);
      return {
        success: true,
        data: posts,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToLoadArticleList"),
      };
    }
  }
  async getById(id: string | number): Promise<ApiResponse<Post>> {
    try {
      // No GET /api/posts/{postId} endpoint in schema.
      // Fetch all posts and filter by postId as a workaround.
      const response = await fetchClient.GET("/api/posts", {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      const posts = unwrapPostResponses(response.data);
      const post = posts.find((p) => p.postId === Number(id));
      if (!post) {
        return {
          success: false,
          error: t("common.noArticlesFound"),
        };
      }
      return {
        success: true,
        data: post,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToLoadArticle"),
      };
    }
  }

  /**
   * Get all published posts
   * GET /api/posts/published
   */
  async getPublished(): Promise<ApiResponse<Post[]>> {
    try {
      const response = await fetchClient.GET("/api/posts/published", {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      // Backend returns PostResponse[] wrapper — unwrap into Post[]
      const posts = unwrapPostResponses(response.data);
      return {
        success: true,
        data: posts,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadPublishedArticle"),
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
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.CHANGE_STATUS, {
        postId,
      });
      const response = await fetchClient
        .GET(
          // @ts-expect-error: Backend Swagger schema mismatch
          endpoint,
          {
            params: {
              status,
            },
          }
        )
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotChangePostStatus"),
      };
    }
  }
  async create(data: Partial<Post>): Promise<ApiResponse<Post>> {
    return this.createPost(data as PostCreateRequest);
  }
  async update(id: string | number, data: Partial<Post>): Promise<ApiResponse<Post>> {
    try {
      const response = await fetchClient
        .POST("/api/posts", {
          body: {
            ...data,
            postId: Number(id),
          },
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToUpdatePost"),
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
      if (data.coverImg) {
        formData.append("coverImg", data.coverImg);
      } else {
        // Send a placeholder file to avoid NPE in backend file.getBytes()
        formData.append("coverImg", new File([""], "placeholder.txt", { type: "text/plain" }));
      }
      if (data.status) formData.append("status", data.status);
      if (data.tags) {
        data.tags.forEach((tag) => formData.append("tags", tag));
      }
      const response = await fetchClient
        .POST("/api/posts", {
          ...{
            headers: {
              "Content-Type": undefined,
            },
          },
          // @ts-expect-error: Backend Swagger schema mismatch
          body: formData,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToUpdatePost"),
      };
    }
  }
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.POSTS.DELETE, {
        postId: id,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      await fetchClient.DELETE(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.postsCannotBeDeleted"),
      };
    }
  }
}

// Export singleton instance
export const postManager = new PostManager();

// React Query hooks using $api
import { $api, fetchClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

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
    {
      params: {
        path: {
          postId,
          userId,
        },
      },
    },
    {
      enabled: enabled && postId > 0 && userId > 0,
    }
  );
export const useUnlikePost = () => $api.useMutation("delete", "/api/posts/likes/{postId}/{userId}");
export const usePublishedPosts = () => $api.useQuery("get", "/api/posts/published");
export const useChangePostStatus = () =>
  $api.useMutation("get", "/api/posts/change-status/{postId}");
export const useNewFeed = (params?: { page?: number; size?: number }) =>
  $api.useQuery("get", "/api/posts/feed", {
    params: {
      query: params,
    },
  });
export const usePostById = (postId: number, enabled = true) =>
  $api.useQuery(
    "get",
    "/api/posts/{postId}",
    {
      params: {
        path: {
          postId,
        },
      },
    },
    {
      enabled: enabled && postId > 0,
    }
  );
