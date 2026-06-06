# Design System & UI Components

> **Source:** `src/components/ui/`, `src/components/shared/`, `src/index.css`, `src/constants/colors.ts`, `components.json`  
> **Last Synced:** 2026-06-05

---

## 1. Foundation

### shadcn/ui Configuration (`components.json`)

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

| Setting       | Value      | Impact                                      |
| ------------- | ---------- | ------------------------------------------- |
| Style         | `new-york` | Smaller, more refined component variants    |
| Base color    | `slate`    | Neutral gray palette for component defaults |
| CSS variables | `true`     | All colors defined as CSS custom properties |
| Icon library  | `lucide`   | Tree-shakeable icon imports                 |

### CSS Variables Architecture (`src/index.css`)

Uses TailwindCSS 4's `@theme inline` directive to map CSS variables to Tailwind color tokens.

#### Light Theme (`:root`)

| Variable        | Value                        | Usage                              |
| --------------- | ---------------------------- | ---------------------------------- |
| `--primary`     | `oklch(0.208 0.042 265.755)` | Dark navy (buttons, active states) |
| `--background`  | `oklch(1 0 0)`               | White                              |
| `--card`        | `oklch(1 0 0)`               | White                              |
| `--border`      | `oklch(0.929 0.013 255.508)` | Light gray border                  |
| `--destructive` | `oklch(0.577 0.245 27.325)`  | Red                                |
| `--muted`       | `oklch(0.968 0.007 247.896)` | Very light blue-gray               |

#### Dark Theme (`.dark`)

| Variable        | Value                        | Usage                   |
| --------------- | ---------------------------- | ----------------------- |
| `--primary`     | `oklch(0.929 0.013 255.508)` | Light border (inverted) |
| `--background`  | `oklch(0.129 0.042 264.695)` | Dark navy               |
| `--card`        | `oklch(0.208 0.042 265.755)` | Slightly lighter navy   |
| `--border`      | `oklch(1 0 0 / 10%)`         | White at 10% opacity    |
| `--destructive` | `oklch(0.704 0.191 22.216)`  | Brighter red            |

#### Brand Color Palette

```css
--navy-blue: #001f3f;
--dark-navy: #002654;
--deep-blue: #003366;
--cobalt-blue: #0047ab; /* Primary brand */
--medium-blue: #005b9a;
--bright-blue: #007bff; /* Links, interactive */
--light-sky-blue: #66b2ff; /* Dark mode primary */
--pale-blue: #a5c8f2;
--very-light-blue: #dceeff;
--alice-blue: #f0f8ff; /* Card backgrounds */
--gold: #ffd700; /* Star ratings */
--light-gold: #ffeb99;
```

### Responsive Font Sizing

```css
html[data-font-size="small"] {
  font-size: 14px;
}
html[data-font-size="default"] {
  font-size: 16px;
}
html[data-font-size="large"] {
  font-size: 18px;
}
```

Managed via the `SettingsModal` component's font size setting.

---

## 2. Utility Function (`cn`)

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Combines `clsx` (conditional class merging) with `tailwind-merge` (deduplication of conflicting Tailwind classes).

---

## 3. UI Component Inventory (62 components)

### Standard shadcn/ui Components

