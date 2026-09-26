import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiResponseMeta {
  count?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  } | null;
  meta?: ApiResponseMeta | null;
}

export function apiSuccess<T>(
  data: T,
  meta?: ApiResponseMeta | null,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      error: null,
      meta: meta !== undefined ? meta : null,
    },
    { status }
  );
}

export function apiError(
  message: string,
  status = 400,
  details?: unknown,
  code?: string
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      data: null,
      error: {
        message,
        code: code || `HTTP_${status}`,
        details: details || null,
      },
      meta: null,
    },
    { status }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<null>> {
  console.error('[API_ERROR]', error);

  if (error instanceof ZodError) {
    return apiError(
      'Validation error',
      422,
      error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
      'VALIDATION_ERROR'
    );
  }

  if (error instanceof Error) {
    return apiError(error.message, 500, null, 'INTERNAL_SERVER_ERROR');
  }

  return apiError('An unexpected server error occurred', 500, null, 'UNKNOWN_ERROR');
}
