import i18n from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

vi.mock("@/lib/api", () => ({
  fetchClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
}));

import { fetchClient } from "@/lib/api";
import { companyManager } from "./company.manager";

const mockGet = fetchClient.GET as ReturnType<typeof vi.fn>;
const mockPost = fetchClient.POST as ReturnType<typeof vi.fn>;
const mockPut = fetchClient.PUT as ReturnType<typeof vi.fn>;
const mockDelete = fetchClient.DELETE as ReturnType<typeof vi.fn>;

describe("CompanyManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns companies when response is an array", async () => {
      const companies = [{ id: 1, name: "Acme" }];
      mockGet.mockResolvedValueOnce({ data: companies, error: null });

      const result = await companyManager.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(companies);
      expect(mockGet).toHaveBeenCalledWith("/api/companies", expect.any(Object));
    });

    it("extracts content array from paginated response", async () => {
      const companies = [{ id: 2, name: "PaginatedCo" }];
      mockGet.mockResolvedValueOnce({
        data: { content: companies, totalElements: 1 },
        error: null,
      });

      const result = await companyManager.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(companies);
    });

    it("falls back to first array value from object response", async () => {
      const companies = [{ id: 3, name: "FallbackCo" }];
      mockGet.mockResolvedValueOnce({ data: { items: companies, page: 0 }, error: null });

      const result = await companyManager.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(companies);
    });

    it("returns empty array for non-array non-object data", async () => {
      mockGet.mockResolvedValueOnce({ data: null, error: null });

      const result = await companyManager.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Server error"));

      const result = await companyManager.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Server error");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockRejectedValueOnce("string error");

      const result = await companyManager.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("common.unableToLoadCompanyList"));
    });
  });

  describe("getById", () => {
    it("returns a company by id", async () => {
      const company = { id: 1, name: "Acme" };
      mockGet.mockResolvedValueOnce({ data: company, error: null });

      const result = await companyManager.getById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(company);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await companyManager.getById(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockRejectedValueOnce("string error");

      const result = await companyManager.getById(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("common.unableToLoadCompanyInformation"));
    });
  });

  describe("create", () => {
    it("creates a company with FormData", async () => {
      const created = { id: 2, name: "NewCo" };
      mockPost.mockResolvedValueOnce({ data: created, error: null });

      const result = await companyManager.create({ data: { name: "NewCo" } });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
      expect(mockPost).toHaveBeenCalledWith(
        "/api/companies",
        expect.objectContaining({ body: expect.any(FormData) })
      );
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("fail"));

      const result = await companyManager.create({ data: { name: "X" } });

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockPost.mockRejectedValueOnce("string error");

      const result = await companyManager.create({ data: { name: "X" } });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("common.cannotCreateCompany"));
    });
  });

  describe("update", () => {
    it("updates a company", async () => {
      const updated = { id: 1, name: "Updated" };
      mockPut.mockResolvedValueOnce({ data: updated, error: null });

      const result = await companyManager.update({ data: { id: 1, name: "Updated" } });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
    });

    it("returns error on failure", async () => {
      mockPut.mockRejectedValueOnce(new Error("fail"));

      const result = await companyManager.update({ data: { id: 1, name: "X" } });

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockPut.mockRejectedValueOnce("string error");

      const result = await companyManager.update({ data: { id: 1, name: "X" } });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("common.unableToUpdateCompany"));
    });
  });

  describe("delete", () => {
    it("deletes a company", async () => {
      mockDelete.mockResolvedValueOnce({ data: null, error: null });

      const result = await companyManager.delete(1);

      expect(result.success).toBe(true);
    });

    it("returns error on failure", async () => {
      mockDelete.mockRejectedValueOnce(new Error("fail"));

      const result = await companyManager.delete(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockDelete.mockRejectedValueOnce("string error");

      const result = await companyManager.delete(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.cannotDeleteCompany"));
    });
  });

  describe("getDetail", () => {
    it("returns company detail", async () => {
      const detail = { id: 1, name: "Acme", jobs: [] };
      mockGet.mockResolvedValueOnce({ data: detail, error: null });

      const result = await companyManager.getDetail(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(detail);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Not found"));

      const result = await companyManager.getDetail(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not found");
    });
  });

  describe("getJobs", () => {
    it("returns jobs as array", async () => {
      const jobs = [{ id: 1, title: "Dev" }];
      mockGet.mockResolvedValueOnce({ data: jobs });

      const result = await companyManager.getJobs(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(jobs);
    });

    it("extracts content array from paginated response", async () => {
      const jobs = [{ id: 2, title: "QA" }];
      mockGet.mockResolvedValueOnce({ data: { content: jobs, total: 1 } });

      const result = await companyManager.getJobs(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(jobs);
    });

    it("extracts data array from nested response", async () => {
      const jobs = [{ id: 3, title: "PM" }];
      mockGet.mockResolvedValueOnce({ data: { data: jobs } });

      const result = await companyManager.getJobs(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(jobs);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await companyManager.getJobs(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("searchJobs", () => {
    it("returns matching jobs", async () => {
      const jobs = [{ id: 1, title: "React Dev" }];
      mockGet.mockResolvedValueOnce({ data: jobs });

      const result = await companyManager.searchJobs({ titleKeyword: "React" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(jobs);
    });

    it("extracts content array from paginated response", async () => {
      const jobs = [{ id: 2 }];
      mockGet.mockResolvedValueOnce({ data: { content: jobs } });

      const result = await companyManager.searchJobs({ status: "OPEN" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(jobs);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await companyManager.searchJobs({});

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("getJobById", () => {
    it("returns a job by id", async () => {
      const job = { id: 1, title: "Dev" };
      mockGet.mockResolvedValueOnce({ data: job });

      const result = await companyManager.getJobById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(job);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await companyManager.getJobById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });
});
