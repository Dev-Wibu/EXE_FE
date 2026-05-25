/**
 * Shared types based on backend schema (schema-from-be.d.ts)
 * These types are used across the application for consistency
 */

import type { components } from "../../schema-from-be";

export type SchemaUser = components["schemas"]["User"];
export type SchemaUserResponse = components["schemas"]["UserResponse"];
export type SchemaMentor = components["schemas"]["Mentor"];
export type SchemaMentorResponse = components["schemas"]["MentorResponse"];
export type SchemaUserInfo = components["schemas"]["UserInfo"];
export type SchemaMentorInfo = components["schemas"]["MentorInfo"];
export type SchemaMembershipPlan = components["schemas"]["MemberShipPlan"];
export type SchemaCandidateProfile = components["schemas"]["CandidateProfile"];
export type SchemaJobDescription = components["schemas"]["JobDescription"];
export type SchemaCreateJobDescriptionRequest =
  components["schemas"]["CreateJobDescriptionRequest"];
export type SchemaUpdateJobDescriptionRequest =
  components["schemas"]["UpdateJobDescriptionRequest"];
export type SchemaCompany = components["schemas"]["Company"];
export type SchemaCreateCompanyRequest = components["schemas"]["CreateCompanyRequest"];
export type SchemaUpdateCompanyRequest = components["schemas"]["UpdateCompanyRequest"];
export type SchemaRound = components["schemas"]["Round"];
export type SchemaRoundConfig = components["schemas"]["RoundConfig"];
export type SchemaRoundConfigDto = components["schemas"]["RoundConfigDto"];
export type SchemaRoundItemDto = components["schemas"]["RoundItemDto"];
export type SchemaSetupJdRoundsRequest = components["schemas"]["SetupJdRoundsRequest"];
export type SchemaUpdateJdRoundRequest = components["schemas"]["UpdateJdRoundRequest"];
export type SchemaQuizQuestion = components["schemas"]["QuizQuestion"];
export type SchemaQuizQuestionDto = components["schemas"]["QuizQuestionDto"];
export type SchemaApplication = components["schemas"]["Application"];
export type SchemaInterviewSession = components["schemas"]["InterviewSession"];
export type SchemaInterviewSetupRequest = components["schemas"]["InterviewSetupRequest"];
export type SchemaSessionConfigData = components["schemas"]["SessionConfigData"];
export type SchemaJobRequirementData = components["schemas"]["JobRequirementData"];
export type SchemaInterviewBlueprintResponse = components["schemas"]["InterviewBlueprintResponse"];
export type SchemaInterviewPhase = components["schemas"]["InterviewPhase"];
export type SchemaInterviewQuestion = components["schemas"]["InterviewQuestion"];
export type SchemaInterviewResultDetail = components["schemas"]["InterviewResultDetail"];
export type SchemaQAResult = components["schemas"]["QAResult"];
export type SchemaInterviewExchange = components["schemas"]["InterviewExchange"];
export type SchemaInterviewSessionRedis = components["schemas"]["InterviewSessionRedis"];
export type SchemaFaceAnalysisResponse = components["schemas"]["FaceAnalysisResponse"];
export type UserSubscriptionResponse = components["schemas"]["UserSubscriptionResponse"];
export type TransactionEntity = components["schemas"]["Transaction"];
export type PaymentEntity = components["schemas"]["Payment"];
export type PaymentPurpose = NonNullable<components["schemas"]["Payment"]["paymentPurpose"]>;
export type JobDescription = SchemaJobDescription;
export type JobDescriptionLevel = NonNullable<SchemaJobDescription["level"]>;
export type JobDescriptionStatus = NonNullable<SchemaJobDescription["status"]>;
export type CreateJobDescriptionRequest = SchemaCreateJobDescriptionRequest;
export type UpdateJobDescriptionRequest = SchemaUpdateJobDescriptionRequest;
export type Company = SchemaCompany;
export type CreateCompanyRequest = SchemaCreateCompanyRequest;
export type UpdateCompanyRequest = SchemaUpdateCompanyRequest;
export type Round = SchemaRound;
export type RoundType = NonNullable<SchemaRound["roundType"]>;
export type RoundConfig = SchemaRoundConfig;
export type RoundConfigDto = SchemaRoundConfigDto;
export type RoundItemDto = SchemaRoundItemDto;
export type SetupJdRoundsRequest = SchemaSetupJdRoundsRequest;
export type UpdateJdRoundRequest = SchemaUpdateJdRoundRequest;
export type QuizQuestion = SchemaQuizQuestion;
export type QuizQuestionDto = SchemaQuizQuestionDto;
export type Application = SchemaApplication;
export type ApplicationStatus = NonNullable<SchemaApplication["status"]>;
export type InterviewSession = SchemaInterviewSession;
export type InterviewSetupRequest = SchemaInterviewSetupRequest;
export type SessionConfigData = SchemaSessionConfigData;
export type InterviewMode = NonNullable<SchemaSessionConfigData["interview_mode"]>;
export type InterviewDifficulty = NonNullable<SchemaSessionConfigData["difficulty"]>;
export type InterviewLanguage = NonNullable<SchemaSessionConfigData["language"]>;
export type InterviewDomain = NonNullable<SchemaSessionConfigData["domain"]>;
export type InterviewStatus = NonNullable<SchemaInterviewSession["status"]>;
export type InterviewResult = NonNullable<SchemaInterviewSession["result"]>;
export type JobRequirementData = SchemaJobRequirementData;
export type InterviewBlueprintResponse = SchemaInterviewBlueprintResponse;
export type InterviewPhase = SchemaInterviewPhase;
export type InterviewQuestion = SchemaInterviewQuestion;
export type InterviewResultDetail = SchemaInterviewResultDetail;
export type QAResult = SchemaQAResult;
export type InterviewExchange = SchemaInterviewExchange;
export type InterviewQuestionType = NonNullable<SchemaInterviewExchange["type"]>;
export type InterviewSessionRedis = SchemaInterviewSessionRedis;
export type FaceAnalysisResponse = SchemaFaceAnalysisResponse;
export type FaceAnalysisStatus = NonNullable<SchemaFaceAnalysisResponse["status"]>;

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

