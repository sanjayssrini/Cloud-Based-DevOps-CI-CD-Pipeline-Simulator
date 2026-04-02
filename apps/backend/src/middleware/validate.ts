import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validate = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        issues: result.error.flatten()
      });
      return;
    }

    next();
  };
};
