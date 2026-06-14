import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(5001),
  MONGODB_URI: z.string().min(1),
  CLERK_JWT_PUBLIC_KEY: z.string().default(""),
  CLERK_PUBLISHABLE_KEY: z.string().default(""),
  CLERK_SECRET_KEY: z.string().default(""),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  GEMINI_API_KEY: z.string().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  N8N_WEBHOOK_SECRET: z.string().default("default-secret"),
  DEFAULT_USER_ROLE: z.string().default("owner")
});

export const env = EnvSchema.parse(process.env);
