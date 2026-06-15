import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface MeetingDocument extends mongoose.Document {
  title: string;
  clientId?: string;
  scheduledAt: Date;
  notes?: string;
  aiSummary?: string;
  meetingLink?: string;
}

const MeetingSchema = withBase({
  title: { type: String, required: true },
  clientId: { type: String },
  scheduledAt: { type: Date, required: true },
  notes: { type: String },
  aiSummary: { type: String },
  meetingLink: { type: String }
});

export const MeetingModel =
  mongoose.models.Meeting ||
  mongoose.model<MeetingDocument>("Meeting", MeetingSchema);
