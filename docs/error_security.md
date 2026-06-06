# Frontend Security Audit Report

> **Audit Date:** 2026-06-06
> **Last Updated:** 2026-06-06 (eighth verification pass — added §10.2 Missing HTTP Security Headers, §6.2 SRI note, updated §12 summary)
> **Auditor:** AI Agent (automated)
> **Scope:** Full `src/` directory of `EXE_FE` React/Vite application
> **Methodology:** Follows `docs/Frontend_Security_Audit_Plan.md`
> **Note:** All 70 dependency vulnerabilities are in **devDependencies** (nx, cypress, vite, vitest, eslint, openapi-typescript). None ship to production bundles.

---

## 1. Vulnerable Dependencies (Supply Chain Analysis)

**Vulnerability Type:** Known CVEs in third-party packages
**Severity:** Critical / High / Moderate / Low

`pnpm audit` revealed **70 vulnerabilities**: 1 critical, 40 high, 27 moderate, 2 low.

### 1.1 — Critical

| Package  | Vulnerable | Patched | Advisory            | Description                                               |
| -------- | ---------- | ------- | ------------------- | --------------------------------------------------------- |
| `vitest` | <4.1.0     | >=4.1.0 | GHSA-5xrq-8626-4rwp | Vitest UI server allows arbitrary file read and execution |

### 1.2 — High

**react-router** (via `react-router-dom`) — 7 high CVEs:

| Vulnerable       | Patched  | Advisory            | Description                                               |
| ---------------- | -------- | ------------------- | --------------------------------------------------------- |
| >=7.0.0 <=7.11.0 | >=7.12.0 | GHSA-2w69-qvjg-hvjx | XSS via Open Redirects                                    |
| >=7.0.0 <7.12.0  | >=7.12.0 | GHSA-8v8x-cx79-35w7 | SSR XSS in ScrollRestoration                              |
| >=7.0.0 <7.14.1  | >=7.14.1 | GHSA-2j2x-hqr9-3h42 | XSS via crafted HTTP redirect                             |
| >=7.0.0 <=7.14.1 | >=7.14.2 | GHSA-49rj-9fvp-4h2h | Arbitrary constructor invocation via turbo-stream RCE     |
| >=7.7.0 <7.13.2  | >=7.13.2 | GHSA-8646-j5j9-6r62 | XSS in unstable RSC redirect via `javascript:` targets    |
| >=7.0.0 <7.15.0  | >=7.15.0 | GHSA-8x6r-g9mw-2r78 | DoS via unbounded path expansion in `__manifest` endpoint |
| >=7.0.0 <7.14.0  | >=7.14.0 | GHSA-rxv8-25v2-qmq8 | DoS via reflected user input in single-fetch              |

**axios** (via `nx`) — 12 high CVEs:

| Vulnerable       | Patched  | Advisory            | Description                                                                            |
| ---------------- | -------- | ------------------- | -------------------------------------------------------------------------------------- |
| >=1.0.0 <1.15.1  | >=1.15.1 | GHSA-pmwg-cvhr-8vh7 | NO_PROXY bypass via RFC 1122 loopback subnet                                           |
| >=1.0.0 <1.15.2  | >=1.15.2 | GHSA-pf86-5x62-jrwf | Prototype Pollution gadgets — response tampering, data exfiltration, request hijacking |
| >=1.0.0 <1.15.1  | >=1.15.1 | GHSA-6chq-wfr3-2hj9 | Header Injection via Prototype Pollution                                               |
| >=1.0.0 <=1.13.4 | >=1.13.5 | GHSA-43fc-jf86-j433 | DoS via `__proto__` key in mergeConfig                                                 |
| >=1.0.0 <1.15.2  | >=1.15.2 | GHSA-q8qp-cvcw-x6jj | Prototype pollution read-side gadgets — credential injection, request hijacking        |
| >=1.0.0 <1.16.0  | >=1.16.0 | GHSA-pjwm-pj3p-43mv | IPv4-mapped IPv6 address bypass (incomplete CVE-2025-62718 fix)                        |
| >=1.0.0 <1.16.0  | >=1.16.0 | GHSA-35jp-ww65-95wh | Full MitM via prototype pollution gadget in `config.proxy`                             |
| >=1.0.0 <1.16.0  | >=1.16.0 | GHSA-hfxv-24rg-xrqf | ReDoS via Cookie Name Injection                                                        |
| >=1.0.0 <1.16.0  | >=1.16.0 | GHSA-777c-7fjr-54vf | Resource allocation without limits/throttling                                          |
| >=1.0.0 <1.16.0  | >=1.16.0 | GHSA-p92q-9vqr-4j8v | Proxy-Authorization credential leak across HTTP-to-HTTPS redirect                      |
| >=1.0.0 <1.16.0  | >=1.16.0 | GHSA-j5f8-grm9-p9fc | Proxy-Authorization header leaks to redirect target                                    |
| >=1.0.0 <1.15.2  | >=1.15.2 | GHSA-3g43-6gmg-66jw | Credential theft & response hijacking via config merge prototype pollution             |

**vite** — 2 high CVEs:

| Vulnerable      | Patched | Advisory            | Description                                  |
| --------------- | ------- | ------------------- | -------------------------------------------- |
| >=7.1.0 <=7.3.1 | >=7.3.2 | GHSA-v2wj-q39q-566r | `server.fs.deny` bypassed with queries       |
| >=7.0.0 <=7.3.1 | >=7.3.2 | GHSA-p9ff-h696-f583 | Arbitrary file read via dev server WebSocket |

**minimatch** (via `eslint`, `openapi-typescript`, `nx`) — 9 entries (3 unique CVEs × 3 version ranges):

