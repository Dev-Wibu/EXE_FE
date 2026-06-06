import i18n from "@/lib/i18n";
import { describe, expect, it } from "vitest";
const t = i18n.t.bind(i18n);

import {
  getNormalizedErrorMessage,
  normalizeApiError,
  resolveStatusErrorMessage,
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

describe("error-normalizer — source detection", () => {
  it("detects fetch source (error with .data property)", () => {
    const normalized = normalizeApiError({ data: { error: "Not found" }, status: 404 }, "Fallback");
    expect(normalized.source).toBe("fetch");
  });

  it("detects native source (Error instance)", () => {
    const normalized = normalizeApiError(new Error("Network error"), "Fallback");
    expect(normalized.source).toBe("native");
  });

  it("detects unknown source (plain non-Error non-record value)", () => {
    const normalized = normalizeApiError(42, "Fallback");
    expect(normalized.source).toBe("unknown");
  });
});

describe("error-normalizer — resolveStatusErrorMessage", () => {
  it("returns Vietnamese message for known status codes", () => {
    expect(resolveStatusErrorMessage(400)).toBe(t("general.invalidDataPleaseCheckAgain"));
    expect(resolveStatusErrorMessage(401)).toBe(t("general.loginSessionExpiredPleaseLog"));
    expect(resolveStatusErrorMessage(403)).toBe(t("general.youDoNotHavePermission"));
    expect(resolveStatusErrorMessage(404)).toBe(t("general.requestedDataNotFound"));
    expect(resolveStatusErrorMessage(409)).toBe(t("general.conflictingDataPleaseTryAgain"));
    expect(resolveStatusErrorMessage(500)).toBe(t("general.theSystemIsExperiencingProblems"));
    expect(resolveStatusErrorMessage(502)).toBe(t("general.theServerIsTemporarilyUnavailable"));
    expect(resolveStatusErrorMessage(503)).toBe(t("general.serviceIsUnderMaintenancePlease"));
    expect(resolveStatusErrorMessage(504)).toBe(t("general.theServerRespondsTooSlowly"));
  });

  it("returns undefined for unknown status codes", () => {
    expect(resolveStatusErrorMessage(418)).toBeUndefined();
    expect(resolveStatusErrorMessage(200)).toBeUndefined();
  });

  it("returns undefined for undefined/null/0 status", () => {
    expect(resolveStatusErrorMessage(undefined)).toBeUndefined();
    expect(resolveStatusErrorMessage(0)).toBeUndefined();
  });
});

describe("error-normalizer — known error patterns", () => {
  it("maps 'wrong password' variants", () => {
    expect(normalizeApiError({ response: { data: "Invalid password" } }).message).toBe(
      t("general.wrongPassword1")
    );
  });

  it("maps 'user not found' variants", () => {
    expect(normalizeApiError({ response: { data: "User not found" } }).message).toBe(
      t("general.wrongEmail")
    );
  });

  it("maps 'insufficient balance' variants", () => {
    expect(normalizeApiError({ response: { data: "Insufficient balance" } }).message).toBe(
      t("general.walletBalanceIsNotEnough")
    );
  });

  it("maps timeout variants", () => {
    expect(normalizeApiError({ response: { data: "Request timed out" } }).message).toBe(
      t("general.requestTimeoutExceededPleaseTry")
    );
  });

  it("maps content-type unsupported", () => {
    expect(
      normalizeApiError({ response: { data: "Content-Type text/plain is not supported" } }).message
    ).toBe(t("general.theSubmittedDataFormatIs"));
  });
});

describe("error-normalizer — field errors extraction", () => {
  it("extracts fieldErrors from payload", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 422,
          data: {
            fieldErrors: { email: "Email is required", name: "Name too short" },
          },
        },
      },
      "Fallback"
    );
    expect(normalized.fieldErrors).toEqual({ email: "Email is required", name: "Name too short" });
  });

  it("extracts errors (alternative key) from payload", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 422,
          data: {
            errors: { password: "Too weak" },
          },
        },
      },
      "Fallback"
    );
    expect(normalized.fieldErrors).toEqual({ password: "Too weak" });
  });

  it("handles array field error values (takes first non-empty)", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 422,
          data: {
            fieldErrors: { email: ["", "Email is required", "Another error"] },
          },
        },
      },
      "Fallback"
    );
    expect(normalized.fieldErrors).toEqual({ email: "Email is required" });
  });

  it("returns undefined fieldErrors when payload has none", () => {
    const normalized = normalizeApiError(
      { response: { status: 400, data: { error: "Bad request" } } },
      "Fallback"
    );
    expect(normalized.fieldErrors).toBeUndefined();
  });
});

