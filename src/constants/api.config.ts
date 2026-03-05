/**
 * API Configuration and Constants
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiConfig, ManagerMode } from "@/interfaces";
import axios, { type AxiosInstance } from "axios";

// Determine manager mode from environment variable or default to mock
const envMode = import.meta.env.VITE_MANAGER_MODE as string;
export const MANAGER_MODE: ManagerMode = envMode === "api" || envMode === "mock" ? envMode : "mock";

// API Base URL from environment or default (use localhost for development)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// API Configuration
export const apiConfig: ApiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
};

// API Endpoints - Aligned with backend schema (schema-from-be.d.ts)
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    MENTOR_REGISTER: "/auth/mentor-register",
    CHECK_STATUS: "/auth/mentor-status",
  },

  // User endpoints (for current user)
  USER: {
    PROFILE: "/api/users/me",
    UPDATE_PROFILE: "/api/users/me",
    UPDATE_PASSWORD: "/api/users/password",
    SETTINGS: "/api/users/settings",
    WALLET: "/api/users/wallet",
    DEPOSIT: "/api/users/wallet/deposit",
  },

  // Users management endpoints (for admin) - Based on schema-from-be.d.ts
  // GET /api/users - getUsers
  // POST /api/users - createUser (multipart/form-data)
  // PUT /api/users - updateUser (query param: user)
  // GET /api/users/{id} - getUserById
  // POST /api/users/upload-cv - uploadCv (multipart/form-data: userId, cvFile)
  USERS: {
    LIST: "/api/users",
    DETAIL: "/api/users/:id",
    CREATE: "/api/users",
    UPDATE: "/api/users",
    UPLOAD_CV: "/api/users/upload-cv",
  },

  // Mentor endpoints - Based on schema-from-be.d.ts
  // GET /api/mentors - getAllMentors
  // POST /api/mentors - createMentor (multipart/form-data)
  // PUT /api/mentors - updateMentor (JSON body)
  // GET /api/mentors/{id} - getMentorById
  // GET /api/mentors/toggle/{id} - toggleActive
  MENTOR: {
    LIST: "/api/mentors",
    DETAIL: "/api/mentors/:id",
    CREATE: "/api/mentors",
    UPDATE: "/api/mentors",
    TOGGLE: "/api/mentors/toggle/:id",
  },

  // AI Interview endpoints
  AI_INTERVIEW: {
    LIST: "/api/ai-interviews",
    DETAIL: "/api/ai-interviews/:id",
    CREATE: "/api/ai-interviews",
    RESULT: "/api/ai-interviews/:id/result",
    PAYMENT: "/api/ai-interviews/payment",
    FACE_ANALYSIS: "/api/interview-analysis/face-behavior",
  },

  // Mock Interview endpoints
  MOCK_INTERVIEW: {
    LIST: "/api/mock-interviews",
    DETAIL: "/api/mock-interviews/:id",
    CREATE: "/api/mock-interviews",
    TYPES: "/api/mock-interviews/types",
    PAYMENT: "/api/mock-interviews/payment",
  },

  // Chat endpoints
  CHAT: {
    SESSIONS: "/api/chat/sessions",
    SESSION_DETAIL: "/api/chat/sessions/:id",
    MESSAGES: "/api/chat/sessions/:id/messages",
    SEND_MESSAGE: "/api/chat/sessions/:id/messages",
    AI_RESPONSE: "/api/chat/sessions/:id/messages/ai-response",
    CREATE_SESSION: "/api/chat/sessions",
  },

  // Question endpoints - Based on schema-from-be.d.ts
  // GET /api/practice-questions - getAllQuestions
  // POST /api/practice-questions - createQuestion (JSON body)
  // PUT /api/practice-questions - updateQuestion (JSON body)
  // GET /api/practice-questions/{id} - getQuestionById
  // DELETE /api/practice-questions/{id} - deleteQuestion
  // GET /api/practice-questions/random-by-level - getRandomQuestionsByLevel
  // GET /api/practice-questions/by-category-level - getQuestionsByCategoryAndLevel
  // POST /api/practice-questions/save-all - createQuestionList
  QUESTION: {
    LIST: "/api/practice-questions",
    DETAIL: "/api/practice-questions/:id",
    CREATE: "/api/practice-questions",
    UPDATE: "/api/practice-questions",
    DELETE: "/api/practice-questions/:id",
    RANDOM_BY_LEVEL: "/api/practice-questions/random-by-level",
    BY_CATEGORY_LEVEL: "/api/practice-questions/by-category-level",
    SAVE_ALL: "/api/practice-questions/save-all",
  },

  // Session endpoints (for admin management) - Based on schema-from-be.d.ts
  // GET /api/sessions - getSessions
  // PUT /api/sessions - updateSession (JSON body)
  // POST /api/sessions/create-session - createSession (JSON body with SessionCreationRequest)
  // POST /api/sessions/join-session - saveJoinRecord
  // GET /api/sessions/{id} - getSession
  // GET /api/sessions/{userId}/by-user - getSessionsByUserId
  SESSIONS: {
    LIST: "/api/sessions",
    DETAIL: "/api/sessions/:id",
    CREATE: "/api/sessions/create-session",
    UPDATE: "/api/sessions",
    UPDATE_STATUS: "/api/sessions/update-status",
    BY_USER: "/api/sessions/:userId/by-user",
    JOIN: "/api/sessions/join-session",
  },

  // Practice Sets endpoints - Based on schema-from-be.d.ts
  PRACTICE_SETS: {
    LIST: "/api/practice-sets",
    DETAIL: "/api/practice-sets/:id",
    CREATE: "/api/practice-sets",
    UPDATE: "/api/practice-sets",
    DELETE: "/api/practice-sets/:id",
    BY_LEVEL: "/api/practice-sets/level/:level",
    BY_INTERVIEW_SESSION: "/api/practice-sets/interview-session/:interviewSessionId",
    FULL_SET: "/api/practice-sets/full-set/:id",
    CREATE_FULL: "/api/practice-sets/create-full",
    CREATE_BY_AI: "/api/practice-sets/create-by-ai",
  },

  // Question Categories endpoints - Based on schema-from-be.d.ts
  QUESTION_CATEGORIES: {
    LIST: "/api/question-categories",
    DETAIL: "/api/question-categories/:id",
    CREATE: "/api/question-categories",
    UPDATE: "/api/question-categories",
    DELETE: "/api/question-categories/:id",
  },

  // Question Majors endpoints - Based on schema-from-be.d.ts
  // NOTE: Schema defines these as /api/majors (not /api/question-majors)
  // The object key remains QUESTION_MAJORS for consistency with the service manager naming,
  // but the actual URLs use /api/majors as per the backend schema definition
  QUESTION_MAJORS: {
    LIST: "/api/majors",
    DETAIL: "/api/majors/:id",
    CREATE: "/api/majors",
    UPDATE: "/api/majors",
    DELETE: "/api/majors/:id",
  },

  // Practice Set Items endpoints - Based on schema-from-be.d.ts
  PRACTICE_SET_ITEMS: {
    LIST: "/api/practice-set-items",
    DETAIL: "/api/practice-set-items/:id",
    CREATE: "/api/practice-set-items",
    CREATE_BULK: "/api/practice-set-items/create-items",
    UPDATE: "/api/practice-set-items",
    DELETE: "/api/practice-set-items/:id",
    BY_QUESTION_SET: "/api/practice-set-items/by-question-set/:id",
  },

  // Quiz Sets endpoints - Based on schema-from-be.d.ts
  // GET /api/quiz-sets - getAll
  // POST /api/quiz-sets - createQuizSet (query params: quizId, quizName)
  // GET /api/quiz-sets/{quizId} - getQuizById
  // DELETE /api/quiz-sets/{quizId} - deleteQuizSet
  // GET /api/quiz-sets/by-practice-set/{practiceSetId} - getHistoryByPracticeSet
  // POST /api/quiz-sets/submit/{quizId} - submitAndCalculateScore
  // POST /api/quiz-sets/create-full - createFullQuizSet
  // POST /api/quiz-sets/create-full-ai - createFullQuizSetAI (query param only: practiceSetId)
  // GET /api/quiz-set-items/by-quiz-set/{quizSetId} - getItemsByQuizSetId
  QUIZ_SETS: {
    LIST: "/api/quiz-sets",
    DETAIL: "/api/quiz-sets/:quizId",
    CREATE: "/api/quiz-sets",
    CREATE_FULL: "/api/quiz-sets/create-full",
    CREATE_FULL_AI: "/api/quiz-sets/create-full-ai",
    SUBMIT: "/api/quiz-sets/submit/:quizId",
    BY_PRACTICE_SET: "/api/quiz-sets/by-practice-set/:practiceSetId",
    DELETE: "/api/quiz-sets/:quizId",
    ITEMS_BY_QUIZ_SET: "/api/quiz-set-items/by-quiz-set/:quizSetId",
  },

  // Notifications endpoints - Based on schema-from-be.d.ts
  NOTIFICATIONS: {
    LIST: "/api/notifications/:id",
    CREATE: "/api/notifications",
    CHECK_READ: "/api/notifications/check-read/:notificationId",
  },

  // Mentor Reviews endpoints - Based on schema-from-be.d.ts
  MENTOR_REVIEWS: {
    LIST: "/api/mentor-reviews",
    DETAIL: "/api/mentor-reviews/:id",
    CREATE: "/api/mentor-reviews",
    UPDATE: "/api/mentor-reviews",
  },

  // Mentor Feedbacks endpoints - Based on schema-from-be.d.ts
  MENTOR_FEEDBACKS: {
    LIST: "/api/mentor-feedbacks",
    DETAIL: "/api/mentor-feedbacks/:id",
    CREATE: "/api/mentor-feedbacks",
    UPDATE: "/api/mentor-feedbacks",
    BY_MENTOR: "/api/mentor-feedbacks/mentor/:mentorId",
  },

  // Candidate Profiles endpoints - Based on schema-from-be.d.ts
  // GET /api/candidate-profiles - getAllProfile
  // POST /api/candidate-profiles - createProfile (JSON body)
  // PUT /api/candidate-profiles - updateProfile (JSON body)
  // GET /api/candidate-profiles/{userId} - getByUserId
  CANDIDATE_PROFILES: {
    LIST: "/api/candidate-profiles",
    DETAIL: "/api/candidate-profiles/:userId",
    CREATE: "/api/candidate-profiles",
    UPDATE: "/api/candidate-profiles",
  },

  // Posts/Social endpoints - Based on schema-from-be.d.ts
  // POST /api/posts - createPost (multipart/form-data)
  // GET /api/posts - getAllPosts
  // GET /api/posts/published - getPublishedPosts
  // GET /api/posts/change-status/{postId}?status= - changeStatus
  // GET /api/posts/{postId}/comments - getCommentsByPostId
  // GET /api/posts/{postId}/comments/count - countComments
  // POST /api/posts/comments - createComment
  // GET /api/posts/comments/{commentId} - getCommentById
  // PUT /api/posts/comments/{commentId} - updateComment
  // DELETE /api/posts/comments/{commentId} - deleteComment
  // GET /api/posts/comments/{parentCommentId}/replies - getReplies
  // POST /api/posts/likes - likePost
  // GET /api/posts/likes/{postId} - getLikesByPostId
  // GET /api/posts/likes/{postId}/count - countLikes
  // GET /api/posts/likes/{postId}/check/{userId} - checkLiked
  // DELETE /api/posts/likes/{postId}/{userId} - unlikePost
  POSTS: {
    LIST: "/api/posts",
    DETAIL: "/api/posts/:postId",
    CREATE: "/api/posts",
    UPDATE: "/api/posts",
    DELETE: "/api/posts/:postId",
    PUBLISHED: "/api/posts/published",
    CHANGE_STATUS: "/api/posts/change-status/:postId",
    COMMENTS: "/api/posts/:postId/comments",
    COMMENTS_COUNT: "/api/posts/:postId/comments/count",
    CREATE_COMMENT: "/api/posts/comments",
    COMMENT_DETAIL: "/api/posts/comments/:commentId",
    UPDATE_COMMENT: "/api/posts/comments/:commentId",
    DELETE_COMMENT: "/api/posts/comments/:commentId",
    COMMENT_REPLIES: "/api/posts/comments/:parentCommentId/replies",
    LIKE: "/api/posts/likes",
    LIKES_BY_POST: "/api/posts/likes/:postId",
    LIKES_COUNT: "/api/posts/likes/:postId/count",
    CHECK_LIKED: "/api/posts/likes/:postId/check/:userId",
    UNLIKE: "/api/posts/likes/:postId/:userId",
  },

  // Interview Sessions endpoints - Based on schema-from-be.d.ts
  // POST /api/interview-sessions/create-session - createInterviewSession (JSON body)
  // POST /api/interview-sessions/generate-job-requirement - generateJobRequirement (JSON body)
  // GET /api/interview-sessions/config-options - getInterviewConfigOptions
  INTERVIEW_SESSIONS: {
    CREATE: "/api/interview-sessions/create-session",
    GENERATE_JOB_REQUIREMENT: "/api/interview-sessions/generate-job-requirement",
    CONFIG_OPTIONS: "/api/interview-sessions/config-options",
    USER_SESSIONS: "/api/interview-sessions/user/:userId",
  },

  // Interview V1 endpoints - Based on schema-from-be.d.ts
  // GET /api/v1/interview/start/{sessionKey} - startInterview
  // POST /api/v1/interview/submit - submitAnswer (JSON body)
  INTERVIEW_V1: {
    START: "/api/v1/interview/start/:sessionKey",
    SUBMIT: "/api/v1/interview/submit",
  },
} as const;

/**
 * Helper function to replace path parameters in endpoints
 * @param endpoint - The endpoint path with parameters (e.g., "/users/:id")
 * @param params - Object with parameter values (e.g., { id: "123" })
 * @returns The endpoint with replaced parameters (e.g., "/users/123")
 */
