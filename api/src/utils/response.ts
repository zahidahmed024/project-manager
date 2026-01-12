import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Standardized API response format
 */
export interface ApiResponse<T = unknown> {
  data: T | null;
  success: boolean;
  message: string;
}

/**
 * Create a success response
 */
export function success<T>(c: Context, data: T, message = "Success", status: ContentfulStatusCode = 200) {
  return c.json<ApiResponse<T>>(
    {
      data,
      success: true,
      message,
    },
    status
  );
}

/**
 * Create an error response
 */
export function error(c: Context, message: string, status: ContentfulStatusCode = 400) {
  return c.json<ApiResponse<null>>(
    {
      data: null,
      success: false,
      message,
    },
    status
  );
}
