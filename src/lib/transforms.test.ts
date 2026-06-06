import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractRole,
  normalizePhone,
  transformMentorCreateRequest,
  transformMentorUpdateRequest,
  transformSessionCreateRequest,
  transformSessionUpdateRequest,
  transformUserCreateRequest,
  transformUserUpdateRequest,
  validateEmail,
  validatePhone,
} from "./transforms";

vi.mock("@/constants/majors", () => ({
  normalizeMajor: (major?: string) => (major ? major.trim().toLowerCase() : undefined),
}));

describe("transformUserCreateRequest", () => {
  it("trims and maps fields correctly", () => {
    const result = transformUserCreateRequest({
      name: "  John  ",
      email: "  john@test.com  ",
      password: "  pass123  ",
      university: "  FPT  ",
      major: "  CS  ",
    });
    expect(result).toEqual({
      name: "John",
      email: "john@test.com",
      password: "pass123",
      university: "FPT",
      major: "cs",
    });
  });

  it("handles undefined optional fields", () => {
    const result = transformUserCreateRequest({ name: "A", email: "a@b.com" });
    expect(result.password).toBeUndefined();
    expect(result.university).toBeUndefined();
    expect(result.major).toBeUndefined();
  });

  it("handles undefined name and email gracefully", () => {
    const result = transformUserCreateRequest({
      name: undefined as never,
      email: undefined as never,
    });
    expect(result.name).toBeUndefined();
    expect(result.email).toBeUndefined();
  });
});

describe("transformUserUpdateRequest", () => {
  it("merges with existing user when formData fields are empty", () => {
    const existing = {
      id: 1,
      name: "Old",
      email: "old@test.com",
      role: "USER" as const,
      university: "OldUni",
      major: "CNTT" as const,
      avatar: null,
      status: "ACTIVE",
      createdAt: "",
      updatedAt: "",
    };
    const result = transformUserUpdateRequest(1, {}, existing);
    expect(result.name).toBe("Old");
    expect(result.email).toBe("old@test.com");
  });

  it("overrides existing user fields when formData provides values", () => {
    const existing = {
      id: 1,
      name: "Old",
      email: "old@test.com",
      role: "USER" as const,
      university: "OldUni",
      major: "CNTT" as const,
      avatar: null,
      status: "ACTIVE",
      createdAt: "",
      updatedAt: "",
    };
    const result = transformUserUpdateRequest(1, { name: "New" }, existing);
    expect(result.name).toBe("New");
  });

  it("handles undefined existingUser", () => {
    const result = transformUserUpdateRequest(1, { name: "OnlyNew" });
    expect(result.name).toBe("OnlyNew");
    expect(result.email).toBeUndefined();
  });
});

describe("transformMentorCreateRequest", () => {
  it("trims and maps all mentor fields", () => {
    const result = transformMentorCreateRequest({
      name: "  Mentor  ",
      email: "  m@test.com  ",
      password: "  pass  ",
      bio: "  bio  ",
      expertise: "  React  ",
      yearsOfExperience: 5,
      linkedInUrl: "  https://linkedin.com  ",
      currentCompany: "  Google  ",
      pricePerMinute: 100,
    });
    expect(result.name).toBe("Mentor");
    expect(result.email).toBe("m@test.com");
    expect(result.bio).toBe("bio");
    expect(result.expertise).toBe("React");
    expect(result.yearsOfExperience).toBe(5);
    expect(result.pricePerMinute).toBe(100);
  });
});

describe("transformMentorUpdateRequest", () => {
  it("uses existing mentor values as fallback", () => {
    const existing = {
      id: 1,
      name: "Old",
      email: "old@test.com",
      bio: "old bio",
      expertise: "Java",
      yearsOfExperience: 3,
      linkedInUrl: "https://old.com",
      currentCompany: "OldCo",
      pricePerMinute: 50,
      avatar: null,
      status: "ACTIVE",
      createdAt: "",
      updatedAt: "",
    };
    const result = transformMentorUpdateRequest(1, {}, existing);
    expect(result.name).toBe("Old");
    expect(result.yearsOfExperience).toBe(3);
  });

  it("uses nullish coalescing for numeric fields", () => {
    const existing = {
      id: 1,
      name: "M",
      email: "m@t.com",
      bio: "b",
      expertise: "e",
      yearsOfExperience: 3,
      linkedInUrl: "l",
      currentCompany: "c",
      pricePerMinute: 50,
      avatar: null,
      status: "ACTIVE",
      createdAt: "",
      updatedAt: "",
    };
    const result = transformMentorUpdateRequest(
      1,
      { yearsOfExperience: 0, pricePerMinute: 0 },
      existing
    );
    expect(result.yearsOfExperience).toBe(0);
    expect(result.pricePerMinute).toBe(0);
  });
});

describe("transformSessionCreateRequest", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a session request with default room name", () => {
    const result = transformSessionCreateRequest({ userId: 1, mentorId: 2 });
    expect(result.userId).toBe(1);
    expect(result.mentorId).toBe(2);
    expect(result.dailyCoCreationRequest.privacy).toBe("private");
    expect(result.dailyCoCreationRequest.properties.max_participants).toBe(2);
    // Verify the room name uses the timestamp-based default (2026-01-01T00:00:00Z = 1767225600000)
    expect(result.dailyCoCreationRequest.name).toBe("session-1767225600000");
  });

  it("uses custom roomName when provided", () => {
    const result = transformSessionCreateRequest({
      userId: 1,
      mentorId: 2,
      roomName: "custom-room",
    });
    expect(result.dailyCoCreationRequest.name).toBe("custom-room");
  });
});

