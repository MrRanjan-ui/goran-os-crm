import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface LeadDocument extends mongoose.Document {
  companyName: string;
  contactName: string;
  phone?: string;
  email: string;
  source?: string;
  estimatedValue?: number;
  stage: string;
  notes?: string;
  conversationHistory: string[];
  followUpDate?: Date;
  aiScore?: number;
  aiProbability?: number;
}

const LeadSchema = withBase({
  companyName: { type: String, required: true },
  contactName: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true },
  source: { type: String },
  estimatedValue: { type: Number },
  stage: { type: String, required: true },
  notes: { type: String },
  conversationHistory: { type: [String], default: [] },
  followUpDate: { type: Date },
  aiScore: { type: Number },
  aiProbability: { type: Number }
});

export const LeadModel =
  mongoose.models.Lead || mongoose.model<LeadDocument>("Lead", LeadSchema);
