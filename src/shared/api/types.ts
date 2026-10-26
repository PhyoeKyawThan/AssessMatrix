export interface TokenPair {
  access: string;
  refresh: string;
}

export interface ApiErrorBody {
  code?: string;
  detail?: string;
  fields?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    const detail = body.detail ?? 'Request failed.';
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code ?? 'error';
    this.fields = body.fields ?? {};
  }

  fieldErrors(): string[] {
    return Object.values(this.fields).flat();
  }
}