| Vulnerable     | Patched | Advisory            | Description                                                   |
| -------------- | ------- | ------------------- | ------------------------------------------------------------- |
| <3.1.3         | >=3.1.3 | GHSA-3ppc-4f35-3m26 | ReDoS via repeated wildcards                                  |
| >=5.0.0 <5.1.7 | >=5.1.7 | GHSA-3ppc-4f35-3m26 | ReDoS (via `openapi-typescript`)                              |
| >=9.0.0 <9.0.6 | >=9.0.6 | GHSA-3ppc-4f35-3m26 | ReDoS (via `nx`, `@typescript-eslint`)                        |
| <3.1.3         | >=3.1.3 | GHSA-7r86-cg39-jmmj | ReDoS: matchOne() combinatorial backtracking                  |
| >=5.0.0 <5.1.8 | >=5.1.8 | GHSA-7r86-cg39-jmmj | ReDoS: matchOne() (via `openapi-typescript`)                  |
| >=9.0.0 <9.0.7 | >=9.0.7 | GHSA-7r86-cg39-jmmj | ReDoS: matchOne() (via `nx`, `@typescript-eslint`)            |
| <3.1.4         | >=3.1.4 | GHSA-23c5-xmqv-rm74 | ReDoS: nested `*()` extglobs                                  |
| >=5.0.0 <5.1.8 | >=5.1.8 | GHSA-23c5-xmqv-rm74 | ReDoS: nested `*()` extglobs (via `openapi-typescript`)       |
| >=9.0.0 <9.0.7 | >=9.0.7 | GHSA-23c5-xmqv-rm74 | ReDoS: nested `*()` extglobs (via `nx`, `@typescript-eslint`) |

**Other high-severity packages:**

| Package     | Vulnerable        | Patched  | Via                  | Advisory            | Description                                             |
| ----------- | ----------------- | -------- | -------------------- | ------------------- | ------------------------------------------------------- |
| `rollup`    | >=4.0.0 <4.59.0   | >=4.59.0 | `vite`               | GHSA-mw96-cpmx-2vgc | Arbitrary File Write via Path Traversal                 |
| `flatted`   | <3.4.0            | >=3.4.0  | `@vitest/ui`         | GHSA-25h7-pfq9-p65f | Unbounded recursion DoS in parse() revive phase         |
| `flatted`   | <=3.4.1           | >=3.4.2  | `@vitest/ui`         | GHSA-rf6f-7fwh-wjgh | Prototype Pollution via parse()                         |
| `picomatch` | >=4.0.0 <4.0.4    | >=4.0.4  | `vite`               | GHSA-c2c7-rcm5-vvqj | ReDoS via extglob quantifiers                           |
| `lodash`    | >=4.0.0 <=4.17.23 | >=4.18.0 | `cypress`            | GHSA-r5fr-rjxr-66jc | Code Injection via `_.template` imports key names       |
| `fast-uri`  | <=3.1.0           | >=3.1.1  | `openapi-typescript` | GHSA-q3j6-qgpj-74h6 | Path traversal via percent-encoded dot segments         |
| `fast-uri`  | <=3.1.1           | >=3.1.2  | `openapi-typescript` | GHSA-v39h-62p7-jpjc | Host confusion via percent-encoded authority delimiters |
| `tmp`       | <0.2.6            | >=0.2.6  | `cypress`            | GHSA-ph9p-34f9-6g65 | Path Traversal via unsanitized prefix/postfix           |

### 1.3 — Moderate (27 vulnerabilities)

**react-router** — 3 moderate CVEs:

| Vulnerable       | Patched  | Advisory            | Description                                                               |
| ---------------- | -------- | ------------------- | ------------------------------------------------------------------------- |
| >=7.5.1 <7.13.2  | >=7.13.2 | GHSA-f22v-gfqf-p8f3 | Stored XSS via unescaped Location header in prerendered redirect HTML     |
| >=7.0.0 <=7.11.0 | >=7.12.0 | GHSA-h5cw-625j-3rxh | CSRF issue in Action/Server Action Request Processing                     |
| >=7.0.0 <7.14.1  | >=7.14.1 | GHSA-2j2x-hqr9-3h42 | Same-origin redirect with `//` path → protocol-relative URL open redirect |

**axios** (via `nx`) — 11 moderate CVEs:

| Vulnerable      | Patched  | Advisory            | Description                                                              |
| --------------- | -------- | ------------------- | ------------------------------------------------------------------------ |
| >=1.0.0 <1.15.0 | >=1.15.0 | GHSA-3p68-rc4w-qgx5 | NO_PROXY hostname normalization bypass → SSRF                            |
| >=1.0.0 <1.15.1 | >=1.15.1 | GHSA-w9j2-pvgh-6h63 | Auth bypass via prototype pollution in `validateStatus` merge            |
| >=1.0.0 <1.15.2 | >=1.15.2 | GHSA-3w6x-2g7m-8v23 | Invisible JSON response tampering via `parseReviver` prototype pollution |
| >=1.0.0 <1.15.1 | >=1.15.1 | GHSA-445q-vr5w-6q77 | CRLF Injection in multipart/form-data via unsanitized `blob.type`        |
| >=1.0.0 <1.15.1 | >=1.15.1 | GHSA-m7pr-hjqh-92cm | `no_proxy` bypass via IP alias → SSRF                                    |
| >=1.0.0 <1.15.1 | >=1.15.1 | GHSA-62hf-57xw-28j9 | Unbounded recursion in `toFormData` → DoS                                |
| >=1.0.0 <1.15.1 | >=1.15.1 | GHSA-5c9x-8gcm-mpgx | Streamed uploads bypass `maxBodyLength` when `maxRedirects: 0`           |
| >=1.0.0 <1.15.1 | >=1.15.1 | GHSA-vf2m-468p-8v99 | Streamed responses bypass `maxContentLength`                             |
| >=1.0.0 <1.15.1 | >=1.15.1 | GHSA-xx6v-rp6x-q39c | XSRF Token cross-origin leakage via `withXSRFToken` boolean coercion     |
| >=1.0.0 <1.15.0 | >=1.15.0 | GHSA-fvcv-3m26-pcqx | Unrestricted cloud metadata exfiltration via header injection chain      |
| >=1.0.0 <1.16.0 | >=1.16.0 | GHSA-898c-q2cr-xwhg | DoS & header injection via prototype pollution read-side gadgets         |

