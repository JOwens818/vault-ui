export function setCookie(
  name: string,
  value: string,
  options: { maxAge?: number; secure?: boolean; sameSite?: 'Lax' | 'Strict' | 'None'; path?: string } = {}
) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  if (options.maxAge != null) parts.push(`Max-Age=${Math.max(0, options.maxAge)}`);
  parts.push(`Path=${options.path ?? '/'}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push(`Secure`);
  document.cookie = parts.join('; ');
}

export function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/`;
}
