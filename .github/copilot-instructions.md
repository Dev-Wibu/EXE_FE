# EXE_FE - AI Agent Guide

## Hard Rules

- **Vietnamese UI**: All user-facing strings (labels, buttons, toasts, placeholders) must be in Vietnamese.
- **Never edit `schema-from-be.d.ts`**: Auto-generated from backend OpenAPI. Regenerate with `pnpm generate-schema`.
- **Quality gate**: Run `pnpm format && pnpm lint && pnpm typecheck && pnpm build` before finishing. All must pass.
- **Path alias**: `@/` → `src/` (configured in `vite.config.ts` and `tsconfig.json`).

## Comment Rules

> Good code is self-explanatory. Only write comments when the code **cannot speak for itself**.

Only write a comment for one of these three reasons:

1. **Complex logic** — explain an algorithm or non-obvious processing step
2. **Risk warning** — the action can cause errors or unintended side-effects
3. **Explain why** — why the code is written this way, not what it does

```ts
// ✅ 1. Logic phức tạp — giải thích thuật toán hoặc bước xử lý khó hiểu
// Tính tổng giá sau khi áp dụng giảm giá lũy tiến:
// - Dưới 5 vé: không giảm
// - Từ 5–10 vé: giảm 10%
// - Trên 10 vé: giảm 20%
const finalPrice = calculateTieredDiscount(quantity, unitPrice);

// ✅ 2. Cảnh báo rủi ro — hành động có thể gây lỗi hoặc ảnh hưởng ngoài ý muốn
// CẢNH BÁO: Xóa cache ở đây sẽ đăng xuất tất cả người dùng đang hoạt động
clearAuthCache();

// ✅ 3. Giải thích lý do — tại sao code được viết theo cách này (không phải viết gì)
// Dùng setTimeout 0ms để đảm bảo DOM đã render xong trước khi focus
setTimeout(() => inputRef.current?.focus(), 0);

// ❌ Không cần comment — code đã tự rõ nghĩa
const isLoggedIn = !!token; // kiểm tra đăng nhập ← thừa
```

## Architecture Overview

**Stack**: React 19 · Vite 7 · TypeScript 5.9 · TailwindCSS 4 · React Query · Zustand · shadcn/ui (new-york style)  
**Key libs**: date-fns (dates) · Recharts (charts) · Daily.co (video calls) · Sonner (toasts) · Framer Motion (animations) · Zod + react-hook-form (validation)  
**Backend**: Spring Boot at `https://api.kdz.asia` · JWT auth · OpenAPI at `/v3/api-docs`  
**Infra**: Nx for task caching (`nx.json`, `project.json`) · Vercel deployment (`vercel.json` with SPA rewrites)

### Four Roles, Four Route Trees

| Role   | Routes         | Layout                                              | Navigation                                                                           |
| ------ | -------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| USER   | `/dashboard/*` | `UserDashboardLayout` → `Sidebar` (blue `#0047AB`)  | Traditional routing via `<Outlet />`                                                 |
| MENTOR | `/mentor/*`    | `MentorDashboardLayout` → `MentorSidebar` (emerald) | Traditional routing via `<Outlet />`                                                 |
| ADMIN  | `/admin`       | Self-contained `AdminDashboardPage`                 | ChromeTabs + built-in sidebar, tab switching via `?tab=` query param — no sub-routes |
| STAFF  | `/staff`       | Self-contained `StaffDashboardPage`                 | Standalone pages at `/staff/*`                                                       |

Public pages (`/`, `/questions/*`, `/features/*`, `/resources/*`) use no dashboard layout. Auth pages (`/login`, `/signup`) use `AuthLayout`.

### Dual API Pattern (Critical)

The codebase has **two coexisting API approaches**:

1. **`$api`** (`src/lib/api.ts`) — openapi-fetch + openapi-react-query. Type-safe against `schema-from-be.d.ts`. JWT auto-injected via middleware. Base URL defaults to `https://api.kdz.asia`. **Use for new code**:

   ```typescript
   import { $api } from "@/lib/api";
   $api.useQuery("get", "/api/sessions");
   $api.useMutation("post", "/api/sessions");
   ```

2. **Axios managers** (`src/services/*.manager.ts`) — Class-based, implement `BaseManager<T>` from `interfaces/manager.types.ts`. Support mock/api mode via `VITE_MANAGER_MODE`. Use `createApiInstance()` from `constants/api.config.ts` (base URL defaults to `http://localhost:8080` — different from `$api`!).

**Current reality**: Most hooks in `src/hooks/` (e.g., `useSession.ts`) wrap Axios managers with React Query's `useQuery`/`useMutation`, not `$api`. Both patterns coexist.

### State Management

- **Server state** → React Query. Import `queryClient` from `lib/queryClient.ts` (not from `QueryProvider`).
  ```typescript
  queryClient.invalidateQueries({ queryKey: ["get", "/api/sessions"] });
  // openapi-react-query keys use ["method", "/path"] format
  ```
- **Client state** → Zustand with `persist` + localStorage. See `stores/authStore.ts` as canonical example.

## Key Patterns

### Service Manager Pattern (`services/*.manager.ts`)

Each manager: class implementing `BaseManager<T>`, with `private api = createApiInstance()`. Returns `ApiResponse<T>` wrappers. Mock mode returns data from `mocks/`. Exported as singletons (e.g., `export const sessionManager = new SessionManager()`).

Reference: `services/session.manager.ts` is the canonical CRUD example.

