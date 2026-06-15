import { createCrudRouter } from "./resource.js";
import { ProjectModel } from "../models/Project.js";
import { createProjectSchema, updateProjectSchema } from "../validation/index.js";
import { syncProjectInvoice } from "../services/recurringRevenue.js";

export const projectsRouter = createCrudRouter({
  model: ProjectModel,
  resourceName: "project",
  createSchema: createProjectSchema,
  updateSchema: updateProjectSchema,
  searchFields: ["name"],
  postCreate: async (project, req) => {
    const userId = req.user?.id ?? "system";
    await syncProjectInvoice(project, userId);
  },
  postUpdate: async (project, req) => {
    const userId = req.user?.id ?? "system";
    await syncProjectInvoice(project, userId);
  }
});
