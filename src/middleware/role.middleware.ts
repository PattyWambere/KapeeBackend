import { Request, Response, NextFunction } from "express";

/**
 * Role-based access control middleware.
 * Usage: authorize("admin"), authorize("vendor"), authorize("admin", "vendor")
 * Relies on `req.role` being set by the `protect` middleware.
 */
export const authorize =
  (...roles: ("admin" | "vendor" | "customer")[]) =>// eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).role;

    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };