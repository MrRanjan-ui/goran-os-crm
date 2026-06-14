import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { routes } from "./routes/index.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Clerk auth middleware — populates req.auth
try {
  app.use(ClerkExpressWithAuth());
} catch (err) {
  console.warn("Clerk middleware failed to initialize, auth will be unavailable");
  app.use((_req: any, _res: any, next: any) => next());
}

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);
