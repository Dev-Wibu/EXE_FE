import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Company Manager
 * Handles company CRUD operations
 * Implements BaseManager interface
 */

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import type {
  ApiResponse,
  CreateCompanyRequest,
  PaginatedResponse,
  PaginationParams,
  UpdateCompanyRequest,
} from "@/interfaces";
import { fetchClient } from "@/lib/api";

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
  level?: "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE";
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
  formData.append(
    "data",
    new Blob([JSON.stringify(data)], {
      type: "application/json",
    })
  );
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
export class CompanyManager {
  // Kết hợp flexible parse của feat và endpoint chuẩn của main
  async getAll(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Company> | Company[]>> {
    try {
      // Fallback string nếu API_ENDPOINTS chưa có
      const url = API_ENDPOINTS?.COMPANIES?.LIST || "/api/companies";
      const response = await fetchClient
        .GET(url, {
          // @ts-expect-error: Backend Swagger schema mismatch
          params,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      const data = response.data;
      let companyList: Company[] = [];
      if (Array.isArray(data)) {
        companyList = data;
      } else if (data && typeof data === "object") {
        if (
          "content" in data &&
          Array.isArray(
            (
              data as unknown as {
                content: unknown;
              }
            ).content
          )
        ) {
          companyList = (
            data as unknown as {
              content: Company[];
            }
          ).content;
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
        error: error instanceof Error ? error.message : t("common.unableToLoadCompanyList"),
      };
    }
  }
  async getById(id: number | string): Promise<ApiResponse<Company>> {
    try {
      const endpoint = API_ENDPOINTS?.COMPANIES?.DETAIL
        ? buildEndpoint(API_ENDPOINTS.COMPANIES.DETAIL, {
            id,
          })
        : `/api/companies/${id}`;
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToLoadCompanyInformation"),
      };
    }
  }

  // Sử dụng cấu trúc FormData an toàn từ main
  async create(payload: CreateCompanyPayload): Promise<ApiResponse<Company>> {
    try {
      const formData = buildCompanyFormData(payload.data, payload.logo, payload.banner);
      const url = API_ENDPOINTS?.COMPANIES?.CREATE || "/api/companies";
      const response = await fetchClient
        .POST(url, {
          ...{
            headers: {
              "Content-Type": undefined,
            },
          },
          // @ts-expect-error: Backend Swagger schema mismatch
          body: formData,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        // @ts-expect-error: Schema type mismatch between frontend and backend
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.cannotCreateCompany"),
      };
    }
  }

  // Sử dụng cấu trúc FormData an toàn từ main
  async update(payload: UpdateCompanyPayload): Promise<ApiResponse<Company>> {
    try {
      const formData = buildCompanyFormData(payload.data, payload.logo, payload.banner);
      const url = API_ENDPOINTS?.COMPANIES?.UPDATE || "/api/companies";
      const response = await fetchClient
        .PUT(url, {
          ...{
            headers: {
              "Content-Type": undefined,
            },
          },
          // @ts-expect-error: Backend Swagger schema mismatch
          body: formData,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        // @ts-expect-error: Schema type mismatch between frontend and backend
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToUpdateCompany"),
      };
    }
  }
  async delete(id: number | string): Promise<ApiResponse<void>> {
    try {
      const endpoint = API_ENDPOINTS?.COMPANIES?.DELETE
        ? buildEndpoint(API_ENDPOINTS.COMPANIES.DELETE, {
            id,
          })
        : `/api/companies/${id}`;
      // @ts-expect-error: Backend Swagger schema mismatch
      await fetchClient.DELETE(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotDeleteCompany"),
      };
    }
  }

  // ==========================================
  // CÁC HÀM TỪ NHÁNH FEAT (BẢO LƯU HOÀN TOÀN)
  // ==========================================

  async getDetail(id: string | number): Promise<ApiResponse<CompanyDetail>> {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .GET("/api/companies/{id}/detail", {
          params: {
            path: {
              id: id,
            },
          },
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadCompanyDetails"),
      };
    }
  }
  async getJobs(
    id: string | number,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<JobDescription> | JobDescription[]>> {
    try {
      const response = await fetchClient
        .GET("/api/job-descriptions/company/{companyId}", {
          // @ts-expect-error: Backend Swagger schema mismatch
          params: { path: { companyId: Number(id) }, query: params },
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      const data = response.data as JobDescription[];
      let jobs: JobDescription[] = [];
      if (Array.isArray(data)) {
        jobs = data;
      } else if (data && typeof data === "object") {
        if (
          "content" in data &&
          Array.isArray(
            (
              data as {
                content: unknown;
              }
            ).content
          )
        ) {
          jobs = (
            data as {
              content: JobDescription[];
            }
          ).content;
        } else if (
          "data" in data &&
          Array.isArray(
            (
              data as {
                data: unknown;
              }
            ).data
          )
        ) {
          jobs = (
            data as {
              data: JobDescription[];
            }
          ).data;
        }
      }
      return {
        success: true,
        data: jobs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadJobListing"),
      };
    }
  }
  async searchJobs(params: {
    titleKeyword?: string;
    status?: "OPEN" | "CLOSED" | "DRAFT";
    level?: "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE" | "SENIOR";
    salaryMin?: number;
    salaryMax?: number;
  }): Promise<ApiResponse<JobDescription[]>> {
    try {
      const response = await fetchClient
        .GET("/api/job-descriptions/search", {
          // @ts-expect-error: Backend Swagger schema mismatch
          params,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      const data = response.data as JobDescription[];
      let jobs: JobDescription[] = [];
      if (Array.isArray(data)) {
        jobs = data;
      } else if (data && typeof data === "object") {
        if (
          "content" in data &&
          Array.isArray(
            (
              data as {
                content: unknown;
              }
            ).content
          )
        ) {
          jobs = (
            data as {
              content: JobDescription[];
            }
          ).content;
        }
      }
      return {
        success: true,
        data: jobs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.canTSearchForA"),
      };
    }
  }
  async getJobById(id: number): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await fetchClient
        .GET("/api/job-descriptions/{id}", {
          params: {
            path: {
              id: id,
            },
          },
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        // @ts-expect-error: Schema type mismatch between frontend and backend
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadJobInformation"),
      };
    }
  }
}
export const companyManager = new CompanyManager();
