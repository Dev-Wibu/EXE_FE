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
import { roundManager } from "./round.manager";

const mockPut = fetchClient.PUT as ReturnType<typeof vi.fn>;

describe("RoundManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setUpForJd", () => {
    it("sets up rounds for a job description", async () => {
      const rounds = [{ id: 1, name: "Round 1" }];
      mockPut.mockResolvedValueOnce({ data: rounds, error: null });

      const result = await roundManager.setUpForJd(1, {
        rounds: [
          {
            name: "Round 1",
            roundOrder: 1,
            roundType: "CV_SCREENING",
            passThreshold: 50,
            configData: {},
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(rounds);
    });

    it("returns error on failure", async () => {
      mockPut.mockRejectedValueOnce(new Error("Network error"));

      const result = await roundManager.setUpForJd(1, { rounds: [] });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockPut.mockRejectedValueOnce("string error");

      const result = await roundManager.setUpForJd(1, { rounds: [] });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("errors.cannotSetUpInterviewRounds"));
    });
  });

  describe("updateForJd", () => {
    it("updates rounds for a job description", async () => {
      const rounds = [{ id: 1, name: "Updated Round" }];
      mockPut.mockResolvedValueOnce({ data: rounds, error: null });

      const result = await roundManager.updateForJd(1, {
        rounds: [
          {
            name: "Updated Round",
            roundOrder: 1,
            roundType: "CV_SCREENING",
            passThreshold: 50,
            configData: {},
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(rounds);
    });

    it("returns error on failure", async () => {
      mockPut.mockRejectedValueOnce(new Error("Update failed"));

      const result = await roundManager.updateForJd(1, { rounds: [] });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockPut.mockRejectedValueOnce("string error");

      const result = await roundManager.updateForJd(1, { rounds: [] });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("errors.cannotUpdateInterviewRounds"));
    });
  });
});
