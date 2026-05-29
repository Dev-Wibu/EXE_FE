/**
 * Type-safe API Client using openapi-fetch and openapi-react-query
 * Based on schema-from-be.d.ts
 */

import type { paths } from "../../schema-from-be";

import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import { API_BASE_URL, isPublicAuthRequest } from "@/constants/api.config";
import { normalizeApiError } from "@/lib/error-normalizer";

// Create the fetch client with base configuration
const fetchClient = createFetchClient<paths>({
  baseUrl: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add middleware to include JWT token in Authorization header and log requests/responses
fetchClient.use({
  async onRequest({ request }) {
    // Dynamically import to avoid circular dependency
    const { useAuthStore } = await import("@/stores/authStore");
    const token = useAuthStore.getState().token;
    const shouldSkipAuthHeader = isPublicAuthRequest(request.url, request.method);

    if (token && !shouldSkipAuthHeader) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }

    // Log API request (development only)
    if (import.meta.env.DEV) {
      console.log("🚀 API Request:", {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString(),
      });

      // Log request body if present (for POST/PUT requests)
      if (request.method === "POST" || request.method === "PUT") {
        try {
          const clonedRequest = request.clone();
          const body = await clonedRequest.text();
          if (body) {
            console.log("📦 Request Body:", JSON.parse(body));
          }
        } catch {
          console.log("📦 Request Body: (unable to parse)");
        }
      }
    }

    return request;
  },
  async onResponse({ request, response }) {
    let finalResponse = response;
    let payload: unknown;
    let hasJson = false;

    // Detect and parse JSON body
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const clonedForParse = response.clone();
        payload = await clonedForParse.json();
        hasJson = true;
      } catch {
        // Failed to parse JSON
      }
    }

    if (response.ok) {
      if (hasJson && payload && typeof payload === "object") {
        if ("traceId" in (payload as Record<string, unknown>)) {
          const record = payload as Record<string, unknown>;
          let unwrappedPayload: unknown = payload;
          const keys = Object.keys(record);

          if (
            keys.includes("data") &&
            (keys.length === 2 || (keys.length === 1 && !keys.includes("traceId")))
          ) {
            unwrappedPayload = record["data"];
          } else {
            unwrappedPayload = Object.fromEntries(
              Object.entries(record).filter(([k]) => k !== "traceId")
            );
          }

          const newResponse = new Response(JSON.stringify(unwrappedPayload), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
          Object.defineProperty(newResponse, "url", { value: response.url });
          finalResponse = newResponse;

          // Use unwrapped payload for subsequent usage/logging
          payload = unwrappedPayload;
        }
      }

      // Log successful API response (development only)
      if (import.meta.env.DEV) {
        console.log("✅ API Response:", {
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          url: finalResponse.url,
          data: hasJson ? payload : "(non-JSON response)",
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Failed response handling
      if (!hasJson) {
        try {
          payload = await response.clone().text();
        } catch {
          payload = undefined;
        }
      }

      const normalizedError = normalizeApiError(
        {
          status: response.status,
          data: payload,
        },
        "Đã xảy ra lỗi khi gọi API."
      );

      // ALWAYS log failed API requests with traceId in all environments
      console.error(`❌ API Error [Trace ID: ${normalizedError.traceId || "N/A"}]:`, {
        status: response.status,
        url: response.url,
        message: normalizedError.message,
        traceId: normalizedError.traceId,
        payload,
      });
      if (normalizedError.traceId) {
        console.error(`[COPY TRACE ID] ${normalizedError.traceId}`);
      }
    }

    // Auto-logout on 401 (token expired or invalid)
    if (response.status === 401 && !isPublicAuthRequest(request.url, request.method)) {
      const { useAuthStore } = await import("@/stores/authStore");
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return finalResponse;
  },
});

// Create the React Query client
export const $api = createClient(fetchClient);

// Export the fetch client for direct use if needed
export { fetchClient };
