import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface InvoiceDocument extends mongoose.Document {
  clientId: string;
  projectId?: string;
  amount: number;
  currency: string;
  status: string;
  dueDate?: Date;
  paidOn?: Date;
  billingType?: string;
  paymentCategory?: string;
  recurringInterval?: string;
  billingPeriod?: string;
}

const InvoiceSchema = withBase({
  clientId: { type: String, required: true },
  projectId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  status: { type: String, default: "Draft" },
  dueDate: { type: Date },
  paidOn: { type: Date },
  billingType: { type: String, enum: ["one-time", "recurring"], default: "one-time" },
  paymentCategory: { type: String, enum: ["development_charge", "recurring_fee", "other"], default: "development_charge" },
  recurringInterval: { type: String, enum: ["monthly", "yearly"] },
  billingPeriod: { type: String }
});

export const InvoiceModel =
  mongoose.models.Invoice ||
  mongoose.model<InvoiceDocument>("Invoice", InvoiceSchema);
