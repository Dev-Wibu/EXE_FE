/// <reference types="cypress" />

describe("Responsive — Mobile Viewport", () => {
  beforeEach(() => {
    cy.viewport(375, 667);
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.interceptCommonAPIs();
    cy.intercept("GET", "**/api/**", {
      statusCode: 200,
      body: { traceId: "mock", data: [] },
    });
  });

  it("should render homepage on mobile", () => {
    cy.visit("/");
    cy.url().should("include", "/");
    // Page should not have horizontal overflow
    cy.document().then((doc) => {
      expect(doc.body.scrollWidth).to.be.at.most(doc.documentElement.clientWidth + 1);
    });
  });

  it("should show mobile navigation", () => {
    cy.visit("/");
    // Mobile nav uses a button with menu/navigation aria-label
    cy.get('button[aria-label*="menu" i], button[aria-label*="navigation" i]').should("exist");
  });

  it("should render login on mobile", () => {
    cy.visit("/login");
    cy.get('input[type="email"], input[name="email"], input[placeholder*="email" i]').should(
      "exist"
    );
    cy.get('input[type="password"], input[name="password"]').should("exist");
    cy.get('button[type="submit"]').should("exist");
  });

  it("should render dashboard on mobile", () => {
    cy.login("USER");
    cy.visit("/user");
    cy.url().should("include", "/user");
  });
});