| Component      | File                  | Purpose                        |
| -------------- | --------------------- | ------------------------------ |
| Accordion      | `accordion.tsx`       | Collapsible content sections   |
| AlertDialog    | `alert-dialog.tsx`    | Modal confirmations            |
| Alert          | `alert.tsx`           | Inline alert messages          |
| AspectRatio    | `aspect-ratio.tsx`    | Proportional containers        |
| Avatar         | `avatar.tsx`          | User profile images            |
| Badge          | `badge.tsx`           | Status labels                  |
| Breadcrumb     | `breadcrumb.tsx`      | Navigation breadcrumbs         |
| Button         | `button.tsx`          | Primary action element         |
| Calendar       | `calendar.tsx`        | Date picker                    |
| Card           | `card.tsx`            | Content containers             |
| Carousel       | `carousel.tsx`        | Image/content carousel         |
| Chart          | `chart.tsx`           | Recharts wrapper               |
| Checkbox       | `checkbox.tsx`        | Boolean toggle                 |
| Collapsible    | `collapsible.tsx`     | Expandable sections            |
| Command        | `command.tsx`         | Command palette (cmdk)         |
| ContextMenu    | `context-menu.tsx`    | Right-click menus              |
| Dialog         | `dialog.tsx`          | Modal dialogs                  |
| Drawer         | `drawer.tsx`          | Slide-in panels (vaul)         |
| DropdownMenu   | `dropdown-menu.tsx`   | Action dropdowns               |
| Form           | `form.tsx`            | Form wrapper (react-hook-form) |
| HoverCard      | `hover-card.tsx`      | Hover preview cards            |
| InputOTP       | `input-otp.tsx`       | OTP verification input         |
| Input          | `input.tsx`           | Text input fields              |
| Label          | `label.tsx`           | Form labels                    |
| Menubar        | `menubar.tsx`         | Application menu bar           |
| NavigationMenu | `navigation-menu.tsx` | Navigation menus               |
| Pagination     | `pagination.tsx`      | Page navigation                |
| Popover        | `popover.tsx`         | Floating content               |
| Progress       | `progress.tsx`        | Progress indicators            |
| RadioGroup     | `radio-group.tsx`     | Radio button groups            |
| Resizable      | `resizable.tsx`       | Resizable panels               |
| ScrollArea     | `scroll-area.tsx`     | Custom scroll containers       |
| Select         | `select.tsx`          | Dropdown selectors             |
| Separator      | `separator.tsx`       | Visual dividers                |
| Sheet          | `sheet.tsx`           | Side panels                    |
| Sidebar        | `sidebar.tsx`         | App sidebar                    |
| Skeleton       | `skeleton.tsx`        | Loading placeholders           |
| Slider         | `slider.tsx`          | Range sliders                  |
| Sonner         | `sonner.tsx`          | Toast notifications            |
| Switch         | `switch.tsx`          | Toggle switches                |
| Table          | `table.tsx`           | Data tables                    |
| Tabs           | `tabs.tsx`            | Tab containers                 |
| Textarea       | `textarea.tsx`        | Multi-line input               |
| ToggleGroup    | `toggle-group.tsx`    | Button toggle groups           |
| Toggle         | `toggle.tsx`          | Single toggle button           |
| Tooltip        | `tooltip.tsx`         | Hover tooltips                 |

### Custom Extensions (Beyond Standard shadcn)

| Component               | File                       | Purpose                   |
| ----------------------- | -------------------------- | ------------------------- |
| **ButtonGroup**         | `button-group.tsx`         | Grouped button layout     |
| **CV Upload Modal**     | `cv-upload-modal.tsx`      | CV/resume upload dialog   |
| **EmptyState**          | `empty-state.tsx`          | Empty list placeholder    |
| **Empty**               | `empty.tsx`                | Alternative empty state   |
| **Field**               | `field.tsx`                | Form field wrapper        |
| **FileUploadInput**     | `file-upload-input.tsx`    | File upload with preview  |
| **ImageCarousel**       | `image-carousel.tsx`       | Image gallery carousel    |
| **InputGroup**          | `input-group.tsx`          | Input with prefix/suffix  |
| **Item**                | `item.tsx`                 | List item component       |
| **Kbd**                 | `kbd.tsx`                  | Keyboard shortcut display |
| **LoadingCard**         | `loading-card.tsx`         | Card with loading spinner |
| **NativeSelect**        | `native-select.tsx`        | HTML native `<select>`    |
| **Spinner**             | `spinner.tsx`              | Loading spinner (orbit)   |
| **StarRating**          | `star-rating.tsx`          | Star rating display/input |
| **TestimonialCarousel** | `testimonial-carousel.tsx` | Testimonial carousel      |
| **TimeAgo**             | `time-ago.tsx`             | Relative time display     |

---

## 4. Shared Components (`src/components/shared/`)

