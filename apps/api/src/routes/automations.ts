import { createCrudRouter } from "./resource.js";
import { AutomationModel } from "../models/Automation.js";
import { createAutomationSchema, updateAutomationSchema } from "../validation/index.js";

export const automationsRouter = createCrudRouter({
  model: AutomationModel,
  resourceName: "automation",
  createSchema: createAutomationSchema,
  updateSchema: updateAutomationSchema,
  searchFields: ["name", "trigger"]
});
