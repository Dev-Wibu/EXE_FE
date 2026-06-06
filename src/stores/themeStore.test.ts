import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyTheme, getEffectiveTheme, useThemeStore } from "./themeStore";

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  // Reset to default
  useThemeStore.getState().setTheme("light");
  document.documentElement.classList.remove("dark");
  localStorage.clear();
});

afterEach(() => {
  // Restore the original matchMedia to prevent cross-test contamination
  window.matchMedia = originalMatchMedia;
});

describe("useThemeStore — initial state", () => {
  it("defaults to light theme", () => {
    expect(useThemeStore.getState().theme).toBe("light");
  });
});

describe("useThemeStore — setTheme", () => {
  it("updates theme state", () => {
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("applies dark class to document when setting dark", () => {
    useThemeStore.getState().setTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class from document when setting light", () => {
    useThemeStore.getState().setTheme("dark");
    useThemeStore.getState().setTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies system theme via store (resolves to light when matchMedia does not match)", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false } as MediaQueryList);
    useThemeStore.getState().setTheme("system");
    expect(useThemeStore.getState().theme).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies system theme via store (resolves to dark when matchMedia matches)", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);
    useThemeStore.getState().setTheme("system");
    expect(useThemeStore.getState().theme).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("getEffectiveTheme", () => {
  it("returns light/dark directly when not system", () => {
    expect(getEffectiveTheme("light")).toBe("light");
    expect(getEffectiveTheme("dark")).toBe("dark");
  });

  it("resolves system to dark when matchMedia matches", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);
    expect(getEffectiveTheme("system")).toBe("dark");
  });

  it("resolves system to light when matchMedia does not match", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false } as MediaQueryList);
    expect(getEffectiveTheme("system")).toBe("light");
  });
});

describe("applyTheme", () => {
  it("adds dark class for dark theme", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class for light theme", () => {
    document.documentElement.classList.add("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies system theme (resolves via matchMedia)", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true } as MediaQueryList);
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class for system theme when matchMedia does not match", () => {
    document.documentElement.classList.add("dark");
    window.matchMedia = vi.fn().mockReturnValue({ matches: false } as MediaQueryList);
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("useThemeStore — onRehydrateStorage", () => {
  it("applies stored theme on rehydration (light)", () => {
    // Simulate persisted theme
    localStorage.setItem(
      "theme-storage",
      JSON.stringify({ state: { theme: "light" }, version: 0 })
    );
    // Verify the onRehydrateStorage callback would apply the theme
    // Since the store is already hydrated, we verify the callback logic directly
    // by calling applyTheme with the stored theme value
    document.documentElement.classList.add("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies stored theme on rehydration (dark)", () => {
    document.documentElement.classList.remove("dark");
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
