import ky from "ky";
import { AppError } from "./action-client";

/**
 * Production-ready HTTP client setup using ky.
 * Supports configurable defaults, base URL mapping, and interceptors (hooks).
 */
export const apiClient = ky.create({
  prefix: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.placeholder.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        // Retrieve access token from cookies, local storage, or a secure store
        // For demonstration, we simulate retrieval or omit if none exists
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("auth_token");
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }
        }
      },
    ],
    afterResponse: [
      async ({ response }) => {
        if (!response.ok) {
          let errorMessage = "An error occurred during the request";
          let errorCode = "HTTP_ERROR";

          try {
            const body = (await response.json()) as {
              message?: string;
              code?: string;
            };
            if (body?.message) errorMessage = body.message;
            if (body?.code) errorCode = body.code;
          } catch {
            try {
              const text = await response.text();
              if (text) errorMessage = text;
            } catch {
              // Ignore failure to read body
            }
          }

          // Raise our unified domain AppError to normalize error handling
          throw new AppError(errorCode, response.status, errorMessage);
        }
      },
    ],
  },
});