| Component                | File                      | Purpose                                                                                 |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------- |
| `DashboardChromeTabs`    | `DashboardChromeTabs.tsx` | Chrome-style tab bar (closeable tabs, context menu)                                     |
| `DashboardSidebar`       | `DashboardSidebar.tsx`    | Collapsible sidebar with logo, menu groups, user info                                   |
| `DashboardSidebarToggle` | `sidebar-collapse.ts`     | Sidebar collapse state management                                                       |
| `DashboardBreadcrumb`    | `DashboardBreadcrumb.tsx` | Auto-generated breadcrumbs from route                                                   |
| `ProtectedRoute`         | `ProtectedRoute.tsx`      | Auth guard (role-based)                                                                 |
| `PublicOnlyRoute`        | `PublicOnlyRoute.tsx`     | Guest-only guard                                                                        |
| `SessionExpiryGuard`     | `SessionExpiryGuard.tsx`  | JWT expiry monitor (render-less)                                                        |
| `SettingsModal`          | `SettingsModal.tsx`       | User settings dialog (theme, font, sound)                                               |
| `PaginationControl`      | `PaginationControl.tsx`   | Reusable pagination with page size selector                                             |
| `Filter`                 | `Filter.tsx`              | Generic filter with criteria/groups                                                     |
| `SortButton`             | `SortButton.tsx`          | Toggleable sort direction                                                               |
| `StatusBadge`            | `StatusBadge.tsx`         | Colored status label                                                                    |
| `ReloadButton`           | `ReloadButton.tsx`        | Data refresh button                                                                     |
| `ScrollToTopButton`      | `ScrollToTopButton.tsx`   | Floating scroll-to-top                                                                  |
| `SocketStatusBadge`      | `SocketStatusBadge.tsx`   | WebSocket connection indicator                                                          |
| `ChatComposer`           | `ChatComposer.tsx`        | Chat input with send button                                                             |
| `MessageBubble`          | `MessageBubble.tsx`       | Chat message bubble                                                                     |
| `Media/*`                | `media/`                  | `ImageZoomPreview`, `MediaLightboxDialog`, `PdfPreviewViewer`, `UniversalMediaUploader` |

### 4.1 — DashboardChromeTabs Theme System

Each role passes a **`ChromeTabsTheme`** object to color the tab bar:

```typescript
interface ChromeTabsTheme {
  bg: string; // Container background
  tabActiveBorder: string; // Active tab top border color
  tabActiveBg: string; // Active tab background
  tabActiveText?: string; // Active tab text color
  tabInactiveBg: string; // Inactive tab background
  tabInactiveHover: string; // Inactive tab hover state
  tabInactiveText?: string; // Inactive tab text color
  closeHover: string; // Close button hover color
  addBtnBg: string; // "New tab" button background
  addBtnHover: string; // "New tab" button hover
  menuHover: string; // Context menu item hover
  menuWidth?: string; // Context menu width
}
```

**Role-specific themes:**

| Role   | `bg`           | `tabActiveBorder`    | `tabActiveBg` | Accent |
| ------ | -------------- | -------------------- | ------------- | ------ |
| User   | `bg-slate-50`  | `border-b-primary`   | `bg-white`    | Blue   |
| Mentor | `bg-slate-50`  | `border-b-primary`   | `bg-white`    | Blue   |
| Admin  | `bg-slate-100` | `border-b-primary`   | `bg-white`    | Blue   |
| Staff  | `bg-slate-100` | `border-b-green-600` | `bg-white`    | Green  |

### 4.2 — DashboardSidebar Theme System

Each role passes a **`DashboardSidebarTheme`** object to style the sidebar:

```typescript
interface DashboardSidebarTheme {
  // Container
  wrapper: string; // Full sidebar container classes
  expandedWidth: string; // Width when expanded (e.g., "w-64")
  collapsedWidth?: string; // Width when collapsed (e.g., "w-16")

  // Logo area
  logoBorder: string; // Logo separator border
  logoExpandedPadding: string; // Padding when expanded
  logoCollapsedPadding: string; // Padding when collapsed

  // Navigation
  navWrapper: string; // Nav container
  activeItem: string; // Active menu item classes
  inactiveItem: string; // Inactive menu item classes

  // Footer
  footerBorder: string; // Footer separator
  logoutExpandedBtn: string; // Logout button when expanded
  logoutCollapsedBtn: string; // Logout button when collapsed
  logoutIcon: string; // Logout icon color
  logoutLabel: string; // Logout text color

  // Plus ~15 more fields for flyout, toggle, section labels, dividers
}
```

