# 01 — Architecture Overview

> **Project:** `exe-fe` — AI Interview Platform Frontend  
> **Stack:** React 19 · Vite 7 · TypeScript 5.9 · TailwindCSS 4 · Zustand · React Query · shadcn/ui  
> **Last Synced:** 2026-06-05

---

## 1. Technology Stack & Rationale

| Technology              | Version        | Purpose                               | Why Chosen                                                                                   |
| ----------------------- | -------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| **React**               | 19.2.0         | UI framework                          | Latest stable with Server Components-ready architecture, concurrent features                 |
| **Vite**                | 7.3.1          | Build tool & dev server               | Near-instant HMR, native ESM, Rollup-based production builds                                 |
| **TypeScript**          | 5.9.3          | Type safety                           | Strict mode enabled, `verbatimModuleSyntax`, `erasableSyntaxOnly`                            |
| **TailwindCSS**         | 4.1.17         | Utility-first CSS                     | V4 with native CSS-first config (`@tailwindcss/vite` plugin), no `tailwind.config.js` needed |
| **Zustand**             | 5.0.9          | Client state management               | Lightweight, no boilerplate, `persist` middleware for localStorage                           |
| **React Query**         | 5.90.11        | Server state management               | Declarative data fetching, caching, deduplication, background refetch                        |
| **openapi-fetch**       | 0.15.0         | Type-safe API client                  | Generated from OpenAPI spec, full TypeScript inference                                       |
| **openapi-react-query** | 0.5.1          | React Query adapter for openapi-fetch | Bridges `$api` client with React Query hooks                                                 |
| **React Router**        | 7.10.0         | Client-side routing                   | Nested routes, role-based route guards, SPA navigation                                       |
| **shadcn/ui**           | new-york style | Component library                     | Radix UI primitives + Tailwind styling, fully customizable, no runtime overhead              |
| **Zod**                 | 4.1.13         | Schema validation                     | Form validation with react-hook-form integration                                             |
| **react-hook-form**     | 7.67.0         | Form management                       | Performant forms with minimal re-renders                                                     |
| **Sonner**              | 2.0.7          | Toast notifications                   | Lightweight, customizable toast system                                                       |
| **Nx**                  | 22.3.3         | Monorepo & task caching               | Cache-aware task pipeline (`format:check → lint → typecheck → build`)                        |
| **Husky**               | 9.1.7          | Git hooks                             | Pre-commit (lint-staged + schema gen) and pre-push (full validation)                         |
| **Vercel**              | —              | Deployment                            | SPA with rewrite rules to `index.html`                                                       |

### Supporting Libraries

| Purpose            | Library                            | Version          |
| ------------------ | ---------------------------------- | ---------------- |
| i18n               | `i18next` + `react-i18next`        | 26.3.0 / 17.0.8  |
| Date formatting    | `date-fns`                         | 4.1.0            |
| Charts             | `recharts`                         | 3.5.1            |
| Video calls        | `@daily-co/daily-js`               | 0.87.0           |
| Animations         | `framer-motion`                    | 12.23.25         |
| File uploads       | `@uppy/*`                          | 5.x              |
| PDF viewer         | `react-pdf` + `pdfjs-dist`         | 10.4.1 / 5.4.296 |
| WebSocket          | `@stomp/stompjs` + `sockjs-client` | 7.3.0 / 1.6.1    |
| Command palette    | `cmdk`                             | 1.1.1            |
| Drawer             | `vaul`                             | 1.1.2            |
| OTP input          | `input-otp`                        | 1.4.2            |
| Carousel           | `embla-carousel-react`             | 8.6.0            |
| Panel resizing     | `react-resizable-panels`           | 3.0.6            |
| Image lightbox     | `yet-another-react-lightbox`       | 3.31.0           |
| Dark mode          | `next-themes`                      | 0.4.6            |
| Icons              | `lucide-react`                     | 0.555.0          |
| CSS utilities      | `clsx` + `tailwind-merge`          | 2.1.1 / 3.4.0    |
| Component variants | `class-variance-authority`         | 0.7.1            |

