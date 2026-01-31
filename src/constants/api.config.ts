/**
 * API Configuration and Constants
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiConfig, ManagerMode } from "@/interfaces";

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
  // GET /api/questions - getAllQuestions
  // POST /api/questions - createQuestion (JSON body)
  // PUT /api/questions - updateQuestion (JSON body)
  // GET /api/questions/{id} - getQuestionById
  // DELETE /api/questions/{id} - deleteQuestion
  // GET /api/questions/random-by-level - getRandomQuestionsByLevel
  // GET /api/questions/by-category-level - getQuestionsByCategoryAndLevel
  // POST /api/questions/save-all - createQuestionList
  QUESTION: {
    LIST: "/api/questions",
    DETAIL: "/api/questions/:id",
    CREATE: "/api/questions",
    UPDATE: "/api/questions",
    DELETE: "/api/questions/:id",
    RANDOM_BY_LEVEL: "/api/questions/random-by-level",
    BY_CATEGORY_LEVEL: "/api/questions/by-category-level",
    SAVE_ALL: "/api/questions/save-all",
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
    BY_USER: "/api/sessions/:userId/by-user",
    JOIN: "/api/sessions/join-session",
  },

  // Question Sets endpoints - Based on schema-from-be.d.ts
  QUESTION_SETS: {
    LIST: "/api/question-sets",
    DETAIL: "/api/question-sets/:id",
    CREATE: "/api/question-sets",
    UPDATE: "/api/question-sets",
    DELETE: "/api/question-sets/:id",
    BY_LEVEL: "/api/question-sets/level/:level",
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

  // Question Set Items endpoints - Based on schema-from-be.d.ts
  QUESTION_SET_ITEMS: {
    LIST: "/api/question-set-items",
    DETAIL: "/api/question-set-items/:id",
    CREATE: "/api/question-set-items",
    CREATE_BULK: "/api/question-set-items/create-items",
    UPDATE: "/api/question-set-items",
    DELETE: "/api/question-set-items/:id",
    BY_QUESTION_SET: "/api/question-set-items/by-question-set/:id",
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

  // Interview Sessions endpoints - Based on schema-from-be.d.ts
  // POST /api/interview-sessions/create-session - createInterviewSession (JSON body)
  // POST /api/interview-sessions/generate-job-requirement - generateJobRequirement (JSON body)
  // GET /api/interview-sessions/config-options - getInterviewConfigOptions
  INTERVIEW_SESSIONS: {
    CREATE: "/api/interview-sessions/create-session",
    GENERATE_JOB_REQUIREMENT: "/api/interview-sessions/generate-job-requirement",
    CONFIG_OPTIONS: "/api/interview-sessions/config-options",
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
