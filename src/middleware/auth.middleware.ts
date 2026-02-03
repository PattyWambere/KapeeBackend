import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { userModel } from "../models/user.model";

interface JwtPayload {
  userId: string;
  role: "admin" | "vendor" | "customer";
}

// Protect routes using JWT and attach userId + role to the request
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization; // Bearer token format
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1]; // Get token part

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    (req as any).userId = decoded.userId;
    (req as any).role = decoded.role;

    // Optional safety: ensure user still exists
    const user = await userModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};  