/**
 * Feature names for usage logs
 */
export type FeatureName = "MENTOR_INTERVIEW" | "AI_INTERVIEW" | "PRACTICE" | "QUIZ";

/**
 * Feature usage log entry based on API response
 */
export interface FeatureUsageLog {
  id: number;
  userId: number;
  featureName: FeatureName;
  useAt: string;
}

/**
 * Membership plan names in usage response.
 */
export type UserUsageMembershipPlanName =
  | "NEW"
  | "FREE"
  | "BASIC"
  | "PREMIUM"
  | "TEST"
  | (string & {});

/**
 * Membership plan payload embedded in user usage response.
 */
export interface UserUsageMembershipPlan {
  id?: number;
  name?: UserUsageMembershipPlanName | null;
  price?: number | null;
  max_ai_interview?: number | null;
  max_practice_sets?: number | null;
  max_quiz_sets?: number | null;
  durationDays?: number | null;
}

/**
 * User snapshot embedded in legacy user usage response.
 */
export interface UserUsageUser {
  id?: number;
  name?: string | null;
  email?: string | null;
  role?: UserRole;
  isActive?: boolean | null;
  membershipPlan?: UserUsageMembershipPlan | null;
}

/**
 * User usage entry from GET /api/users/usage.
 * Supports both current flat payload and legacy nested payload.
 */
export interface UserUsageRecord {
  userId?: number;
  planName?: UserUsageMembershipPlanName | null;
  price?: number | null;
  durationDays?: number | null;
  maxAiInterview?: number | null;
  maxPracticeSets?: number | null;
  maxQuizSets?: number | null;
  user?: UserUsageUser | null;
  active?: boolean | null;
  isActive?: boolean | null;
  aiInterviewUsed?: number | null;
  practiceSetUsed?: number | null;
  quizSetUsed?: number | null;
  aiInterviewRemaining?: number | null;
  practiceSetRemaining?: number | null;
  quizSetRemaining?: number | null;
  expiredAt?: string | null;
}
