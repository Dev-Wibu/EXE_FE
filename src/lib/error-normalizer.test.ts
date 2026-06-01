import i18n from "@/lib/i18n";
import { describe, expect, it } from "vitest";
const t = i18n.t.bind(i18n);

import {
  getNormalizedErrorMessage,
  normalizeApiError,
  toAppApiError,
} from "@/lib/error-normalizer";

describe("error-normalizer", () => {
  it("normalizes traceId + error payload from backend", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 400,
          data: {
            traceId: "69e505c6e57c956afb9022db28c866a3",
            error: "Email đã tồn tại",
          },
        },
      },
      "Fallback"
    );

    expect(normalized.message).toBe(t("general.emailAlreadyExists"));
    expect(normalized.status).toBe(400);
    expect(normalized.traceId).toBe("69e505c6e57c956afb9022db28c866a3");
  });

  it("maps login bad credentials to Vietnamese message", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 401,
          data: "Bad credentials",
        },
      },
      "Fallback"
    );

    expect(normalized.message).toBe(t("general.wrongPassword1"));
    expect(normalized.status).toBe(401);
  });

  it("maps enum parse errors to validation message", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 500,
          data: {
            error: "Internal Server Error",
            message: "No enum constant fpt.org.inblue.model.enums.Major.123",
          },
        },
      },
      "Fallback"
    );

    expect(normalized.message).toBe(t("general.theDataSubmittedIsInvalid"));
  });

  it("uses HTTP status mapping when backend returns generic messages", () => {
    const normalized = normalizeApiError(
      {
        message: "Request failed with status code 500",
        response: {
          status: 500,
          data: {
            error: "Internal Server Error",
          },
        },
      },
      "Fallback"
    );

    expect(normalized.message).toBe(t("general.theSystemIsExperiencingProblems"));
    expect(normalized.rawMessage).toBe("Internal Server Error");
  });

  it("keeps informative plain-text backend messages", () => {
    const message = getNormalizedErrorMessage(
      "Transfer out successful. Current balance: 0",
      "Fallback"
    );

    expect(message).toBe("Transfer out successful. Current balance: 0");
  });

  it("builds app error with metadata", () => {
    const appError = toAppApiError(
      {
        response: {
          status: 404,
          data: {
            traceId: "trace-404",
            error: "Session not found",
          },
        },
      },
      "Fallback"
    );

    expect(appError.message).toBe(t("general.noInterviewSessionsFound"));
    expect(appError.status).toBe(404);
    expect(appError.traceId).toBe("trace-404");
  });
});
