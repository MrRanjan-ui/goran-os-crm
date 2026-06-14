import { Router } from "express";
import { env } from "../config/env.js";
import { NotificationModel } from "../models/Notification.js";

export const webhooksRouter = Router();

webhooksRouter.post("/n8n", async (req, res, next) => {
  try {
    const signature = req.headers["x-goran-signature"];
    if (signature !== env.N8N_WEBHOOK_SECRET) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    const payload = req.body as Record<string, unknown>;
    const notification = await NotificationModel.create({
      title: "Automation Triggered",
      message: JSON.stringify(payload),
      type: "automation",
      read: false,
      createdBy: "system",
      updatedBy: "system"
    });

    const io = req.app.get("io");
    io?.emit("notification:new", notification);

    res.status(202).json({ status: "accepted" });
  } catch (err) {
    next(err);
  }
});
