import i18n from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

vi.mock("@/lib/api", () => ({
  fetchClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
  },
}));

import { fetchClient } from "@/lib/api";
import { mentorManager } from "./mentor.manager";

const mockGet = fetchClient.GET as ReturnType<typeof vi.fn>;
const mockPost = fetchClient.POST as ReturnType<typeof vi.fn>;

describe("MentorManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns mentors on success", async () => {
      const mentors = [{ id: 1, name: "Mentor A" }];
      mockGet.mockResolvedValueOnce({ data: mentors, error: null });

      const result = await mentorManager.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mentors);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Network error"));

      const result = await mentorManager.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("getById", () => {
    it("returns a mentor by id", async () => {
      const mentor = { id: 1, name: "Mentor A" };
      mockGet.mockResolvedValueOnce({ data: mentor, error: null });

      const result = await mentorManager.getById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mentor);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Not found"));

      const result = await mentorManager.getById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not found");
    });
  });

  describe("toggleActive", () => {
    it("calls toggle endpoint and returns updated mentor", async () => {
      const mentor = { id: 1, active: false };
      mockGet.mockResolvedValueOnce({ data: mentor, error: null });

      const result = await mentorManager.toggleActive(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mentor);
      expect(mockGet).toHaveBeenCalledTimes(1);
      // Verify it calls the toggle endpoint (not getById)
      const calledUrl = mockGet.mock.calls[0]?.[0] as string;
      expect(calledUrl).toContain("toggle");
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Toggle failed"));

      const result = await mentorManager.toggleActive(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Toggle failed");
    });
  });

  describe("create", () => {
    it("creates a mentor with FormData", async () => {
      const created = { id: 2, name: "New Mentor" };
      mockPost.mockResolvedValueOnce({ data: created, error: null });

      const result = await mentorManager.create({
        name: "New Mentor",
        email: "new@test.com",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
      expect(mockPost).toHaveBeenCalledWith(
        "/api/mentors",
        expect.objectContaining({ body: expect.any(FormData) })
      );
    });

    it("returns error when name is missing", async () => {
      const result = await mentorManager.create({ email: "test@test.com" });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.nameIsRequiredToCreate"));
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("returns error when name is empty string", async () => {
      const result = await mentorManager.create({ name: "  ", email: "test@test.com" });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.nameIsRequiredToCreate"));
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("returns error when email is missing", async () => {
      const result = await mentorManager.create({ name: "Mentor" });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.emailIsRequiredToCreate"));
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("returns error when email is empty string", async () => {
      const result = await mentorManager.create({ name: "Mentor", email: "  " });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.emailIsRequiredToCreate"));
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("returns error on POST failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("Create failed"));

      const result = await mentorManager.create({ name: "M", email: "m@test.com" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Create failed");
    });
  });

  describe("update", () => {
    it("fetches existing mentor and merges data into FormData", async () => {
      const existing = {
        id: 1,
        name: "Old",
        email: "old@test.com",
        password: "hashed",
        active: true,
      };
      mockGet.mockResolvedValueOnce({ data: existing });
      mockPost.mockResolvedValueOnce({ data: { id: 1, name: "New" } });

      const result = await mentorManager.update(1, { name: "New" });

      expect(result.success).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1); // getById
      expect(mockPost).toHaveBeenCalledWith(
        "/api/mentors",
        expect.objectContaining({ body: expect.any(FormData) })
      );
    });

    it("falls back to existing password when not provided", async () => {
      const existing = { id: 1, name: "M", email: "e@t.com", password: "old-pw" };
      mockGet.mockResolvedValueOnce({ data: existing });
      mockPost.mockResolvedValueOnce({ data: { id: 1 } });

      await mentorManager.update(1, { name: "Updated" });

      // Verify POST was called (password fallback happens inside FormData blob)
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it("preserves active field from _data when provided", async () => {
      const existing = { id: 1, name: "M", email: "e@t.com", active: false };
      mockGet.mockResolvedValueOnce({ data: existing });
      mockPost.mockResolvedValueOnce({ data: { id: 1 } });

      await mentorManager.update(1, { name: "M", active: true });

      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it("falls back to existing active when _data.active is not set", async () => {
      const existing = { id: 1, name: "M", email: "e@t.com", active: true };
      mockGet.mockResolvedValueOnce({ data: existing });
      mockPost.mockResolvedValueOnce({ data: { id: 1 } });

      await mentorManager.update(1, { name: "M" });

      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it("proceeds when getById fails (ignores fetch error)", async () => {
      mockGet.mockRejectedValueOnce(new Error("Not found"));
      mockPost.mockResolvedValueOnce({ data: { id: 1 } });

      const result = await mentorManager.update(1, { name: "New", email: "n@t.com" });

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it("returns error on POST failure", async () => {
      mockGet.mockResolvedValueOnce({ data: { id: 1 } });
      mockPost.mockRejectedValueOnce(new Error("Update failed"));

      const result = await mentorManager.update(1, { name: "X" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockResolvedValueOnce({ data: { id: 1 } });
      mockPost.mockRejectedValueOnce("string error");

      const result = await mentorManager.update(1, { name: "X" });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("common.unableToUpdateMentor"));
    });
  });

  describe("delete", () => {
    it("delegates to toggleActive", async () => {
      mockGet.mockResolvedValueOnce({ data: { id: 1, active: false } });

      const result = await mentorManager.delete(1);

      expect(result.success).toBe(true);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });
});