---

## 2. Project Directory Structure

```
exe-fe/
├── .github/
│   └── copilot-instructions.md          # AI agent rules (canonical)
├── .husky/
│   ├── pre-commit                       # Schema gen + lint-staged
│   └── pre-push                         # Full validation pipeline
├── cypress/                             # E2E & component tests
│   ├── e2e/                             # Cypress E2E specs
│   ├── fixtures/                        # Test fixtures
│   ├── screenshots/                     # Test screenshots
│   └── support/                         # Cypress support files
├── docs/
│   ├── error.md                         # Catalogued anti-patterns
│   ├── TECHNICAL_SPEC_GENERATION_PLAN.md
│   ├── UNIT_TEST_GENERATION_PLAN.md
│   └── qa-plan/
├── public/                              # Static assets served at /
├── scripts/                             # Build/dev scripts
├── src/
│   ├── App.tsx                          # Route definitions + top-level providers
│   ├── main.tsx                         # React entry point
│   ├── index.css                        # TailwindCSS 4 + design tokens
│   ├── assets/                          # Static assets (images, fonts, icons)
│   ├── components/
│   │   ├── ui/                          # shadcn/ui primitives (62 components)
│   │   ├── shared/                      # Cross-domain shared components
│   │   ├── layouts/                     # Layout wrappers (AuthLayout, Header, Footer)
│   │   ├── homepage-redesign/           # Homepage redesign components
│   │   ├── feedback/                    # Feedback domain components
│   │   ├── review/                      # Review domain components
│   │   ├── notification/                # Notification domain components
│   │   ├── post/                        # Post/community domain components
│   │   └── video-call/                  # Daily.co video call components
│   ├── constants/                       # Config, colors, endpoint maps
│   ├── contexts/                        # React contexts (QueryProvider)
│   ├── hooks/                           # Custom React hooks (barrel: index.ts)
│   ├── interfaces/                      # TypeScript types (barrel: index.ts)
│   ├── lib/                             # Utility modules (barrel: index.ts)
│   ├── locales/                         # i18n translation files (en.json, vi.json)
│   ├── pages/                           # Route pages grouped by role
│   │   ├── Admin/                       # Admin dashboard tabs (18 domains)
│   │   ├── Auth/                        # Login, Signup, Register, SelectRole
│   │   ├── Enterprise/                  # Company search, JD detail
│   │   ├── Error/                       # 401, 403, 404, 500, 503, 504
│   │   ├── Homepage/                    # Public landing, Features, Resources
│   │   ├── Mentor/                      # Mentor dashboard tabs
│   │   ├── Payment/                     # Payment success/cancel
│   │   ├── Shared/                      # Cross-role pages (Playgrounds, Messenger)
│   │   ├── Staff/                       # Staff moderation pages
│   │   └── User/                        # User dashboard tabs
│   ├── services/                        # API service managers (barrel: index.ts)
│   ├── stores/                          # Zustand stores (barrel: index.ts)
│   └── test/                            # Test setup (Vitest + jest-dom)
├── components.json                      # shadcn/ui configuration
├── eslint.config.js                     # Flat ESLint config
├── nx.json                              # Nx workspace config
├── package.json                         # Dependencies & scripts
├── project.json                         # Nx project targets
├── schema-from-be.d.ts                  # Auto-generated OpenAPI types (DO NOT EDIT)
├── tsconfig.json                        # Root TypeScript config (references)
├── tsconfig.app.json                    # App TypeScript config (strict)
├── tsconfig.node.json                   # Node TypeScript config
├── vercel.json                          # Vercel SPA rewrites
└── vite.config.ts                       # Vite + Vitest config
```

---

## 3. Build & Development Pipeline

### 3.1 — Vite Configuration

