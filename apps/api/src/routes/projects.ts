import { createCrudRouter } from "./resource.js";
import { ProjectModel } from "../models/Project.js";
import { createProjectSchema, updateProjectSchema } from "../validation/index.js";

export const projectsRouter = createCrudRouter({
  model: ProjectModel,
  resourceName: "project",
  createSchema: createProjectSchema,
  updateSchema: updateProjectSchema,
  searchFields: ["name"]
});
