# EXE_FE - AI Agent Guide

## Hard Rules

- **Vietnamese UI**: All user-facing strings (labels, buttons, toasts, placeholders) must be in Vietnamese.
- **Never edit `schema-from-be.d.ts`**: Auto-generated from backend OpenAPI. Regenerate with `pnpm generate-schema`.
- **Quality gate**: Run `pnpm format && pnpm lint && pnpm typecheck && pnpm build` before finishing. All must pass.

## Architecture Overview

**Stack**: React 19 · Vite 7 · TypeScript · TailwindCSS 4 · React Query · Zustand · shadcn/ui  
**Backend**: Spring Boot at `https://api.kdz.asia` · JWT auth · OpenAPI at `/v3/api-docs`

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

1. **`$api`** (`src/lib/api.ts`) — openapi-fetch + openapi-react-query. Type-safe against `schema-from-be.d.ts`. JWT auto-injected via middleware. Use for new code:

   ```typescript
   import { $api } from "@/lib/api";
   $api.useQuery("get", "/api/sessions");
   $api.useMutation("post", "/api/sessions");
   ```

2. **Axios managers** (`src/services/*.manager.ts`) — Class-based, implement `BaseManager<T>` from `interfaces/manager.types.ts`. Support mock/api mode via `VITE_MANAGER_MODE`. Use `createApiInstance()` from `constants/api.config.ts` (does NOT auto-inject JWT — only adds `X-Request-ID`).

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

Each manager: class implementing `BaseManager<T>`, with `private mode = MANAGER_MODE` and `private api = createApiInstance()`. Returns `ApiResponse<T>` wrappers. Mock mode returns data from `mocks/`. Exported as singletons (e.g., `export const sessionManager = new SessionManager()`).

Reference: `services/session.manager.ts` (252 lines) is the canonical CRUD example.

### Custom Hooks

- **`useMutationHandler`** — Wraps `useMutation` with auto-toast (Vietnamese messages). Use for all mutations.
- **`usePagination`** — Pagination with URL sync.
- **`useSortable`** — Sortable table columns.
- **`useTabsState`** — Tab persistence (URL query params + localStorage). Used by Admin/Mentor dashboards.

### Styling

- shadcn/ui components in `components/ui/` (60+ components). Custom extensions: `cv-upload-modal`, `empty-state`, `star-rating`, `spinner`, `time-ago`.
- Design tokens: Primary `#0047AB`, Bright `#007BFF`, Light BG `#DCEEFF`/`#F0F8FF`, Gold `#FFD700`.
- Domain components: `components/feedback/`, `components/review/`, `components/notification/`, `components/video-call/`.
- Shared widgets: `components/shared/` (`PaginationControl`, `Filter`, `SortButton`).

## Commands

| Command                       | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                    | Dev server                                                               |
| `pnpm build`                  | `tsc -b && vite build`                                                   |
| `pnpm typecheck`              | TypeScript check (`tsc -b`)                                              |
| `pnpm lint` / `pnpm lint:fix` | ESLint                                                                   |
| `pnpm format`                 | Prettier                                                                 |
| `pnpm test`                   | Vitest (watch)                                                           |
| `pnpm test:run`               | Vitest single run                                                        |
| `pnpm generate-schema`        | Regenerate `schema-from-be.d.ts` from `https://api.kdz.asia/v3/api-docs` |

## Adding a New Feature

1. `pnpm generate-schema` (if backend changed)
2. Add/update types in `interfaces/schema.types.ts`
3. Create manager in `services/` implementing `BaseManager<T>` — add mock data in `mocks/`
4. Create hook in `hooks/` wrapping manager with React Query
5. Create page in `pages/<Role>/` following existing folder structure
6. Add route in `App.tsx` (User/Mentor: nested under layout; Admin: add tab to `AdminDashboardPage`)
7. Export from barrel files (`services/index.ts`, `hooks/index.ts`, page `index.ts`)

## Testing

- **Framework**: Vitest + jsdom + `@testing-library/react`. Config in `vite.config.ts`.
- **Pattern**: Tests live next to source (`services/auth.manager.test.ts`). Mock `fetchClient` or set `MANAGER_MODE` to `"mock"`.
- **Setup**: `src/test/setup.ts` imports `@testing-library/jest-dom`.

## Gotchas

- `VITE_MANAGER_MODE`: `"mock"` (default) uses mock data; `"api"` hits real backend. Managers branch on this.
- Axios managers (`createApiInstance`) do NOT auto-inject auth tokens. Only `fetchClient` (openapi-fetch) does via middleware.
- Admin pages are NOT routed — they render via tab switching inside `AdminDashboardPage`. Adding an admin feature means adding a tab + component, not a route.
- `buildEndpoint()` from `constants/api.config.ts` substitutes `:id` params: `buildEndpoint("/api/users/:id", { id: 5 })`.
- Form validation: Zod schemas + react-hook-form (`@hookform/resolvers`).
- Path alias: `@/` → `src/` (configured in `vite.config.ts` and `tsconfig.json`).
