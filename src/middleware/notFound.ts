import { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({ message: `Not found: ${req.method} ${req.path}` });
}
