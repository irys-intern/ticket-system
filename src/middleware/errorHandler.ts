import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  details?: unknown;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${status}]`, message, err.details);

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { details: err.details }),
  });
};

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
