/// <reference types="cypress" />

describe("Payment — Success Page", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept("GET", "**/api/**", {
      statusCode: 200,
      body: { traceId: "mock", data: [] },
    });
    cy.intercept("POST", "**/api/**", {
      statusCode: 200,
      body: { traceId: "mock", data: {} },
    });
  });

  it("should load payment success page", () => {
    cy.visit("/payment/success?orderCode=12345&status=PAID");
    cy.url().should("include", "/payment/success");
  });

  it("should handle missing orderCode", () => {
    cy.visit("/payment/success");
    cy.url().should("include", "/payment/success");
  });

  it("should accept legacy /success URL", () => {
    cy.visit("/success?status=PAID");
    cy.url().should("include", "/success");
  });
});

describe("Payment — Cancel Page", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept("GET", "**/api/**", {
      statusCode: 200,
      body: { traceId: "mock", data: [] },
    });
  });

  it("should load payment cancel page", () => {
    cy.visit("/payment/cancel");
    cy.url().should("include", "/payment/cancel");
  });

  it("should display cancel message", () => {
    cy.visit("/payment/cancel");
    cy.contains(/cancel|hủy|thất bại|failed|unpaid/i).should("exist");
  });

  it("should accept legacy /cancel URL", () => {
    cy.visit("/cancel");
    cy.url().should("include", "/cancel");
  });
});
