# Internationalization (i18n)

> **Source:** `src/lib/i18n.ts`, `src/locales/en.json`, `src/locales/vi.json`, `src/components/LanguageToggle.tsx`  
> **Last Synced:** 2026-06-05

---

## 1. Architecture

### Library Stack

| Package                            | Purpose                                        |
| ---------------------------------- | ---------------------------------------------- |
| `i18next`                          | Core i18n framework                            |
| `react-i18next`                    | React bindings (`useTranslation`, `Trans`)     |
| `i18next-browser-languagedetector` | Auto-detect language from browser/localStorage |

### Configuration (`src/lib/i18n.ts`)

```typescript
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, vi: { translation: vi } },
    fallbackLng: "vi", // Vietnamese is default
    defaultNS: "translation",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });
```

| Config            | Value                    | Notes                               |
| ----------------- | ------------------------ | ----------------------------------- |
| Fallback language | `vi`                     | Vietnamese if translation missing   |
| Detection order   | localStorage → navigator | Stored preference wins over browser |
| Cache             | localStorage             | Persists choice across sessions     |
| Namespace         | `translation`            | Single flat namespace               |

---

## 2. Locale Files

### Structure

```
src/locales/
├── en.json    # English translations
└── vi.json    # Vietnamese translations
```

### Statistics

| Metric                 | Value      |
| ---------------------- | ---------- |
| Languages              | 2 (en, vi) |
| Top-level namespaces   | 80         |
| Total translation keys | 3,180      |

### Namespace Convention

Keys are organized by domain using a camelCase namespace prefix:

| Namespace Pattern           | Domain                  | Example Keys                                    |
| --------------------------- | ----------------------- | ----------------------------------------------- |
| `adminAdmindashboard`       | Admin dashboard         | `administration`, `companyManagement`           |
| `adminCompanymanagement`    | Company CRUD            | `createJd`, `editCompany`, `closeJd`            |
| `adminSessionmanagement`    | Session management      | —                                               |
| `adminUsermanagement`       | User management         | —                                               |
| `authLoginpage`             | Login page              | —                                               |
| `authSignuppage`            | Signup page             | —                                               |
| `common`                    | Shared strings          | `toggleLanguage`, `vietnameseVi`                |
| `general`                   | Global messages         | `invalidDataPleaseCheckAgain`, `wrongPassword1` |
| `compShared`                | Shared components       | —                                               |
| `compNotification`          | Notification components | —                                               |
| `userAiinterview`           | AI interview flow       | —                                               |
| `userPractice`              | Practice quiz           | —                                               |
| `mentorSessions`            | Mentor sessions         | —                                               |
| `paymentPaymentsuccesspage` | Payment success         | —                                               |
| `errorNotfoundpage`         | 404 page                | —                                               |
| `settings`                  | Settings modal          | —                                               |

### Key Naming Convention

```
{namespace}.{descriptiveCamelCaseKey}
```

Examples:

- `adminCompanymanagement.createJd` → "Create JD"
- `general.wrongPassword1` → "Mật khẩu không đúng"
- `compShared.noData` → "No data"

---

## 3. Usage Patterns

### In React Components (Primary)

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("adminCompanymanagement.companyManagement")}</h1>
      <Button>{t("common.save")}</Button>
      <p>{t("general.invalidDataPleaseCheckAgain")}</p>
    </div>
  );
}
```

### In Non-Component Code (Services, Utils)

```typescript
import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);

// Used in error-normalizer.ts, formatting.ts, status-utils.ts
const statusMessages: Record<number, string> = {
  401: t("general.loginSessionExpiredPleaseLog"),
  404: t("general.requestedDataNotFound"),
};
```

> **⚠️ Known limitation:** Module-level `const t = i18n.t.bind(i18n)` evaluates translations **ONCE** at import time. When the user switches language, module-level `t()` values remain **frozen** in the original language. This is acceptable in `error-normalizer.ts` and `formatting.ts` because those modules produce messages at call time, not at import time.

### Module-Level `t()` Root Cause (Known Bug Pattern)

A major i18n bug was discovered in the 2026-06-01 audit: **112 files** had `const t = i18n.t.bind(i18n)` at module scope, and ~38 component/page files used it for **translated constants** that should update on language switch.

**The problem:**

```tsx
// ❌ BAD — evaluated once at import, never updates on language switch
const MODE_LABELS: Record<string, string> = {
  STANDARD_MOCK: t("common.trialInterview"), // Frozen to initial language
};

