import { API_BASE_URL } from '@/constants/config';
export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}
type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};
export async function apiFetch<TResponse>(path: string, options: RequestOptions = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(!isFormData && options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    throw new ApiError('Không thể kết nối tới máy chủ', 0, error);
  }
  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    let details: unknown;
    let errorMessage = `${response.status} ${response.statusText}`;
    try {
      details = await response.json();
      // Try to extract message from error response
      if (details && typeof details === 'object') {
        const errorObj = details as any;
        // Check common error response formats (ErrorResponse format from backend)
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.error) {
          errorMessage = errorObj.error;
        } else if (Array.isArray(errorObj.errors) && errorObj.errors.length > 0) {
          errorMessage = errorObj.errors[0];
        }
      }
    } catch (error) {
      // If JSON parsing fails, try to read as text
      try {
        const text = await response.text();
        details = text;
        // Try to parse as JSON if possible
        try {
          const parsed = JSON.parse(text);
          if (parsed.message) {
            errorMessage = parsed.message;
          } else if (parsed.error) {
            errorMessage = parsed.error;
          }
        } catch {
          // If not JSON, use text as message if it's meaningful
          if (text && text.length < 200 && text.trim().length > 0) {
            errorMessage = text;
          }
        }
        } catch (e) {
        // Fallback to status text
      }
    }
    throw new ApiError(errorMessage, response.status, details);
  }
  if (response.status === 204) {
    return null as TResponse;
  }
  return (await response.json()) as TResponse;
}