**Other moderate-severity packages:**

| Package            | Vulnerable        | Patched  | Via                  | Advisory            | Description                                                                  |
| ------------------ | ----------------- | -------- | -------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `lodash`           | <=4.17.23         | >=4.18.0 | `cypress`            | GHSA-xxjr-mmjv-4gpg | Prototype Pollution in `_.unset` and `_.omit`                                |
| `lodash`           | <=4.17.23         | >=4.18.0 | `cypress`            | GHSA-f23m-r3pf-42rh | Prototype Pollution via array path bypass in `_.unset`/`_.omit`              |
| `ajv`              | <6.14.0           | >=6.14.0 | `eslint`             | GHSA-2g4f-4pwh-qvx6 | ReDoS when using `$data` option                                              |
| `brace-expansion`  | <1.1.13           | >=1.1.13 | `eslint`             | GHSA-f886-m6hf-6m8v | Zero-step sequence → process hang & memory exhaustion                        |
| `brace-expansion`  | >=2.0.0 <2.0.3    | >=2.0.3  | `@typescript-eslint` | GHSA-f886-m6hf-6m8v | Zero-step sequence (v2 via `minimatch`)                                      |
| `picomatch`        | >=4.0.0 <4.0.4    | >=4.0.4  | `vite`               | GHSA-3v7f-55p6-f55p | Method Injection in POSIX Character Classes                                  |
| `yaml`             | >=2.0.0 <2.8.3    | >=2.8.3  | `nx`                 | GHSA-48c2-rrv3-qjmp | Stack Overflow via deeply nested YAML collections                            |
| `vite`             | >=7.0.0 <=7.3.1   | >=7.3.2  | direct               | GHSA-4w7w-66w2-5vf9 | Path Traversal in optimized deps `.map` handling                             |
| `follow-redirects` | <=1.15.11         | >=1.16.0 | `nx>axios`           | GHSA-r4q5-vmmm-2653 | Custom auth headers leak to cross-domain redirect targets                    |
| `postcss`          | <8.5.10           | >=8.5.10 | `vite`               | GHSA-qx2v-qp2m-jg93 | XSS via unescaped `</style>` in CSS stringify output                         |
| `ws`               | >=8.0.0 <8.20.1   | >=8.20.1 | `jsdom`              | GHSA-58qx-3vcg-4xpx | Uninitialized memory disclosure                                              |
| `uuid`             | <11.1.1           | >=11.1.1 | `cypress`            | GHSA-w5hq-g745-h8pq | Missing buffer bounds check in v3/v5/v6                                      |
| `qs`               | >=6.11.1 <=6.15.1 | >=6.15.2 | `cypress`            | GHSA-q8mj-m7cp-5q26 | DoS: `qs.stringify` crashes on null/undefined entries in comma-format arrays |

### 1.4 — Low (2 vulnerabilities)

| Package | Vulnerable       | Patched  | Via       | Advisory            | Description                              |
| ------- | ---------------- | -------- | --------- | ------------------- | ---------------------------------------- |
| `qs`    | >=6.7.0 <=6.14.1 | >=6.14.2 | `cypress` | GHSA-w7fw-mjwx-w883 | arrayLimit bypass in comma parsing → DoS |
| `axios` | >=1.0.0 <1.15.1  | >=1.15.1 | `nx`      | GHSA-xhjh-pmcv-23jw | Null Byte Injection via Reverse-Encoding |

**Remediation:**

```bash
pnpm update react-router-dom@latest         # pulls react-router >=7.15.0 (fixes all 10 CVEs)
pnpm update vitest@latest @vitest/ui@latest # pulls vitest >=4.1.0, flatted >=3.4.2
pnpm update vite@latest                     # pulls vite >=7.3.2 (fixes 3 CVEs + rollup, picomatch, postcss)
```

For transitive deps that cannot be updated via semver range, add overrides in `package.json`:

```jsonc
"pnpm": {
  "overrides": {
    "minimatch": ">=9.0.7",
    "qs": ">=6.15.2",
    "fast-uri": ">=3.1.2",
    "tmp": ">=0.2.6"
  }
}
```

> **Note:** `axios` is a transitive dependency of `nx` (devDependency). Updating `nx` to a version that uses `axios >= 1.16.0` will resolve all 21 axios CVEs. The `lodash` and `tmp` CVEs come from `cypress` (devDependency) — update `cypress` to resolve them. All vulnerable packages are **devDependencies only** — none ship to production bundles.

---

## 2. Insecure Storage of Sensitive Data

### 2.1 — JWT Token & User Data in localStorage

**Vulnerability Type:** Insecure Client-Side Storage
**Severity:** High
**Location:** `src/stores/authStore.ts` (Lines 64–73)

**Description:**
The Zustand `authStore` persists the JWT token, user object (including email, role, avatar URL), and login state to `localStorage` under the key `auth-storage` using `createJSONStorage(() => localStorage)`. This means the full JWT token and user PII are readable by any JavaScript running on the same origin. If an XSS vulnerability is exploited, an attacker can exfiltrate the token and impersonate the user.

**Evidence:**

```typescript
// src/stores/authStore.ts (Lines 64–73)
{
  name: "auth-storage",
  storage: createJSONStorage(() => localStorage),
  // Only persist these fields
  partialize: (state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,         // ← includes email, name, role, avatarUrl
    token: state.token,       // ← raw JWT
    expiresAt: state.expiresAt,
  }),
}
```

**Remediation:**

