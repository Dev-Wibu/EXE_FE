import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { useDashboardScrollRestoration } from "./useDashboardScrollRestoration";

function ScrollHarness({ enabled = true, scopeKey }: { enabled?: boolean; scopeKey?: string }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useDashboardScrollRestoration(containerRef, { enabled, scopeKey });

  return (
    <div>
      <button onClick={() => navigate("/dashboard?tab=b")}>Go B</button>
      <button onClick={() => navigate(-1)}>Go Back</button>
      <div
        data-testid="scroll-container"
        ref={containerRef}
        style={{ height: 120, overflowY: "auto" }}>
        <div style={{ height: 1200 }}>Scrollable content</div>
      </div>
    </div>
  );
}

function ScopeSwitchHarness() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scopeKey, setScopeKey] = useState("scope-a");

  useDashboardScrollRestoration(containerRef, { scopeKey });

  return (
    <div>
      <button
        onClick={() => {
          setScopeKey((prev) => (prev === "scope-a" ? "scope-b" : "scope-a"));
        }}>
        Switch Scope
      </button>
      <div
        data-testid="scroll-container"
        ref={containerRef}
        style={{ height: 120, overflowY: "auto" }}>
        <div style={{ height: 1200 }}>Scrollable content</div>
      </div>
    </div>
  );
}

describe("useDashboardScrollRestoration", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("resets scroll on push and restores on pop", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard?tab=a"]}>
        <ScrollHarness />
      </MemoryRouter>
    );

    const scrollContainer = screen.getByTestId("scroll-container");
    scrollContainer.scrollTop = 320;

    fireEvent.click(screen.getByRole("button", { name: "Go B" }));

    await waitFor(() => {
      expect(scrollContainer.scrollTop).toBe(0);
    });

    scrollContainer.scrollTop = 140;
    fireEvent.click(screen.getByRole("button", { name: "Go Back" }));

    await waitFor(() => {
      expect(scrollContainer.scrollTop).toBe(320);
    });
  });

  it("does not force scroll position when disabled", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard?tab=a"]}>
        <ScrollHarness enabled={false} />
      </MemoryRouter>
    );

    const scrollContainer = screen.getByTestId("scroll-container");
    scrollContainer.scrollTop = 260;

    fireEvent.click(screen.getByRole("button", { name: "Go B" }));

    await waitFor(() => {
      expect(scrollContainer.scrollTop).toBe(260);
    });
  });

  it("resets scroll when scope changes without route navigation", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard?tab=a"]}>
        <ScopeSwitchHarness />
      </MemoryRouter>
    );

    const scrollContainer = screen.getByTestId("scroll-container");
    scrollContainer.scrollTop = 310;

    fireEvent.click(screen.getByRole("button", { name: "Switch Scope" }));

    await waitFor(() => {
      expect(scrollContainer.scrollTop).toBe(0);
    });

    scrollContainer.scrollTop = 175;

    fireEvent.click(screen.getByRole("button", { name: "Switch Scope" }));

    await waitFor(() => {
      expect(scrollContainer.scrollTop).toBe(0);
    });
  });
});
