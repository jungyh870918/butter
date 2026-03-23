import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error] ${err.message}`);
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({ message: err.message || "Internal server error" });
}
