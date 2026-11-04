import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function safeStorage(kind: 'local' | 'session' = 'local') {
  return {
    get(key: string): string | null { try { return (kind === 'local' ? localStorage : sessionStorage).getItem(key); } catch { return null; } },
    set(key: string, value: string) { try { (kind === 'local' ? localStorage : sessionStorage).setItem(key, value); } catch { /* storage unavailable */ } },
    remove(key: string) { try { (kind === 'local' ? localStorage : sessionStorage).removeItem(key); } catch { /* ignore */ } },
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
