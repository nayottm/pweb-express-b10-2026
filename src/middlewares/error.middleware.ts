import { Request, Response, NextFunction } from "express";

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`));
};

export const errorHandler = (
  err: Error | HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const message = err.message || "Terjadi kesalahan pada server";

  res.status(statusCode).json({
    status: false,
    message,
  });
};

