import { NextFunction, Request, Response } from "express";
import { UserModel } from "../models/User.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await UserModel.findOne({ clerkUserId: req.auth.userId }).lean() as any;
  if (!user) {
    res.status(403).json({ error: "User not provisioned" });
    return;
  }

  req.user = {
    id: String(user._id),
    clerkUserId: user.clerkUserId,
    role: user.role
  };

  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
