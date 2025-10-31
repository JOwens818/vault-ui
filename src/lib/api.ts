import { getCookie } from "./cookies";

type RuntimeConfig = { apiBase?: string };

function normalizeBase(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function readRuntimeConfig(): RuntimeConfig | undefined {
  return (globalThis as typeof globalThis & { __APP_CONFIG__?: RuntimeConfig }).__APP_CONFIG__;
}

const envApiBase = normalizeBase(import.meta.env.VITE_API_BASE);

function resolveApiBase(): string {
  const runtimeApiBase = normalizeBase(readRuntimeConfig()?.apiBase);
  const base = runtimeApiBase ?? envApiBase;
  if (!base) {
    throw new Error(
      "Missing API base URL. Provide API_BASE at runtime or set VITE_API_BASE for build-time fallback."
    );
  }
  return base;
}

// -- Types --------------------------------------------------------------------

export interface ApiEnvelopeOk<T> {
  status: "success";
  data: T;
}

export interface ApiEnvelopeErr {
  status: "error";
  message: string;
}

// Union of expected API shapes
type ApiEnvelope<T> = ApiEnvelopeOk<T> | ApiEnvelopeErr;

// Utility to represent API errors
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

// Optional global 401 handler
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

// -- Core fetch wrapper -------------------------------------------------------

export async function apiFetch<T>(
  path: string,
  init: globalThis.RequestInit = {}
): Promise<T | undefined> {
  const base = resolveApiBase();
  const token = getCookie("token");

  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!headers.has("Content-Type") && init.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const method = (init.method ?? "GET").toUpperCase();
  const cache = init.cache ?? (method === "GET" ? "no-store" : undefined);

  const res = await fetch(`${base}${path}`, {
    ...init,
    method,
    headers,
    cache,
  });

  if (res.status === 401 && onUnauthorized) {
    onUnauthorized();
  }

  if (res.status === 304) {
    return undefined; // No new data, keep current
  }

  const text = await res.text();

  if (!text) {
    if (!res.ok) throw new ApiError(res.statusText, res.status);
    return undefined;
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    if (!res.ok) throw new ApiError(res.statusText, res.status);
    return undefined;
  }

  // If it's an envelope {status: "error" | "success"}
  if (isApiEnvelopeErr(json)) {
    throw new ApiError(json.message, res.status);
  }

  if (isApiEnvelopeOk<T>(json)) {
    return json.data;
  }

  // Otherwise, return as-is (raw JSON response)
  return json as T;
}

export async function apiFetchBlob(
  path: string,
  init: globalThis.RequestInit = {}
): Promise<Blob> {
  const base = resolveApiBase();
  const token = getCookie("token");

  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const method = (init.method ?? "GET").toUpperCase();
  const cache = init.cache ?? (method === "GET" ? "no-store" : undefined);

  const res = await fetch(`${base}${path}`, {
    ...init,
    method,
    headers,
    cache,
  });

  if (res.status === 401 && onUnauthorized) {
    onUnauthorized();
  }

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const text = await res.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (isApiEnvelopeErr(parsed)) {
            message = parsed.message;
          }
        } catch {
          message = text;
        }
      }
    } catch {
      // ignore parsing errors
    }
    throw new ApiError(message, res.status);
  }

  return res.blob();
}

// -- Type guards --------------------------------------------------------------

function isApiEnvelopeOk<T>(v: unknown): v is ApiEnvelopeOk<T> {
  return (
    typeof v === "object" &&
    v !== null &&
    (v as Record<string, unknown>).status === "success" &&
    "data" in (v as Record<string, unknown>)
  );
}

function isApiEnvelopeErr(v: unknown): v is ApiEnvelopeErr {
  return (
    typeof v === "object" &&
    v !== null &&
    (v as Record<string, unknown>).status === "error" &&
    typeof (v as Record<string, unknown>).message === "string"
  );
}
