import { Schema } from "mongoose";

export const baseFields = {
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: true },
  isArchived: { type: Boolean, default: false }
};

export const baseOptions = {
  timestamps: true
} as const;

export function withBase<T extends Record<string, unknown>>(fields: T) {
  return new Schema({ ...fields, ...baseFields } as any, baseOptions);
}
