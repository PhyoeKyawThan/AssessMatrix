import type { HttpMethod } from '@/shared/api/client';

type ParamValue = string | number | boolean | undefined | null;

/** Hand-rolled because Hermes does not guarantee a `URLSearchParams` global. */
export function qs(params: Record<string, ParamValue>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

export type { HttpMethod };