```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import checker from "vite-plugin-checker";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss(), checker({ typescript: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Path alias: @/ → src/
    },
  },
  define: {
    global: "window", // Polyfill for libraries expecting Node.js `global`
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/cypress/**"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8",
    },
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

**Key decisions:**

- **`@tailwindcss/vite` plugin** replaces PostCSS-based Tailwind v3 setup — native V4 integration
- **`vite-plugin-checker`** runs TypeScript checking in the dev server background
- **Path alias `@/`** maps to `src/` — enforced project-wide, never use relative `../../`
- **`global: "window"`** polyfill needed for `sockjs-client` and other libs expecting Node globals
- **Vitest** is co-located in `vite.config.ts` — shares the same transform pipeline

### 3.2 — TypeScript Configuration

The project uses a **two-config reference model**:

```
tsconfig.json (root)
├── references: tsconfig.app.json    # Application code (src/)
└── references: tsconfig.node.json   # Config files (vite.config.ts)
```

**`tsconfig.app.json`** (application code):

- **Target:** ES2022
- **Module:** ESNext with bundler resolution
- **Strict mode:** Enabled with additional strictness:
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `erasableSyntaxOnly: true` (prevents `enum` and other runtime-emitted syntax)
  - `noFallthroughCasesInSwitch: true`
  - `noUncheckedSideEffectImports: true`
- **Path alias:** `@/*` → `./src/*`

**`tsconfig.node.json`** (build config):

- **Target:** ES2023
- Only includes `vite.config.ts`
- Node types only

### 3.3 — ESLint Configuration

Uses **flat config** format (ESLint 9+):

```javascript
// eslint.config.js
export default defineConfig([
  globalIgnores(["dist", "EXAMPLE/**", ".nx/**"]),
  eslintPluginPrettierRecommended,
  ...pluginQuery.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // ...
    },
  },
  {
    // shadcn/ui components need export flexibility
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);
```

**Notable plugins:**

- `@tanstack/eslint-plugin-query` — enforces React Query best practices
- `eslint-plugin-prettier` — runs Prettier as ESLint rule
- `eslint-plugin-react-hooks` — validates hook dependency arrays
- `eslint-plugin-react-refresh` — catches non-component exports breaking HMR (disabled for `ui/`)

### 3.4 — Prettier Configuration

```jsonc
// .prettierrc
{
  "printWidth": 100,
  "tabWidth": 2,
  "singleQuote": false,
  "bracketSameLine": true,
  "trailingComma": "es5",
  "endOfLine": "crlf",
  "plugins": [
    "prettier-plugin-packagejson",
    "prettier-plugin-sh",
    "prettier-plugin-organize-imports", // Auto-sorts imports
    "prettier-plugin-organize-attributes", // Auto-sorts JSX attributes
    "prettier-plugin-tailwindcss", // Auto-sorts Tailwind classes
  ],
}
```

**Critical:** Prettier auto-organizes imports and Tailwind classes. Never manually add import grouping comments — they will be removed on format.

---

## 4. Git Hooks (Husky)

### 4.1 — Pre-commit Hook

```bash
echo "🚀 Đang tự động tạo Schema từ Backend..."
pnpm run generate-schema

echo "💅 Đang format code cho các file được commit..."
pnpm lint-staged

git add .
```

**Flow:**

1. **Regenerate OpenAPI types** from the backend spec (`schema-from-be.d.ts`)
2. **Run lint-staged** — applies Prettier + ESLint only to staged files:
   - `*.{ts,tsx,js,jsx}` → `prettier --write` + `eslint --fix`
   - `*.{json,css,scss,md,html,yml,yaml}` → `prettier --write`
3. **Re-add files** (formatting changes may modify staged content)

### 4.2 — Pre-push Hook

Runs the full validation pipeline before allowing pushes:

1. **`pnpm run format:check`** — Prettier formatting verification
2. **`pnpm run lint`** — ESLint check
3. **`pnpm run typecheck`** — TypeScript compilation check
4. **`pnpm run build`** — Full production build

Any failure blocks the push with a descriptive Vietnamese error message.

---

## 5. Nx Task Caching

```jsonc
// nx.json
{
  "targetDefaults": {
    "dev": { "cache": true },
    "build": { "cache": true },
    "lint": { "cache": true },
    "typecheck": { "cache": true },
    "format": { "cache": true },
    "format:check": { "cache": true },
    "generate-schema": { "cache": false }, // Always fetches fresh spec
    "validate": { "cache": true },
  },
}
```

**`validate` pipeline** (from `project.json`):

```jsonc
"validate": {
  "executor": "nx:run-commands",
  "dependsOn": ["format:check", "lint", "typecheck", "build"],
  "options": {
    "command": "echo Validation complete"
  }
}
```

This creates a **dependency chain**: `format:check` → `lint` → `typecheck` → `build` → `validate`. Nx caches each step, so subsequent runs skip unchanged targets.

**`dev` target** depends on `generate-schema` — ensuring fresh API types before starting the dev server:

```jsonc
"dev": {
  "dependsOn": ["generate-schema"],
  "options": { "command": "vite" }
}
```

---

## 6. Deployment (Vercel)

```jsonc
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
}
```

**SPA rewrite rule:** All routes are redirected to `index.html`, allowing React Router to handle client-side routing. This is standard for single-page applications deployed to Vercel.

---

## 7. Design System Foundation

### 7.1 — TailwindCSS 4 Configuration

TailwindCSS v4 uses a **CSS-first** configuration approach (no `tailwind.config.js`):

```css
/* index.css */
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-primary: var(--primary);
  /* ... all design tokens as CSS custom properties */
}
```

### 7.2 — shadcn/ui Configuration

```jsonc
// components.json
{
  "style": "new-york",
  "rsc": false, // Not using React Server Components
  "tsx": true,
  "tailwind": {
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks",
  },
}
```

### 7.3 — Design Tokens (CSS Custom Properties)

The project defines a comprehensive **blue-centric** color palette:

```css
:root {
  /* Brand Colors */
  --navy-blue: #001f3f;
  --dark-navy: #002654;
  --deep-blue: #003366;
  --cobalt-blue: #0047ab; /* Primary brand color */
  --medium-blue: #005b9a;
  --bright-blue: #007bff; /* Interactive elements */
  --light-sky-blue: #66b2ff;
  --pale-blue: #a5c8f2;
  --very-light-blue: #dceeff;
  --alice-blue: #f0f8ff; /* Card backgrounds */
  --gold: #ffd700; /* Star ratings */
  --light-gold: #ffeb99;
}
```

**Light/Dark mode** uses OKLCH color space via CSS custom properties, toggled by the `.dark` class on the root element.

### 7.4 — Component Inventory

**62 shadcn/ui components** in `src/components/ui/`:

| Category              | Components                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Layout**            | `accordion`, `card`, `collapsible`, `resizable`, `scroll-area`, `separator`, `sheet`, `sidebar`                                                                                                                          |
| **Forms**             | `button`, `checkbox`, `input`, `label`, `radio-group`, `select`, `slider`, `switch`, `textarea`, `toggle`, `toggle-group`                                                                                                |
| **Navigation**        | `breadcrumb`, `command`, `context-menu`, `dropdown-menu`, `menubar`, `navigation-menu`, `pagination`, `tabs`                                                                                                             |
| **Overlay**           | `alert-dialog`, `dialog`, `drawer`, `hover-card`, `popover`, `tooltip`                                                                                                                                                   |
| **Feedback**          | `alert`, `badge`, `progress`, `skeleton`, `sonner` (toast)                                                                                                                                                               |
| **Data Display**      | `avatar`, `calendar`, `carousel`, `chart`, `table`, `image-carousel`                                                                                                                                                     |
| **Custom Extensions** | `cv-upload-modal`, `empty-state`, `star-rating`, `spinner`, `time-ago`, `loading-card`, `file-upload-input`, `testimonial-carousel`, `button-group`, `input-group`, `field`, `item`, `kbd`, `native-select`, `input-otp` |

**24 shared components** in `src/components/shared/`:

| Component                            | Purpose                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| `DashboardChromeTabs`                | Chrome-style tab navigation with role-based theming                                     |
| `DashboardSidebar`                   | Collapsible sidebar navigation                                                          |
| `ProtectedRoute` / `PublicOnlyRoute` | Auth route guards                                                                       |
| `SessionExpiryGuard`                 | JWT session polling (30s intervals)                                                     |
| `PaginationControl`                  | Reusable pagination with page size selector                                             |
| `Filter`                             | Generic filter with `FilterCriteria`, `FilterGroup` types                               |
| `SortButton`                         | Toggleable sort direction                                                               |
| `StatusBadge`                        | Label + variant badge                                                                   |
| `ChatComposer` / `MessageBubble`     | Chat UI primitives                                                                      |
| `SocketStatusBadge`                  | WebSocket connection indicator                                                          |
| `ScrollToTopButton`                  | Floating scroll-to-top                                                                  |
| `SettingsModal`                      | User settings dialog                                                                    |
| `ReloadButton`                       | Data refresh                                                                            |
| `DashboardBreadcrumb`                | Breadcrumb generation                                                                   |
| `media/*`                            | `ImageZoomPreview`, `MediaLightboxDialog`, `PdfPreviewViewer`, `UniversalMediaUploader` |

### 7.5 — The `cn()` Utility

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

This is the foundation of all component styling — merges Tailwind classes intelligently, resolving conflicts (e.g., `cn("px-2 px-4")` → `"px-4"`).

---

## 8. Entry Points

### 8.1 — HTML Entry

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/src/assets/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Interview</title>
    <!-- Google Fonts: Inter, Manrope, Open Sans, Orelega One, Poppins, Roboto -->
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&..."
      rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <!-- ResponsiveVoice.js for TTS -->
    <script src="https://code.responsivevoice.org/responsivevoice.js?key=L0x1u2UZ"></script>
  </body>
</html>
```

### 8.2 — React Entry

```typescript
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";           // Initialize i18next before render

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Key details:**

- `StrictMode` is enabled — catches side-effect issues in development
- `i18n` is imported as a side-effect before `App` renders — ensures translations are available immediately

### 8.3 — App Component (Provider Tree)

```
<App>
  └── <ErrorBoundary>              // Catches rendering errors globally
       └── <QueryProvider>          // React Query context
            ├── <Toaster />         // Sonner toast notifications
            └── <BrowserRouter>     // React Router
                 ├── <SessionExpiryGuard />    // JWT polling
                 ├── <PublicScrollToTopButton /> // Scroll UI
                 └── <Routes />               // All route definitions
```

---

## 9. Quality Control Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT WORKFLOW                            │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │  pnpm    │    │  pnpm    │    │  pnpm    │    │  pnpm    │    │
│  │  dev     │───▸│ format   │───▸│ validate │───▸│  push    │    │
│  │          │    │          │    │          │    │          │    │
│  │ Vite HMR │    │Prettier  │    │ Full     │    │ Husky    │    │
│  │ + TS     │    │ auto-    │    │ pipeline │    │ pre-push │    │
│  │ checker  │    │ organize │    │          │    │ gate     │    │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    │
│                                                                     │
│  VALIDATION CHAIN (pnpm validate):                                 │
│  format:check ──▸ lint ──▸ typecheck ──▸ build                     │
│                                                                     │
│  PRE-COMMIT HOOK:                                                   │
│  generate-schema ──▸ lint-staged (prettier + eslint)               │
│                                                                     │
│  PRE-PUSH HOOK:                                                     │
│  format:check ──▸ lint ──▸ typecheck ──▸ build                     │
└─────────────────────────────────────────────────────────────────────┘
```

| Gate              | Tool                          | Scope                          | Auto-fix?                 |
| ----------------- | ----------------------------- | ------------------------------ | ------------------------- |
| **Formatting**    | Prettier + plugins            | All staged/global files        | Yes (`pnpm format`)       |
| **Linting**       | ESLint (flat config)          | `.ts`, `.tsx` files            | Partial (`pnpm lint:fix`) |
| **Type checking** | TypeScript (`tsc -b`)         | All `src/` files               | No (manual fix)           |
| **Build**         | Vite (`tsc -b && vite build`) | Full production bundle         | No (manual fix)           |
| **Schema**        | `openapi-typescript`          | `schema-from-be.d.ts`          | Auto (pre-commit)         |
| **Tests**         | Vitest                        | `{src,tests}/**/*.{test,spec}` | N/A                       |

---

## 10. Key Architectural Patterns

### 10.1 — Four Roles, Four Route Trees

```
                    ┌─────────────────────────────────────────┐
                    │              PUBLIC ROUTES               │
                    │  /  /login  /signup  /questions/*        │
                    │  /enterprise/*  /features/*  /resources/*│
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────┴───────────────────────┐
                    │         ROLE-BASED DASHBOARDS            │
                    ├──────────┬──────────┬──────────┬────────┤
                    │   USER   │  MENTOR  │  ADMIN   │ STAFF  │
                    │ /user/*  │ /mentor/*│ /admin   │/staff/*│
                    │ChromeTabs│ChromeTabs│ChromeTabs│Standalone│
                    │+Outlet   │+Outlet   │+Sidebar  │Pages   │
                    └──────────┴──────────┴──────────┴────────┘
```

| Role       | Route Pattern | Shell Component       | Navigation                                         |
| ---------- | ------------- | --------------------- | -------------------------------------------------- |
| **USER**   | `/user/*`     | `UserDashboardPage`   | ChromeTabs + nested `<Outlet />`                   |
| **MENTOR** | `/mentor/*`   | `MentorDashboardPage` | ChromeTabs + nested `<Outlet />`                   |
| **ADMIN**  | `/admin`      | `AdminDashboardPage`  | ChromeTabs + built-in sidebar, `?tab=` query param |
| **STAFF**  | `/staff/*`    | `StaffDashboardPage`  | Standalone pages at `/staff/reviews`, etc.         |

### 10.2 — Route Guards

```typescript
// ProtectedRoute — requires authentication + role matching
<ProtectedRoute allowedRoles={["USER"]} />

// PublicOnlyRoute — redirects logged-in users to their dashboard
<PublicOnlyRoute />
```

Both read from `useAuthStore` (Zustand persisted to localStorage).

### 10.3 — State Management Split

| Layer               | Technology          | Storage                  | Examples                                    |
| ------------------- | ------------------- | ------------------------ | ------------------------------------------- |
| **Server state**    | React Query         | Memory (cache)           | API responses, mutations                    |
| **Client state**    | Zustand             | localStorage (persisted) | Auth token, user info, theme, notifications |
| **URL state**       | React Router        | Browser URL              | `?tab=` params, search params               |
| **Form state**      | react-hook-form     | Component state          | Form inputs, validation                     |
| **Component state** | `useState`/`useRef` | Component-local          | Modals, dropdowns, local UI state           |

### 10.4 — Backend Contract

- **API Base:** `https://api.kdz.asia` (via `VITE_API_BASE_URL`)
- **Auth:** JWT Bearer tokens, auto-injected via `$api` middleware
- **Response wrapper:** `{ traceId, data }` — auto-unwrapped by the API client
- **OpenAPI spec:** `https://api.kdz.asia/v3/api-docs`
- **Generated types:** `schema-from-be.d.ts` — **never edit manually**

---

_Document generated from source code analysis on 2026-06-05._
