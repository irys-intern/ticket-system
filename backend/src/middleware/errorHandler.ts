import type { NextFunction, Request, Response } from "express";

interface ErrorResponse extends Error {
  status?: number;
  details?: unknown;
}

export function errorHandler(
  err: ErrorResponse,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  const body = {
    success: false,
    message: err.message || "Internal Server Error",
    ...(err.details ? { details: err.details } : {}),
  };

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json(body);
}
