/**
 * Company Manager
 * Handles company CRUD operations
 * Implements BaseManager interface
 */

import type { 
  ApiResponse, 
  BaseManager, 
  PaginatedResponse, 
  PaginationParams,
  CreateCompanyRequest,
  UpdateCompanyRequest
} from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

// ==========================================
// 1. INTERFACES DÀNH CHO UI (Từ nhánh feat)
// ==========================================
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

// ==========================================
// 2. PAYLOAD & HELPER (Từ nhánh main)
// ==========================================
export interface CreateCompanyPayload {
  data: CreateCompanyRequest;
  logo?: File;
  banner?: File;
}

export interface UpdateCompanyPayload {
  data: UpdateCompanyRequest;
  logo?: File;
  banner?: File;
}

const buildCompanyFormData = (
  data: CreateCompanyRequest | UpdateCompanyRequest,
  logo?: File,
  banner?: File
): FormData => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));

  if (logo) {
    formData.append("logo", logo);
  }

  if (banner) {
    formData.append("banner", banner);
  }

  return formData;
};

// ==========================================
// 3. MAIN MANAGER CLASS
// ==========================================
export class CompanyManager implements BaseManager<Company> {
  private api = createApiInstance();

  // Kết hợp flexible parse của feat và endpoint chuẩn của main
  async getAll(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Company> | Company[]>> {
    try {
      // Fallback string nếu API_ENDPOINTS chưa có
      const url = API_ENDPOINTS?.COMPANIES?.LIST || "/api/companies"; 
      const response = await this.api.get(url, { params });
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

      return { success: true, data: companyList };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải danh sách công ty",
      };
    }
  }

  async getById(id: number | string): Promise<ApiResponse<Company>> {
    try {
      const endpoint = API_ENDPOINTS?.COMPANIES?.DETAIL 
        ? buildEndpoint(API_ENDPOINTS.COMPANIES.DETAIL, { id }) 
        : `/api/companies/${id}`;
      const response = await this.api.get<Company>(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải thông tin công ty",
      };
    }
  }

  // Sử dụng cấu trúc FormData an toàn từ main
  async create(payload: CreateCompanyPayload): Promise<ApiResponse<Company>> {
    try {
      const formData = buildCompanyFormData(payload.data, payload.logo, payload.banner);
      const url = API_ENDPOINTS?.COMPANIES?.CREATE || "/api/companies";
      const response = await this.api.post<Company>(url, formData, {
        headers: { "Content-Type": undefined },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tạo công ty",
      };
    }
  }

  // Sử dụng cấu trúc FormData an toàn từ main
  async update(payload: UpdateCompanyPayload): Promise<ApiResponse<Company>> {
    try {
      const formData = buildCompanyFormData(payload.data, payload.logo, payload.banner);
      const url = API_ENDPOINTS?.COMPANIES?.UPDATE || "/api/companies";
      const response = await this.api.put<Company>(url, formData, {
        headers: { "Content-Type": undefined },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể cập nhật công ty",
      };
    }
  }

  async delete(id: number | string): Promise<ApiResponse<void>> {
    try {
      const endpoint = API_ENDPOINTS?.COMPANIES?.DELETE 
        ? buildEndpoint(API_ENDPOINTS.COMPANIES.DELETE, { id }) 
        : `/api/companies/${id}`;
      await this.api.delete(endpoint);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể xóa công ty",
      };
    }
  }

  // ==========================================
  // CÁC HÀM TỪ NHÁNH FEAT (BẢO LƯU HOÀN TOÀN)
  // ==========================================
  
  async getDetail(id: string | number): Promise<ApiResponse<CompanyDetail>> {
    try {
      const response = await this.api.get(`/api/companies/${id}/detail`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải chi tiết công ty",
      };
    }
  }

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

      return { success: true, data: jobs };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải danh sách việc làm",
      };
    }
  }

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

      return { success: true, data: jobs };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tìm kiếm việc làm",
      };
    }
  }

  async getJobById(id: number): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await this.api.get(`/api/job-descriptions/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải thông tin việc làm",
      };
    }
  }
}

export const companyManager = new CompanyManager();