export function MyComponent() {
  return <div>{MODE_LABELS[mode]}</div>; // Always shows Vietnamese even after switching to English
}
```

**The fix:**

```tsx
// ✅ GOOD — re-evaluated on every render, updates on language switch
export function MyComponent() {
  const { t } = useTranslation();
  const MODE_LABELS: Record<string, string> = {
    STANDARD_MOCK: t("common.trialInterview"), // Re-evaluated when language changes
  };
  return <div>{MODE_LABELS[mode]}</div>;
}
```

**Where module-level `t()` is still used safely (112 → ~2 files):**

| Module                  | Usage                                   | Safe? | Reason                                                     |
| ----------------------- | --------------------------------------- | ----- | ---------------------------------------------------------- |
| `error-normalizer.ts`   | `normalizeApiError()` fallback messages | ✅    | `t()` is called at error-handling time, not at import time |
| `formatting.ts`         | `formatDate()`, `formatCurrency()`      | ✅    | `t()` is called at formatting time, not at import time     |
| `status-utils.ts`       | `getSessionStatusBadge()`               | ✅    | `t()` is called at render time via function call           |
| Component constant maps | `MODE_LABELS = { ... }`                 | ❌    | Evaluated once at import time, never updates               |

**React Compiler gotchas** when moving translated constants inside components:

1. **Impure functions in render**: `Date.now()` inside `useMemo` or IIFE triggers `react-hooks/purity` error → use `eslint-disable-next-line react-hooks/purity` with explanation
2. **useMemo chain**: If `useMemo` A depends on `useMemo` B, React Compiler can't preserve the chain → flatten to plain computation
3. **useMemo dependency**: When wrapped constants are used in downstream `useMemo`, add them to the dependency array

### With Parameters (Interpolation)

```typescript
t("general.fileCount", { count: 5 }); // "5 files"
t("adminCompanymanagement.totalJd", { n: 12 }); // "Total JD: 12"
```

### With Pluralization

```typescript
// Key: "items" → "{{count}} item" | "{{count}} items"
t("items", { count: 1 }); // "1 item"
t("items", { count: 5 }); // "5 items"
```

### Notification-Specific i18n Patterns

The notification alert system uses several i18n patterns worth noting:

**Count interpolation for batch alerts:**

```typescript
t("general.youHaveNewNotifications", { var_0: notifications.length });
// EN: "You have 3 new notifications"
// VI: "Bạn có 3 thông báo mới"
```

**Fallback title for empty notifications:**

```typescript
t("general.newAnnouncement"); // Used when notification.title is empty
```

**Truncated message with i18n default:**

```typescript
// If notification.message is empty or too long:
t("general.youHaveJustReceivedA"); // Default placeholder
```

**Action button label:**

```typescript
t("general.seeAnnouncement"); // "Xem thông báo" / "See announcement"
```

The `var_0` parameter naming convention is used instead of `count` to avoid conflicts with i18next's built-in `count` pluralization feature.

---

## 4. Language Toggle Component

```typescript
// src/components/LanguageToggle.tsx
export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useSettingsStore();

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);       // Persist to Zustand → localStorage
    i18n.changeLanguage(newLang); // Update i18next
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Globe /> <span>{language.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleLanguageChange("vi")}>
          {t("common.vietnameseVi")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
          English (EN)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Language State Flow

```mermaid
flowchart LR
    A[User clicks toggle] --> B[setLanguage in settingsStore]
    B --> C[localStorage "settings-storage"]
    B --> D[i18n.changeLanguage]
    D --> E[localStorage "i18nextLng"]
    D --> F[React re-renders with new translations]
```

---

## 5. Hard Rules (from `.github/copilot-instructions.md`)

1. **All user-facing strings** in `.tsx` files **must** use `t()` from `react-i18next`
2. **No hardcoded strings** in components (labels, buttons, toasts, placeholders, validation messages)
3. **New features** must include both `en.json` and `vi.json` entries
4. **Translation keys** must follow the `namespace.descriptiveKey` convention

---

## 6. Adding New Translations

### Step-by-Step

1. Determine the namespace (e.g., `adminNewFeature` for a new admin feature)
2. Add keys to both `en.json` and `vi.json`:

```json
// en.json
{
  "adminNewFeature": {
    "title": "New Feature",
    "description": "Description of the new feature",
    "createButton": "Create",
    "successMessage": "Feature created successfully"
  }
}

// vi.json
{
  "adminNewFeature": {
    "title": "Tính năng mới",
    "description": "Mô tả tính năng mới",
    "createButton": "Tạo mới",
    "successMessage": "Đã tạo tính năng thành công"
  }
}
```

3. Use in component:

```tsx
const { t } = useTranslation();
<h1>{t("adminNewFeature.title")}</h1>
<Button>{t("adminNewFeature.createButton")}</Button>
```

### Key Naming Rules

- Use camelCase for the namespace: `adminNewFeature`
- Use camelCase for keys: `createButton`, `successMessage`
- Be descriptive: `companyUpdatedSuccessfully` not `updated`
- Prefix error messages with context: `wrongPassword1`, `emailAlreadyExists`

---

_Document generated from source code analysis on 2026-06-05._
