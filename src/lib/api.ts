// src/lib/api.ts
import { getCookie } from './cookies';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000';

type ApiOk<T> = { status: 'success'; data: T };
type ApiErr = { status: 'error'; message: string };
type FetchInit = globalThis.RequestInit;

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export async function apiFetch<T>(path: string, init: FetchInit = {}): Promise<T> {
  const token = getCookie('token');
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();

  // Call the handler on 401 regardless of body shape
  if (res.status === 401 && onUnauthorized) {
    onUnauthorized();
  }

  if (!text) {
    if (!res.ok) throw makeHttpError(res);
    // @ts-expect-error allow void
    return undefined;
  }

  let json: ApiOk<T> | ApiErr;
  try {
    json = JSON.parse(text);
  } catch {
    if (!res.ok) throw makeHttpError(res);
    // @ts-expect-error allow void
    return undefined;
  }

  if (!res.ok || (json as ApiErr).status === 'error') {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    const msg = (json as ApiErr).message || res.statusText || 'Request failed';
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return (json as ApiOk<T>).data;
}

function makeHttpError(res: Response) {
  const err = new Error(res.statusText || 'Request failed') as Error & { status?: number };
  err.status = res.status;
  return err;
}