**Role-specific sidebar themes:**

| Role   | Logo Color          | Active Item                  | Divider            |
| ------ | ------------------- | ---------------------------- | ------------------ |
| User   | `bg-primary` (blue) | `bg-primary/10 text-primary` | `border-slate-200` |
| Mentor | `bg-primary` (blue) | `bg-primary/10 text-primary` | `border-slate-200` |
| Admin  | `bg-primary` (blue) | `bg-primary/10 text-primary` | `border-slate-200` |
| Staff  | `bg-green-600`      | `bg-green-50 text-green-700` | `border-slate-200` |

### 4.3 — StatusBadge Configuration

`StatusBadge` is a simple label + badge pair. The badge **variant and color** are determined by status-utils functions:

```typescript
// src/lib/status-utils.ts
interface StatusBadgeConfig {
  label: string; // i18n-translated label
  variant: BadgeVariant; // shadcn Badge variant (default, outline, secondary)
  className?: string; // Override classes for custom colors
}
```

**Session status badge mapping:**

| Status      | Variant   | Color Classes                              | i18n Key                       |
| ----------- | --------- | ------------------------------------------ | ------------------------------ |
| `DRAFT`     | `outline` | `border-amber-500 bg-amber-500 text-white` | `common.draft`                 |
| `SCHEDULED` | `default` | `bg-yellow-500 text-white`                 | `common.scheduled`             |
| `PAID`      | `default` | `bg-emerald-600 text-white`                | `common.paid`                  |
| `ONGOING`   | `default` | `bg-blue-600 text-white`                   | `common.ongoing`               |
| `COMPLETED` | `default` | `bg-green-600 text-white`                  | `general.completed`            |
| `CANCELED`  | `default` | `bg-red-600 text-white`                    | `common.canceled`              |
| `REJECTED`  | `default` | `bg-rose-600 text-white`                   | `common.refuse`                |
| _(unknown)_ | `outline` | _(none)_                                   | raw status or `general.hollow` |

**Post status badge mapping:**

| Status      | Variant   | Color Classes                       |
| ----------- | --------- | ----------------------------------- |
| `DRAFT`     | `outline` | `border-yellow-500 text-yellow-700` |
| `PUBLISHED` | `outline` | `border-green-500 text-green-700`   |
| `ARCHIVED`  | `outline` | `border-gray-500 text-gray-700`     |

**Content status badge mapping:**

| Status     | Variant           |
| ---------- | ----------------- |
| `pending`  | `secondary`       |
| `approved` | `outline` (green) |
| `rejected` | `outline` (red)   |

**Important:** All badge labels use `i18n.t.bind(i18n)` at module scope (see §7 Internationalization for why). This means labels update when language changes, but the binding happens once at module load time.

---

## 5. Design Patterns

### Variant System (CVA)

Components use `class-variance-authority` for type-safe variant props:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

### Dark Mode

Implemented via `.dark` class on `<html>` element, managed by `next-themes` and `themeStore`:

```typescript
// Theme toggling
const { theme, setTheme } = useTheme(); // next-themes
// Persisted in
useThemeStore() → localStorage key "theme-storage"
```

### 5.1 — Orbit Spinner

The `Spinner` component uses a pure CSS **orbit animation** (no JavaScript intervals):

```css
/* Spinner CSS (inline in spinner.tsx or index.css) */
@keyframes orbit {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.spinner-orbit {
  animation: orbit 1.2s linear infinite;
}
```

The visual consists of a central dot with a small circle orbiting around it, created using CSS transforms rather than SVG or canvas. The `size` prop controls the container dimensions (sm/md/lg/xl).

### 5.2 — Filter Component Types

The `Filter` component accepts structured filter criteria:

```typescript
interface FilterOption {
  label: string;
  value: string | number;
}

interface FilterGroup {
  label: string;
  options: FilterOption[];
}

interface FilterCriteria {
  [field: string]: string | number | boolean | undefined;
}
```

### 5.3 — PaginationControl Props

```typescript
interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showTotalItems?: boolean;
}
```

---

_Document generated from source code analysis on 2026-06-05._
