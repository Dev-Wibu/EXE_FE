# Testing Strategy

> **Source:** `vite.config.ts` (vitest config), `src/test/setup.ts`, `cypress/`, 51 test files  
> **Last Synced:** 2026-06-05

---

## 1. Test Infrastructure Overview

```mermaid
flowchart LR
    subgraph Unit Tests
        A[Vitest + jsdom]
        B[@testing-library/react]
        C[vi.fn / vi.mock]
    end
    subgraph E2E Tests
        D[Cypress]
        E[cy.visit / cy.get]
    end
    subgraph CI Pipeline
        F[pnpm validate]
        F --> G[format:check]
        G --> H[lint]
        H --> I[typecheck]
        I --> J[build]
    end
    A --> F
    D -.-> F
```

---

## 2. Unit Testing (Vitest)

### Configuration (`vite.config.ts`)

```typescript
test: {
  globals: true,                        // describe/it/expect available globally
  environment: "jsdom",                 // Browser-like DOM
  include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  exclude: ["**/node_modules/**", "**/dist/**", "**/cypress/**"],
  reporters: [["default"]],             // Array format with "default" reporter
  coverage: {
    reportsDirectory: "./test-output/vitest/coverage",
    provider: "v8",
  },
  setupFiles: ["./src/test/setup.ts"],
}
```

| Setting     | Value               | Notes                                                           |
| ----------- | ------------------- | --------------------------------------------------------------- |
| Environment | `jsdom`             | Full DOM API (not `happy-dom`) — supports React testing library |
| Globals     | `true`              | No need to import `describe`/`it`/`expect`                      |
| Coverage    | V8                  | Fast, native V8 coverage, no Istanbul overhead                  |
| Setup       | `src/test/setup.ts` | `@testing-library/jest-dom` + DOMMatrix polyfill                |
| Reporters   | `[["default"]]`     | Array format — Vitest 3.x requirement                           |
| Include     | `{src,tests}/**`    | Covers both `src/` and root `tests/` directory                  |

### Test Setup (`src/test/setup.ts`)

```typescript
import "@testing-library/jest-dom";

if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as unknown as { DOMMatrix: unknown }).DOMMatrix = class {} as unknown;
}
```

### Commands

| Command              | Purpose                     |
| -------------------- | --------------------------- |
| `pnpm test`          | Run tests in watch mode     |
| `pnpm test:run`      | Single run (CI)             |
| `pnpm test:coverage` | Run with V8 coverage report |

---

## 3. Test Inventory (51 files)

### By Layer

| Layer                   | Files    | Pattern                            |
| ----------------------- | -------- | ---------------------------------- |
| **Lib utilities**       | 13 files | Pure function tests                |
| **Services (managers)** | 11 files | API mock + assertion               |
| **Hooks**               | 7 files  | `renderHook` + QueryClient wrapper |
| **Stores (Zustand)**    | 4 files  | State assertion + action testing   |
| **Shared components**   | 4 files  | `render` + `screen` queries        |
| **Page components**     | 6 files  | Component-specific logic           |
| **Domain utils**        | 6 files  | Pure function tests                |

### Complete Test File List

#### `src/lib/` (13 files)

| Test File                          | Tests                                       |
| ---------------------------------- | ------------------------------------------- |
| `formatting.test.ts`               | Date parsing, formatting, timezone handling |
| `error-normalizer.test.ts`         | Error normalization pipeline                |
| `dashboard-breadcrumb.test.ts`     | Breadcrumb generation                       |
| `auth-session.test.ts`             | Token expiry, session detection             |
| `media-file-utils.test.ts`         | File type detection, size validation        |
| `payment-callback.test.ts`         | Cancel transaction code resolution          |
| `payment-recovery.test.ts`         | localStorage recovery record lifecycle      |
| `session-payment-context.test.ts`  | Pending session payment tracking            |
| `session-paid-status-sync.test.ts` | Paid status synchronization                 |
| `notification-alert-bus.test.ts`   | BroadcastChannel cross-tab events           |
| `practice-quiz-route.test.ts`      | Quiz route construction                     |
| `transforms.test.ts`               | FE↔BE data transformations                  |
| `utils.test.ts`                    | cn(), extractDataArray()                    |
| `status-utils.test.ts`             | Status utility functions                    |
| `tts-playground.test.ts`           | TTS utility functions                       |

#### `src/services/` (11 files)

| Test File                           | Pattern                                    |
| ----------------------------------- | ------------------------------------------ |
| `auth.manager.test.ts`              | Mock `fetchClient`, assert endpoint + body |
| `chat.manager.test.ts`              | Same pattern                               |
| `company.manager.test.ts`           | Same pattern                               |
| `user.manager.test.ts`              | Same pattern                               |
| `session.manager.test.ts`           | Same pattern                               |
| `round.manager.test.ts`             | Same pattern                               |
| `quiz-set.manager.test.ts`          | Same pattern                               |
| `question-category.manager.test.ts` | Same pattern                               |
| `practice-set.manager.test.ts`      | Same pattern                               |
| `payment.manager.test.ts`           | Same pattern                               |
| `notification.manager.test.ts`      | Same pattern                               |
| `mentor.manager.test.ts`            | Same pattern                               |

