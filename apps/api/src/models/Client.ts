import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface ClientDocument extends mongoose.Document {
  name: string;
  primaryContact: string;
  email: string;
  phone?: string;
  industry?: string;
  status: string;
  contractUrl?: string;
  imageUrl?: string;
  website?: string;
  address?: string;
  notes?: string;
}

const ClientSchema = withBase({
  name: { type: String, required: true },
  primaryContact: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  industry: { type: String },
  status: { type: String, default: "Active" },
  contractUrl: { type: String },
  imageUrl: { type: String },
  website: { type: String },
  address: { type: String },
  notes: { type: String }
});

export const ClientModel =
  mongoose.models.Client ||
  mongoose.model<ClientDocument>("Client", ClientSchema);
