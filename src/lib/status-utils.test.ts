import { describe, expect, it } from "vitest";

import { getTransactionPurposeBadge } from "@/lib/status-utils";

describe("getTransactionPurposeBadge", () => {
  it("returns expected badge for membership purpose", () => {
    const badge = getTransactionPurposeBadge("BUY_MEMBERSHIP");

    expect(badge.label).toBe("Mua gói");
    expect(badge.variant).toBe("default");
  });

  it("returns expected badge for mentor interview purpose", () => {
    const badge = getTransactionPurposeBadge("MENTOR_INTERVIEW");

    expect(badge.label).toBe("Phiên mentor");
    expect(badge.variant).toBe("default");
  });

  it("returns fallback badge for unknown purpose", () => {
    const badge = getTransactionPurposeBadge("UNKNOWN");

    expect(badge.label).toBe("Chưa phân loại");
    expect(badge.variant).toBe("outline");
  });
});
