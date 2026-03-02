/**
 * Type-safe API Client using openapi-fetch and openapi-react-query
 * Based on schema-from-be.d.ts
 */

import type { paths } from "../../schema-from-be";

import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

// Get the API base URL from environment or use default
// Note: Do not include /api suffix here as it's already in the endpoint paths
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.kdz.asia";

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

    if (token) {
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
  async onResponse({ response }) {
    // Log API response (development only)
    if (import.meta.env.DEV) {
      const clonedResponse = response.clone();

      try {
        const data = await clonedResponse.json();
        console.log("✅ API Response:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          data: data,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // If JSON parse fails, try to get raw text for debugging
        try {
          const clonedResponse2 = response.clone();
          const rawText = await clonedResponse2.text();
          console.log("✅ API Response:", {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            body: "(unable to parse JSON)",
            rawText: rawText,
            timestamp: new Date().toISOString(),
          });
        } catch {
          console.log("✅ API Response:", {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            body: "(unable to parse JSON or text)",
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Auto-logout on 401 (token expired or invalid)
    if (response.status === 401) {
      const { useAuthStore } = await import("@/stores/authStore");
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }

    return response;
  },
});

// Create the React Query client
export const $api = createClient(fetchClient);

// Export the fetch client for direct use if needed
export { fetchClient };
