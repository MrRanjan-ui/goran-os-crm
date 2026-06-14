import { createCrudRouter } from "./resource.js";
import { LeadModel } from "../models/Lead.js";
import { createLeadSchema, updateLeadSchema } from "../validation/index.js";

export const leadsRouter = createCrudRouter({
  model: LeadModel,
  resourceName: "lead",
  createSchema: createLeadSchema,
  updateSchema: updateLeadSchema,
  searchFields: ["companyName", "contactName", "email"]
});
