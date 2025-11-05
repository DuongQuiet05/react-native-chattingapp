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
  
  // Debug log
  console.log('🌐 API Request:', {
    url,
    method: options.method || 'GET',
    API_BASE_URL,
  });
  
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
    console.error('❌ Fetch Error:', error);
    throw new ApiError('Không thể kết nối tới máy chủ', 0, error);
  }

  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedHandler?.();
    }

    const message = `${response.status} ${response.statusText}`;
    let details: unknown;

    try {
      details = await response.json();
    } catch (error) {
      details = await response.text();
    }

    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204) {
    return null as TResponse;
  }

  return (await response.json()) as TResponse;
}
