import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface AutomationDocument extends mongoose.Document {
  name: string;
  trigger: string;
  webhookUrl: string;
  enabled: boolean;
}

const AutomationSchema = withBase({
  name: { type: String, required: true },
  trigger: { type: String, required: true },
  webhookUrl: { type: String, required: true },
  enabled: { type: Boolean, default: true }
});

export const AutomationModel =
  mongoose.models.Automation ||
  mongoose.model<AutomationDocument>("Automation", AutomationSchema);
