/// <reference types="cypress" />

describe("Public Content Pages", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  const publicPages = [
    {
      path: "/questions/bank",
      description: "Question Bank",
      content: /question|câu hỏi/i,
    },
    {
      path: "/questions/tips",
      description: "Interview Tips",
      content: /tip|mẹo|interview|phỏng vấn/i,
    },
    {
      path: "/enterprise/companies",
      description: "Company Search",
      content: /company|công ty|doanh nghiệp/i,
    },
    {
      path: "/features/ai-interview",
      description: "AI Interview Feature",
      content: /ai|interview|phỏng vấn/i,
    },
    {
      path: "/features/mentor-interview",
      description: "Mentor Interview Feature",
      content: /mentor|interview|phỏng vấn/i,
    },
    {
      path: "/resources/faq",
      description: "FAQ Page",
      content: /faq|câu hỏi thường gặp|frequently asked/i,
    },
    {
      path: "/resources/blog",
      description: "Blog Page",
      content: /blog|bài viết/i,
    },
  ];

  publicPages.forEach(({ path, description, content }) => {
    it(`should load ${description} page at ${path}`, () => {
      cy.intercept("GET", "**/api/**", { statusCode: 200, body: { traceId: "mock", data: [] } });
      cy.visit(path);
      cy.url().should("include", path);
      cy.contains(content).should("exist");
    });
  });
});
