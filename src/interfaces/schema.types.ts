/**
 * Shared types based on backend schema (schema-from-be.d.ts)
 * These types are used across the application for consistency
 */

/**
 * User role enum
 */
export type UserRole = "MENTOR" | "ADMIN" | "STAFF" | "USER";

/**
 * User type based on backend schema
 * Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
 */
export interface User {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
  avatarUrl?: string;
  public_id?: string;
  university?: string;
  major?: string;
  cvUrl?: string;
  cv_public_id?: string;
}

/**
 * Mentor type based on backend schema
 */
export interface Mentor {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  bio?: string;
  avatarUrl?: string;
  public_id?: string;
  expertise?: string;
  yearsOfExperience?: number;
  linkedInUrl?: string;
  currentCompany?: string;
  rate?: number;
  identityImg?: string;
  public_id_identity?: string;
  degreeImg?: string;
  public_id_degree?: string;
  otherFile?: string;
  public_id_other?: string;
  totalSession?: number;
  active?: boolean;
}

/**
 * User form data for create/update operations
 * Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
 * Updated: Removed role as UserInfo schema doesn't include it (2026-01-23)
 * UserInfo only contains: id, name, email, password, university, major
 */
export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  university?: string;
  major?: string;
  isActive?: boolean;
  /** Cloudinary public_id for avatar - required for update operations */
  public_id?: string;
  /** Cloudinary public_id for CV - required for update operations */
  cv_public_id?: string;
}

/**
 * Mentor form data for create/update operations
 * Updated to match MentorInfo schema (doesn't include rate)
 */
export interface MentorFormData {
  name: string;
  email: string;
  bio?: string;
  expertise?: string;
  yearsOfExperience?: number;
  linkedInUrl?: string;
  currentCompany?: string;
  active?: boolean;
}

/**
 * Session status enum
 */
export type SessionStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELED";

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
  recordUrl?: string;
  status?: SessionStatus;
}

/**
 * Session form data for create/update operations
 * Updated: Removed roomName (auto-generated), added exp (expiration time), start_audio_off, start_video_off
 */
export interface SessionFormData {
  userId?: number;
  userId2?: number;
  status?: SessionStatus;
  /** Session expiration time in seconds for the user */
  exp?: number;
  /** Start with video off (default: true) */
  start_video_off?: boolean;
  /** Start with audio off (default: true) */
  start_audio_off?: boolean;
  /** Maximum participants (default: 2) */
  max_participants?: number;
  /** Enable screenshare */
  enable_screenshare?: boolean;
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
  major?: { id?: number; name?: string; description?: string };
  coverImgUrl?: string;
  public_id?: string;
  tags?: string[];
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