export function buildEndpoint(endpoint: string, params?: Record<string, string | number>): string {
  if (!params) return endpoint;

  return Object.entries(params).reduce((path, [key, value]) => {
    return path.replace(`:${key}`, String(value));
  }, endpoint);
}

// Error messages mapping - Vietnamese user-friendly messages
// EXPORTED for components to use when handling HTTP errors
// Components can import this to get consistent, localized error messages:
// import { ERROR_MESSAGES } from '@/constants/api.config';
// const message = ERROR_MESSAGES[response.status] || 'Đã xảy ra lỗi';
export const ERROR_MESSAGES: Record<number, string> = {
  400: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  401: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu yêu cầu.",
  413: "Tập tin quá lớn. Vui lòng chọn file nhỏ hơn.",
  415: "Định dạng file không được hỗ trợ.",
  429: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  500: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
  502: "Máy chủ tạm thời không khả dụng.",
  503: "Dịch vụ đang bảo trì. Vui lòng thử lại sau.",
  504: "Máy chủ phản hồi quá chậm. Vui lòng thử lại.",
};

/**
 * Create axios instance with response interceptors for global error handling
 *
 * NOTE: Toast notifications are NOT shown in the interceptor to prevent duplicate toasts.
 * Components/hooks should handle their own error toasts for more specific messaging.
 *
 * @returns Configured axios instance with error interceptors
 */
export const createApiInstance = (): AxiosInstance => {
  const instance = axios.create(apiConfig);

  // Request interceptor - Add request ID for debugging
  instance.interceptors.request.use((config) => {
    // Generate unique request ID for debugging
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    config.headers["X-Request-ID"] = requestId;
    return config;
  });

  // Response interceptor - Global error handling (without toast to prevent duplicates)
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;

      // Handle network errors (no response) - log but don't toast
      if (!error.response) {
        console.error("Network error: Không thể kết nối đến máy chủ");
        return Promise.reject(error);
      }

      // Handle HTTP errors
      if (status >= 400) {
        // Log error for debugging
        console.error(`HTTP ${status} error:`, error.response?.data);

        // Redirect to login on 401 (unauthorized)
        if (status === 401) {
          // Clear auth and redirect
          localStorage.removeItem("auth-storage");
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};
