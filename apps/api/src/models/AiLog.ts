import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface AiLog {
  category: string;
  prompt: string;
  response: string;
  model: string;
}

const AiLogSchema = withBase({
  category: { type: String, required: true },
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  model: { type: String, required: true }
});

export const AiLogModel =
  mongoose.models.AiLog || mongoose.model<AiLog>("AiLog", AiLogSchema);
