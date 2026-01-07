# Copilot Instructions for EXE201 Frontend

## Project Overview
Interview preparation platform (React 19 + TypeScript + Vite) with AI-powered and mentor-led mock interviews. Uses **shadcn/ui** components, **TanStack Query** for data fetching, and **Zustand** for state management.

## Architecture

### API Layer (Type-Safe)
- **Schema-first approach**: Backend OpenAPI spec generates types via `pnpm generate-schema` → [schema-from-be.d.ts](../schema-from-be.d.ts)
- **Type-safe client**: [src/lib/api.ts](../src/lib/api.ts) uses `openapi-fetch` + `openapi-react-query` for fully typed API calls
- **Manager pattern**: Services in [src/services/](../src/services/) wrap API calls with mock/real mode switching via `VITE_MANAGER_MODE` env var
- **Mock mode**: Set `VITE_MANAGER_MODE=mock` to use mock data from [src/mocks/](../src/mocks/) during development

### State Management
- **Auth state**: [src/stores/authStore.ts](../src/stores/authStore.ts) - Zustand with localStorage persistence for user/token
- **Server state**: TanStack Query handles caching, configured in [src/contexts/QueryProvider.tsx](../src/contexts/QueryProvider.tsx)

### Component Structure
```
src/components/
├── ui/          # shadcn/ui primitives (DO NOT edit manually - use `pnpm dlx shadcn@latest add <component>`)
├── layouts/     # Page layouts (AuthLayout, UserDashboardLayout, MainLayout)
```

### Page Organization
```
src/pages/
├── Auth/        # Login, Signup, MentorRegister, SelectRole
├── User/        # Dashboard features: AIInterview, MockInterview, AIChat, Questions
├── Manager/     # Admin: UserManagement, MentorManagement, SessionManagement
├── Homepage/    # Landing page
```

## Key Patterns

### Creating API Services
```typescript
// src/services/example.manager.ts
export class ExampleManager {
  private mode = MANAGER_MODE;  // 'mock' | 'api'
  
  async getData(): Promise<ApiResponse<Data>> {
    if (this.mode === "mock") {
      return mockData;  // from src/mocks/
    }
    // Real API call
  }
}
```

### Using Mutations with Toast Feedback
```typescript
import { useMutationHandler } from "@/hooks";

const { mutate } = useMutationHandler({
  mutationFn: authManager.login,
  successMessage: "Logged in successfully",
  onSuccess: (data) => { /* handle success */ },
});
```

### Styling
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- Tailwind v4 with CSS variables for theming (see [src/index.css](../src/index.css))
- Color tokens defined in [src/constants/colors.ts](../src/constants/colors.ts)

### Path Aliases
All imports use `@/` alias → `src/` (configured in [vite.config.ts](../vite.config.ts) and [components.json](../components.json))

## Commands
| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server |
| `pnpm build` | TypeScript check + Vite build |
| `pnpm generate-schema` | Regenerate types from backend OpenAPI spec |
| `pnpm lint` | ESLint check |
| `pnpm typecheck` | TypeScript only (no build) |

## File Conventions
- **Barrel exports**: Each directory has `index.ts` re-exporting public modules
- **Page naming**: `<Feature>Page.tsx` (e.g., `AIInterviewListPage.tsx`)
- **Service naming**: `<domain>.manager.ts` with class-based managers
- **Interface files**: Types in [src/interfaces/](../src/interfaces/), schema types derived from backend

## Environment Variables
```env
VITE_API_BASE_URL=https://api.kdz.asia  # Backend API
VITE_MANAGER_MODE=mock|api              # mock for dev, api for real backend
```

## Adding New Features
1. **New page**: Create in appropriate `src/pages/<Domain>/` folder, export via `index.ts`
2. **New API endpoint**: Add to [src/constants/api.config.ts](../src/constants/api.config.ts), create mock in `src/mocks/`, implement in `src/services/`
3. **New UI component**: Use `pnpm dlx shadcn@latest add <component>` - never manually edit `src/components/ui/`
4. **New route**: Add to [src/App.tsx](../src/App.tsx) under appropriate layout
