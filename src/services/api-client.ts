/**
 * API Client
 * Centralized HTTP client with interceptors, error handling, mock support,
 * and automatic token refresh on 401.
 *
 * Mock mode (default for template):
 *  - When NEXT_PUBLIC_ENABLE_MOCK_API is true, this client routes requests
 *    through in-memory mock handlers defined in src/mocks.
 *  - The real fetch is only invoked when mock mode is disabled.
 *
 * Token refresh:
 *  - When a request returns 401 (and skipAuth is false), the client invokes
 *    the registered refresh handler. If it returns true, the request is
 *    retried once with the new access token. Otherwise onUnauthorized fires.
 *  - Concurrent 401s share a single in-flight refresh promise to avoid
 *    token thrash.
 */

import { env } from "@/config/env";
import type { ApiError, ApiResponse } from "@/types/common";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  responseType?: "json" | "blob" | "text";
  timeout?: number;
  skipAuth?: boolean;
  skipMock?: boolean;
  /**
   * Skip the auto-refresh interceptor (used internally when retrying and
   * for endpoints that should not trigger refresh, like /auth/refresh).
   */
  skipRefresh?: boolean;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly errors: ApiError[];
  public readonly data: unknown;

  constructor(
    message: string,
    options: {
      status: number;
      code: string;
      errors?: ApiError[];
      data?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code;
    this.errors = options.errors ?? [];
    this.data = options.data;
  }
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private getAccessToken: (() => string | null) | null = null;
  private onUnauthorized: (() => void | Promise<void>) | null = null;
  private refreshHandler: (() => Promise<boolean>) | null = null;
  private refreshInFlight: Promise<boolean> | null = null;
  private mockHandler: ((url: string, options: RequestOptions) => Promise<Response> | null) | null =
    null;

  constructor(baseUrl: string, timeout: number) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.defaultTimeout = timeout;
  }

  /** Set access token provider (called before every request) */
  setAccessTokenProvider(fn: () => string | null): void {
    this.getAccessToken = fn;
  }

  /** Set callback for 401 responses (after refresh has failed) */
  setOnUnauthorized(fn: () => void | Promise<void>): void {
    this.onUnauthorized = fn;
  }

  /**
   * Set callback to attempt a token refresh. The handler should call
   * /auth/refresh, update the auth store, and return true on success.
   */
  setRefreshHandler(fn: () => Promise<boolean>): void {
    this.refreshHandler = fn;
  }

  /** Set mock handler for template dev mode */
  setMockHandler(
    fn: (url: string, options: { method?: string; body?: unknown }) => Promise<Response> | null,
  ): void {
    this.mockHandler = fn as never;
  }

  /** Build full URL with query parameters */
  private buildUrl(path: string, params?: RequestOptions["params"]): string {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    if (!params) return url;
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      search.append(key, String(value));
    });
    const qs = search.toString();
    return qs ? `${url}?${qs}` : url;
  }

  /** Try to refresh the access token. Coalesces concurrent calls. */
  private async tryRefresh(): Promise<boolean> {
    if (!this.refreshHandler) return false;
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = (async () => {
      try {
        return await this.refreshHandler!();
      } catch {
        return false;
      } finally {
        this.refreshInFlight = null;
      }
    })();
    return this.refreshInFlight;
  }

  /** Core request method */
  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.executeWithRetry<T>(path, options, 0);
  }

  /**
   * Internal: run a request and retry once on 401 after a successful refresh.
   * `attempt` 0 = first try, 1 = post-refresh retry.
   */
  private async executeWithRetry<T = unknown>(
    path: string,
    options: RequestOptions,
    attempt: number,
  ): Promise<T> {
    const { params, body, timeout, responseType = "json", skipAuth, skipMock, skipRefresh, headers, ...rest } =
      options;

    const url = this.buildUrl(path, params);
    const finalTimeout = timeout ?? this.defaultTimeout;

    // Try mock handler first if enabled
    if (env.api.enableMock && !skipMock && this.mockHandler) {
      try {
        const mockResponse = await this.mockHandler(url, {
          ...options,
          body,
          params,
          responseType,
          skipAuth,
        });
        if (mockResponse) {
          return (await this.parseResponse<T>(mockResponse, responseType)) as T;
        }
      } catch (err) {
        if (err instanceof ApiClientError) throw err;
        // fall through to network
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalTimeout);

    try {
      const finalHeaders = new Headers(headers);
      finalHeaders.set("Accept", "application/json");

      if (body !== undefined && !(body instanceof FormData)) {
        finalHeaders.set("Content-Type", "application/json");
      }

      if (!skipAuth && this.getAccessToken) {
        const token = this.getAccessToken();
        if (token) {
          finalHeaders.set("Authorization", `Bearer ${token}`);
        }
      }

      const response = await fetch(url, {
        ...rest,
        headers: finalHeaders,
        body:
          body === undefined
            ? undefined
            : body instanceof FormData
              ? body
              : JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Auto-refresh on 401 (only first attempt, and only if not skipped)
      const canRefresh =
        response.status === 401 && !skipAuth && !skipRefresh && attempt === 0;
      if (canRefresh) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          // Retry with the new access token. The provider will be re-invoked
          // and pick up the new token from the store.
          return this.executeWithRetry<T>(path, options, attempt + 1);
        }
        // Refresh failed — fall through to onUnauthorized
        if (this.onUnauthorized) {
          await this.onUnauthorized();
        }
        return this.parseResponse<T>(response, responseType) as T;
      }

      if (response.status === 401 && this.onUnauthorized && !canRefresh) {
        await this.onUnauthorized();
      }

      return (await this.parseResponse<T>(response, responseType)) as T;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof ApiClientError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new ApiClientError("การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง", {
          status: 408,
          code: "TIMEOUT",
        });
      }
      throw new ApiClientError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบเครือข่าย", {
        status: 0,
        code: "NETWORK_ERROR",
      });
    }
  }

  private async parseResponse<T>(response: Response, type: "json" | "blob" | "text"): Promise<T> {
    if (type === "blob") return (await response.blob()) as T;
    if (type === "text") return (await response.text()) as T;

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const apiData = data as ApiResponse<unknown> | null;
      throw new ApiClientError(
        apiData?.message ?? `Request failed with status ${response.status}`,
        {
          status: response.status,
          code: apiData?.messageCode ?? `HTTP_${response.status}`,
          errors: apiData?.errors ?? [],
          data,
        },
      );
    }

    // If response is already unwrapped (e.g. mock returns data directly), return as-is
    if (data && typeof data === "object" && "success" in data) {
      const apiResponse = data as ApiResponse<T>;
      if (!apiResponse.success) {
        throw new ApiClientError(apiResponse.message ?? "Request failed", {
          status: response.status,
          code: apiResponse.messageCode ?? "API_ERROR",
          errors: apiResponse.errors ?? [],
          data,
        });
      }
      return apiResponse.data;
    }

    return data as T;
  }

  get<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T = unknown>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T = unknown>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T = unknown>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  upload<T = unknown>(path: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: formData,
      headers: { ...(options.headers ?? {}) },
    });
  }

  download(path: string, options: RequestOptions = {}): Promise<Blob> {
    return this.request<Blob>(path, {
      ...options,
      method: "GET",
      responseType: "blob",
    });
  }
}

export { ApiClient };
export const apiClient = new ApiClient(env.api.baseUrl, env.api.timeout);
