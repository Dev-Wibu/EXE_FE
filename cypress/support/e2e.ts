/// <reference types="cypress" />

// =============================================
// CUSTOM COMMANDS
// =============================================

/**
 * Simulate login by setting auth state in localStorage.
 * Loads user data from fixture and writes to auth-storage key.
 */
Cypress.Commands.add("login", (role: "USER" | "ADMIN" | "MENTOR" | "STAFF") => {
  const fixtureMap: Record<string, string> = {
    USER: "users/user",
    ADMIN: "users/admin",
    MENTOR: "users/mentor",
    STAFF: "users/staff",
  };

  cy.fixture(fixtureMap[role]).then((user) => {
    const authState = {
      state: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar || null,
        },
        token: `mock-jwt-token-${role.toLowerCase()}`,
        isLoggedIn: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      version: 0,
    };

    window.localStorage.setItem("auth-storage", JSON.stringify(authState));
    window.localStorage.setItem("current-user-id", String(user.id));
  });
});

/**
 * Logout by clearing auth state from localStorage.
 */
Cypress.Commands.add("logout", () => {
  window.localStorage.removeItem("auth-storage");
  window.localStorage.removeItem("current-user-id");
});

/**
 * Assert that the current URL contains a specific path.
 */
Cypress.Commands.add("assertPath", (path: string) => {
  cy.url().should("include", path);
});

/**
 * Assert that a toast notification appears with specific text.
 */
Cypress.Commands.add("assertToast", (text: string | RegExp) => {
  cy.get("[data-sonner-toaster]", { timeout: 10000 })
    .should("exist")
    .within(() => {
      cy.contains(text).should("exist");
    });
});

/**
 * Intercept all common API calls that most pages need.
 * Includes notification polling and user profile fetch.
 */
Cypress.Commands.add("interceptCommonAPIs", () => {
  // Notifications polling (every 15s)
  cy.intercept("GET", "**/api/notifications/user/*", {
    fixture: "api/notifications-empty.json",
  }).as("getNotifications");

  // User profile
  cy.intercept("GET", "**/api/users/*", {
    fixture: "users/user.json",
  }).as("getUser");
});

/**
 * Set a specific tab in the dashboard URL.
 */
Cypress.Commands.add("switchTab", (dashboardPath: string, tabKey: string) => {
  cy.visit(`${dashboardPath}?tab=${tabKey}`);
});

// =============================================
// TYPE DECLARATIONS
// =============================================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(_role: "USER" | "ADMIN" | "MENTOR" | "STAFF"): Chainable<void>;
      logout(): Chainable<void>;
      assertPath(_path: string): Chainable<void>;
      assertToast(_text: string | RegExp): Chainable<void>;
      interceptCommonAPIs(): Chainable<void>;
      switchTab(_dashboardPath: string, _tabKey: string): Chainable<void>;
    }
  }
}

export {};
