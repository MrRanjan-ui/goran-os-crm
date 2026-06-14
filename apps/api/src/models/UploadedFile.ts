import mongoose, { Schema } from "mongoose";

export interface UploadedFileDocument extends mongoose.Document {
  filename: string;
  mimeType: string;
  data: Buffer;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const UploadedFileSchema = new Schema<UploadedFileDocument>(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    data: { type: Buffer, required: true },
    size: { type: Number, required: true }
  },
  { timestamps: true }
);

export const UploadedFileModel =
  mongoose.models.UploadedFile ||
  mongoose.model<UploadedFileDocument>("UploadedFile", UploadedFileSchema);
