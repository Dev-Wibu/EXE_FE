/**
 * Company Manager
 * Handles company CRUD operations
 * Implements BaseManager interface
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { createApiInstance } from "@/constants/api.config";

export interface Company {
  id?: number;
  name?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  status?: string;
  isDeleted?: boolean;
  jobDescriptions?: JobDescription[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  // Extended fields for display
  industry?: string;
  website?: string;
  size?: string;
  location?: string;
  foundedYear?: number;
  benefits?: string[];
  culture?: string;
  stats?: CompanyStats;
}

export interface CompanyStats {
  totalEmployees?: number;
  openPositions?: number;
  interviewsPerMonth?: number;
  hiringRate?: number;
}

export interface Round {
  id?: number;
  name?: string;
  roundOrder?: number;
  roundType?: "CV_SCREENING" | "EMAIL_SIMULATOR" | "QUIZ" | "DB_DESIGN" | "AI_INTERVIEW";
  passThreshold?: number;
  configData?: RoundConfig;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoundConfig {
  instruction?: string;
  submissionFormat?: string;
  timeLimitMinutes?: number;
  maxScore?: number;
  aiSystemPrompt?: string;
  evaluationCriteria?: string;
  quizQuestions?: QuizQuestion[];
}

export interface QuizQuestion {
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  points?: number;
}

export interface JobDescription {
  id?: number;
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  level?: "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE" | "SENIOR";
  salaryMin?: number;
  salaryMax?: number;
  appliedCount?: number;
  currency?: string;
  status?: "OPEN" | "CLOSED" | "DRAFT";
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deadlineAt?: string;
  location?: string;
  workType?: string;
  skills?: string[];
  rounds?: Round[];
  // Computed field for company detail page
  companyId?: number;
  companyName?: string;
}

export interface CompanyDetail extends Company {
  jobDescriptions?: JobDescription[];
}

export class CompanyManager implements BaseManager<Company> {
  private api = createApiInstance();

  async getAll(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Company> | Company[]>> {
    try {
      const response = await this.api.get("/api/companies", { params });
      const data = response.data;

      let companyList: Company[] = [];

      if (Array.isArray(data)) {
        companyList = data;
      } else if (data && typeof data === "object") {
        if ("content" in data && Array.isArray((data as { content: unknown }).content)) {
          companyList = (data as { content: Company[] }).content;
        } else {
          const values = Object.values(data as Record<string, unknown>);
          for (const value of values) {
            if (Array.isArray(value)) {
              companyList = value as Company[];
              break;
            }
          }
        }
      }

      return {
        success: true,
        data: companyList,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải danh sách công ty",
      };
    }
  }

  async getById(id: string | number): Promise<ApiResponse<Company>> {
    try {
      const response = await this.api.get(`/api/companies/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải thông tin công ty",
      };
    }
  }

  async create(_data: Partial<Company>): Promise<ApiResponse<Company>> {
    try {
      const formData = new FormData();
      Object.entries(_data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await this.api.post("/api/companies", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tạo công ty",
      };
    }
  }

  async update(id: string | number, _data: Partial<Company>): Promise<ApiResponse<Company>> {
    try {
      const formData = new FormData();
      formData.append("id", String(id));
      Object.entries(_data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await this.api.put("/api/companies", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể cập nhật công ty",
      };
    }
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      await this.api.delete(`/api/companies/${id}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể xóa công ty",
      };
    }
  }

  /**
   * Get company detail with jobs
   * GET /api/companies/{id}/detail
   */
  async getDetail(id: string | number): Promise<ApiResponse<CompanyDetail>> {
    try {
      const response = await this.api.get(`/api/companies/${id}/detail`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải chi tiết công ty",
      };
    }
  }

  /**
   * Get job listings for a company
   * GET /api/job-descriptions/company/{companyId}
   */
  async getJobs(
    id: string | number,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<JobDescription> | JobDescription[]>> {
    try {
      const response = await this.api.get(`/api/job-descriptions/company/${id}`, { params });
      const data = response.data;

      let jobs: JobDescription[] = [];

      if (Array.isArray(data)) {
        jobs = data;
      } else if (data && typeof data === "object") {
        if ("content" in data && Array.isArray((data as { content: unknown }).content)) {
          jobs = (data as { content: JobDescription[] }).content;
        } else if ("data" in data && Array.isArray((data as { data: unknown }).data)) {
          jobs = (data as { data: JobDescription[] }).data;
        }
      }

      return {
        success: true,
        data: jobs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải danh sách việc làm",
      };
    }
  }

  /**
   * Search job descriptions
   * GET /api/job-descriptions/search
   */
  async searchJobs(params: {
    titleKeyword?: string;
    status?: "OPEN" | "CLOSED" | "DRAFT";
    level?: "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE";
    salaryMin?: number;
    salaryMax?: number;
  }): Promise<ApiResponse<JobDescription[]>> {
    try {
      const response = await this.api.get("/api/job-descriptions/search", { params });
      const data = response.data;

      let jobs: JobDescription[] = [];

      if (Array.isArray(data)) {
        jobs = data;
      } else if (data && typeof data === "object") {
        if ("content" in data && Array.isArray((data as { content: unknown }).content)) {
          jobs = (data as { content: JobDescription[] }).content;
        }
      }

      return {
        success: true,
        data: jobs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tìm kiếm việc làm",
      };
    }
  }

  /**
   * Get job description by ID
   * GET /api/job-descriptions/{id}
   */
  async getJobById(id: number): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await this.api.get(`/api/job-descriptions/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải thông tin việc làm",
      };
    }
  }
}

export const companyManager = new CompanyManager();
