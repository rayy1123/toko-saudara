import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, meta?: Record<string, any>, status = 200) {
  return NextResponse.json(
    {
      data,
      ...(meta !== undefined ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: any
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}
