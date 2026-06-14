import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface NotificationDocument extends mongoose.Document {
  title: string;
  message: string;
  type: string;
  read: boolean;
  entityRef?: string;
}

const NotificationSchema = withBase({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "info" },
  read: { type: Boolean, default: false },
  entityRef: { type: String }
});

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);
