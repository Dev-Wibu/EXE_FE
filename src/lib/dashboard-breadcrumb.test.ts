import i18n from "@/lib/i18n";
import { describe, expect, it } from "vitest";
import {
  buildDashboardBreadcrumbItems,
  formatBreadcrumbLabelWithPrefix,
  getDashboardNestedRouteLabel,
  getDashboardRouteMatch,
  getDashboardTabFromPath,
  normalizeDashboardPath,
} from "./dashboard-breadcrumb";
const t = i18n.t.bind(i18n);
describe("dashboard-breadcrumb", () => {
  it(t("general.createABasicBreadcrumbFor"), () => {
    const items = buildDashboardBreadcrumbItems({
      role: "user",
      pathname: "/user",
      activeTab: "homeFeed",
      availableTabs: [
        {
          type: "homeFeed",
          label: t("common.home"),
        },
      ],
      t,
    });
    expect(items).toEqual([
      {
        label: t("common.user"),
        href: "/user?tab=homeFeed",
        kind: "root",
      },
      {
        label: t("common.home"),
        kind: "tab",
      },
    ]);
  });
  it(t("general.inferTheCorrectTabFrom"), () => {
    const tab = getDashboardTabFromPath({
      role: "mentor",
      pathname: "/mentor/sessions/123/review",
      defaultTab: "overview",
      t,
    });
    expect(tab).toBe("sessions");
  });
  it(t("general.nestedLabelOverrideIsPreferred"), () => {
    const items = buildDashboardBreadcrumbItems({
      role: "mentor",
      pathname: "/mentor/sessions/123",
      activeTab: "sessions",
      availableTabs: [
        {
          type: "sessions",
          label: t("common.interviewSession"),
        },
      ],
      nestedLabelOverride: t("general.sessionSession1776232524937"),
      t,
    });
    expect(items.at(-1)).toEqual({
      label: t("general.sessionSession1776232524937"),
      kind: "detail",
    });
  });
  it(t("general.returnsRouteMetadataWithDynamic"), () => {
    const routeMatch = getDashboardRouteMatch("user", "/user/mentors/42", t);
    expect(routeMatch).toEqual({
      label: t("general.mentorProfile"),
      tabType: "mentors",
      variant: undefined,
      routeParams: {
        mentorId: "42",
      },
      dynamic: {
        resource: "mentor",
        id: 42,
        rawId: "42",
        prefix: "Mentor",
      },
    });
  });
  it(t("general.returnsTheRouteVariantAnd"), () => {
    const routeMatch = getDashboardRouteMatch(
      "user",
      "/user/practice/session/9/1/quiz/11/result",
      t
    );
    expect(routeMatch).toEqual({
      label: t("general.testResults"),
      tabType: "practice",
      variant: "practiceQuizResult",
      routeParams: {
        sessionId: "9",
        practiceSetId: "1",
        quizId: "11",
      },
      dynamic: {
        resource: "quizSet",
        id: 11,
        rawId: "11",
        prefix: t("common.result"),
      },
    });
  });
  it(t("general.prefersTheDetailLabelsString"), () => {
    const items = buildDashboardBreadcrumbItems({
      role: "user",
      pathname: "/user/practice/session/9/1/quiz/11/result",
      activeTab: "practice",
      availableTabs: [
        {
          type: "practice",
          label: t("common.trainingSet"),
        },
      ],
      detailLabelsOverride: [
        {
          label: t("general.roadmapSession9"),
          href: "/user/practice/session/9",
        },
        {
          label: t("general.testDay3"),
        },
        {
          label: t("common.result"),
        },
      ],
      t,
    });
    expect(items).toEqual([
      {
        label: t("common.user"),
        href: "/user?tab=homeFeed",
        kind: "root",
      },
      {
        label: t("common.trainingSet"),
        href: "/user?tab=practice",
        kind: "tab",
      },
      {
        label: t("general.roadmapSession9"),
        href: "/user/practice/session/9",
        kind: "detail",
      },
      {
        label: t("general.testDay3"),
        kind: "detail",
      },
      {
        label: t("common.result"),
        kind: "detail",
      },
    ]);
  });
  it(t("general.sanitizeThePrefixWhenValue"), () => {
    expect(formatBreadcrumbLabelWithPrefix(t("general.test"), t("general.testDay3"))).toBe(
      t("general.testDay3")
    );
    expect(formatBreadcrumbLabelWithPrefix(t("common.route"), "session-1776220472420")).toBe(
      t("general.routeSession1776220472420")
    );
  });
  it(t("general.friendlyFallbackLabelWhenRoute"), () => {
    const nestedLabel = getDashboardNestedRouteLabel("user", "/user/custom-route-name", t);
    expect(nestedLabel).toBe("Custom Route Name");
  });
});

