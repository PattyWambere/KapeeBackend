import { Request, Response, NextFunction } from "express";

// Logs every request method and URL
export const logger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next(); // Continue to next middleware or route
};