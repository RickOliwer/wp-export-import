import type { RequestHandler } from "express";
import { z } from "zod";
import { HttpError } from "../utils/httpError.js";

export const validate =
  (schema: z.ZodSchema): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      return next(
        new HttpError(400, "Validation error", result.error.format())
      );
    }
    Object.assign(req, result.data);
    return next();
  };
