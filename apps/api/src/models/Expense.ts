import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface ExpenseDocument extends mongoose.Document {
  vendor: string;
  amount: number;
  currency: string;
  category?: string;
  incurredOn?: Date;
  description?: string;
}

const ExpenseSchema = withBase({
  vendor: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  category: { type: String },
  incurredOn: { type: Date },
  description: { type: String }
});

export const ExpenseModel =
  mongoose.models.Expense ||
  mongoose.model<ExpenseDocument>("Expense", ExpenseSchema);