- **Ideal:** Store JWT in an HttpOnly, Secure, SameSite=Strict cookie managed by the backend. The frontend should never directly access the token.
- **Practical short-term:** If localStorage must be used, encrypt the token before storage and decrypt on read. Avoid storing user PII (email, name) in localStorage — fetch from `/api/users/me` on rehydration.

---

### 2.2 — Raw User ID in localStorage

**Vulnerability Type:** Insecure Client-Side Storage
**Severity:** Medium
**Location:**

- `src/pages/Auth/LoginPage.tsx` (Line 55)
- `src/pages/Auth/SignupPage.tsx` (Lines 64, 139)

**Description:**
Upon successful login/signup, the raw user ID is explicitly stored in `localStorage` as `current-user-id`. This is redundant with the `authStore` persistence and exposes an additional attack surface.

**Evidence:**

```typescript
// src/pages/Auth/LoginPage.tsx (Line 55)
if (userId && !isNaN(userId)) {
  localStorage.setItem("current-user-id", String(userId));
}

// src/pages/Auth/SignupPage.tsx (Lines 63-64) — after email+password signup
if (userId && !isNaN(userId)) {
  localStorage.setItem("current-user-id", String(userId));
}

// src/pages/Auth/SignupPage.tsx (Lines 138-139) — after Google OAuth signup
if (userId && !isNaN(userId)) {
  localStorage.setItem("current-user-id", String(userId));
}
```

**Remediation:**
Remove the `localStorage.setItem("current-user-id", ...)` calls. The user ID is already available via `useAuthStore.getState().user?.id`. If a separate storage key is needed, store it in the Zustand store's `partialize` instead.

---

### 2.3 — Sensitive Data in Other localStorage Keys

**Vulnerability Type:** Information Exposure
**Severity:** Low
**Locations:**

- `src/lib/payment-recovery.ts` (Line 170) — stores payment recovery context
- `src/lib/session-paid-status-sync.ts` (Line 107) — stores session payment status
- `src/lib/session-payment-context.ts` (Line 105) — stores session payment context

**Description:**
Payment-related data (order codes, session IDs, checkout tokens) is stored in localStorage. While not as sensitive as JWT tokens, this data could be useful for session replay or CSRF-like attacks if combined with an XSS exploit.

**Remediation:**
Use `sessionStorage` instead of `localStorage` for transient payment data so it is cleared when the tab closes. Alternatively, encrypt the stored values.

---

## 3. Unsafe React Patterns (XSS)

### 3.1 — `dangerouslySetInnerHTML` in Chart Component

**Vulnerability Type:** Potential XSS
**Severity:** Low (mitigated by design)
**Location:** `src/components/ui/chart.tsx` (Line 95-96)

**Description:**
The `ChartStyle` component uses `dangerouslySetInnerHTML` to inject CSS custom properties for chart theming. The injected content is generated from a static `ChartConfig` object (developer-defined chart configuration), NOT from user input or API data.

**Evidence:**

```typescript
// src/components/ui/chart.tsx (Lines 95-96)
<style
  dangerouslySetInnerHTML={{
    __html: Object.entries(THEMES)
      .map(([theme, prefix]) => `${prefix} [data-chart=${id}] { ... }`)
      .join("\n"),
  }}
/>
```

**Risk Assessment:** LOW. The `id` and `config` values originate from developer-authored component props, not from user input or external APIs. The `THEMES` object is a static constant. However, if `id` were ever derived from user input (e.g., a chart named by a user), it could become an XSS vector.

**Remediation:**

- **No immediate fix required** given current usage pattern.
- **Defensive improvement:** Sanitize the `id` parameter to ensure it contains only alphanumeric characters and hyphens before interpolation.

---

### 3.2 — No Other XSS Vectors Found

The audit scanned all `.tsx` and `.ts` files in `src/` for:

- `eval()` — **Not found**
- `new Function()` — **Not found**
- `setTimeout(string)` / `setInterval(string)` — **Not found**
- `innerHTML` / `outerHTML` / `document.write()` — **Not found**
- `javascript:` URI schemes in `href`/`src` — **Not found**
- DOMPurify / sanitization libraries — **Not used** (not required given no user-generated HTML rendering)

---

## 4. WebSocket Security

### 4.1 — JWT Token in WebSocket URL Query Parameter

**Vulnerability Type:** Token Leakage via URL
**Severity:** High
**Location:** `src/services/socket.manager.ts` (Line 35)

**Description:**
The JWT token is passed as a query parameter in the WebSocket connection URL (`/ws-chat?token=${token}`). Query parameters are:

- Logged in server access logs
- Stored in browser history
- Visible in browser DevTools Network tab
- Potentially cached by intermediate proxies

This is a well-known anti-pattern for token transmission.

**Evidence:**

```typescript
// src/services/socket.manager.ts (Line 35)
const socketUrl = token ? `${API_BASE_URL}/ws-chat?token=${token}` : `${API_BASE_URL}/ws-chat`;
```

**Remediation:**

- **Ideal:** Pass the token in the STOMP `connectHeaders` only (which is already done on Line 38). Remove the `?token=` query parameter from the URL.
- **Backend change required:** The backend WebSocket endpoint must read the token from the STOMP CONNECT frame headers instead of the URL query parameter.

```typescript
// Recommended fix:
const socketUrl = `${API_BASE_URL}/ws-chat`; // no token in URL
this.stompClient = new Client({
  webSocketFactory: () => new SockJS(socketUrl),
  connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  // ...
});
```

---

### 4.2 — STOMP Debug Logging in All Environments

**Vulnerability Type:** Information Exposure
**Severity:** Medium
**Location:** `src/services/socket.manager.ts` (Lines 40, 48, 140)

**Description:**
The STOMP client's `debug` callback, connection logs, and outgoing message payloads are all logged to the console unconditionally — they execute in **all environments**, including production. This leaks WebSocket protocol details, connection state, and message content (sender ID, recipient ID) to anyone who opens DevTools.

