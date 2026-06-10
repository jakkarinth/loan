import type { ErrorRequestHandler, RequestHandler } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../lib/http.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      details: err.details
    });
    return;
  }

  if (err && typeof err === "object" && "code" in err) {
    const code = String(err.code);
    if (code === "ER_DUP_ENTRY") {
      res.status(409).json({
        message: "Duplicate data",
        ...(env.NODE_ENV === "production" ? {} : { details: err })
      });
      return;
    }
    if (code.startsWith("ER_NO_REFERENCED_ROW")) {
      res.status(422).json({
        message: "Referenced data does not exist",
        ...(env.NODE_ENV === "production" ? {} : { details: err })
      });
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    message: "Internal server error"
  });
};
