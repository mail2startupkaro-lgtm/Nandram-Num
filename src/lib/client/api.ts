'use client';
/** Browser helpers for the app's own API. */
export class ApiError extends Error {
  constructor(public status: number, public body: { error?: string; issues?: { path?: string; where?: string; message: string }[]; status?: string }) {
    super(body?.issues?.map((i) => i.message).join(' · ') || body?.error || body?.status || `HTTP ${status}`);
  }
}

export async function api<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json: body, ...rest } = init;
  const res = await fetch(url, { ...rest, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(rest.headers ?? {}) }, body: body !== undefined ? JSON.stringify(body) : rest.body });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data ?? {});
  return data as T;
}

/** Fetches a file from the API and saves it with the server-provided name. */
export async function download(url: string, init: RequestInit & { json?: unknown } = {}): Promise<void> {
  const { json: body, ...rest } = init;
  const res = await fetch(url, { ...rest, headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined, body: body !== undefined ? JSON.stringify(body) : rest.body });
  if (!res.ok) throw new ApiError(res.status, res.headers.get('content-type')?.includes('json') ? await res.json() : {});
  const blob = await res.blob();
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'download';
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}
