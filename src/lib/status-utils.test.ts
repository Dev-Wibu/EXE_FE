import i18n from "@/lib/i18n";
import { getMockInterviewStatusBadge, getSessionStatusBadge } from "@/lib/status-utils";
import { describe, expect, it } from "vitest";
const t = i18n.t.bind(i18n);
describe("getSessionStatusBadge", () => {
  it("returns expected badge for completed status", () => {
    const badge = getSessionStatusBadge("completed");
    expect(badge.variant).toBe("default");
  });
  it("returns fallback badge for unknown status", () => {
    const badge = getSessionStatusBadge("unknown");
    expect(badge.label).toBe(t("general.hollow"));
    expect(badge.variant).toBe("outline");
  });
});
describe("getMockInterviewStatusBadge", () => {
  it("returns expected badge for paid status", () => {
    const badge = getMockInterviewStatusBadge("paid");
    expect(badge.variant).toBe("default");
  });
});