describe("transformSessionUpdateRequest", () => {
  it("merges formData over existingSession", () => {
    const existing = {
      id: 1,
      status: "ACTIVE" as const,
      roomName: "old-room",
    } as never;
    const result = transformSessionUpdateRequest(1, { status: "COMPLETED" as never }, existing);
    expect(result.id).toBe(1);
    expect(result.status).toBe("COMPLETED");
    expect(result.roomName).toBe("old-room");
  });

  it("works without existingSession", () => {
    const result = transformSessionUpdateRequest(5, { status: "ACTIVE" as never });
    expect(result.id).toBe(5);
    expect(result.status).toBe("ACTIVE");
  });

  it("formData fields override existingSession fields", () => {
    const existing = {
      id: 1,
      status: "PENDING" as const,
      roomName: "room-a",
    } as never;
    const result = transformSessionUpdateRequest(
      1,
      { status: "REJECTED" as never, roomName: "room-b" },
      existing
    );
    expect(result.status).toBe("REJECTED");
    expect(result.roomName).toBe("room-b");
  });
});

describe("validateEmail", () => {
  it("returns true for valid emails", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("a.b@c.co")).toBe(true);
  });

  it("returns false for invalid emails", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("@no-local.com")).toBe(false);
    expect(validateEmail("no-at-sign.com")).toBe(false);
  });
});

describe("validatePhone", () => {
  it("returns true for valid Vietnamese phone numbers", () => {
    expect(validatePhone("0912345678")).toBe(true);
    expect(validatePhone("+84912345678")).toBe(true);
    expect(validatePhone("091 234 5678")).toBe(true);
  });

  it("returns false for invalid phone numbers", () => {
    expect(validatePhone("123")).toBe(false);
    expect(validatePhone("abcdefghij")).toBe(false);
    expect(validatePhone("")).toBe(false);
  });

  it("returns false for 11 digits after 0 (too long)", () => {
    expect(validatePhone("091234567890")).toBe(false);
  });

  it("returns false for 8 digits after 0 (too short)", () => {
    expect(validatePhone("091234567")).toBe(false);
  });

  it("strips spaces before validation", () => {
    expect(validatePhone("+84 912 345 678")).toBe(true);
  });
});

describe("normalizePhone", () => {
  it("converts +84 prefix to 0", () => {
    expect(normalizePhone("+84912345678")).toBe("0912345678");
  });

  it("returns trimmed number as-is if no +84", () => {
    expect(normalizePhone("0912345678")).toBe("0912345678");
  });

  it("removes spaces", () => {
    expect(normalizePhone(" 091 234 5678 ")).toBe("0912345678");
  });
});

describe("extractRole", () => {
  it("returns USER for empty/null arrays", () => {
    expect(extractRole([])).toBe("USER");
    expect(extractRole(null as unknown as unknown[])).toBe("USER");
    expect(extractRole(undefined as unknown as unknown[])).toBe("USER");
  });

  it("extracts role from plain string", () => {
    expect(extractRole(["ADMIN"])).toBe("ADMIN");
    expect(extractRole(["MENTOR"])).toBe("MENTOR");
    expect(extractRole(["STAFF"])).toBe("STAFF");
  });

  it("strips ROLE_ prefix", () => {
    expect(extractRole(["ROLE_ADMIN"])).toBe("ADMIN");
    expect(extractRole(["ROLE_USER"])).toBe("USER");
  });

  it("extracts from authority object format", () => {
    expect(extractRole([{ authority: "ROLE_MENTOR" }])).toBe("MENTOR");
  });

  it("extracts from role/name object format", () => {
    expect(extractRole([{ role: "STAFF" }])).toBe("STAFF");
    expect(extractRole([{ name: "ADMIN" }])).toBe("ADMIN");
  });

  it("defaults to USER for unknown roles", () => {
    expect(extractRole(["UNKNOWN"])).toBe("USER");
    expect(extractRole([123])).toBe("USER");
  });

  it("only reads the first element of array", () => {
    expect(extractRole(["ADMIN", "USER"])).toBe("ADMIN");
    expect(extractRole(["USER", "ADMIN"])).toBe("USER");
  });

  it("authority takes precedence over role and name in object", () => {
    expect(extractRole([{ authority: "ROLE_ADMIN", role: "USER", name: "STAFF" }])).toBe("ADMIN");
  });

  it("falls through empty string authority to role", () => {
    expect(extractRole([{ authority: "", role: "MENTOR" }])).toBe("MENTOR");
  });

  it("falls through empty string authority and role to name", () => {
    expect(extractRole([{ authority: "", role: "", name: "STAFF" }])).toBe("STAFF");
  });

  it("returns USER for object with no recognized properties", () => {
    expect(extractRole([{ unknown: "value" }])).toBe("USER");
  });

  it("returns USER for non-string, non-object role (number)", () => {
    expect(extractRole([42])).toBe("USER");
  });
});
