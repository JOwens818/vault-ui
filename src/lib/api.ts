import { getCookie } from "./cookies";

const envApiBase = import.meta.env.VITE_API_BASE;
const API_BASE = envApiBase ?? "";

if (!API_BASE) {
  throw new Error("Missing API base URL. Did you forget to set VITE_API_BASE?");
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
  const token = getCookie("token");

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const method = (init.method ?? "GET").toUpperCase();
  const cache = init.cache ?? (method === "GET" ? "no-store" : undefined);

  const res = await fetch(`${API_BASE}${path}`, {
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
