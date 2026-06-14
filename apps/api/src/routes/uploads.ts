import { Router } from "express";
import { z } from "zod";
import { UploadedFileModel } from "../models/UploadedFile.js";

const uploadSchema = z.object({
  dataUrl: z.string(),
  filename: z.string().optional()
});

export const uploadsRouter = Router();

// Endpoint to handle the file upload and save binary data to MongoDB
uploadsRouter.post("/", async (req, res, next) => {
  try {
    const payload = uploadSchema.parse(req.body);
    
    const matches = payload.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ error: "Invalid data URL format" });
      return;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    const fileDoc = await UploadedFileModel.create({
      filename: payload.filename || "document",
      mimeType,
      data: buffer,
      size: buffer.length
    });

    const secure_url = `${req.protocol}://${req.get("host")}/api/v1/uploads/download/${fileDoc._id}`;
    res.status(201).json({ data: { secure_url } });
  } catch (err) {
    next(err);
  }
});

// Handler function to fetch/download/preview files directly from MongoDB
export async function downloadFile(req: any, res: any, next: any) {
  try {
    const file = await UploadedFileModel.findById(req.params.id);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
    res.send(file.data);
  } catch (err) {
    next(err);
  }
}

// Endpoint to fetch/download/preview files directly from MongoDB
uploadsRouter.get("/download/:id", downloadFile);
