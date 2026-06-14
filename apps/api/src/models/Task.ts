import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface TaskDocument extends mongoose.Document {
  projectId: string;
  title: string;
  description?: string;
  status: string;
  assigneeId?: string;
  dueDate?: Date;
  priority: string;
}

const TaskSchema = withBase({
  projectId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: "Todo" },
  assigneeId: { type: String },
  dueDate: { type: Date },
  priority: { type: String, default: "Medium" }
});

export const TaskModel =
  mongoose.models.Task || mongoose.model<TaskDocument>("Task", TaskSchema);
