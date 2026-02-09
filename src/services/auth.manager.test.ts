/**
 * Test file for Auth Manager
 * Tests mentor login functionality
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { authManager } from "./auth.manager";

// Mock the fetchClient
vi.mock("@/lib/api", () => ({
  fetchClient: {
    GET: vi.fn(),
  },
}));

import { fetchClient } from "@/lib/api";

const mockFetchClient = fetchClient.GET as ReturnType<typeof vi.fn>;

describe("AuthManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("mentor login", () => {
    it("should map mentor role correctly", async () => {
      const mockMentors = [
        {
          id: 1,
          name: "Test Mentor",
          email: "mentor@test.com",
          password: "test123",
          role: "MENTOR",
          avatarUrl: "https://example.com/avatar.jpg",
        },
      ];

      // Mock users endpoint to return empty
      mockFetchClient.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock mentors endpoint to return test mentor
      mockFetchClient.mockResolvedValueOnce({
        data: mockMentors,
        error: null,
      });

      const result = await authManager.login({
        email: "mentor@test.com",
        password: "test123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.role).toBe("mentor");
      expect(result.data?.user.fullName).toBe("Test Mentor");
      expect(result.data?.user.email).toBe("mentor@test.com");
    });

    it("should handle demo mentor account", async () => {
      const result = await authManager.login({
        email: "mentor@example.com",
        password: "mentor123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.role).toBe("mentor");
      expect(result.data?.user.fullName).toBe("Demo Mentor");
      expect(result.data?.token).toBe("demo-token-demo-mentor");
    });

    it("should search both users and mentors endpoints", async () => {
      // Mock users endpoint to return empty
      mockFetchClient.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock mentors endpoint to return empty
      mockFetchClient.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await authManager.login({
        email: "notfound@test.com",
        password: "test123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email không tồn tại trong hệ thống");

      // Verify both endpoints were called
      expect(fetchClient.GET).toHaveBeenCalledWith("/api/users");
      expect(fetchClient.GET).toHaveBeenCalledWith("/api/mentors");
    });

    it("should handle user found in users endpoint", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Test User",
          email: "user@test.com",
          password: "test123",
          role: "USER",
        },
      ];

      mockFetchClient.mockResolvedValueOnce({
        data: mockUsers,
        error: null,
      });

      const result = await authManager.login({
        email: "user@test.com",
        password: "test123",
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.role).toBe("user");
      expect(result.data?.user.fullName).toBe("Test User");

      // Should only call users endpoint, not mentors
      expect(fetchClient.GET).toHaveBeenCalledTimes(1);
      expect(fetchClient.GET).toHaveBeenCalledWith("/api/users");
    });

    it("should handle incorrect password for mentor", async () => {
      const mockMentors = [
        {
          id: 1,
          name: "Test Mentor",
          email: "mentor@test.com",
          password: "test123",
          role: "MENTOR",
        },
      ];

      // Mock users endpoint to return empty
      mockFetchClient.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock mentors endpoint to return test mentor
      mockFetchClient.mockResolvedValueOnce({
        data: mockMentors,
        error: null,
      });

      const result = await authManager.login({
        email: "mentor@test.com",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Mật khẩu không chính xác");
    });
  });
});