#### `src/hooks/` (7 files)

| Test File                                | Pattern                                                          |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `useMentorFeedback.test.tsx`             | `renderHook` + `QueryClientProvider` wrapper + `vi.mock` manager |
| `useMentorReview.test.tsx`               | Same pattern                                                     |
| `useTabsState.test.tsx`                  | URL param state management                                       |
| `useDashboardScrollRestoration.test.tsx` | Scroll position save/restore                                     |
| `useSpeechRecognition.test.tsx`          | Web Speech API mock                                              |
| `useSpeechSynthesis.test.tsx`            | Speech synthesis mock                                            |
| `speech-synthesis.utils.test.ts`         | Pure utility tests                                               |

#### `src/stores/` (4 files)

| Test File                   | Pattern                                                   |
| --------------------------- | --------------------------------------------------------- |
| `authStore.test.ts`         | `useAuthStore.getState()` + action invocation + assertion |
| `settingsStore.test.ts`     | Same pattern                                              |
| `themeStore.test.ts`        | Same pattern                                              |
| `notificationStore.test.ts` | Same pattern                                              |

#### `src/components/` (6 files)

| Test File                             | Pattern                      |
| ------------------------------------- | ---------------------------- |
| `shared/ChatComposer.test.tsx`        | `render` + user interaction  |
| `shared/MessageBubble.test.tsx`       | `render` + content assertion |
| `shared/DashboardChromeTabs.test.tsx` | `render` + tab switching     |
| `shared/SocketStatusBadge.test.tsx`   | `render` + status display    |
| `post/CommentItem.test.tsx`           | Component rendering          |
| `post/feed/PostFeedModal.test.tsx`    | Modal behavior               |

#### `src/pages/` (6 files)

| Test File                                                 | Tests                       |
| --------------------------------------------------------- | --------------------------- |
| `User/AIInterview/InterviewStage.test.tsx`                | Interview stage transitions |
| `User/AIInterview/speech.utils.test.ts`                   | Speech utility functions    |
| `User/AIInterview/useUserCameraPreview.test.tsx`          | Camera preview hook         |
| `User/MentorList/components/MentorGridCard.test.tsx`      | Card rendering              |
| `User/MentorDetail/components/MentorActionPanel.test.tsx` | Action panel logic          |
| `Mentor/Overview/mentorSchedule.utils.test.ts`            | Schedule utility functions  |

---

## 4. Testing Patterns

### Pattern A: Pure Utility Test

```typescript
import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./formatting";

describe("formatting datetime helpers", () => {
  it("parses backend naive ISO-like string as Vietnam local time", () => {
    const value = "2026-04-14 21:26:00.000";
    expect(formatDateTime(value)).toBe("14/04/2026 21:26");
  });

  it("returns fallback placeholders for invalid input", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });
});
```

### Pattern B: Zustand Store Test

```typescript
import { useAuthStore } from "./authStore";

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  localStorage.clear();
});

describe("useAuthStore — initial state", () => {
  it("has correct defaults", () => {
    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.user).toBeNull();
  });
});

describe("useAuthStore — actions", () => {
  it("setUser updates user", () => {
    const user = { id: 1, name: "Test" } as never;
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });
});
```

### Pattern C: React Hook Test (with QueryClient)

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const managerMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
}));

