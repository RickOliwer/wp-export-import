import type { NextFunction, Request, Response } from "express";
import { logger } from "../../logger/index.js";
import { HttpError } from "../utils/httpError.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    if (err.status >= 500)
      logger.error({ err, details: err.details }, err.message);
    return res
      .status(err.status)
      .json({ error: err.message, details: err.details });
  }
  logger.error({ err }, "Unhandled error");
  return res.status(500).json({ error: "Internal Server Error" });
}
