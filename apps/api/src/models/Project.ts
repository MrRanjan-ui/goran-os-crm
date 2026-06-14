import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface ProjectDocument extends mongoose.Document {
  name: string;
  clientId: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  priority: string;
  teamIds: string[];
  scopeOfWork: string[];
  billingType?: string;
  developmentCharge?: number;
  recurringFee?: number;
  recurringInterval?: string;
}

const ProjectSchema = withBase({
  name: { type: String, required: true },
  clientId: { type: String, required: true },
  status: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  budget: { type: Number },
  priority: { type: String, default: "Medium" },
  teamIds: { type: [String], default: [] },
  scopeOfWork: { type: [String], default: [] },
  billingType: { type: String, enum: ["one-time", "recurring", "both"], default: "one-time" },
  developmentCharge: { type: Number },
  recurringFee: { type: Number },
  recurringInterval: { type: String, enum: ["monthly", "yearly"] }
});

export const ProjectModel =
  mongoose.models.Project ||
  mongoose.model<ProjectDocument>("Project", ProjectSchema);