**Evidence:**

```typescript
// src/services/socket.manager.ts (Line 40) — STOMP protocol debug output
debug: (str) => console.log("STOMP: " + str),
```

```typescript
// src/services/socket.manager.ts (Line 48) — connection event
console.log("Connected to STOMP: " + frame);
```

```typescript
// src/services/socket.manager.ts (Line 140) — outgoing message payloads
console.log("DEBUG: Sending Payload:", chatDto); // ← exposes senderId, recipientId
```

**Additional unguarded console calls in the same file:** Lines 59, 68, 73, 78, 120, 149, 159. While `console.error`/`console.warn` calls are less critical, the `console.log` calls at lines 40, 48, 140, and 159 leak operational details in production.

**Remediation:**
Gate all non-error logging behind `import.meta.env.DEV`:

```typescript
debug: import.meta.env.DEV ? (str) => console.log("STOMP: " + str) : undefined,

// And wrap lines 48, 140, 159 in:
if (import.meta.env.DEV) console.log(/* ... */);
```

---

## 5. API & Network Security

### 5.1 — Development Logging Exposes Auth Headers

**Vulnerability Type:** Information Exposure (dev-only)
**Severity:** Low (mitigated by `import.meta.env.DEV` guard)
**Location:** `src/lib/api.ts` (Lines 49–69)

**Description:**
In development mode, the API middleware logs all request headers to the console, including the `Authorization: Bearer <JWT>` header. It also logs the full request body for POST/PUT requests. This is properly gated behind `import.meta.env.DEV` and will not execute in production builds.

**Evidence:**

```typescript
// src/lib/api.ts (Lines 49–69)
if (import.meta.env.DEV) {
  console.log("🚀 API Request:", {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()), // ← includes Authorization
    timestamp: new Date().toISOString(),
  });
  if (request.method === "POST" || request.method === "PUT") {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.text();
      if (body) {
        console.log("📦 Request Body:", JSON.parse(body)); // ← may include passwords, PII
      }
    } catch {
      /* ... */
    }
  }
}
```

**Remediation:**
Filter out the `Authorization` header before logging:

```typescript
const safeHeaders = Object.fromEntries(request.headers.entries());
delete safeHeaders["Authorization"];
console.log("🚀 API Request:", { method: request.method, url: request.url, headers: safeHeaders });
```

---

### 5.2 — Production Error Logging Includes Trace IDs

**Vulnerability Type:** Information Exposure (acceptable)
**Severity:** Low (informational)
**Location:** `src/lib/api.ts` (Lines 154–160)

**Description:**
Failed API requests are logged to the console in ALL environments, including the trace ID, status code, URL, and error message. This is intentional for debugging but could expose internal API structure to anyone with browser DevTools access.

**Evidence:**

```typescript
// src/lib/api.ts (Lines 154–160)
console.error(`❌ API Error [Trace ID: ${normalizedError.traceId || "N/A"}]:`, {
  status: response.status,
  url: response.url,
  message: normalizedError.message,
  traceId: normalizedError.traceId,
  payload,
});
```

**Remediation:**
Consider gating verbose error logging behind `import.meta.env.DEV` in a future iteration. The trace ID logging is acceptable for production debugging.

---

### 5.3 — No CSRF Protection (By Design)

**Vulnerability Type:** N/A
**Severity:** N/A
**Description:**
The application uses JWT Bearer token authentication (not cookie-based sessions), so CSRF protection is not required. The token is explicitly set in the `Authorization` header for each request. CSRF attacks exploit automatic cookie attachment, which does not apply here.

**Status:** ✅ No action needed.

---

### 5.4 — Default HTTP Base URL for Development

**Vulnerability Type:** Insecure Transport (dev-only)
**Severity:** Low (mitigated by environment variable)
**Location:** `src/constants/api.config.ts` (Line 12)

**Description:**
The fallback API base URL is `http://localhost:8080` (HTTP, not HTTPS). This only applies when `VITE_API_BASE_URL` is not set, which should only happen in local development.

**Evidence:**

```typescript
// src/constants/api.config.ts (Line 12)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
```

**Remediation:**
Ensure `.env.production` sets `VITE_API_BASE_URL=https://api.kdz.asia`. Add a build-time check that warns if the base URL starts with `http://` in production.

---

### 5.5 — Ungated Console.log Dumps Mentor Profile with Password

**Vulnerability Type:** Information Exposure
**Severity:** Medium
**Locations:**

- `src/services/mentor.manager.ts` (Line 272)
- `src/pages/Admin/MentorManagement/MentorManagementPage.tsx` (Line 149)
- `src/services/mentor.manager.ts` (Line 338)

**Description:**
Two locations log the entire mentor update payload to the console via `console.log()` in **all environments**, including production. The payloads contain PII fields (`name`, `email`, `bio`, `expertise`, `linkedInUrl`, `currentCompany`) and critically the **`password` field** if provided during the update. Anyone with browser DevTools open during a mentor profile update can see the plaintext password.

**Evidence:**

```typescript
// src/services/mentor.manager.ts (Line 272)
console.log("Update mentor payload:", JSON.stringify(mentorInfo, null, 2));
// mentorInfo includes: name, email, bio, expertise, password, pricePerMinute, ...

// src/pages/Admin/MentorManagement/MentorManagementPage.tsx (Line 149)
console.log("Updating mentor with formData:", formData);
// formData is Partial<MentorFormData> which includes password field

// src/services/mentor.manager.ts (Line 338) — dumps raw backend error response
console.error("Backend error response:", axiosError.response?.data);
// response.data may contain PII, database constraint errors, or Spring stack traces
```

**Remediation:**
Gate behind `import.meta.env.DEV` or remove entirely:

