import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { leadsRouter } from "./leads.js";
import { clientsRouter } from "./clients.js";
import { projectsRouter } from "./projects.js";
import { tasksRouter } from "./tasks.js";
import { invoicesRouter } from "./invoices.js";
import { expensesRouter } from "./expenses.js";
import { employeesRouter } from "./employees.js";
import { meetingsRouter } from "./meetings.js";
import { notificationsRouter } from "./notifications.js";
import { documentsRouter } from "./documents.js";
import { automationsRouter } from "./automations.js";
import { usersRouter } from "./users.js";
import { aiRouter } from "./ai.js";
import { webhooksRouter } from "./webhooks.js";
import { dashboardRouter } from "./dashboard.js";
import { uploadsRouter, downloadFile } from "./uploads.js";
import { aiLogsRouter } from "./aiLogs.js";
import { calendarRouter } from "./calendar.js";

export const routes = Router();

routes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

routes.use("/webhooks", webhooksRouter);

routes.use("/users", usersRouter);

// Public route to preview/download uploaded files directly from MongoDB
routes.get("/uploads/download/:id", downloadFile);

routes.use(requireAuth);

routes.use("/dashboard", dashboardRouter);
routes.use("/leads", leadsRouter);
routes.use("/clients", clientsRouter);
routes.use("/projects", projectsRouter);
routes.use("/tasks", tasksRouter);
routes.use("/invoices", invoicesRouter);
routes.use("/expenses", expensesRouter);
routes.use("/employees", employeesRouter);
routes.use("/meetings", meetingsRouter);
routes.use("/notifications", notificationsRouter);
routes.use("/documents", documentsRouter);
routes.use("/automations", automationsRouter);
routes.use("/ai", aiRouter);
routes.use("/ai-logs", aiLogsRouter);
routes.use("/uploads", uploadsRouter);
routes.use("/calendar", calendarRouter);
