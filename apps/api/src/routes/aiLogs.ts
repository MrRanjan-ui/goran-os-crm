import { createCrudRouter } from "./resource.js";
import { AiLogModel } from "../models/AiLog.js";
import { createAiLogSchema, updateAiLogSchema } from "../validation/index.js";

export const aiLogsRouter = createCrudRouter({
  model: AiLogModel as any,
  resourceName: "aiLog",
  createSchema: createAiLogSchema,
  updateSchema: updateAiLogSchema,
  searchFields: ["category", "prompt", "response", "model"]
});