describe("error-normalizer — nested payload extraction", () => {
  it("extracts message from nested .data.message", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 400,
          data: {
            data: { message: "Nested error message" },
          },
        },
      },
      "Fallback"
    );
    expect(normalized.rawMessage).toBe("Nested error message");
  });

  it("extracts message from array payload", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 400,
          data: ["First error", "Second error"],
        },
      },
      "Fallback"
    );
    expect(normalized.rawMessage).toBe("First error");
  });

  it("extracts message from payload.detail", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 400,
          data: { detail: "Detailed error info" },
        },
      },
      "Fallback"
    );
    expect(normalized.rawMessage).toBe("Detailed error info");
  });

  it("extracts message from payload.title", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 400,
          data: { title: "Bad Request" },
        },
      },
      "Fallback"
    );
    expect(normalized.rawMessage).toBe("Bad Request");
  });

  it("extracts message from payload.msg", () => {
    const normalized = normalizeApiError(
      {
        response: {
          status: 400,
          data: { msg: "Short message" },
        },
      },
      "Fallback"
    );
    expect(normalized.rawMessage).toBe("Short message");
  });
});

describe("error-normalizer — traceId extraction", () => {
  it("extracts traceId from error object directly", () => {
    const normalized = normalizeApiError(
      { traceId: "direct-trace", data: { error: "test" } },
      "Fallback"
    );
    expect(normalized.traceId).toBe("direct-trace");
  });

  it("extracts traceID (alternate casing) from payload", () => {
    const normalized = normalizeApiError(
      {
        response: {
          data: { traceID: "alternate-trace", error: "test" },
        },
      },
      "Fallback"
    );
    expect(normalized.traceId).toBe("alternate-trace");
  });
});

describe("error-normalizer — code extraction", () => {
  it("extracts code from payload", () => {
    const normalized = normalizeApiError(
      {
        response: {
          data: { code: "ERR_DUPLICATE", error: "Duplicate entry" },
        },
      },
      "Fallback"
    );
    expect(normalized.code).toBe("ERR_DUPLICATE");
  });

  it("extracts errorCode from payload", () => {
    const normalized = normalizeApiError(
      {
        response: {
          data: { errorCode: "VALIDATION_FAILED", error: "Validation error" },
        },
      },
      "Fallback"
    );
    expect(normalized.code).toBe("VALIDATION_FAILED");
  });

  it("extracts error_code (snake_case) from payload", () => {
    const normalized = normalizeApiError(
      {
        response: {
          data: { error_code: "SNAKE_CASE_CODE", error: "Snake case error" },
        },
      },
      "Fallback"
    );
    expect(normalized.code).toBe("SNAKE_CASE_CODE");
  });
});

describe("error-normalizer — status extraction", () => {
  it("extracts status from error.status directly", () => {
    const normalized = normalizeApiError({ status: 403, data: { error: "Forbidden" } }, "Fallback");
    expect(normalized.status).toBe(403);
  });

  it("extracts status from error.statusCode", () => {
    const normalized = normalizeApiError(
      { statusCode: 429, data: { error: "Rate limited" } },
      "Fallback"
    );
    expect(normalized.status).toBe(429);
  });

  it("returns undefined status for non-record errors", () => {
    const normalized = normalizeApiError("plain string error", "Fallback");
    expect(normalized.status).toBeUndefined();
  });
});

