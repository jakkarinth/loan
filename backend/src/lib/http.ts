import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(422, "Validation failed", error.flatten());
    }
    throw error;
  }
}

export function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid id");
  }
  return id;
}

export function getPagination(req: Request) {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize ?? 20), 1), 100);
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize
  };
}

export function sendList<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  res.json({
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}

