/// <reference types="cypress" />

describe("Error Pages", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept("GET", "**/api/**", {
      statusCode: 200,
      body: { traceId: "mock", data: [] },
    });
  });

  const errorPages = [
    { path: "/error/401", content: /unauthorized|không được phép|401/i },
    { path: "/error/403", content: /forbidden|bị cấm|403|truy cập bị từ chối/i },
    { path: "/error/404", content: /not found|không tìm thấy|404/i },
    { path: "/error/500", content: /server error|lỗi máy chủ|500/i },
    { path: "/error/503", content: /service unavailable|dịch vụ không khả dụng|503/i },
    { path: "/error/504", content: /gateway timeout|hết thời gian|504/i },
  ];

  errorPages.forEach(({ path, content }) => {
    it(`should display error page at ${path}`, () => {
      cy.visit(path, { failOnStatusCode: false });
      cy.url().should("include", path);
      cy.contains(content).should("exist");
    });
  });

  it("should show 404 for unknown routes", () => {
    cy.visit("/this-route-does-not-exist", { failOnStatusCode: false });
    cy.contains(/not found|không tìm thấy|404/i).should("exist");
  });
});
