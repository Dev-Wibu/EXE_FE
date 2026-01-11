# EXE_FE - AI Agent Guide

React + Vite web application for interview practice platform with type-safe backend integration and role-based access.

## Quick Start

**New feature workflow**: `npm run generate-schema` → create service in `services/` → use `$api.useQuery()` or `$api.useMutation()` in pages.

**Essential commands**:

- `npm run generate-schema` - **Critical**: Regenerate types from backend OpenAPI (`https://api.kdz.asia/v3/api-docs`) after backend changes
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run typecheck` - Validate TypeScript before committing
- `npm run lint` - ESLint + Prettier
- `npm run format` - Format code with Prettier

**File structure patterns**:

- **Services**: `services/session.manager.ts` exports manager classes with CRUD methods
- **Pages**: `pages/Manager/UserManagement/` auto-registers routes via React Router
- **State**: Zustand stores in `stores/` with localStorage persistence (see `authStore.ts` pattern)
- **Types**: `schema-from-be.d.ts` auto-generated (**NEVER edit manually**)

**Critical constraints**:

- **Role separation**: USER → `(tabs)` routes, ADMIN → `/manager` routes
- **Auth flow**: JWT stored in `authStore` → auto-injected via `lib/api.ts` middleware
- **Fetch rule**: Prefer `$api` client from `lib/api.ts` for type-safe API calls
- **⚠️ IMPORTANT - HTTP Methods**: Backend team confirmed that **all UPDATE operations must use POST method, NOT PUT**. Always use `api.post()` for updates in service managers, even though the schema shows `put`. This applies to all CRUD operations in `services/*.manager.ts` files.

## Architecture

**Stack**: React 19 + Vite + TypeScript + TailwindCSS + React Query + Zustand + shadcn/ui  
**Backend**: Spring Boot at `https://api.kdz.asia` with JWT auth  
**Target**: Web application for interview practice with USER/ADMIN interfaces

### Design Decisions Agents Must Understand

1. **Dual-Interface Architecture**:
   - USER role → `app/(tabs)/` - Interview practice interface
   - ADMIN role → `app/manager/` - Management dashboard

2. **Type-Safe Backend Integration**:
   - Backend OpenAPI spec → `npm run generate-schema` → `schema-from-be.d.ts` (auto-generated)
   - Service managers wrap API calls with proper types
   - See `services/session.manager.ts` for canonical pattern

3. **JWT Auth Flow**:
   - Login → token stored in `authStore.ts` via Zustand
   - Middleware in `lib/api.ts` auto-injects `Authorization: Bearer` header

4. **State Management Split**:
   - **Server state** → React Query (`$api` hooks invalidate via `queryClient`)
   - **Client state** → Zustand with localStorage persistence

## Code Patterns (Enforce Strictly)

### 1. API Integration - Service Layer Pattern

**Rule**: Prefer using `$api` client from `lib/api.ts` for type-safe API calls.

**⚠️ CRITICAL - HTTP Methods for CRUD Operations**:

- **CREATE** → Use `POST` method
- **READ** → Use `GET` method
- **UPDATE** → Use `POST` method (**NOT PUT** - Backend team confirmation)
- **DELETE** → Use `DELETE` or soft delete via `POST` update

```typescript
// ✅ CORRECT: Using $api client for type-safe queries
import { $api } from "@/lib/api";

export const useSessions = () => {
  return $api.useQuery("get", "/api/sessions");
};

export const useCreateSession = () => {
  return $api.useMutation("post", "/api/sessions/create-session");
};

// ✅ CORRECT: Update operations use POST (not PUT)
export const useUpdateSession = () => {
  return $api.useMutation("post", "/api/sessions"); // POST for updates!
};
```

**Cache invalidation**:

```typescript
import { queryClient } from "@/lib/queryClient"; // Note: Import from queryClient, not QueryProvider

// After mutation success
queryClient.invalidateQueries({ queryKey: ["get", "/api/sessions"] });
```

### 2. State Management - Split Pattern

**Server state** → React Query (`$api` hooks)  
**Client state** → Zustand with localStorage persistence

```typescript
// ✅ Zustand store structure (stores/authStore.ts)
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      clearAuth: () => set({ isLoggedIn: false, user: null, token: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 3. Styling with TailwindCSS + shadcn/ui

Use Tailwind classes and shadcn/ui components:

```tsx
// ✅ CORRECT: Using shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button className="bg-[#0047AB] hover:bg-[#005B9A]">Submit</Button>
  </CardContent>
</Card>;
```

**Design System** (from `color.md`):

- Primary Blue: `#0047AB` (Cobalt Blue)
- Bright Blue: `#007BFF`
- Light Blue Background: `#DCEEFF`, `#F0F8FF`
- Gold Accent: `#FFD700` (for ratings)

### 4. Custom Hooks

**usePagination**: For paginated lists with URL sync

```typescript
import { usePagination } from "@/hooks";

const pagination = usePagination({
  totalCount: items.length,
  pageSize: 10,
});
```

**useMutationHandler**: For mutations with auto-toast notifications

```typescript
import { useMutationHandler } from "@/hooks";

const { mutate } = useMutationHandler({
  mutationFn: createUser,
  successMessage: "User created successfully",
});
```

**useSortable**: For sortable tables

```typescript
import { useSortable } from "@/hooks";

const { sortedData, toggleSort, sortDirection, sortKey } = useSortable(users);
```

## Key Files to Reference

- **API Setup**: `lib/api.ts` (shows middleware pattern for JWT injection)
- **Auth Store**: `stores/authStore.ts` (Zustand with persistence)
- **Query Provider**: `contexts/QueryProvider.tsx` (React Query setup)
- **Service Pattern**: `services/session.manager.ts` (canonical CRUD pattern)
- **Type Safety**: `schema-from-be.d.ts` (auto-generated, never edit manually)
- **UI Components**: `components/ui/` (shadcn/ui components)
- **Shared Types**: `interfaces/schema.types.ts` (aligned with backend schema)

## Common Tasks

### Adding a New Feature

1. **Generate types**: `npm run generate-schema` (if backend changed)
2. **Create interface**: Add to `interfaces/` (e.g., `schema.types.ts`)
3. **Create service**: Add manager class to `services/`
4. **Create page**: Add to `pages/` (follow existing structure)
5. **Update routing**: Modify `App.tsx` if adding routes

### Adding a New API Endpoint

```typescript
// 1. Run schema generation (updates schema-from-be.d.ts from backend)
npm run generate-schema

// 2. Create service hook using $api
export const useGetUsers = () => {
  return $api.useQuery("get", "/api/users");
};

// 3. Use in component
const { data: users, isLoading } = useGetUsers();
```

## Don'ts

❌ **Never** edit `schema-from-be.d.ts` manually (auto-generated)  
❌ **Never** bypass role checks in layouts  
❌ **Never** store sensitive data in localStorage without encryption  
❌ **Never** commit with ESLint errors (run `npm run lint` first)  
❌ **Never** use inline styles when Tailwind classes exist

## Critical Gotchas

1. **Query key format**: openapi-react-query uses `["method", "/path"]` format:

   ```typescript
   queryClient.invalidateQueries({ queryKey: ["get", "/api/sessions"] });
   ```

2. **API modes**: Check `VITE_MANAGER_MODE` env var:
   - `mock` - Uses mock data for development
   - `api` - Uses real backend API

3. **Form validation**: Use Zod schemas with react-hook-form for validation

4. **Demo accounts**: Work in both mock and API modes:
   - `user@example.com` / `user123` → USER role
   - `admin@example.com` / `admin123` → ADMIN role

## Backend Integration Notes

- **Base URL**: `https://api.kdz.asia` (configurable via `VITE_API_BASE_URL`)
- **Auth**: JWT tokens via login endpoint
- **Session**: Stateless JWT (no server-side session management)
- **OpenAPI**: `/v3/api-docs` endpoint for schema generation
