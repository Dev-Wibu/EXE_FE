/// <reference types="cypress" />

describe("Homepage", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept("GET", "**/api/**", {
      statusCode: 200,
      body: { traceId: "mock", data: [] },
    });
    cy.visit("/");
  });

  it("should load the homepage", () => {
    cy.url().should("include", "/");
  });

  it("should display navigation bar", () => {
    cy.get("nav").should("exist");
  });

  it("should have a login/signup link", () => {
    cy.contains(/login|đăng nhập|sign in/i).should("exist");
  });

  it("should have a signup link", () => {
    cy.contains(/signup|đăng ký|register|sign up/i).should("exist");
  });

  it("should display hero section", () => {
    cy.get("h1").should("exist");
  });

  it("should have feature sections", () => {
    cy.get("section").should("have.length.greaterThan", 1);
  });

  it("should navigate to login page", () => {
    cy.contains(/login|đăng nhập|sign in/i)
      .first()
      .click();
    cy.url().should("include", "/login");
  });

  it("should navigate to signup page", () => {
    cy.contains(/signup|đăng ký|register|sign up/i)
      .first()
      .click();
    cy.url().should("include", "/signup");
  });
});
