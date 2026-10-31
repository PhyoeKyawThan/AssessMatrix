const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** API date fields remain ISO `YYYY-MM-DD` strings behind the themed calendar UI. */
export function isDateOnly(value: string): boolean {
  return DATE_ONLY.test(value);
}

export function firstInvalid(errors: Record<string, string | null>): string | null {
  const entry = Object.entries(errors).find(([, message]) => message !== null);
  return entry ? `${entry[0]}: ${entry[1]}` : null;
}

export function errorMessages(errors: Record<string, string | null>): string[] {
  return Object.entries(errors)
    .filter(([, message]) => message !== null)
    .map(([field, message]) => `${field}: ${message}`);
}

export function formatDate(value: string | null | undefined): string {
  if (value === undefined || value === null || value === '') return '—';
  return value.replace('T', ' ').slice(0, 16);
}