describe("error-normalizer — message priority", () => {
  it("uses fallback when error is empty/null and no status match", () => {
    const normalized = normalizeApiError(null, "My fallback");
    expect(normalized.message).toBe("My fallback");
  });

  it("uses default i18n fallback when no fallback provided", () => {
    const normalized = normalizeApiError(null);
    expect(normalized.message).toBe(t("general.anErrorHasOccurredPlease"));
  });

  it("prefers known pattern over status message", () => {
    // "Bad credentials" matches known pattern → should use wrongPassword message, not 401 message
    const normalized = normalizeApiError(
      { response: { status: 401, data: "Bad credentials" } },
      "Fallback"
    );
    expect(normalized.message).toBe(t("general.wrongPassword1"));
  });

  it("prefers non-generic raw message over status message", () => {
    const normalized = normalizeApiError(
      { response: { status: 500, data: { error: "Specific database connection failed" } } },
      "Fallback"
    );
    // "Specific database connection failed" does not match any known pattern and is not generic
    expect(normalized.message).toBe("Specific database connection failed");
  });

  it("falls back to status message when raw message is generic", () => {
    const normalized = normalizeApiError(
      { response: { status: 403, data: { error: "Request failed with status code 403" } } },
      "Fallback"
    );
    expect(normalized.message).toBe(t("general.youDoNotHavePermission"));
  });
});

describe("error-normalizer — getNormalizedErrorMessage", () => {
  it("returns just the message string", () => {
    const message = getNormalizedErrorMessage(
      { response: { status: 401, data: "Bad credentials" } },
      "Fallback"
    );
    expect(message).toBe(t("general.wrongPassword1"));
    expect(typeof message).toBe("string");
  });
});

describe("error-normalizer — toAppApiError", () => {
  it("creates Error with all metadata fields", () => {
    const appError = toAppApiError(
      {
        response: {
          status: 422,
          data: {
            traceId: "trace-422",
            code: "VALIDATION_ERROR",
            error: "Invalid data",
            fieldErrors: { email: "Required" },
          },
        },
      },
      "Fallback"
    );

    expect(appError).toBeInstanceOf(Error);
    expect(appError.status).toBe(422);
    expect(appError.code).toBe("VALIDATION_ERROR");
    expect(appError.traceId).toBe("trace-422");
    expect(appError.fieldErrors).toEqual({ email: "Required" });
    expect(appError.source).toBe("axios");
  });

  it("handles Error instance input", () => {
    const appError = toAppApiError(new Error("Something broke"), "Fallback");
    expect(appError).toBeInstanceOf(Error);
    expect(appError.source).toBe("native");
    expect(appError.rawMessage).toBe("Something broke");
  });
});

describe("error-normalizer — JSON string payload parsing", () => {
  it("parses JSON string in response data to extract message", () => {
    const jsonString = JSON.stringify({ message: "Parsed from JSON string" });
    const normalized = normalizeApiError(
      { response: { status: 400, data: jsonString } },
      "Fallback"
    );
    expect(normalized.rawMessage).toBe("Parsed from JSON string");
  });

  it("falls back to raw string when data is not JSON", () => {
    const normalized = normalizeApiError(
      { response: { status: 400, data: "Plain text error" } },
      "Fallback"
    );
    expect(normalized.rawMessage).toBe("Plain text error");
  });
});

describe("error-normalizer — fetch nested status extraction", () => {
  it("extracts status from error.data.status (fetch source)", () => {
    const normalized = normalizeApiError({ data: { status: 404, error: "Not found" } }, "Fallback");
    expect(normalized.status).toBe(404);
    expect(normalized.source).toBe("fetch");
  });

  it("extracts status from error.data.statusCode (fetch source)", () => {
    const normalized = normalizeApiError(
      { data: { statusCode: 429, error: "Rate limited" } },
      "Fallback"
    );
    expect(normalized.status).toBe(429);
  });
});

describe("error-normalizer — Vietnamese diacritics patterns", () => {
  it("maps 'email đã tồn tại' to emailAlreadyExists", () => {
    const normalized = normalizeApiError(
      { response: { data: "Email đã tồn tại trong hệ thống" } },
      "Fallback"
    );
    expect(normalized.message).toBe(t("general.emailAlreadyExists"));
  });

  it("maps 'số dư không đủ' to walletBalanceIsNotEnough", () => {
    const normalized = normalizeApiError(
      { response: { data: "Số dư trong tài khoản không đủ" } },
      "Fallback"
    );
    expect(normalized.message).toBe(t("general.walletBalanceIsNotEnough"));
  });
});