### Custom Hooks

- **`useMutationHandler`** — Wraps `useMutation` with auto-toast (Vietnamese messages). Use for all mutations.
- **`usePagination`** / **`useUrlPagination`** — Pagination with optional URL sync via search params.
- **`useSortable`** — Sortable table columns with null-safe comparison and default reverse order (newest first).
- **`useTabsState`** — Tab persistence (URL `?tab=` query params + localStorage). Used by Admin/Mentor dashboards.
- All hooks barrel-exported from `hooks/index.ts`.

### Styling

- shadcn/ui components in `components/ui/` (60+ components). Custom extensions: `cv-upload-modal`, `empty-state`, `star-rating`, `spinner`, `time-ago`, `loading-card`, `file-upload-input`, `image-carousel`, `testimonial-carousel`.
- Design tokens: Primary `#0047AB`, Bright `#007BFF`, Light BG `#DCEEFF`/`#F0F8FF`, Gold `#FFD700`. Full map in `constants/colors.ts`.
- Domain components: `components/feedback/`, `components/review/`, `components/notification/`, `components/video-call/`.
- Shared widgets: `components/shared/` (`PaginationControl`, `Filter`, `SortButton`).

### Video Call Architecture

Daily.co integration in `components/video-call/` uses React context pattern:
`VideoCallProvider` → `VideoCallContext` → `useVideoCall` hook. Supporting components: `VideoCallRoom`, `VideoControls`, `ParticipantGrid`, `DeviceCheckDialog`.

### Data Transforms

`lib/transforms.ts` contains FE↔BE conversion functions (`transformUserCreateRequest`, `transformSessionCreateRequest`, etc.). Use these when form data shape differs from API schema.

### Error Handling

- `constants/api.config.ts` exports `ERROR_MESSAGES` — a `Record<number, string>` mapping HTTP status codes to Vietnamese messages. Use for consistent error display.
- `createApiInstance()` has a 401 interceptor that clears `auth-storage` and redirects to `/login`.
- `lib/toast-service.ts` exports `ToastService` for centralized Sonner toast calls.

## Commands

| Command                       | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                    | Dev server (Vite)                                                        |
| `pnpm build`                  | `tsc -b && vite build`                                                   |
| `pnpm typecheck`              | TypeScript check (`tsc -b`)                                              |
| `pnpm lint` / `pnpm lint:fix` | ESLint (includes `@tanstack/eslint-plugin-query`)                        |
| `pnpm format`                 | Prettier (auto-organizes imports and Tailwind classes)                   |
| `pnpm test`                   | Vitest (watch mode)                                                      |
| `pnpm test:run`               | Vitest single run                                                        |
| `pnpm test:coverage`          | Vitest with V8 coverage                                                  |
| `pnpm test:ui`                | Vitest UI                                                                |
| `pnpm generate-schema`        | Regenerate `schema-from-be.d.ts` from `https://api.kdz.asia/v3/api-docs` |
| `pnpm cypress:open`           | Cypress interactive mode                                                 |
| `pnpm cypress:run`            | Cypress headless run                                                     |

> **Note**: `pnpm format` runs Prettier with `prettier-plugin-organize-imports` and `prettier-plugin-tailwindcss` — imports are auto-sorted and Tailwind classes auto-ordered. Don't manually organize imports.

## Adding a New Feature

1. `pnpm generate-schema` (if backend changed)
2. Add/update types in `interfaces/schema.types.ts`
3. Create manager in `services/` implementing `BaseManager<T>` — add mock data in `mocks/`
4. Create hook in `hooks/` wrapping manager with React Query
5. Create page in `pages/<Role>/` following existing folder structure
6. Add route in `App.tsx` (User/Mentor: nested under layout; Admin: add tab to `AdminDashboardPage`)
7. Export from barrel files (`services/index.ts`, `hooks/index.ts`, page `index.ts`)

## Testing

- **Unit**: Vitest + jsdom + `@testing-library/react`. Config in `vite.config.ts`. Setup: `src/test/setup.ts`.
- **Pattern**: Tests live next to source (`services/auth.manager.test.ts`). Mock `fetchClient` or set `MANAGER_MODE` to `"mock"`.
- **E2E**: Cypress in `cypress/` directory. Specs in `cypress/e2e/`.

## Gotchas

- **Two different base URLs**: `$api` (openapi-fetch) defaults to `https://api.kdz.asia`; Axios managers default to `http://localhost:8080`. Both read from `VITE_API_BASE_URL` but have different fallbacks.
- **`VITE_MANAGER_MODE`**: `"mock"` (default) uses mock data; `"api"` hits real backend. Managers branch on this.
- **Axios ≠ auto-auth**: `createApiInstance()` does NOT inject JWT tokens — only adds `X-Request-ID`. Only `fetchClient` (openapi-fetch) auto-injects JWT via middleware.
- **Admin pages are NOT routed** — they render via tab switching inside `AdminDashboardPage`. Adding an admin feature means adding a tab + component, not a route.
- **`buildEndpoint()`** from `constants/api.config.ts` substitutes `:param` placeholders: `buildEndpoint("/api/users/:id", { id: 5 })`.
- **Form validation**: Zod schemas + react-hook-form (`@hookform/resolvers`).
- **`JoinSessionRequest.isMentor`**: Must be explicitly `true` or `false` — backend cannot deserialize `null`/`undefined` to boolean.
- **Prettier auto-sorts imports**: Don't add manual import grouping comments — they'll be removed on `pnpm format`.
