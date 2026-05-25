/**
 * Types for Company & Job Description management (Admin)
 */

import type { JobDescriptionLevel, JobDescriptionStatus } from "@/interfaces";

export type {
  Company,
  CreateCompanyRequest,
  CreateJobDescriptionRequest,
  JobDescription,
  JobDescriptionLevel,
  JobDescriptionStatus,
  UpdateCompanyRequest,
  UpdateJobDescriptionRequest,
} from "@/interfaces";

export type CompanyStatus = "ACTIVE" | "INACTIVE";

export interface CompanyFormData {
  name?: string;
  description?: string;
  status?: CompanyStatus;
  logo?: File;
  banner?: File;
}

export interface JobDescriptionFormData {
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  level?: JobDescriptionLevel;
  status?: JobDescriptionStatus;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  deadlineAt?: string;
}
