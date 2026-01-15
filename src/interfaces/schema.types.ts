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
 */
export interface User {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
  bio?: string;
  avatarUrl?: string;
  public_id?: string;
  university?: string;
  major?: string;
  targetPosition?: string;
  targetLevel?: string;
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
 */
export interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  bio?: string;
  university?: string;
  major?: string;
  targetPosition?: string;
  targetLevel?: string;
  isActive?: boolean;
  /** Cloudinary public_id for avatar - required for update operations */
  public_id?: string;
  /** Cloudinary public_id for CV - required for update operations */
  cv_public_id?: string;
}

/**
 * Mentor form data for create/update operations
 */
export interface MentorFormData {
  name: string;
  email: string;
  bio?: string;
  expertise?: string;
  yearsOfExperience?: number;
  linkedInUrl?: string;
  currentCompany?: string;
  rate?: number;
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
 */
export interface SessionFormData {
  roomName?: string;
  userId?: number;
  userId2?: number;
  status?: SessionStatus;
}
