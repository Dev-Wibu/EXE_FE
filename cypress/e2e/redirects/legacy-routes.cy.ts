/// <reference types="cypress" />

describe("Legacy Route Redirects", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.interceptCommonAPIs();
    cy.intercept("GET", "**/api/**", {
      statusCode: 200,
      body: { traceId: "mock", data: [] },
    });
    cy.intercept("POST", "**/api/**", {
      statusCode: 200,
      body: { traceId: "mock", data: {} },
    });
  });

  // --- User legacy redirects ---
  const userRedirects = [
    { old: "/dashboard", expected: "/user" },
    { old: "/dashboard/mock-interview", expected: "/user" },
    { old: "/dashboard/feedback", expected: "/user" },
    { old: "/dashboard/ai-interview", expected: "/user" },
    { old: "/dashboard/practice", expected: "/user" },
    { old: "/dashboard/notifications", expected: "/user" },
    { old: "/dashboard/account", expected: "/user" },
  ];

  userRedirects.forEach(({ old, expected }) => {
    it(`should redirect ${old} to ${expected}`, () => {
      cy.login("USER");
      cy.visit(old, { failOnStatusCode: false });
      cy.url().should("include", expected);
    });
  });

  // --- Mentor legacy redirects ---
  const mentorRedirects = [
    { old: "/mentor-dashboard", expected: "/mentor" },
    { old: "/mentor-dashboard/sessions", expected: "/mentor" },
  ];

  mentorRedirects.forEach(({ old, expected }) => {
    it(`should redirect ${old} to ${expected}`, () => {
      cy.login("MENTOR");
      cy.visit(old, { failOnStatusCode: false });
      cy.url().should("include", expected);
    });
  });

  // --- Admin legacy redirects ---
  const adminRedirects = [
    { old: "/admin/dashboard", expected: "/admin" },
    { old: "/admin/mentors", expected: "/admin" },
    { old: "/admin/users", expected: "/admin" },
    { old: "/admin/sessions", expected: "/admin" },
  ];

  adminRedirects.forEach(({ old, expected }) => {
    it(`should redirect ${old} to ${expected}`, () => {
      cy.login("ADMIN");
      cy.visit(old, { failOnStatusCode: false });
      cy.url().should("include", expected);
    });
  });
});
