import mongoose from "mongoose";
import { withBase } from "./common.js";

export interface EmployeeDocument extends mongoose.Document {
  name: string;
  role: string;
  email: string;
  status: string;
  allocation?: number;
}

const EmployeeSchema = withBase({
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, default: "Active" },
  allocation: { type: Number, default: 0 }
});

export const EmployeeModel =
  mongoose.models.Employee ||
  mongoose.model<EmployeeDocument>("Employee", EmployeeSchema);
