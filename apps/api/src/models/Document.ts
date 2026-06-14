import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface DocumentEntry extends mongoose.Document {
  title: string;
  url: string;
  type: string;
  linkedTo?: string;
}

const DocumentSchema = withBase({
  title: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  linkedTo: { type: String }
});

export const DocumentModel =
  mongoose.models.Document ||
  mongoose.model<DocumentEntry>("Document", DocumentSchema);
