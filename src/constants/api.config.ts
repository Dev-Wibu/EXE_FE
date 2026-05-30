/**
 * API Configuration and Constants
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiConfig, ManagerMode } from "@/interfaces";
import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from "axios";

import { normalizeApiError, toAppApiError } from "@/lib/error-normalizer";

// API-only mode: mock branches are removed from service managers.
export const MANAGER_MODE: ManagerMode = "api";

// API Base URL from environment or default (use localhost for development)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// API Configuration
export const apiConfig: ApiConfig = {
  baseURL: API_BASE_URL,
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
};

// API Endpoints - Aligned with backend schema (schema-from-be.d.ts)
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGIN_WITH_GOOGLE: "/api/auth/login-with-google",
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
    SUBSCRIBE: "/api/users/subscribe",
    ACTIVE_SUBSCRIPTION: "/api/users/:userId/subscription",
    FIND_BY_ID: "/api/users/find-by-id/:userId",
  },

  // Dashboard endpoints (admin overview)
  DASHBOARD: {
    TOTAL_USER: "/api/dashboard/total-user",
    TOTAL_MENTOR: "/api/dashboard/total-mentor",
    TOTAL_SESSION: "/api/dashboard/total-session",
    TOTAL_TRANSACTION: "/api/dashboard/total-transaction",
    TOTAL_INCOME: "/api/dashboard/total-income",
    FEATURE_USAGE_LOGS: "/api/feature-usage-logs",
    FEATURE_USAGE_BY_FEATURE: "/api/feature-usage-logs/by-feature",
  },

  // Transaction endpoints - schema-first mapping (skeleton phase: constants only)
  TRANSACTIONS: {
    LIST: "/api/transactions",
    DETAIL: "/api/transactions/:transactionCode",
    BY_USER: "/api/transactions/user/:userId",
    TRANSFER_IN: "/api/transactions/transfer-in",
    TRANSFER_OUT: "/api/transactions/transfer-out",
    DELETE: "/api/transactions/:transactionCode",
  },

  // Payment endpoints - schema-first mapping (skeleton phase: constants only)
  PAYMENTS: {
    LIST: "/api/payments",
    DETAIL: "/api/payments/:id",
    PAY: "/api/payments/pay",
    CANCEL: "/api/payments/cancel",
    WEBHOOK: "/api/payments/webhook",
  },

  // Users management endpoints (for admin) - Based on schema-from-be.d.ts
  // GET /api/users - getUsers
  // POST /api/users - createUser (multipart/form-data)
  // PUT /api/users - updateUser (query param: user)
  // GET /api/users/{id} - getUserById
  // POST /api/users/upload-cv - uploadCv (multipart/form-data: userId, cvFile)
  USERS: {
    LIST: "/api/users",
    USAGE: "/api/users/usage",
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
    HISTORY_BY_PARTICIPANTS: "/api/messages/:currentFullId/:recipientFullId",
  },

  // Messages endpoints
  MESSAGES: {
    CONTACTS: "/api/messages/contacts",
    HISTORY: "/api/messages/:currentFullId/:recipientFullId",
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
  // GET /api/sessions/make-payment - makePayment (query param: sessionId)
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
    MAKE_PAYMENT: "/api/sessions/make-payment",
  },

  // Practice Sets endpoints - Based on schema-from-be.d.ts
  PRACTICE_SETS: {
    LIST: "/api/practice-sets",
    DETAIL: "/api/practice-sets/:id",
    CREATE: "/api/practice-sets",
    UPDATE: "/api/practice-sets",
    DELETE: "/api/practice-sets/:id",
    BY_LEVEL: "/api/practice-sets/level/:level",
    BY_USER: "/api/practice-sets/user/:userId",
    BY_INTERVIEW_SESSION: "/api/practice-sets/interview-session/:interviewSessionId",
    FULL_SET: "/api/practice-sets/full-set/:id",
    CREATE_FULL: "/api/practice-sets/create-full",
    CREATE_BY_AI: "/api/practice-sets/create-by-ai",
  },

  // Membership Plans endpoints - Based on schema-from-be.d.ts
  // GET /api/membership-plans - getAllPlans
  // PUT /api/membership-plans - updatePlan (JSON body)
  // POST /api/membership-plans - createPlan (JSON body)
  // GET /api/membership-plans/{id} - getPlanById
  // DELETE /api/membership-plans/{id} - deletePlan
  MEMBERSHIP_PLANS: {
    LIST: "/api/membership-plans",
    DETAIL: "/api/membership-plans/:id",
    CREATE: "/api/membership-plans",
    UPDATE: "/api/membership-plans",
    DELETE: "/api/membership-plans/:id",
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

  // Companies endpoints - Based on schema-from-be.d.ts
  COMPANIES: {
    LIST: "/api/companies",
    DETAIL: "/api/companies/:id",
    CREATE: "/api/companies",
    UPDATE: "/api/companies",
    DELETE: "/api/companies/:id",
  },

  // Job Descriptions endpoints - Based on schema-from-be.d.ts
  JOB_DESCRIPTIONS: {
    LIST: "/api/job-descriptions",
    DETAIL: "/api/job-descriptions/:id",
    CREATE: "/api/job-descriptions",
    UPDATE: "/api/job-descriptions",
    SEARCH: "/api/job-descriptions/search",
    BY_COMPANY: "/api/job-descriptions/company/:companyId",
    SOFT_DELETE: "/api/job-descriptions/:id/soft",
  },

  // Interview rounds endpoints (Job Description rounds)
  ROUNDS: {
    SETUP_JD: "/api/rounds/jd/:jdId",
    UPDATE_JD: "/api/rounds/jd/:jdId/update",
  },

  // Job applications endpoints
  APPLICATIONS: {
    LIST: "/api/applications",
    DETAIL: "/api/applications/:id",
    APPLY: "/api/applications",
    MY: "/api/applications/me",
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
    DETAIL: "/api/interview-sessions/:sessionId",
    CACHE: "/api/interview-sessions/cache/:sessionKey",
  },

  // Interview analysis endpoints
  INTERVIEW_ANALYSIS: {
    FACE_BEHAVIOR: "/api/interview-analysis/face-behavior",
  },

  // Proctoring endpoints (v1)
  PROCTORING: {
    TRACK: "/api/v1/proctoring/track",
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

const PUBLIC_AUTH_POST_ENDPOINTS = new Set<string>([
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.LOGIN_WITH_GOOGLE,
  API_ENDPOINTS.AUTH.SIGNUP,
  API_ENDPOINTS.AUTH.MENTOR_REGISTER,
]);

const PUBLIC_REGISTRATION_POST_ENDPOINTS = new Set<string>([
  API_ENDPOINTS.USERS.CREATE,
  API_ENDPOINTS.MENTOR.CREATE,
]);

// Public GET endpoints that don't require authentication
const PUBLIC_GET_ENDPOINTS = new Set<string>([
  API_ENDPOINTS.POSTS.PUBLISHED, // GET /api/posts/published - public blog posts
  "/api/majors", // GET /api/majors - public majors list
  "/api/companies", // GET /api/companies - public companies
]);

// Public GET endpoint patterns (for dynamic paths with parameters)
const PUBLIC_GET_ENDPOINT_PATTERNS: RegExp[] = [
  // GET /api/posts/{postId} - get individual post
  /^\/api\/posts\/[^/]+$/,
  // GET /api/posts/likes/{postId}/check/{userId} - check if user liked post
  /^\/api\/posts\/likes\/[^/]+\/check\/[^/]+$/,
  // Any GET to /api/posts/* (including /api/posts/published)
  /^\/api\/posts/,
];

// Endpoints that should fail silently on 401 (no redirect, no toast)
// Used for public content that doesn't require authentication
const SILENT_401_ENDPOINTS = new Set<string>([
  API_ENDPOINTS.POSTS.PUBLISHED, // GET /api/posts/published - public blog posts
]);

const SILENT_401_ENDPOINT_PATTERNS: RegExp[] = [
  // GET /api/posts/{postId} - get individual post
  /^\/api\/posts\/[^/]+$/,
];

const PUBLIC_AUTH_PAGE_PATHS = new Set<string>(["/signup", "/mentor-register", "/select-role"]);

const normalizeRequestPath = (url?: string): string => {
  if (!url) {
    return "";
  }

  try {
    return new URL(url, API_BASE_URL).pathname;
  } catch {
    return url.split("?")[0]?.split("#")[0] || "";
  }
};

const isSilent401Endpoint = (url?: string, method?: string): boolean => {
  const normalizedMethod = (method || "get").toLowerCase();
  if (normalizedMethod !== "get") {
    return false;
  }

  const requestPath = normalizeRequestPath(url);
  if (!requestPath) {
    return false;
  }

  // Check exact match
  if (SILENT_401_ENDPOINTS.has(requestPath)) {
    return true;
  }

  // Check pattern match for dynamic endpoints
  if (SILENT_401_ENDPOINT_PATTERNS.some((pattern) => pattern.test(requestPath))) {
    return true;
  }

  return false;
};

const isPublicAuthPage = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return PUBLIC_AUTH_PAGE_PATHS.has(window.location.pathname);
};

export const isPublicAuthRequest = (url?: string, method?: string): boolean => {
  const normalizedMethod = (method || "get").toLowerCase();
  const requestPath = normalizeRequestPath(url);
  if (!requestPath) {
    return false;
  }

  // Check if this is a public GET endpoint (no auth required)
  if (normalizedMethod === "get") {
    // Check exact match
    if (PUBLIC_GET_ENDPOINTS.has(requestPath)) {
      return true;
    }
    // Check pattern match for dynamic endpoints
    if (PUBLIC_GET_ENDPOINT_PATTERNS.some((pattern) => pattern.test(requestPath))) {
      return true;
    }
  }

  // Only POST requests need auth for auth endpoints
  if (normalizedMethod !== "post") {
    return false;
  }

  if (PUBLIC_AUTH_POST_ENDPOINTS.has(requestPath)) {
    return true;
  }

  if (PUBLIC_REGISTRATION_POST_ENDPOINTS.has(requestPath)) {
    return isPublicAuthPage();
  }

  return false;
};

const appendCurlQueryParams = (url: URL, params: AxiosRequestConfig["params"]): void => {
  if (!params) {
    return;
  }

  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    return;
  }

  if (typeof params !== "object") {
    return;
  }

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value == null) {
      return;
    }

    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) => {
      if (item == null) {
        return;
      }

      const normalizedValue =
        item instanceof Date
          ? item.toISOString()
          : typeof item === "object"
            ? JSON.stringify(item)
            : String(item);

      url.searchParams.append(key, normalizedValue);
    });
  });
};

const buildCurlCommand = (config: AxiosRequestConfig): string => {
  try {
    const baseUrl = config.baseURL || API_BASE_URL;
    const resolvedUrl = config.url ? new URL(config.url, baseUrl) : new URL(baseUrl);
    appendCurlQueryParams(resolvedUrl, config.params);

    const method = (config.method || "get").toString().toUpperCase();
    const parts: string[] = [`curl -X ${method} "${resolvedUrl.toString()}"`];

    const headers = AxiosHeaders.from(
      config.headers as Parameters<typeof AxiosHeaders.from>[0]
    ).toJSON() as Record<string, unknown>;
    Object.entries(headers).forEach(([key, value]) => {
      if (key.toLowerCase() === "common" || key.toLowerCase() === "content-type" || value == null) {
        return;
      }

      const normalizedValue = Array.isArray(value) ? value.join(", ") : String(value);
      parts.push(`  -H ${JSON.stringify(`${key}: ${normalizedValue}`)}`);
    });

    if (config.data != null && config.data !== "") {
      if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        config.data.forEach((value, key) => {
          if (typeof File !== "undefined" && value instanceof File) {
            const fileName = value.name || "file";
            const mimeType = value.type || "application/octet-stream";
            parts.push(`  -F "${key}=@${fileName};type=${mimeType}"`);
            return;
          }

          if (typeof value === "string") {
            parts.push(`  -F "${key}=${value}"`);
            return;
          }

          parts.push(`  -F "${key}=${JSON.stringify(value)}"`);
        });
      } else {
        const rawBody = typeof config.data === "string" ? config.data : JSON.stringify(config.data);
        parts.push(`  -H "Content-Type: application/json"`);
        parts.push(`  -d '${rawBody.replace(/'/g, "'\"'\"'")}'`);
      }
    }

    return parts.join(" \\\n");
  } catch {
    return "# Failed to build cURL";
  }
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
  instance.interceptors.request.use(async (config) => {
    // Keep auth behavior consistent across clients: always attach token when available.
    const { useAuthStore } = await import("@/stores/authStore");
    const token = useAuthStore.getState().token;

    const shouldSkipAuthHeader = isPublicAuthRequest(config.url, config.method);
    const headers =
      config.headers instanceof AxiosHeaders ? config.headers : AxiosHeaders.from(config.headers);

    if (token && !shouldSkipAuthHeader) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Generate unique request ID for debugging
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    headers.set("X-Request-ID", requestId);
    config.headers = headers;

    const shouldLogCurl =
      typeof window !== "undefined" &&
      (import.meta.env.DEV || import.meta.env.VITE_DEBUG_CURL === "true");

    if (shouldLogCurl) {
      const curlCommand = buildCurlCommand(config);
      try {
        console.groupCollapsed(
          `[API cURL] ${(config.method || "GET").toString().toUpperCase()} ${config.url}`
        );
        console.log(curlCommand);
        console.groupEnd();
      } catch {
        console.log("[API cURL]", curlCommand);
      }
    }

    return config;
  });

  // Response interceptor - Global error handling (without toast to prevent duplicates)
  instance.interceptors.response.use(
    (response) => {
      if (response.data && typeof response.data === "object") {
        if ("traceId" in response.data) {
          const record = response.data as Record<string, unknown>;
          let unwrappedData = response.data;
          const keys = Object.keys(record);

          if (
            keys.includes("data") &&
            (keys.length === 2 || (keys.length === 1 && !keys.includes("traceId")))
          ) {
            unwrappedData = record.data;
          } else {
            unwrappedData = Object.fromEntries(
              Object.entries(record).filter(([k]) => k !== "traceId")
            );
          }
          response.data = unwrappedData;
        }
      }
      return response;
    },
    async (error) => {
      const normalizedError = normalizeApiError(error, "Đã xảy ra lỗi khi gọi API.");
      const status = normalizedError.status;

      // ALWAYS log failed API requests with traceId in all environments
      console.error(`❌ Axios API Error [Trace ID: ${normalizedError.traceId || "N/A"}]:`, {
        status,
        url: error.config?.url,
        message: normalizedError.message,
        traceId: normalizedError.traceId,
        payload: normalizedError.payload,
      });
      if (normalizedError.traceId) {
        console.error(`[COPY TRACE ID] ${normalizedError.traceId}`);
      }

      // Handle network errors (no response) - log but don't toast
      if (!error.response) {
        return Promise.reject(
          toAppApiError(error, "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.")
        );
      }

      // Handle HTTP errors
      if ((status || 0) >= 400) {
        // Log error for debugging
        console.error(`HTTP ${status} error:`, {
          message: normalizedError.message,
          traceId: normalizedError.traceId,
          payload: normalizedError.payload,
        });

        // Handle 401 - don't redirect for public endpoints
        if (status === 401) {
          const requestUrl = error.config?.url ?? "";
          const requestMethod = (error.config?.method ?? "get").toLowerCase();

          // Check if this is a public endpoint - skip redirect
          const shouldSkipRedirect = isPublicAuthRequest(requestUrl, requestMethod);
          const shouldSilentFail = isSilent401Endpoint(requestUrl, requestMethod);

          // Also check generic /posts pattern
          const isPostsEndpoint = requestUrl.includes("/posts") && requestMethod === "get";

          if (shouldSkipRedirect || shouldSilentFail || isPostsEndpoint) {
            return Promise.reject(toAppApiError(error, normalizedError.message));
          }

          // Redirect for protected endpoints
          const { useAuthStore } = await import("@/stores/authStore");
          useAuthStore.getState().clearAuth();

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }

      return Promise.reject(toAppApiError(error, normalizedError.message));
    }
  );

  return instance;
};