```typescript
if (import.meta.env.DEV) {
  console.log("Update mentor payload:", JSON.stringify(mentorInfo, null, 2));
}
```

---

### 5.6 — Ungated Error Logging Across Service Managers & Components

**Vulnerability Type:** Information Exposure (production error logging)
**Severity:** Low–Medium
**Locations:**

- `src/services/auth.manager.ts` (Lines 485, 649, 736) — `console.error` in login, signup, and mentor registration catch blocks
- `src/services/application.manager.ts` (Lines 62, 87, 119, 143) — `console.error` in all ApplicationService error paths
- `src/services/socket.manager.ts` (Lines 59, 68) — `console.error` logging STOMP parse errors and broker error `frame.body`
- `src/components/video-call/VideoCallProvider.tsx` (Line 168) — `console.error` logging Daily.co room URL + error event
- `src/components/ErrorBoundary.tsx` (Line 29) — `console.error` logging React component stack traces

**Description:**
Multiple service managers and components log raw error objects to `console.error`/`console.warn` without `import.meta.env.DEV` guards. While `console.error` in catch blocks is a common pattern, several of these leak sensitive data:

- `socket.manager.ts:68` logs `frame.body` which may contain chat message content
- `VideoCallProvider.tsx:168` logs the Daily.co meeting room URL (a sensitive endpoint)
- `ErrorBoundary.tsx:29` logs React component stack traces revealing internal architecture
- `mentor.manager.ts:338` (covered in §5.5) logs the full backend error response body

These are not gated by `import.meta.env.DEV` and execute in production.

**Evidence:**

```typescript
// src/services/socket.manager.ts (Line 68)
console.error("STOMP broker error", frame.headers["message"], frame.body);
// frame.body may contain chat message content

// src/components/video-call/VideoCallProvider.tsx (Line 168)
console.error("[Daily.co] init/join error", { roomUrl: normalizedRoomUrl, event });
// Leaks the Daily.co meeting room URL

// src/components/ErrorBoundary.tsx (Line 29)
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error("ErrorBoundary caught:", error, errorInfo);
  // errorInfo.componentStack reveals React component hierarchy
}
```

**Remediation:**
For production observability, replace `console.error` with a proper error reporting service (Sentry, LogRocket, etc.) that scrubs PII before transmission. Alternatively, gate behind `import.meta.env.DEV`:

```typescript
if (import.meta.env.DEV) {
  console.error("STOMP broker error", frame.headers["message"], frame.body);
}
```

---

## 6. Hardcoded Credentials

### 6.1 — Demo Login Accounts in Source Code

**Vulnerability Type:** Hardcoded Credentials
**Severity:** Medium
**Location:** `src/components/DemoLoginButton.tsx` (Lines 39–57)

**Description:**
The `DemoLoginButton` component contains hardcoded demo account credentials (email + password) directly in the source code. While these are intentionally demo accounts, they are:

- Committed to version control
- Accessible to anyone with the built JavaScript bundle
- Real accounts on the production backend

**Evidence:**

```typescript
// src/components/DemoLoginButton.tsx (Lines 39–57)
const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "USER",
    email: "binhan@gmail.com",
    password: "123",
    description: t("compDemologinbutton.userAccountToExperienceStudent"),
  },
  {
    role: "ADMIN",
    email: "thuson@gmail.com",
    password: "12345",
    description: t("compDemologinbutton.administratorAccountToManageThe"),
  },
  {
    role: "MENTOR",
    email: "b@fpt.com",
    password: "12345",
    description: t("compDemologinbutton.mentorAccountToManageInterview"),
  },
];
```

**Remediation:**

- **Short-term:** The `DemoLoginButton` is already conditionally rendered via `isDemoLoginEnabled` (`import.meta.env.DEV || import.meta.env.MODE === "staging"`) at `LoginPage.tsx:33,233`. However, the component is **statically imported**, so the `DEMO_ACCOUNTS` array (with plaintext passwords) is still included in the production JavaScript bundle. Convert the import to a **dynamic `import()`** (e.g., `React.lazy()`) so the module is code-split and excluded from production builds.
- **Long-term:** Remove hardcoded credentials from the frontend entirely. If demo login is needed in production, use a backend endpoint that generates short-lived tokens without exposing passwords.

---

### 6.2 — Hardcoded ResponsiveVoice API Key

**Vulnerability Type:** Hardcoded Credentials
**Severity:** Medium
**Locations:**

- `index.html` (Line 17) — primary exposure via `<script>` tag
- `src/lib/tts-playground.ts` (Line 29) — hardcoded fallback

**Description:**
The ResponsiveVoice text-to-speech API key is hardcoded in **two locations**:

1. **`index.html` (Line 17):** A `<script>` tag loads the ResponsiveVoice library with the key directly in the URL on **every page load**, unconditionally. This is the primary exposure — the key is visible in the page source, browser DevTools Network tab, and server access logs for all visitors.

2. **`tts-playground.ts` (Line 29):** A hardcoded fallback key is used when the `VITE_RESPONSIVE_VOICE_KEY` environment variable is not set. Since `Vite` inlines `import.meta.env.*` at build time, the hardcoded fallback is always present in the compiled JavaScript bundle. Additionally, the key is assigned to `window.rvApiKey` (Line 143), exposing it in the global scope.

**Evidence:**

```html
<!-- index.html (Line 17) — loads on every page, unconditionally -->
<script src="https://code.responsivevoice.org/responsivevoice.js?key=L0x1u2UZ"></script>
```

```typescript
// src/lib/tts-playground.ts (Lines 29, 33, 143)
const DEFAULT_RESPONSIVE_VOICE_KEY = "L0x1u2UZ";

const RESPONSIVE_VOICE_KEY = (
  import.meta.env.VITE_RESPONSIVE_VOICE_KEY ?? DEFAULT_RESPONSIVE_VOICE_KEY
).trim();

// Later in loadResponsiveVoice():
window.rvApiKey = RESPONSIVE_VOICE_KEY; // ← exposes key on global window object
```