vi.mock("@/services/mentor-feedback.manager", () => ({
  mentorFeedbackManager: managerMocks,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

it("fetches feedbacks", async () => {
  managerMocks.getAll.mockResolvedValue({ success: true, data: [...] });
  const { result } = renderHook(() => useMentorFeedbacksByMentor(), {
    wrapper: createWrapper(),
  });
  await waitFor(() => expect(result.current.data).toBeDefined());
});
```

### Pattern D: Service Manager Test

```typescript
vi.mock("@/lib/api", () => ({
  $api: { get: vi.fn(), post: vi.fn() },
}));

it("calls correct endpoint", async () => {
  mockFetchClient.get.mockResolvedValue({ data: { id: 1 } });
  const result = await sessionManager.getById(1);
  expect(mockFetchClient.get).toHaveBeenCalledWith("/api/sessions/1");
});
```

---

## 5. E2E Testing (Cypress)

### Configuration

```typescript
// cypress.config.ts (inferred from project structure)
e2e: {
  baseUrl: "http://localhost:5173",
  specPattern: "cypress/e2e/**/*.cy.ts",
  supportFile: "cypress/support/e2e.ts",
}
```

### Commands

| Command             | Purpose          |
| ------------------- | ---------------- |
| `pnpm cypress:open` | Interactive mode |
| `pnpm cypress:run`  | Headless CI run  |

### Structure

```
cypress/
├── e2e/
│   ├── homepage.cy.ts          # Homepage smoke test
│   └── job-description.cy.ts   # JD page flow
├── fixtures/
│   └── example.json
├── screenshots/
│   └── job-description.cy.ts/
├── support/
│   ├── component.ts
│   └── e2e.ts
```

### Example Test

```typescript
describe("Homepage", () => {
  beforeEach(() => cy.visit("/"));

  it("should load the homepage", () => {
    cy.url().should("include", "/");
  });

  it("should have a login link", () => {
    cy.contains(/login|đăng nhập/i).should("exist");
  });
});
```

---

## 6. Test Coverage Gaps

| Area              | Current                 | Ideal                                                                 |
| ----------------- | ----------------------- | --------------------------------------------------------------------- |
| `lib/` utilities  | Well covered (13 files) | ✅                                                                    |
| Service managers  | Covered (11 files)      | ✅                                                                    |
| Zustand stores    | Covered (4 stores)      | ✅                                                                    |
| Custom hooks      | 7/30+ hooks tested      | Add coverage for `usePagination`, `useSortable`, `useMutationHandler` |
| Shared components | 4/20+ components tested | Add coverage for `Filter`, `PaginationControl`, `StatusBadge`         |
| Page components   | 6 pages tested          | Add coverage for critical flows (payment, auth)                       |
| E2E               | 2 smoke tests           | Expand login flow, interview flow, admin CRUD                         |

---

## 7. Mock Patterns

### `vi.hoisted()` — Solving the Mock Hoist Problem

When using `vi.mock()`, Vitest **hoists the factory function** to the top of the file. If the factory references variables declared below it, you get `Cannot access 'x' before initialization`. The solution is `vi.hoisted()`:

```typescript
// ❌ BROKEN — mock factory is hoisted above the variable declaration
const mockGetAll = vi.fn();
vi.mock("@/services/session.manager", () => ({
  sessionManager: { getAll: mockGetAll }, // ReferenceError: mockGetAll not yet defined
}));

// ✅ WORKS — vi.hoisted() creates references before the factory evaluates
const sessionMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
}));

vi.mock("@/services/session.manager", () => ({
  sessionManager: sessionMocks,
}));
```

**Why this works:** `vi.hoisted()` is also hoisted, but it creates its closure first. The factory function then references the already-initialized object. This is the official recommended pattern from the Vitest docs.

### Module Mocking

```typescript
vi.mock("@/lib/auth-session", () => ({
  getTokenExpiresAt: vi.fn((token) => (token ? 9999999999999 : null)),
  isSessionExpired: vi.fn(() => false),
}));
```

### Service Manager Mock Pattern

Service managers internally use `fetchClient` from `@/lib/api`. Tests mock the entire manager module:

```typescript
const managerMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
}));

vi.mock("@/services/session.manager", () => ({
  sessionManager: managerMocks,
}));

// In tests:
managerMocks.getAll.mockResolvedValue({ success: true, data: mockSessions });
```

### React Query Wrapper Factory

Hook tests that depend on React Query need a `QueryClientProvider` wrapper:

```typescript
const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Usage:
const { result } = renderHook(() => useMyHook(), {
  wrapper: createQueryWrapper(),
});
```

The `retry: false` and `gcTime: 0` settings prevent retries and caching between test runs, making assertions deterministic.

### Toast Mock Pattern (sonner)

```typescript
const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMocks,
}));
```

When testing UI components that trigger toasts, use `waitFor` for async assertions:

```typescript
await waitFor(() => {
  expect(toastMocks.success).toHaveBeenCalledWith("Success", expect.any(Object));
});
```

### jsdom Limitations for Speech/TTS

For hooks using `SpeechRecognition` or `speechSynthesis`, jsdom provides basic mocks but call-count assertions can be **flaky**. Prefer assertions on outcome states (e.g., `result.current.activeVoice`) rather than verifying internal API call counts. For thorough TTS fallback testing, use real browser E2E tests.

### React Compiler Gotcha: Impure Functions in Tests

When testing components that use `Date.now()` inside `useMemo` (common with i18n constants), the `react-hooks/purity` ESLint rule may trigger. In test files, use:

```typescript
// eslint-disable-next-line react-hooks/purity -- Date.now() is stable within a single render
```

### Hoisted Mocks (for vi.mock factory)

```typescript
const managerMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/services/some.manager", () => ({
  someManager: managerMocks,
}));
```

### Socket Manager Mock

```typescript
vi.mock("@/services/socket.manager", () => ({
  socketService: { disconnect: vi.fn() },
}));
```

---

_Document generated from source code analysis on 2026-06-05._
