import { createCrudRouter } from "./resource.js";
import { NotificationModel } from "../models/Notification.js";
import {
  createNotificationSchema,
  updateNotificationSchema
} from "../validation/index.js";

export const notificationsRouter = createCrudRouter({
  model: NotificationModel,
  resourceName: "notification",
  createSchema: createNotificationSchema,
  updateSchema: updateNotificationSchema,
  searchFields: ["title", "message", "type"]
});
