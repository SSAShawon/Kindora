import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MongoServerError } from "mongodb";
import { ApiError } from "../lib/http.js";
import { env } from "../config/env.js";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} does not exist.` },
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const first = Object.values(fieldErrors).flat()[0];
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: first ?? "The submitted data is invalid.",
        details: fieldErrors,
      },
    });
    return;
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    res.status(409).json({
      success: false,
      error: { code: "DUPLICATE", message: "This record already exists." },
    });
    return;
  }

  // Better Auth API errors carry a statusCode.
  const maybe = err as { statusCode?: number; status?: number; body?: { message?: string; code?: string }; message?: string };
  const status = maybe?.statusCode ?? maybe?.status;
  if (status && status >= 400 && status < 500) {
    res.status(status).json({
      success: false,
      error: { code: maybe.body?.code ?? "REQUEST_ERROR", message: maybe.body?.message ?? maybe.message ?? "Request failed." },
    });
    return;
  }

  console.error("[kindora-api] unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong on our side. Please try again.",
      ...(env.isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
    },
  });
}
