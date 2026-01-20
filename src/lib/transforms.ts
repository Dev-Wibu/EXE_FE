/**
 * Transform functions for converting between frontend forms and backend API formats
 * Based on schema-from-be.d.ts types
 * Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
 */

import type { Mentor, Session, User, UserRole } from "@/interfaces/schema.types";

// ==================== User Transforms ====================

export interface UserCreateFormData {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  university?: string;
  major?: string;
}

/**
 * Transform user form data to UserInfo format for API create request
 */
export const transformUserCreateRequest = (formData: UserCreateFormData) => ({
  name: formData.name?.trim(),
  email: formData.email?.trim(),
  password: formData.password?.trim(),
  university: formData.university?.trim(),
  major: formData.major?.trim(),
});

/**
 * Transform user form data to User format for API update request
 */
export const transformUserUpdateRequest = (
  id: number,
  formData: Partial<UserCreateFormData>,
  existingUser?: User
): User => ({
  id,
  ...existingUser,
  name: formData.name?.trim() || existingUser?.name,
  email: formData.email?.trim() || existingUser?.email,
  role: formData.role || existingUser?.role,
  university: formData.university?.trim() || existingUser?.university,
  major: formData.major?.trim() || existingUser?.major,
});

// ==================== Mentor Transforms ====================

export interface MentorCreateFormData {
  name: string;
  email: string;
  password?: string;
  bio?: string;
  expertise?: string;
  yearsOfExperience?: number;
  linkedInUrl?: string;
  currentCompany?: string;
}

/**
 * Transform mentor form data to MentorInfo format for API create request
 */
export const transformMentorCreateRequest = (formData: MentorCreateFormData) => ({
  name: formData.name?.trim(),
  email: formData.email?.trim(),
  password: formData.password?.trim(),
  bio: formData.bio?.trim(),
  expertise: formData.expertise?.trim(),
  yearsOfExperience: formData.yearsOfExperience,
  linkedInUrl: formData.linkedInUrl?.trim(),
  currentCompany: formData.currentCompany?.trim(),
});

/**
 * Transform mentor form data to Mentor format for API update request
 */
export const transformMentorUpdateRequest = (
  id: number,
  formData: Partial<MentorCreateFormData>,
  existingMentor?: Mentor
): Mentor => ({
  id,
  ...existingMentor,
  name: formData.name?.trim() || existingMentor?.name,
  email: formData.email?.trim() || existingMentor?.email,
  bio: formData.bio?.trim() || existingMentor?.bio,
  expertise: formData.expertise?.trim() || existingMentor?.expertise,
  yearsOfExperience: formData.yearsOfExperience ?? existingMentor?.yearsOfExperience,
  linkedInUrl: formData.linkedInUrl?.trim() || existingMentor?.linkedInUrl,
  currentCompany: formData.currentCompany?.trim() || existingMentor?.currentCompany,
});

// ==================== Session Transforms ====================

export interface SessionCreateFormData {
  userId: number;
  mentorId: number;
  roomName?: string;
}

/**
 * Transform session form data to SessionCreationRequest format for API create request
 */
export const transformSessionCreateRequest = (formData: SessionCreateFormData) => ({
  dailyCoCreationRequest: {
    name: formData.roomName || `session-${Date.now()}`,
    privacy: "private",
    properties: {
      max_participants: 2,
      start_video_off: false,
      start_audio_off: false,
      enable_screenshare: true,
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      enable_recording: "cloud",
    },
  },
  userId: formData.userId,
  mentorId: formData.mentorId,
});

/**
 * Transform session form data to Session format for API update request
 */
export const transformSessionUpdateRequest = (
  id: number,
  formData: Partial<Session>,
  existingSession?: Session
): Session => ({
  id,
  ...existingSession,
  ...formData,
});

// ==================== Validation Helpers ====================

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Vietnamese)
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(0|\+84)\d{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

/**
 * Normalize phone number to standard format
 * Converts +84 prefix to 0 prefix
 */
export const normalizePhone = (phone: string): string => {
  const trimmed = phone.trim().replace(/\s/g, "");
  if (/^\+84\d+$/.test(trimmed)) {
    return `0${trimmed.slice(3)}`;
  }
  return trimmed;
};

// ==================== Role Extraction ====================

/**
 * Extract role from various backend role formats
 */
export const extractRole = (roles: unknown[]): UserRole => {
  if (!roles || roles.length === 0) return "USER";

  const role = roles[0];

  // Handle different formats: "USER" or {authority: "ROLE_USER"}
  let roleStr: string;
  if (typeof role === "string") {
    roleStr = role;
  } else if (typeof role === "object" && role !== null) {
    const roleObj = role as Record<string, unknown>;
    roleStr =
      (roleObj.authority as string) ||
      (roleObj.role as string) ||
      (roleObj.name as string) ||
      "USER";
  } else {
    return "USER";
  }

  // Remove ROLE_ prefix if present
  const cleanRole = roleStr.replace("ROLE_", "").toUpperCase();

  // Validate and return
  if (["MENTOR", "ADMIN", "STAFF", "USER"].includes(cleanRole)) {
    return cleanRole as UserRole;
  }

  return "USER";
};
