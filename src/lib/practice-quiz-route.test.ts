import { describe, expect, it } from "vitest";
import {
  buildPracticeQuizPath,
  buildPracticeQuizResultPath,
  buildPracticeSessionPath,
  toPositiveIntegerParam,
} from "./practice-quiz-route";

describe("buildPracticeSessionPath", () => {
  it("builds path with numeric sessionId", () => {
    expect(buildPracticeSessionPath(42)).toBe("/user/practice/session/42");
  });

  it("builds path with string sessionId", () => {
    expect(buildPracticeSessionPath("99")).toBe("/user/practice/session/99");
  });

  it("encodes special characters in sessionId", () => {
    expect(buildPracticeSessionPath("a/b")).toBe("/user/practice/session/a%2Fb");
  });
});

describe("buildPracticeQuizPath", () => {
  it("builds full quiz path with numeric params", () => {
    expect(buildPracticeQuizPath({ sessionId: 1, practiceSetId: 2, quizId: 3 })).toBe(
      "/user/practice/session/1/2/quiz/3"
    );
  });

  it("builds full quiz path with string params", () => {
    expect(buildPracticeQuizPath({ sessionId: "10", practiceSetId: "20", quizId: "30" })).toBe(
      "/user/practice/session/10/20/quiz/30"
    );
  });
});

describe("buildPracticeQuizResultPath", () => {
  it("appends /result to quiz path", () => {
    expect(buildPracticeQuizResultPath({ sessionId: 1, practiceSetId: 2, quizId: 3 })).toBe(
      "/user/practice/session/1/2/quiz/3/result"
    );
  });
});

describe("toPositiveIntegerParam", () => {
  it("returns undefined for undefined/empty", () => {
    expect(toPositiveIntegerParam(undefined)).toBeUndefined();
    expect(toPositiveIntegerParam("")).toBeUndefined();
  });

  it("returns undefined for non-integer strings", () => {
    expect(toPositiveIntegerParam("abc")).toBeUndefined();
    expect(toPositiveIntegerParam("3.14")).toBeUndefined();
  });

  it("returns undefined for zero or negative", () => {
    expect(toPositiveIntegerParam("0")).toBeUndefined();
    expect(toPositiveIntegerParam("-5")).toBeUndefined();
  });

  it("returns the number for valid positive integers", () => {
    expect(toPositiveIntegerParam("1")).toBe(1);
    expect(toPositiveIntegerParam("42")).toBe(42);
  });
});
