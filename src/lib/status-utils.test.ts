import i18n from "@/lib/i18n";
import {
  getContentStatusBadge,
  getJobDescriptionLevelBadge,
  getJobDescriptionStatusBadge,
  getMentorApplicationBadge,
  getMockInterviewStatusBadge,
  getPostStatusBadge,
  getSessionStatusBadge,
} from "@/lib/status-utils";
import { describe, expect, it } from "vitest";
const t = i18n.t.bind(i18n);

// ---------------------------------------------------------------------------
// getSessionStatusBadge
// ---------------------------------------------------------------------------
describe("getSessionStatusBadge", () => {
  it("returns DRAFT badge with amber styling", () => {
    const badge = getSessionStatusBadge("DRAFT");
    expect(badge.variant).toBe("outline");
    expect(badge.className).toContain("amber");
  });

  it("returns SCHEDULED badge", () => {
    const badge = getSessionStatusBadge("SCHEDULED");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("yellow");
  });

  it("returns PAID badge", () => {
    const badge = getSessionStatusBadge("PAID");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("emerald");
  });

  it("returns ONGOING badge", () => {
    const badge = getSessionStatusBadge("ONGOING");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("blue");
  });

  it("returns COMPLETED badge", () => {
    const badge = getSessionStatusBadge("completed");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("green");
  });

  it("returns CANCELED badge", () => {
    const badge = getSessionStatusBadge("CANCELED");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("red");
  });

  it("returns REJECTED badge", () => {
    const badge = getSessionStatusBadge("REJECTED");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("rose");
  });

  it("handles case-insensitive status", () => {
    const badge = getSessionStatusBadge("paid");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("emerald");
  });

  it("returns fallback for unknown status", () => {
    const badge = getSessionStatusBadge("UNKNOWN_STATUS");
    expect(badge.variant).toBe("outline");
    expect(badge.label).toBe("UNKNOWN_STATUS");
    expect(badge.className).toBeUndefined();
  });

  it("returns translated fallback for undefined", () => {
    const badge = getSessionStatusBadge(undefined);
    expect(badge.variant).toBe("outline");
    expect(badge.label).toBe(t("general.hollow"));
  });

  it("returns translated fallback for empty string", () => {
    const badge = getSessionStatusBadge("");
    expect(badge.label).toBe(t("general.hollow"));
    expect(badge.variant).toBe("outline");
  });
});

// ---------------------------------------------------------------------------
// getPostStatusBadge
// ---------------------------------------------------------------------------
describe("getPostStatusBadge", () => {
  it("returns DRAFT badge", () => {
    const badge = getPostStatusBadge("DRAFT");
    expect(badge.variant).toBe("outline");
    expect(badge.className).toContain("yellow");
  });

  it("returns PUBLISHED badge", () => {
    const badge = getPostStatusBadge("PUBLISHED");
    expect(badge.variant).toBe("outline");
    expect(badge.className).toContain("green");
  });

  it("returns ARCHIVED badge", () => {
    const badge = getPostStatusBadge("ARCHIVED");
    expect(badge.variant).toBe("outline");
    expect(badge.className).toContain("gray");
  });

  it("returns fallback for unknown status", () => {
    const badge = getPostStatusBadge("UNKNOWN");
    expect(badge.variant).toBe("outline");
    expect(badge.label).toBe("UNKNOWN");
  });

  it("returns translated fallback for undefined", () => {
    const badge = getPostStatusBadge(undefined);
    expect(badge.label).toBe(t("general.hollow"));
  });
});

// ---------------------------------------------------------------------------
// getContentStatusBadge
// ---------------------------------------------------------------------------
describe("getContentStatusBadge", () => {
  it("returns pending badge (waiting for approval)", () => {
    const badge = getContentStatusBadge("pending");
    expect(badge.variant).toBe("secondary");
  });

  it("returns approved badge", () => {
    const badge = getContentStatusBadge("approved");
    expect(badge.variant).toBe("outline");
    expect(badge.className).toContain("green");
  });

  it("returns rejected badge", () => {
    const badge = getContentStatusBadge("rejected");
    expect(badge.variant).toBe("outline");
    expect(badge.className).toContain("red");
  });

  it("handles case-insensitive status", () => {
    const badge = getContentStatusBadge("PENDING");
    expect(badge.variant).toBe("secondary");
  });

  it("returns fallback for unknown status", () => {
    const badge = getContentStatusBadge("unknown");
    expect(badge.variant).toBe("outline");
    expect(badge.label).toBe("unknown");
  });

  it("returns translated fallback for undefined", () => {
    const badge = getContentStatusBadge(undefined);
    expect(badge.label).toBe(t("general.hollow"));
  });
});

