/// <reference types="cypress" />

describe("Messenger Page", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.login("USER");
    cy.interceptCommonAPIs();
    cy.intercept("GET", "**/api/**", {
      statusCode: 200,
      body: { traceId: "mock", data: [] },
    });
  });

  it("should load messenger page", () => {
    cy.visit("/user?tab=messenger");
    cy.url().should("include", "tab=messenger");
  });

  it("should display chat composer", () => {
    cy.visit("/user?tab=messenger");
    cy.get('input[type="text"], textarea, [contenteditable="true"]').should("exist");
  });
});
