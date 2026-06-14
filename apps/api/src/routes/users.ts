import { Router } from "express";
import { provisionUserSchema } from "../validation/index.js";
import { UserModel } from "../models/User.js";
import { env } from "../config/env.js";

export const usersRouter = Router();

usersRouter.post("/provision", async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const payload = provisionUserSchema.parse(req.body);
    const existing = await UserModel.findOne({
      clerkUserId: req.auth.userId
    });

    if (existing) {
      res.json({ data: existing });
      return;
    }

    const user = await UserModel.create({
      clerkUserId: req.auth.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role ?? env.DEFAULT_USER_ROLE
    });

    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
});