// ---------------------------------------------------------------------------
// getMentorApplicationBadge
// ---------------------------------------------------------------------------
describe("getMentorApplicationBadge", () => {
  it("returns approved badge for active", () => {
    const badge = getMentorApplicationBadge(true);
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("green");
  });

  it("returns waiting badge for inactive", () => {
    const badge = getMentorApplicationBadge(false);
    expect(badge.variant).toBe("outline");
    expect(badge.className).toContain("yellow");
  });
});

// ---------------------------------------------------------------------------
// getMockInterviewStatusBadge
// ---------------------------------------------------------------------------
describe("getMockInterviewStatusBadge", () => {
  it("returns paid badge", () => {
    const badge = getMockInterviewStatusBadge("paid");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("emerald");
  });

  it("returns ongoing badge", () => {
    const badge = getMockInterviewStatusBadge("ongoing");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("emerald");
  });

  it("returns upcoming badge", () => {
    const badge = getMockInterviewStatusBadge("upcoming");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("sky");
  });

  it("returns scheduled badge (same as upcoming)", () => {
    const badge = getMockInterviewStatusBadge("scheduled");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("sky");
  });

  it("handles case-insensitive status", () => {
    const badge = getMockInterviewStatusBadge("PAID");
    expect(badge.variant).toBe("default");
  });

  it("returns fallback for unknown status", () => {
    const badge = getMockInterviewStatusBadge("unknown");
    expect(badge.variant).toBe("outline");
    expect(badge.label).toBe("unknown");
  });

  it("returns translated fallback for undefined", () => {
    const badge = getMockInterviewStatusBadge(undefined);
    expect(badge.label).toBe(t("general.hollow"));
  });
});

// ---------------------------------------------------------------------------
// getJobDescriptionStatusBadge
// ---------------------------------------------------------------------------
describe("getJobDescriptionStatusBadge", () => {
  it("returns OPEN badge", () => {
    const badge = getJobDescriptionStatusBadge("OPEN");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("emerald");
  });

  it("returns CLOSED badge", () => {
    const badge = getJobDescriptionStatusBadge("CLOSED");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("red");
  });

  it("returns DRAFT badge", () => {
    const badge = getJobDescriptionStatusBadge("DRAFT");
    expect(badge.variant).toBe("outline");
    expect(badge.className).toContain("amber");
  });

  it("handles case-insensitive status", () => {
    const badge = getJobDescriptionStatusBadge("open");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("emerald");
  });

  it("returns fallback for unknown status", () => {
    const badge = getJobDescriptionStatusBadge("UNKNOWN");
    expect(badge.variant).toBe("outline");
    expect(badge.label).toBe("UNKNOWN");
  });

  it("returns translated fallback for undefined", () => {
    const badge = getJobDescriptionStatusBadge(undefined);
    expect(badge.label).toBe(t("general.hollow"));
  });
});

// ---------------------------------------------------------------------------
// getJobDescriptionLevelBadge
// ---------------------------------------------------------------------------
describe("getJobDescriptionLevelBadge", () => {
  it("returns INTERN badge", () => {
    const badge = getJobDescriptionLevelBadge("INTERN");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("gray");
  });

  it("returns FRESHER badge", () => {
    const badge = getJobDescriptionLevelBadge("FRESHER");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("green");
  });

  it("returns JUNIOR badge", () => {
    const badge = getJobDescriptionLevelBadge("JUNIOR");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("blue");
  });

  it("returns MIDDLE badge", () => {
    const badge = getJobDescriptionLevelBadge("MIDDLE");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("purple");
  });

  it("handles case-insensitive level", () => {
    const badge = getJobDescriptionLevelBadge("junior");
    expect(badge.variant).toBe("default");
    expect(badge.className).toContain("blue");
  });

  it("returns fallback for unknown level", () => {
    const badge = getJobDescriptionLevelBadge("SENIOR");
    expect(badge.variant).toBe("outline");
    expect(badge.label).toBe("SENIOR");
  });

  it("returns translated fallback for undefined", () => {
    const badge = getJobDescriptionLevelBadge(undefined);
    expect(badge.label).toBe(t("general.hollow"));
    expect(badge.variant).toBe("outline");
  });

  it("returns translated fallback for empty string", () => {
    const badge = getJobDescriptionLevelBadge("");
    expect(badge.label).toBe(t("general.hollow"));
  });
});