**Risk Assessment:** MEDIUM. The ResponsiveVoice API key is a commercial service key. While `ResponsiveVoice` keys are somewhat limited in what they can do (only TTS), exposing the key allows anyone to make API calls using this key's quota. The `index.html` exposure is the more severe of the two: it is loaded on every page for all visitors and cannot be gated behind environment checks. The `window.rvApiKey` assignment in `tts-playground.ts` makes it trivially discoverable via the browser console.

**Remediation:**

- **Remove the hardcoded key from `index.html`** — load ResponsiveVoice conditionally only when TTS is needed (via `useSpeechSynthesis` hook), not on every page.
- **Remove the hardcoded fallback from `tts-playground.ts:29`** — if `VITE_RESPONSIVE_VOICE_KEY` is not set, throw an error or skip loading instead of silently using a hardcoded key.
- **Remove `window.rvApiKey = RESPONSIVE_VOICE_KEY`** — this assignment is unnecessary and exposes the key globally.
- **Ensure `VITE_RESPONSIVE_VOICE_KEY` is set** in `.env.production` (or via Vercel environment variables) and never commit it to version control.
- **Add Subresource Integrity (SRI)** to the ResponsiveVoice `<script>` tag in `index.html`: the script currently loads from a third-party CDN (`code.responsivevoice.org`) without `integrity` or `crossorigin` attributes. If that CDN is compromised, arbitrary JavaScript will execute on **every page** of the application. Add a hash-based `integrity` attribute and pin the script version.

---

## 7. Routing & RBAC Security

### 7.1 — Route Protection Assessment

**Vulnerability Type:** N/A
**Severity:** N/A

**Findings:**

- `ProtectedRoute` component (`src/components/shared/ProtectedRoute.tsx`) correctly checks `isLoggedIn` and `allowedRoles` via `useAuthStore`.
- Unauthenticated users are redirected to `/login`.
- Unauthorized users (wrong role) are redirected to `/error/403`.
- `PublicOnlyRoute` redirects authenticated users to their role-based dashboard.
- Admin pages are tab-based within `AdminDashboardPage` (not independently routed), reducing the attack surface.

**Status:** ✅ Route protection is properly implemented.

---

## 8. External Link Protections

### 8.1 — `target="_blank"` Links

**Vulnerability Type:** Reverse Tabnabbing
**Severity:** Low
**Location:** `src/pages/Enterprise/CompanyDetail/components/CompanyHeroSection.tsx` (Line 131)

**Description:**
Only ONE `target="_blank"` link was found in the entire `src/` directory. It correctly includes `rel="noopener noreferrer"`.

**Evidence:**

```typescript
// src/pages/Enterprise/CompanyDetail/components/CompanyHeroSection.tsx (Lines 130-132)
<a href={company.website} target="_blank" rel="noopener noreferrer" ...>
```

**Status:** ✅ No vulnerability found. Consider adding `react/jsx-no-target-blank` ESLint rule as a preventive measure.

---

## 9. Form & Input Validation

### 9.1 — File Upload Restrictions

**Vulnerability Type:** N/A
**Severity:** N/A

**Findings:**

- `MentorRegisterPage.tsx` uses `react-dropzone` with explicit `accept` MIME types and `maxSizeBytes` limits (5MB per file).
- `UniversalMediaUploader.tsx` uses Uppy with `restrictions.maxFileSize`, `restrictions.maxNumberOfFiles`, and `restrictions.allowedFileTypes`.

**Status:** ✅ File upload restrictions are properly implemented.

---

## 10. Cookie Security

### 10.1 — Sidebar State Cookie Missing Security Flags

**Vulnerability Type:** Missing Cookie Flags
**Severity:** Low
**Location:** `src/components/ui/sidebar.tsx` (Line 82)

**Description:**
The sidebar component sets a cookie to persist the sidebar open/closed state. The cookie is set without `Secure` or `SameSite` flags. While the cookie value (`"open"` or `"closed"`) is not sensitive, the pattern of setting cookies without security flags is a bad practice that could be copied for more sensitive cookies.

**Evidence:**

```typescript
// src/components/ui/sidebar.tsx (Line 82)
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
// Missing: SameSite=Lax (or Strict); Secure (for HTTPS)
```

**Remediation:**
This is a shadcn/ui component with non-sensitive data. No immediate action required. If customizing, add `SameSite=Lax; Secure` flags:

```typescript
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax; Secure`;
```

### 10.2 — Missing HTTP Security Headers (CSP, X-Frame-Options, etc.)

**Vulnerability Type:** Missing Security Hardening
**Severity:** Medium
**Locations:**

- `index.html` — no `<meta http-equiv="Content-Security-Policy">` tag
- `vercel.json` — only contains `rewrites`, no `headers` configuration

**Description:**
The application does not configure **any** HTTP security response headers — neither via `<meta>` tags in `index.html` nor via server/CDN configuration in `vercel.json`. The following critical headers are missing:

| Header                          | Purpose                                                  | Risk                                                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy` (CSP) | Restricts which scripts, styles, and origins can execute | Without CSP, any injected `<script>` tag can run freely. Combined with the XSS vectors noted in §3.1 and the hardcoded CDN script in §6.2, there is no defense-in-depth against script injection. |
| `X-Frame-Options`               | Prevents embedding in `<iframe>`                         | The application can be embedded in a malicious site for clickjacking attacks — an attacker overlays invisible iframes to trick users into clicking admin actions.                                 |
| `X-Content-Type-Options`        | Prevents MIME-type sniffing                              | Browsers may interpret uploaded files (e.g., a user-uploaded HTML file served from the API) as executable content.                                                                                |
| `Referrer-Policy`               | Controls referrer information sent with requests         | JWT tokens or sensitive URLs may leak to third-party sites via the `Referer` header.                                                                                                              |
| `Permissions-Policy`            | Restricts browser feature access                         | Without restrictions, embedded content could access camera, microphone, or geolocation.                                                                                                           |

