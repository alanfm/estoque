import type { ApiErrorBody } from "../../types/api";
import { ApiError } from "./errors";

const API_BASE = "/api/v1";
const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_ENDPOINT = "/sanctum/csrf-cookie";

let csrfRequest: Promise<void> | null = null;

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  retryOnCsrf?: boolean;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      `(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function ensureCsrfCookie(force = false): Promise<void> {
  if (!force && readCookie(CSRF_COOKIE)) return;

  csrfRequest ??= fetch(CSRF_ENDPOINT, {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  })
    .then(() => undefined)
    .finally(() => {
      csrfRequest = null;
    });

  await csrfRequest;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function defaultCode(status: number): string {
  switch (status) {
    case 401:
      return "UNAUTHENTICATED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 419:
      return "CSRF_TOKEN_EXPIRED";
    case 429:
      return "TOO_MANY_REQUESTS";
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED";
  }
}

function defaultMessage(status: number): string {
  switch (status) {
    case 401:
      return "Sua sessão expirou. Entre novamente.";
    case 403:
      return "Você não tem permissão para executar esta ação.";
    case 404:
      return "O recurso solicitado não foi encontrado.";
    case 419:
      return "Sua sessão expirou. Entre novamente.";
    case 429:
      return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
    default:
      return status >= 500
        ? "Ocorreu um erro inesperado. Tente novamente em instantes."
        : "Não foi possível concluir a solicitação.";
  }
}

function toApiError(response: Response, json: unknown): ApiError {
  const body = json as ApiErrorBody | null;

  if (body && typeof body === "object" && body.error) {
    return new ApiError({
      status: response.status,
      code: body.error.code,
      message: body.error.message,
      details: body.error.details,
      requestId: body.error.requestId,
    });
  }

  return new ApiError({
    status: response.status,
    code: defaultCode(response.status),
    message: defaultMessage(response.status),
    requestId: response.headers.get("X-Request-Id"),
  });
}

function emitAuthEvent(status: number): void {
  if (typeof window === "undefined") return;

  const type = status === 419 ? "auth:csrf-expired" : "auth:unauthorized";
  window.dispatchEvent(new CustomEvent(type));
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const json = text ? safeParse(text) : null;

  if (response.ok) {
    return json as T;
  }

  if (response.status === 401 || response.status === 419) {
    emitAuthEvent(response.status);
  }

  throw toApiError(response, json);
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const mutating = method !== "GET";

  if (mutating) {
    await ensureCsrfCookie();
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (mutating) {
    const token = readCookie(CSRF_COOKIE);
    if (token) headers["X-XSRF-TOKEN"] = token;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}${buildQuery(options.query)}`, {
      method,
      headers,
      credentials: "same-origin",
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw ApiError.network();
  }

  if (response.status === 419 && mutating && options.retryOnCsrf !== false) {
    await ensureCsrfCookie(true);
    return apiRequest<T>(path, { ...options, retryOnCsrf: false });
  }

  return parseResponse<T>(response);
}
