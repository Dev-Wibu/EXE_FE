import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SchemaMentorResponse } from "@/interfaces/schema.types";

import { MentorGridCard } from "./MentorGridCard";

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastMocks.success,
    error: toastMocks.error,
  },
}));

describe("MentorGridCard", () => {
  const mentor: SchemaMentorResponse = {
    id: 101,
    name: "Mentor A",
    email: "mentor.a@example.com",
    expertise: "Frontend",
    currentCompany: "Inblue",
    totalSession: 12,
    yearsOfExperience: 6,
    averageRating: 4.7,
  };

  beforeEach(() => {
    toastMocks.success.mockClear();
    toastMocks.error.mockClear();
  });

  it("shows mentor email directly on card", () => {
    render(<MentorGridCard mentor={mentor} onStartChat={vi.fn()} onViewProfile={vi.fn()} />);

    expect(screen.getByText("mentor.a@example.com")).toBeInTheDocument();
  });

  it("copies email and shows success toast", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });

    render(<MentorGridCard mentor={mentor} onStartChat={vi.fn()} onViewProfile={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Sao chép email mentor" }));

    expect(writeTextMock).toHaveBeenCalledWith("mentor.a@example.com");
    await waitFor(() => {
      expect(toastMocks.success).toHaveBeenCalledWith("Đã sao chép email mentor");
    });
    expect(toastMocks.error).not.toHaveBeenCalled();
  });
});