describe("normalizeDashboardPath", () => {
  it("returns '/' for empty string", () => {
    expect(normalizeDashboardPath("")).toBe("/");
  });

  it("strips trailing slash from path", () => {
    expect(normalizeDashboardPath("/user/sessions/")).toBe("/user/sessions");
  });

  it("does not strip slash from root path", () => {
    expect(normalizeDashboardPath("/")).toBe("/");
  });

  it("returns path unchanged when no trailing slash", () => {
    expect(normalizeDashboardPath("/user/sessions")).toBe("/user/sessions");
  });
});

describe("dashboard-breadcrumb — mentor routes", () => {
  it("matches mentor session room route", () => {
    const routeMatch = getDashboardRouteMatch("mentor", "/mentor/sessions/room/42", t);
    expect(routeMatch?.tabType).toBe("sessions");
    expect(routeMatch?.dynamic?.resource).toBe("session");
    expect(routeMatch?.dynamic?.id).toBe(42);
  });

  it("matches mentor reviews route", () => {
    const routeMatch = getDashboardRouteMatch("mentor", "/mentor/reviews/99", t);
    expect(routeMatch?.tabType).toBe("reviews");
    expect(routeMatch?.dynamic?.resource).toBe("mentorReview");
    expect(routeMatch?.dynamic?.id).toBe(99);
  });

  it("matches mentor students route", () => {
    const routeMatch = getDashboardRouteMatch("mentor", "/mentor/students/7", t);
    expect(routeMatch?.tabType).toBe("students");
    expect(routeMatch?.dynamic?.resource).toBe("user");
    expect(routeMatch?.dynamic?.id).toBe(7);
  });

  it("returns null for unknown mentor route", () => {
    expect(getDashboardRouteMatch("mentor", "/mentor/unknown/123", t)).toBeNull();
  });

  it("infers correct tab for mentor session room", () => {
    const tab = getDashboardTabFromPath({
      role: "mentor",
      pathname: "/mentor/sessions/room/42",
      defaultTab: "overview",
      t,
    });
    expect(tab).toBe("sessions");
  });

  it("infers correct tab for mentor students", () => {
    const tab = getDashboardTabFromPath({
      role: "mentor",
      pathname: "/mentor/students/7",
      defaultTab: "overview",
      t,
    });
    expect(tab).toBe("students");
  });
});

describe("dashboard-breadcrumb — empty tabs fallback", () => {
  it("uses fallback label when availableTabs is empty", () => {
    const items = buildDashboardBreadcrumbItems({
      role: "user",
      pathname: "/user",
      activeTab: "unknown",
      availableTabs: [],
      t,
    });
    // When no tab matches, getTabLabel returns t("common.page") as fallback
    expect(items[1].label).toBe(t("common.page"));
  });
});

describe("dashboard-breadcrumb — detailLabelsOverride dedup", () => {
  it("deduplicates detail labels with same label and href", () => {
    const items = buildDashboardBreadcrumbItems({
      role: "user",
      pathname: "/user/practice/session/9",
      activeTab: "practice",
      availableTabs: [{ type: "practice", label: t("common.trainingSet") }],
      detailLabelsOverride: [
        { label: "Session 9", href: "/user/practice/session/9" },
        { label: "Session 9", href: "/user/practice/session/9" }, // duplicate
      ],
      t,
    });
    // Should only have root + tab + 1 detail (not 2)
    const detailItems = items.filter((item) => item.kind === "detail");
    expect(detailItems).toHaveLength(1);
  });

  it("skips detail label that matches activeTab label", () => {
    const items = buildDashboardBreadcrumbItems({
      role: "user",
      pathname: "/user/practice/session/9",
      activeTab: "practice",
      availableTabs: [{ type: "practice", label: "Practice" }],
      detailLabelsOverride: ["Practice"], // same as tab label
      t,
    });
    // "Practice" matches activeTabLabel → skipped
    const detailItems = items.filter((item) => item.kind === "detail");
    expect(detailItems).toHaveLength(0);
  });

  it("skips empty/whitespace detail labels", () => {
    const items = buildDashboardBreadcrumbItems({
      role: "user",
      pathname: "/user/practice/session/9",
      activeTab: "practice",
      availableTabs: [{ type: "practice", label: t("common.trainingSet") }],
      detailLabelsOverride: ["  ", "Valid Label"],
      t,
    });
    const detailItems = items.filter((item) => item.kind === "detail");
    expect(detailItems).toHaveLength(1);
    expect(detailItems[0].label).toBe("Valid Label");
  });
});

describe("dashboard-breadcrumb — route dynamic ID parsing", () => {
  it("returns undefined id for non-numeric segment", () => {
    const routeMatch = getDashboardRouteMatch("user", "/user/mentors/abc-def-ghi", t);
    // "abc-def-ghi" is not a positive integer, but passes the UUID-like pattern (>=8 chars hex)
    // toPositiveInteger("abc-def-ghi") → NaN → undefined
    expect(routeMatch?.dynamic?.rawId).toBe("abc-def-ghi");
  });

  it("returns null for completely unmatched user path", () => {
    expect(getDashboardRouteMatch("user", "/user/unknown/route", t)).toBeNull();
  });
});