**Evidence:**

```jsonc
// vercel.json — NO headers section exists
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html",
    },
  ],
}
```

```html
<!-- index.html — NO security meta tags -->
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- Missing: <meta http-equiv="Content-Security-Policy" ...> -->
  <!-- Missing: <meta name="referrer" content="strict-origin-when-cross-origin"> -->
</head>
```

**Remediation:**
Add security headers in `vercel.json`:

```jsonc
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://code.responsivevoice.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.kdz.asia wss://api.kdz.asia;",
        },
      ],
    },
  ],
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
}
```

> **Note:** The CSP `script-src` must include `https://code.responsivevoice.org` to allow the CDN script loaded in `index.html` (§6.2). The `connect-src` must include the backend API domain and WebSocket endpoint. Testing CSP in report-only mode (`Content-Security-Policy-Report-Only`) first is recommended before enforcing.

---

## 11. Verified Safe Patterns

The following patterns were inspected and found to be **securely implemented**:

| Pattern                          | Location                                                   | Assessment                                                                                         |
| -------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `window.open()`                  | `src/lib/media-file-utils.ts` (Line 310)                   | ✅ Uses `"noopener,noreferrer"` features AND sets `openedWindow.opener = null` as defense-in-depth |
| `BroadcastChannel.postMessage()` | `src/lib/notification-alert-bus.ts` (Line 17)              | ✅ Same-origin only; no cross-origin risk                                                          |
| `document.cookie`                | `src/components/ui/sidebar.tsx` (Line 82)                  | ✅ Non-sensitive value (UI state); see §10.1 for flag recommendation                               |
| `.env` configuration             | `.env`                                                     | ✅ No secrets/tokens — only `VITE_API_BASE_URL` and `VITE_MANAGER_MODE`                            |
| Production base URL              | `.env`                                                     | ✅ `VITE_API_BASE_URL=https://api.kdz.asia` — uses HTTPS                                           |
| URL parameter rendering          | `useSearchParams` usage in `useTabsState`, `usePagination` | ✅ Values are parsed as enums/numbers, not rendered as raw HTML                                    |

---

## 12. Summary & Prioritized Remediation

| #   | Vulnerability                                                                              | Severity     | Effort | Priority           |
| --- | ------------------------------------------------------------------------------------------ | ------------ | ------ | ------------------ |
| 1   | Vulnerable dependencies (70 CVEs, all in devDependencies)                                  | Critical–Low | Low    | **P0 — Immediate** |
| 2   | JWT token in WebSocket URL query param                                                     | High         | Medium | **P1 — High**      |
| 3   | JWT + user PII in localStorage                                                             | High         | High   | **P1 — High**      |
| 4   | STOMP debug logging in production                                                          | Medium       | Low    | **P2 — Medium**    |
| 5   | Raw user ID in localStorage (redundant, 3 locations)                                       | Medium       | Low    | **P2 — Medium**    |
| 6   | Hardcoded demo credentials in source (static import leaks to prod bundle)                  | Medium       | Low    | **P2 — Medium**    |
| 7   | Hardcoded ResponsiveVoice API key (`index.html` + `tts-playground.ts` + `window.rvApiKey`) | Medium       | Low    | **P2 — Medium**    |
| 8   | Missing HTTP security headers (no CSP, X-Frame-Options, X-Content-Type-Options, etc.)      | Medium       | Low    | **P2 — Medium**    |
| 9   | Ungated `console.log` dumps mentor profile with password                                   | Medium       | Low    | **P2 — Medium**    |
| 10  | CDN script without Subresource Integrity (SRI) — supply chain risk                         | Medium       | Low    | **P2 — Medium**    |
| 11  | Dev logging exposes Authorization header + request body                                    | Low          | Low    | **P3 — Low**       |
| 12  | `dangerouslySetInnerHTML` in chart.tsx (static data only)                                  | Low          | Low    | **P3 — Low**       |
| 13  | Payment data in localStorage                                                               | Low          | Medium | **P3 — Low**       |
| 14  | Sidebar cookie missing `SameSite`/`Secure` flags                                           | Low          | Low    | **P3 — Low**       |
| 15  | Ungated error logging across services (chat body, room URL, stack traces)                  | Low–Medium   | Low    | **P3 — Low**       |

### Quick Wins (< 30 minutes each)

1. `pnpm update react-router-dom@latest vite@latest vitest@latest @vitest/ui@latest` — fixes critical + 40 high CVEs
2. Gate STOMP debug behind `import.meta.env.DEV` — 1 line change in `socket.manager.ts:40`
3. Convert `DemoLoginButton` to dynamic `import()` in `LoginPage.tsx` — removes credentials from prod bundle (it's already conditionally rendered via `isDemoLoginEnabled`, but the static import keeps it bundled)
4. Remove `localStorage.setItem("current-user-id", ...)` from `LoginPage.tsx:55`, `SignupPage.tsx:64,139`
5. Remove hardcoded `DEFAULT_RESPONSIVE_VOICE_KEY` from `tts-playground.ts:29`, `window.rvApiKey` from Line 143, **and** the `<script>` tag from `index.html:17` — key is exposed in three places
6. Filter `Authorization` header from dev request logging in `api.ts:50-55` — 2 lines
7. Gate `console.log` in `mentor.manager.ts:272` and `MentorManagementPage.tsx:149` behind `import.meta.env.DEV` — prevents mentor profile + password leakage
8. Add security headers to `vercel.json` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP) — copy-paste from §10.2 remediation
9. Add `integrity` + `crossorigin` attributes to the ResponsiveVoice `<script>` tag in `index.html` — prevents CDN compromise from executing malicious JS
