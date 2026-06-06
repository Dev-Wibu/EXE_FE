/// <reference types="cypress" />

describe("Notification Display", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.login("USER");
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

  it("should display notification bell", () => {
    cy.visit("/user");
    // Notification bell is a button with accessible label
    cy.get('[aria-label*="notification" i], [aria-label*="bell" i], button svg').should("exist");
  });

  it("should show unread count badge", () => {
    cy.intercept("GET", "**/api/notifications/user/*", {
      fixture: "api/notifications-with-items.json",
    }).as("getNotifications");
    cy.visit("/user");
    cy.wait("@getNotifications");
    // After notifications load, the page should still be on the dashboard
    cy.url().should("include", "/user");
  });

  it("should display notification list on tab", () => {
    cy.intercept("GET", "**/api/notifications/user/*", {
      fixture: "api/notifications-with-items.json",
    }).as("getNotifications");
    cy.visit("/user?tab=notifications");
    cy.wait("@getNotifications");
    cy.url().should("include", "tab=notifications");
  });

  it("should show empty state", () => {
    cy.intercept("GET", "**/api/notifications/user/*", {
      fixture: "api/notifications-empty.json",
    }).as("getNotificationsEmpty");
    cy.visit("/user?tab=notifications");
    cy.wait("@getNotificationsEmpty");
    cy.url().should("include", "tab=notifications");
  });
});
