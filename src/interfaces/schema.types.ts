/**
 * Shared types based on backend schema (schema-from-be.d.ts)
 * These types are used across the application for consistency
 */

import type { components } from "../../schema-from-be";

export type SchemaUser = components["schemas"]["User"];
export type SchemaMentor = components["schemas"]["Mentor"];
export type SchemaMentorResponse = components["schemas"]["MentorResponse"];
export type SchemaUserInfo = components["schemas"]["UserInfo"];
export type SchemaMentorInfo = components["schemas"]["MentorInfo"];
export type SchemaMembershipPlan = components["schemas"]["MemberShipPlan"];
export type SchemaCandidateProfile = components["schemas"]["CandidateProfile"];
export type UserSubscriptionResponse = components["schemas"]["UserSubscriptionResponse"];
export type TransactionEntity = components["schemas"]["Transaction"];
export type PaymentEntity = components["schemas"]["Payment"];
export type PaymentPurpose = NonNullable<components["schemas"]["Payment"]["paymentPurpose"]>;

/**
 * User role enum
 */
export type UserRole = "MENTOR" | "ADMIN" | "STAFF" | "USER";

/**
 * User type based on backend schema
 * Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
 */
export interface User extends Omit<SchemaUser, "role"> {
  role?: UserRole;
}

/**
 * Mentor type based on backend schema
 */
export interface Mentor extends Omit<SchemaMentor, "role">, Partial<SchemaMentorResponse> {
  role?: UserRole;
  /** @deprecated Use averageRating from schema response */
  rate?: number;
}

/**
 * User form data for create/update operations
 * Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
 * Updated: Removed role as UserInfo schema doesn't include it (2026-01-23)
 * UserInfo only contains: id, name, email, password, university, major
 */
export interface UserFormData extends Omit<SchemaUserInfo, "id" | "name" | "email"> {
  name: string;
  email: string;
  isActive?: boolean;
  role?: UserRole;
  /** Cloudinary public_id for avatar - required for update operations */
  public_id?: string;
  /** Cloudinary public_id for CV - required for update operations */
  cv_public_id?: string;
}

/**
 * Mentor form data for create/update operations
 * Updated to match MentorInfo schema (doesn't include rate)
 */
export interface MentorFormData extends Omit<SchemaMentorInfo, "id" | "name" | "email"> {
  name: string;
  email: string;
  active?: boolean;
}

/**
 * Session status enum
 */
export type SessionStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "PAID"
  | "REJECTED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELED";

/**
 * Session type based on backend schema
 */
export interface Session {
  id?: number;
  roomName?: string;
  userId?: number;
  participantId1?: string;
  startTime1?: string;
  endTime1?: string;
  durationSeconds1?: number;
  userId2?: number;
  participantId2?: string;
  startTime2?: string;
  endTime2?: string;
  durationSeconds2?: number;
  roomUrl?: string;
  /** Meeting start time set by user (date-time) */
  joinTime?: string;
  recordUrl?: string;
  status?: SessionStatus;
  duration?: number;
  totalPrice?: number;
  transactionCode?: string;
}

/**
 * Session form data for create/update operations
 * Updated: exp defaults to 0 (no user-defined exp), added joinTime for meeting start time
 */
export interface SessionFormData {
  userId?: number;
  userId2?: number;
  status?: SessionStatus;
  /** Start with video off (default: true) */
  start_video_off?: boolean;
  /** Start with audio off (default: true) */
  start_audio_off?: boolean;
  /** Maximum participants (default: 2) */
  max_participants?: number;
  /** Enable screenshare */
  enable_screenshare?: boolean;
  /** Meeting start time (ISO date-time string) set by user */
  joinTime?: string;
  /** Planned interview duration in minutes */
  duration?: number;
  /** Planned total price based on duration and mentor rate */
  totalPrice?: number;
  /** Linked payment transaction code for paid sessions */
  transactionCode?: string;
  /** Recording mode: "cloud" or "local" (default: "cloud") */
  enable_recording?: string;
}

/**
 * Post status enum
 */
export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/**
 * Post type based on backend schema
 */
export interface Post {
  postId?: number;
  title?: string;
  content?: string;
  summary?: string;
  status?: PostStatus;
  author?: User;
  creationDate?: string;
  lastModifiedDate?: string;
  major?: { id?: number; name?: string; majorName?: string; description?: string };
  coverImgUrl?: string;
  public_id?: string;
  tags?: string[];
  /** Embedded from PostResponse wrapper (populated after normalization) */
  likeCount?: number;
  /** Embedded from PostResponse wrapper (populated after normalization) */
  commentCount?: number;
}

/**
 * Backend PostResponse wrapper
 * GET /api/posts and GET /api/posts/published return PostResponse[]
 */
export interface PostResponseWrapper {
  post?: Post;
  likeCount?: number;
  commentCount?: number;
  postLikes?: PostLikeResponse[];
  postComments?: PostCommentResponse[];
}

/**
 * Post create request (multipart/form-data)
 */
export interface PostCreateRequest {
  title?: string;
  content?: string;
  summary?: string;
  authorId?: number;
  majorId?: number;
  coverImg?: File;
  tags?: string[];
  status?: PostStatus;
}

/**
 * Post comment response (from API)
 */
export interface PostCommentResponse {
  id?: number;
  postId?: number;
  userId?: number;
  userName?: string;
  userAvatar?: string;
  content?: string;
  parentCommentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Post comment request (for creating comments)
 */
export interface PostCommentRequest {
  postId?: number;
  userId?: number;
  content?: string;
  parentCommentId?: number;
}

/**
 * Post like request
 */
export interface PostLikeRequest {
  postId?: number;
  userId?: number;
}

/**
 * Post like response
 */
export interface PostLikeResponse {
  id?: number;
  postId?: number;
  userId?: number;
  userName?: string;
  userAvatar?: string;
  createdAt?: string;
}

/**
 * Education entry for candidate profile
 */
export interface EducationEntry {
  school?: string;
  major?: string;
  degree?: string;
  gpa?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Project detail for candidate profile
 */
export interface ProjectDetail {
  name?: string;
  description?: string;
  role?: string;
  teamSize?: number;
  usedTools?: string[];
  outcome?: string;
}

/**
 * Work experience for candidate profile
 */
export interface WorkExperience {
  company?: string;
  position?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Interview config option item (from GET /api/interview-sessions/config-options)
 */
export interface InterviewConfigOptionItem {
  key: string;
  label: string;
  description: string;
}

/**
 * Interview config options response (from GET /api/interview-sessions/config-options)
 */
export interface InterviewConfigOptions {
  interview_modes: InterviewConfigOptionItem[];
  languages: InterviewConfigOptionItem[];
  difficulties: InterviewConfigOptionItem[];
  domains: InterviewConfigOptionItem[];
}

/**
 * Candidate profile type based on backend schema
 */
export interface CandidateProfile {
  id?: number;
  user?: User;
  targetRole?: string;
  targetLevel?: string;
  introduction?: string;
  technicalSkills?: string[];
  softSkills?: string[];
  tools?: string[];
  projects?: ProjectDetail[];
  workExperiences?: WorkExperience[];
  educations?: EducationEntry[];
  certifications?: string[];
  achievements?: string[];
  createdAt?: string;
  updatedAt?: string;
}
